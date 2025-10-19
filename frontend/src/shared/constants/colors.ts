export const COLORS = {
  PRIMARY: '#1D74AE',
  DARK: '#032742',
  MEDIUM: '#335471',
  LIGHT: '#5B819B',
  GRAY: '#929198',
} as const;

// Mantineのカラーパレット用（薄い順→濃い順）
export const BRAND_COLORS = [
  '#e3f0f9', // 0: 一番薄い
  '#b3d3ea', // 1
  '#8bb8d6', // 2
  COLORS.LIGHT, // 3
  '#6a97b6', // 4
  COLORS.MEDIUM, // 5
  '#29577a', // 6
  COLORS.PRIMARY, // 7
  COLORS.DARK, // 8
  COLORS.GRAY, // 9: 一番濃い
] as const;
