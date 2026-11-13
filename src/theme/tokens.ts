export type ToneNumber = 1 | 2 | 3 | 4 | 5;

export const ToneColors: Record<ToneNumber, string> = {
  1: '#E63946', // High flat — Coral Red
  2: '#E07A22', // Rising — Warm Amber (high contrast on light bg)
  3: '#1E847F', // Dipping — Emerald Teal
  4: '#2563EB', // Falling — Royal Blue
  5: '#64748B', // Neutral — Slate Gray
};

export const ToneLabels: Record<ToneNumber, { name: string; contour: string; shortDesc: string }> = {
  1: { name: '1st Tone', contour: '55', shortDesc: 'High & flat' },
  2: { name: '2nd Tone', contour: '35', shortDesc: 'Rising (like "Huh?")' },
  3: { name: '3rd Tone', contour: '214', shortDesc: 'Low dipping' },
  4: { name: '4th Tone', contour: '51', shortDesc: 'Sharp drop' },
  5: { name: 'Neutral', contour: '·', shortDesc: 'Light & short' },
};

export const Colors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F3F5',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#7C3AED',
  primarySoft: '#EDE9FE',
  primaryDark: '#6D28D9',
  accent: '#EF4444',
  accentSoft: '#FEE2E2',
  amber: '#FFB703',
  amberSoft: '#FEF3C7',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  error: '#DC2626',
  errorSoft: '#FEE2E2',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;
