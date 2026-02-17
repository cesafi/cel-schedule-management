# Color Schemes and Theming System

This document describes the color scheme and theming architecture for the CEL Volunteer Tracker application.

## Overview

The application supports two color schemes:
- **Night Mode** (default): Dark theme with high contrast
- **Day Mode**: Light theme with softer colors

## Architecture

### 1. Color Scheme Configuration
**File**: [`src/utils/colorSchemes.ts`](../utils/colorSchemes.ts)

This file contains all color definitions for both day and night modes. Each color scheme includes:

#### Color Categories:
- **Base Colors**: Primary branding colors
- **Background Colors**: For different surface levels (base, container, elevated, overlay)
- **Border Colors**: For UI element boundaries
- **Text Colors**: Four levels of text hierarchy
- **Status Colors**: Success, warning, error, info states
- **Neutral Scale**: 11-step grayscale for fine-grained control

#### Color Schemes:

**Night Mode**:
```typescript
NIGHT_COLOR_SCHEME: ColorScheme = {
  bgBase: '#0a0a0a',
  bgContainer: '#171717',
  bgElevated: '#262626',
  text: '#ffffff',
  // ... see file for complete colors
}
```

**Day Mode**:
```typescript
DAY_COLOR_SCHEME: ColorScheme = {
  bgBase: '#ffffff',
  bgContainer: '#f5f5f5',
  bgElevated: '#e5e5e5',
  text: '#0a0a0a',
  // ... see file for complete colors
}
```

### 2. Theme Provider
**File**: [`src/providers/ThemeProvider.tsx`](../providers/ThemeProvider.tsx)

React Context provider that manages theme state across the application. Features:
- **Persistent Storage**: Theme preference saved to localStorage
- **Body Attribute**: Sets `data-theme` attribute for CSS styling
- **Theme Toggle**: Easy switching between day and night modes

### 3. Theme Hook
**File**: [`src/providers/ThemeProvider.tsx`](../providers/ThemeProvider.tsx)

Custom hook to access theme context:
```typescript
const { mode, colorScheme, toggleTheme, setTheme } = useTheme();
```

### 4. CSS Variables
**File**: [`src/index.css`](../index.css)

Global CSS variables that update based on `data-theme` attribute:
```css
body[data-theme="night"] {
  --color-bg-base: #0a0a0a;
  --color-text: #ffffff;
  /* ... */
}

body[data-theme="day"] {
  --color-bg-base: #ffffff;
  --color-text: #0a0a0a;
  /* ... */
}
```

### 5. Tailwind Configuration
**File**: [`tailwind.config.js`](../../tailwind.config.js)

Extended with theme-aware classes:
```javascript
darkMode: ['class', '[data-theme="night"]'],
colors: {
  theme: {
    base: 'var(--color-bg-base)',
    text: 'var(--color-text)',
    // ...
  }
}
```

## Usage

### 1. Using the Theme Hook in Components

```typescript
import { useTheme } from '../providers/ThemeProvider';

const MyComponent: React.FC = () => {
  const { mode, colorScheme, toggleTheme } = useTheme();
  
  return (
    <div style={{ background: colorScheme.bgBase, color: colorScheme.text }}>
      <button onClick={toggleTheme}>
        {mode === 'night' ? 'Switch to Day' : 'Switch to Night'}
      </button>
    </div>
  );
};
```

### 2. Using CSS Variables in Stylesheets

```css
.my-component {
  background-color: var(--color-bg-container);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

### 3. Using Tailwind Theme Classes

```tsx
<div className="bg-theme-base text-theme-text border-theme-border">
  Content
</div>
```

### 4. Conditional Styling Based on Mode

```typescript
const { mode } = useTheme();

<div style={{
  background: mode === 'night' 
    ? 'rgba(23, 23, 23, 0.8)' 
    : 'rgba(245, 245, 245, 0.9)'
}}>
```

## Day/Night Toggle

The toggle button is located in the Header component ([`src/layouts/Header.tsx`](../layouts/Header.tsx)):

- **Icon**: Sun icon in night mode, Moon icon in day mode
- **Tooltip**: Displays current action ("Switch to Day Mode" / "Switch to Night Mode")
- **Location**: Top-right of header, before user profile dropdown

## Adding New Color Values

To add a new color:

1. **Add to ColorScheme interface** in `colorSchemes.ts`:
```typescript
export interface ColorScheme {
  // ... existing colors
  myNewColor: string;
}
```

2. **Add to both color schemes**:
```typescript
export const NIGHT_COLOR_SCHEME: ColorScheme = {
  // ... existing colors
  myNewColor: '#123456',
};

export const DAY_COLOR_SCHEME: ColorScheme = {
  // ... existing colors
  myNewColor: '#abcdef',
};
```

3. **Optionally add CSS variable** in `index.css`:
```css
body[data-theme="night"] {
  --color-my-new: #123456;
}

body[data-theme="day"] {
  --color-my-new: #abcdef;
}
```

4. **Use in components**:
```typescript
const { colorScheme } = useTheme();
<div style={{ color: colorScheme.myNewColor }} />
```

## Best Practices

1. **Always use the color scheme**: Don't hardcode colors; reference them from `colorScheme`
2. **Add transitions**: Include `transition: 'all 0.3s ease'` for smooth theme switching
3. **Test both modes**: Verify UI looks good in both day and night modes
4. **Use semantic naming**: Color names should describe function, not appearance
5. **Maintain consistency**: Follow the established neutral scale for new colors

## File Structure

```
src/
├── utils/
│   ├── colorSchemes.ts          # Color definitions
│   └── index.ts                 # Utils barrel export
├── providers/
│   ├── ThemeProvider.tsx        # Theme context & hook
│   └── index.ts                 # Providers barrel export
├── layouts/
│   ├── Header.tsx               # Contains theme toggle
│   └── MainLayout.tsx           # Uses theme colors
├── App.tsx                      # Wraps app in ThemeProvider
└── index.css                    # CSS variables & global styles
```

## Technical Details

- **Storage Key**: `cel-schedule-theme`
- **Default Theme**: Night mode
- **Theme Attribute**: `data-theme` on `<body>`
- **Ant Design Integration**: Theme adapted via ConfigProvider
- **Transition Duration**: 0.3s ease
