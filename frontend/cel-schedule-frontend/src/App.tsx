import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { AppRouter } from './routes';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { THEME_CONSTANTS } from './utils/colorSchemes';
import 'antd/dist/reset.css';

const ThemedApp: React.FC = () => {
  const { mode, colorScheme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === 'night' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgBase: colorScheme.bgBase,
          colorBgContainer: colorScheme.bgContainer,
          colorBgElevated: colorScheme.bgElevated,
          colorBorder: colorScheme.border,
          colorPrimary: colorScheme.primary,
          colorText: colorScheme.text,
          colorTextSecondary: colorScheme.textSecondary,
          colorTextTertiary: colorScheme.textTertiary,
          colorTextQuaternary: colorScheme.textQuaternary,
          borderRadius: THEME_CONSTANTS.borderRadius,
          fontSize: THEME_CONSTANTS.fontSize,
          fontWeightStrong: THEME_CONSTANTS.fontWeightMedium,
        },
        components: {
          Layout: {
            headerBg: colorScheme.bgContainer,
            bodyBg: colorScheme.bgBase,
            footerBg: colorScheme.bgContainer,
          },
          Menu: {
            darkItemBg: colorScheme.bgContainer,
            darkItemSelectedBg: mode === 'day' ? 'rgba(255, 255, 255, 0.15)' : colorScheme.bgElevated,
            darkItemHoverBg: mode === 'night' ? 'rgba(38, 38, 38, 0.5)' : 'rgba(255, 255, 255, 0.1)',
            itemBg: colorScheme.bgContainer,
            itemSelectedBg: mode === 'day' ? 'rgba(255, 255, 255, 0.15)' : colorScheme.bgElevated,
            itemHoverBg: mode === 'night' ? 'rgba(38, 38, 38, 0.5)' : 'rgba(255, 255, 255, 0.1)',
            colorItemText: mode === 'day' ? '#ffffff' : undefined,
            colorItemTextHover: mode === 'day' ? '#ffffff' : undefined,
            colorItemTextSelected: mode === 'day' ? '#ffffff' : undefined,
          },
          Card: {
            colorBgContainer: colorScheme.bgOverlay,
            colorBorderSecondary: colorScheme.borderSecondary,
          },
          Button: {
            colorBgContainer: colorScheme.bgElevated,
            colorBorder: colorScheme.border,
          },
          Typography: {
            colorText: colorScheme.text,
            colorTextSecondary: colorScheme.textSecondary,
            colorTextDescription: colorScheme.textTertiary,
            colorLink: colorScheme.textSecondary,
            colorLinkHover: colorScheme.textSecondary,
            colorLinkActive: colorScheme.textSecondary,
          },
        },
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;
