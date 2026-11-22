import { Platform } from 'react-native';

/** palette di CT Buddy: toni freddi da sala refertazione, accento verde acqua */
export const Colors = {
  light: {
    text: '#0F1B2D',
    textSecondary: '#5B6575',
    textMuted: '#8A93A3',
    background: '#F4F6F9',
    surface: '#FFFFFF',
    surfaceAlt: '#EBEFF4',
    border: '#DCE2EA',
    primary: '#0E7C86',
    primaryText: '#FFFFFF',
    primarySoft: '#D7EFF0',
    positive: '#C2410C',
    positiveSoft: '#FDE8DC',
    negative: '#15803D',
    negativeSoft: '#DDF3E4',
    warning: '#A16207',
    warningSoft: '#FEF3C7',
  },
  dark: {
    text: '#E8EDF4',
    textSecondary: '#A6B0BF',
    textMuted: '#77818F',
    background: '#0B121C',
    surface: '#141D29',
    surfaceAlt: '#1C2735',
    border: '#2A3646',
    primary: '#3FB8C2',
    primaryText: '#04191B',
    primarySoft: '#123A3E',
    positive: '#FB923C',
    positiveSoft: '#3B2414',
    negative: '#4ADE80',
    negativeSoft: '#12301E',
    warning: '#FACC15',
    warningSoft: '#3A3010',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
} as const;

export const Radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const Fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, monospace' }),
};

export const MaxContentWidth = 760;
