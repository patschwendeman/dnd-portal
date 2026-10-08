import { css } from 'styled-components'

const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
}

const text = {
  xs: { fontSize: '12px', lineHeight: '16px' },
  sm: { fontSize: '14px', lineHeight: '20px' },
  md: { fontSize: '16px', lineHeight: '24px' },
  lg: { fontSize: '20px', lineHeight: '28px' },
  xl: { fontSize: '24px', lineHeight: '32px' },
  '2xl': { fontSize: '32px', lineHeight: '40px' },
  reading: { fontSize: '16px', lineHeight: '26px' },
}

const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

const letterSpacing = {
  label: '.08em',
}

const font = {
  family: {
    base: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
}

const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
}

const borderWidth = {
  thin: '1px',
  thick: '2px',
}

const size = {
  control: {
    md: '40px',
    lg: '48px',
  },
  icon: '20px',
  scrollbar: '4px',
  badge: '32px',
  button: {
    minWidth: '112px',
  },
  bar: {
    md: '56px',
    lg: '80px',
  },
}

const layer = {
  base: 0,
  raised: 1,
  media: 1,
  grid: 10,
  panel: 20,
  controls: 30,
  dialog: 40,
}

export const tokens = { space, text, fontWeight, letterSpacing, font, radius, borderWidth, size, layer }

export type TextStep = keyof typeof text

export const textStyle = (step: TextStep) => css`
  font-size: ${(props) => props.theme.text[step].fontSize};
  line-height: ${(props) => props.theme.text[step].lineHeight};
`
