/**
 * Color Schemes Configuration
 * 
 * This file contains all color schemes for day and night modes.
 * These colors are used throughout the application for consistent theming.
 */

export interface ColorScheme {
  // Base colors
  primary: string;
  secondary: string;
  accent: string;
  
  // Background colors
  bgBase: string;
  bgContainer: string;
  bgElevated: string;
  bgOverlay: string;
  
  // Border colors
  border: string;
  borderSecondary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Neutral scale (for fine-grained control)
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

/**
 * Night Mode Color Scheme (Current Default)
 */
export const NIGHT_COLOR_SCHEME: ColorScheme = {
  // Base colors
  primary: '#737373',
  secondary: '#a3a3a3',
  accent: '#d4d4d4',
  
  // Background colors
  bgBase: '#0a0a0a',
  bgContainer: '#171717',
  bgElevated: '#262626',
  bgOverlay: 'rgba(23, 23, 23, 0.6)',
  
  // Border colors
  border: '#404040',
  borderSecondary: 'rgba(64, 64, 64, 0.6)',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#d4d4d4',
  textTertiary: '#a3a3a3',
  textQuaternary: '#737373',
  
  // Status colors
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  
  // Neutral scale
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
};

/**
 * Day Mode Color Scheme
 * Features cobalt blue accents with softer, less bright backgrounds
 */
export const DAY_COLOR_SCHEME: ColorScheme = {
  // Base colors - cobalt blue theme
  primary: '#0050B3',
  secondary: '#1677FF',
  accent: '#0047AB',
  
  // Background colors - soft blue-tinted whites
  bgBase: '#F5F7FA',
  bgContainer: '#FFFFFF',  // White for tables and containers
  bgElevated: '#E8EEF5',
  bgOverlay: 'rgba(245, 247, 250, 0.95)',
  
  // Border colors - subtle blue-gray
  border: '#C5D1E0',
  borderSecondary: 'rgba(197, 209, 224, 0.7)',
  
  // Text colors - high contrast for readability
  text: '#1A1A1A',
  textSecondary: '#3D3D3D',
  textTertiary: '#5C5C5C',
  textQuaternary: '#7A7A7A',
  
  // Status colors
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  
  // Neutral scale with blue undertones
  neutral: {
    50: '#0F1419',
    100: '#1A1F24',
    200: '#2C3439',
    300: '#404951',
    400: '#5A656E',
    500: '#7A8690',
    600: '#9BA8B3',
    700: '#C5D1E0',
    800: '#E8EEF5',
    900: '#F5F7FA',
    950: '#FAFBFC',
  },
};

export type ThemeMode = 'day' | 'night';

/**
 * Get color scheme based on theme mode
 */
export const getColorScheme = (mode: ThemeMode): ColorScheme => {
  return mode === 'day' ? DAY_COLOR_SCHEME : NIGHT_COLOR_SCHEME;
};

/**
 * Theme Configuration Constants
 */
export const THEME_CONSTANTS = {
  borderRadius: 12,
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  transitionDuration: '0.3s',
  transitionEasing: 'ease',
} as const;
