import type { HanziStrokeDef, Point } from '../curriculum/hanziData';

export type StrokeValidationFailure =
  | 'too_short'
  | 'wrong_direction'
  | 'wrong_position'
  | 'wrong_shape';

export interface StrokeValidationResult {
  matched: boolean;
  score: number;
  failureReason?: StrokeValidationFailure;
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Resamples a polyline into `count` evenly spaced points along its arc length.
 */
export function resamplePolyline(points: Point[], count = 16): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1 || count <= 1) return [points[0]];

  const totalLen = polylineLength(points);
  if (totalLen === 0) {
    return Array.from({ length: count }, () => points[0]);
  }

  const step = totalLen / (count - 1);
  const resampled: Point[] = [points[0]];
  let accumulated = 0;
  let prev = points[0];

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    let segLen = distance(prev, curr);

    while (accumulated + segLen >= step && resampled.length < count) {
      const remain = step - accumulated;
      const ratio = segLen > 0 ? remain / segLen : 0;
      const nx = prev.x + (curr.x - prev.x) * ratio;
      const ny = prev.y + (curr.y - prev.y) * ratio;
      const nextPt = { x: nx, y: ny };
      resampled.push(nextPt);
      prev = nextPt;
      segLen = distance(prev, curr);
      accumulated = 0;
    }

    accumulated += segLen;
    prev = curr;
  }

  while (resampled.length < count) {
    resampled.push(points[points.length - 1]);
  }

  return resampled;
}

/**
 * Converts a polyline in normalized 0..100 coordinates to an SVG path `d` scaled to `canvasSize`.
 */
