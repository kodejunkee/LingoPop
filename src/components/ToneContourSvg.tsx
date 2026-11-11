import React, { useMemo } from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { ToneColors, type ToneNumber } from '../theme/tokens';

interface ToneContourSvgProps {
  tone: ToneNumber;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

/**
 * Renders the Chao 5-level pitch contour diagram for Mandarin tones 1–5.
 * Ensures tone differences are visually clear even without relying on color alone.
 */
export const ToneContourSvg = React.memo(function ToneContourSvg({
  tone,
  width = 76,
  height = 44,
  strokeWidth = 3.5,
}: ToneContourSvgProps) {
  const color = ToneColors[tone];

  const { pathData, endPoint, gridLines } = useMemo(() => {
    const padX = 10;
    const padY = 6;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    // Map Chao pitch scale (5 = top, 1 = bottom) to Y coordinates
    const levelToY = (level: number) => padY + ((5 - level) / 4) * innerH;
    const x0 = padX;
    const x1 = padX + innerW * 0.35;
    const x2 = padX + innerW * 0.65;
    const xEnd = padX + innerW;

    let d = '';
    let end = { x: xEnd, y: levelToY(3) };

    switch (tone) {
      case 1: {
        const y = levelToY(4.7);
        d = `M ${x0} ${y} L ${xEnd} ${y}`;
        end = { x: xEnd, y };
        break;
      }
      case 2: {
        const yStart = levelToY(2.8);
        const yEnd = levelToY(4.8);
        d = `M ${x0} ${yStart} Q ${x1} ${levelToY(3.1)} ${xEnd} ${yEnd}`;
        end = { x: xEnd, y: yEnd };
        break;
      }
      case 3: {
        const yStart = levelToY(2.2);
        const yDip = levelToY(1.0);
        const yEnd = levelToY(3.9);
        d = `M ${x0} ${yStart} Q ${x1} ${yDip} ${x2} ${levelToY(1.3)} T ${xEnd} ${yEnd}`;
        end = { x: xEnd, y: yEnd };
        break;
      }
      case 4: {
        const yStart = levelToY(4.9);
        const yEnd = levelToY(1.1);
        d = `M ${x0} ${yStart} Q ${x1} ${levelToY(3.6)} ${xEnd} ${yEnd}`;
        end = { x: xEnd, y: yEnd };
        break;
      }
      case 5: {
        const midX = padX + innerW * 0.5;
        const midY = levelToY(3.0);
        d = '';
        end = { x: midX, y: midY };
        break;
      }
    }

    const lines = [1, 3, 5].map((lvl) => levelToY(lvl));
    return { pathData: d, endPoint: end, gridLines: lines };
  }, [tone, width, height]);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {gridLines.map((y, idx) => (
        <Line
          key={idx}
          x1={6}
          y1={y}
          x2={width - 6}
          y2={y}
          stroke="#CBD5E1"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ))}
      {pathData ? (
        <Path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : null}
      <Circle cx={endPoint.x} cy={endPoint.y} r={tone === 5 ? 5 : 3.5} fill={color} />
    </Svg>
  );
});
