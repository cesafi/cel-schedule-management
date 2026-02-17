import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, getColorScheme, ColorScheme } from '../utils/colorSchemes';
import { ThemeTransitionOverlay } from '../components/ThemeTransitionOverlay';
import { 
  ENABLE_THEME_TRANSITION_OVERLAY, 
  TRANSITION_OVERLAY_DURATION,
  TRANSITION_OVERLAY_IMAGE_URL,
  TRANSITION_OVERLAY_PROBABILITY,
  TRANSITION_OVERLAY_DIRECTION
} from '../utils/themeConfig';

interface ThemeContextValue {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'cel-schedule-theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or default to 'night'
  const [mode, setMode] = useState<ThemeMode>(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return (storedTheme === 'day' || storedTheme === 'night') ? storedTheme : 'night';
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  const colorScheme = getColorScheme(mode);

  // Check if overlay should be shown based on probability and direction
  const shouldShowOverlay = (fromMode: ThemeMode, toMode: ThemeMode): boolean => {
    if (!ENABLE_THEME_TRANSITION_OVERLAY) return false;
    
    // Check direction
    const isNightToDay = fromMode === 'night' && toMode === 'day';
    const isDayToNight = fromMode === 'day' && toMode === 'night';
    
    const directionMatches = 
      TRANSITION_OVERLAY_DIRECTION === 'both' ||
      (TRANSITION_OVERLAY_DIRECTION === 'night-to-day' && isNightToDay) ||
      (TRANSITION_OVERLAY_DIRECTION === 'day-to-night' && isDayToNight);
    
    if (!directionMatches) return false;
    
    // Check probability (0-100%)
    const randomValue = Math.random() * 100;
    return randomValue < TRANSITION_OVERLAY_PROBABILITY;
  };

  // Persist theme preference
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    
    // Update body class for global styling
    document.body.setAttribute('data-theme', mode);
    
    // Update body background
    document.body.style.backgroundColor = colorScheme.bgBase;
  }, [mode, colorScheme.bgBase]);

  const toggleTheme = () => {
    const newMode = mode === 'day' ? 'night' : 'day';
    const showOverlay = shouldShowOverlay(mode, newMode);
    
    if (showOverlay) {
      setIsTransitioning(true);
      setTimeout(() => {
        setMode(newMode);
        setTimeout(() => {
          setIsTransitioning(false);
        }, TRANSITION_OVERLAY_DURATION / 2);
      }, TRANSITION_OVERLAY_DURATION / 2);
    } else {
      setMode(newMode);
    }
  };

  const setTheme = (newMode: ThemeMode) => {
    if (newMode === mode) return;
    
    const showOverlay = shouldShowOverlay(mode, newMode);
    
    if (showOverlay) {
      setIsTransitioning(true);
      setTimeout(() => {
        setMode(newMode);
        setTimeout(() => {
          setIsTransitioning(false);
        }, TRANSITION_OVERLAY_DURATION / 2);
      }, TRANSITION_OVERLAY_DURATION / 2);
    } else {
      setMode(newMode);
    }
  };

  const value: ThemeContextValue = {
    mode,
    colorScheme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {ENABLE_THEME_TRANSITION_OVERLAY && (
        <ThemeTransitionOverlay 
          isVisible={isTransitioning} 
          mode={mode}
          imageUrl={TRANSITION_OVERLAY_IMAGE_URL}
        />
      )}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
