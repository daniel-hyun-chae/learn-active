export const tokens = {
  color: {
    background: '#0b1020',
    surface: '#11172a',
    text: '#f5f7ff',
    muted: '#c8d4ff',
    primary: '#5b8cff',
    accent: '#45d6ff',
    border: '#27324a',
  },
  opacity: {
    pressed: 0.85,
    disabled: 0.6,
  },
  size: {
    contentMax: 1120,
    cardMin: 280,
    viewportHeight: '100vh',
    viewportWidth: '100vw',
  },
  border: {
    width: {
      sm: 1,
      md: 2,
    },
  },
  spacing: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  font: {
    family: {
      base: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    size: {
      sm: 14,
      md: 16,
      lg: 20,
      xl: 28,
    },
    weight: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
}

export const tokenVars = {
  color: {
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    text: 'var(--color-text)',
    muted: 'var(--color-text-muted)',
    primary: 'var(--color-primary)',
    accent: 'var(--color-accent)',
    border: 'var(--color-border)',
  },
  opacity: {
    pressed: 'var(--opacity-pressed)',
    disabled: 'var(--opacity-disabled)',
  },
  size: {
    contentMax: 'var(--size-content-max)',
    cardMin: 'var(--size-card-min)',
    viewportHeight: 'var(--size-viewport-height)',
    viewportWidth: 'var(--size-viewport-width)',
  },
  border: {
    width: {
      sm: 'var(--border-width-sm)',
      md: 'var(--border-width-md)',
    },
  },
  spacing: {
    none: 'var(--spacing-none)',
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
  },
  font: {
    family: {
      base: 'var(--font-family-base)',
    },
    size: {
      sm: 'var(--font-size-sm)',
      md: 'var(--font-size-md)',
      lg: 'var(--font-size-lg)',
      xl: 'var(--font-size-xl)',
    },
    weight: {
      regular: 'var(--font-weight-regular)',
      medium: 'var(--font-weight-medium)',
      bold: 'var(--font-weight-bold)',
    },
  },
}
