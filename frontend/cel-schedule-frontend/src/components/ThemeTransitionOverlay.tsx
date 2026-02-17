import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeTransitionOverlayProps {
  isVisible: boolean;
  mode: 'day' | 'night';
  imageUrl?: string | null;
}

export const ThemeTransitionOverlay: React.FC<ThemeTransitionOverlayProps> = ({ 
  isVisible, 
  mode,
  imageUrl 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Theme transition"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: mode === 'day' 
                  ? 'linear-gradient(to bottom, #87CEEB 0%, #FFD700 50%, #FF6B35 100%)'
                  : 'linear-gradient(to bottom, #0F2027 0%, #203A43 50%, #2C5364 100%)',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
