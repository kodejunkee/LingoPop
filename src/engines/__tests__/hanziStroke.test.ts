/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildHanziStrokesFromMmah,
  convertMmahMedianToPoints,
  convertMmahPointToNormalized,
  convertMmahSvgPathToNormalized,
  pointsToSvgPath,
  resamplePolyline,
  scaleNormalizedSvgPath,
  validateStroke,
} from '../hanziStroke';

describe('hanziStroke engine', () => {
  it('accepts an accurate horizontal stroke drawn left-to-right', () => {
    const target = [
      { x: 14, y: 50 },
      { x: 86, y: 50 },
    ];
    const user = [
      { x: 15, y: 51 },
      { x: 35, y: 49 },
      { x: 60, y: 50 },
      { x: 84, y: 51 },
    ];

    const res = validateStroke(user, target);
    assert.equal(res.matched, true);
    assert.ok(res.score > 0.75);
  });

  it('rejects a stroke drawn in reverse direction (right-to-left)', () => {
    const target = [
      { x: 14, y: 50 },
      { x: 86, y: 50 },
    ];
    const backwardsUser = [
      { x: 85, y: 50 },
      { x: 50, y: 50 },
      { x: 15, y: 50 },
    ];

    const res = validateStroke(backwardsUser, target);
    assert.equal(res.matched, false);
    assert.equal(res.failureReason, 'wrong_direction');
  });

  it('rejects tiny taps or strokes cut short', () => {
    const target = [
      { x: 14, y: 50 },
      { x: 86, y: 50 },
    ];
    const shortUser = [
      { x: 15, y: 50 },
      { x: 22, y: 50 },
    ];

    const res = validateStroke(shortUser, target);
    assert.equal(res.matched, false);
    assert.equal(res.failureReason, 'too_short');
  });

  it('rejects a straight diagonal shortcut across a 90-degree corner stroke (横折)', () => {
    const cornerTarget = [
      { x: 25, y: 27 },
      { x: 75, y: 27 },
      { x: 73, y: 76 },
    ];
    const diagonalShortcut = [
      { x: 25, y: 27 },
      { x: 50, y: 52 },
      { x: 73, y: 76 },
    ];

    const res = validateStroke(diagonalShortcut, cornerTarget);
    assert.equal(res.matched, false);
    assert.equal(res.failureReason, 'wrong_shape');
  });

  it('resamples polylines and formats scaled SVG paths cleanly', () => {
    const resampled = resamplePolyline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      5
    );
    assert.equal(resampled.length, 5);
    assert.equal(resampled[2].x, 50);

    const svgPath = pointsToSvgPath(
      [
        { x: 10, y: 50 },
        { x: 90, y: 50 },
      ],
      200
    );
    assert.equal(svgPath, 'M 20.0 100.0 L 180.0 100.0');
  });

  it('normalizes Make Me a Hanzi Cartesian points, medians, and SVG paths to 0..100 space', () => {
    const topCenter = convertMmahPointToNormalized(512, 900);
    assert.deepEqual(topCenter, { x: 50, y: 0 });

    const bottomEdge = convertMmahPointToNormalized(0, -124);
    assert.deepEqual(bottomEdge, { x: 0, y: 100 });

    const points = convertMmahMedianToPoints([
      [256, 644],
      [768, 644],
    ]);
    assert.deepEqual(points, [
      { x: 25, y: 25 },
      { x: 75, y: 25 },
    ]);

    const normSvg = convertMmahSvgPathToNormalized('M 512 900 Q 512 388 1024 -124 Z');
    assert.equal(normSvg, 'M 50 0 Q 50 50 100 100 Z');
    assert.equal(scaleNormalizedSvgPath(normSvg, 200), 'M 100.0 0.0 Q 100.0 100.0 200.0 200.0 Z');

    const built = buildHanziStrokesFromMmah(
      [[[15, 50], [85, 50]]],
      ['M 15 48 L 85 52 Z']
    );
    assert.equal(built.length, 1);
    assert.equal(built[0].svgPath, 'M 15 48 L 85 52 Z');
    assert.match(built[0].name, /横/);
  });
});