export function pointsToSvgPath(points: Point[], canvasSize: number): string {
  if (points.length === 0) return '';
  const scale = canvasSize / 100;
  return points
    .map((p, idx) => {
      const cmd = idx === 0 ? 'M' : 'L';
      return `${cmd} ${(p.x * scale).toFixed(1)} ${(p.y * scale).toFixed(1)}`;
    })
    .join(' ');
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp0100(value: number): number {
  return Math.max(0, Math.min(100, round1(value)));
}

/**
 * Converts a Make Me a Hanzi coordinate (0..1024 X, -124..900 bottom-up Y)
 * into LingoPop's normalized 0..100 top-down SVG coordinate space.
 */
export function convertMmahPointToNormalized(x: number, y: number): Point {
  return {
    x: clamp0100((x / 1024) * 100),
    y: clamp0100(((900 - y) / 1024) * 100),
  };
}

/**
 * Converts a Make Me a Hanzi median coordinate list into normalized 0..100 Points.
 */
export function convertMmahMedianToPoints(median: readonly (readonly [number, number])[]): Point[] {
  return median.map(([x, y]) => convertMmahPointToNormalized(x, y));
}

const SVG_CMD_ARG_PAIRS: Record<string, number> = {
  M: 1,
  L: 1,
  Q: 2,
  C: 3,
  Z: 0,
};

/**
 * Converts a Make Me a Hanzi SVG silhouette path string (`M`, `L`, `Q`, `C`, `Z` in Cartesian
 * 1024x900 space) into a top-down normalized 0..100 SVG path string.
 */
export function convertMmahSvgPathToNormalized(rawPath: string): string {
  const parts = rawPath.trim().split(/\s+/);
  const out: string[] = [];
  let i = 0;

  while (i < parts.length) {
    const cmd = parts[i++];
    const pairCount = SVG_CMD_ARG_PAIRS[cmd];
    if (pairCount === undefined) {
      break;
    }
    out.push(cmd);
    for (let k = 0; k < pairCount && i + 1 < parts.length; k++) {
      const pt = convertMmahPointToNormalized(Number(parts[i]), Number(parts[i + 1]));
      out.push(String(pt.x), String(pt.y));
      i += 2;
    }
  }

  return out.join(' ');
}

/**
 * Scales a normalized 0..100 SVG path (`M`, `L`, `Q`, `C`, `Z`) to match `canvasSize`.
 */
export function scaleNormalizedSvgPath(normPath: string, canvasSize: number): string {
  if (!normPath) return '';
  const scale = canvasSize / 100;
  return normPath
    .trim()
    .split(/\s+/)
    .map((tok) => {
      if (tok in SVG_CMD_ARG_PAIRS) return tok;
      const num = Number(tok);
      return Number.isFinite(num) ? (num * scale).toFixed(1) : tok;
    })
    .join(' ');
}

function inferStrokeLabel(points: Point[], strokeIndex: number): { name: string; hint: string } {
  if (points.length < 2) {
    return { name: `Stroke ${strokeIndex + 1}`, hint: 'Follow the numbered guide dot.' };
  }
  const dx = points[points.length - 1].x - points[0].x;
  const dy = points[points.length - 1].y - points[0].y;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  if (ax > ay * 1.8 && dx > 0) {
    return { name: '横 Héng (Horizontal)', hint: 'Sweep smoothly left to right.' };
  }
  if (ay > ax * 1.8 && dy > 0) {
    return { name: '竖 Shù (Vertical)', hint: 'Pull straight downward from top to bottom.' };
  }
  if (dx < -4 && dy > 6) {
    return { name: '撇 Piě (Left-fall)', hint: 'Sweep downward toward the bottom-left.' };
  }
  if (dx > 4 && dy > 6) {
    return { name: '捺 / 点 (Right-fall / Dot)', hint: 'Move down toward the right.' };
  }
  return { name: `Stroke ${strokeIndex + 1}`, hint: 'Follow the guide path in order.' };
}

/**
 * Converts normalized Make Me a Hanzi median tuples `[x, y][][]` and SVG silhouettes into
 * interactive `HanziStrokeDef[]` ready for `HanziCanvas` validation and display.
 */
export function buildHanziStrokesFromMmah(
  normalizedMedians: readonly (readonly [number, number][])[],
  normalizedSvgPaths: readonly string[] = []
): HanziStrokeDef[] {
  return normalizedMedians.map((strokeCoords, idx) => {
    const points = strokeCoords.map(([x, y]) => ({ x, y }));
    const meta = inferStrokeLabel(points, idx);
    return {
      name: meta.name,
      points,
      svgPath: normalizedSvgPaths[idx],
      hint: meta.hint,
    };
  });
}

/**
 * Validates a user's drawn stroke (in normalized 0..100 coordinates) against an expected
 * Hanzi stroke polyline, enforcing proper stroke direction and path fidelity.
 */
export function validateStroke(
  userPoints: Point[],
  targetPoints: Point[]
): StrokeValidationResult {
  if (userPoints.length < 2 || targetPoints.length < 2) {
    return { matched: false, score: 0, failureReason: 'too_short' };
  }

  const userLen = polylineLength(userPoints);
  const targetLen = polylineLength(targetPoints);
  if (userLen < Math.max(7, targetLen * 0.38)) {
    return { matched: false, score: 0, failureReason: 'too_short' };
  }

  const userStart = userPoints[0];
  const userEnd = userPoints[userPoints.length - 1];
  const targetStart = targetPoints[0];
  const targetEnd = targetPoints[targetPoints.length - 1];

  const startDist = distance(userStart, targetStart);
  const endDist = distance(userEnd, targetEnd);
  const reversedStartDist = distance(userStart, targetEnd);
  const reversedEndDist = distance(userEnd, targetStart);

  // Detect backwards stroke drawing (e.g. Right -> Left instead of Left -> Right)
  if (
    reversedStartDist < startDist &&
    reversedEndDist < endDist &&
    reversedStartDist < 26 &&
    reversedEndDist < 26
  ) {
    return { matched: false, score: 0.2, failureReason: 'wrong_direction' };
  }

  const anchorTolerance = 28;
  if (startDist > anchorTolerance || endDist > anchorTolerance) {
    return { matched: false, score: 0.3, failureReason: 'wrong_position' };
  }

  // Compare resampled curve shapes point-by-point along the expected direction
  const SAMPLE_COUNT = 16;
  const userResampled = resamplePolyline(userPoints, SAMPLE_COUNT);
  const targetResampled = resamplePolyline(targetPoints, SAMPLE_COUNT);

  let deviationSum = 0;
  let maxDev = 0;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const d = distance(userResampled[i], targetResampled[i]);
    deviationSum += d;
    if (d > maxDev) maxDev = d;
  }

  const meanDeviation = deviationSum / SAMPLE_COUNT;

  if (meanDeviation > 17 || maxDev > 30) {
    return { matched: false, score: 0.45, failureReason: 'wrong_shape' };
  }

  const score = Math.max(0.5, Math.min(1, 1 - meanDeviation / 24));
  return { matched: true, score };
}
