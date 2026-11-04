// Shared by resource.special/negative and resource.action/positive; the roles stay separate
const RED = { surface: '#290000', border: '#ff2424' }
const GREEN = { surface: '#072900', border: '#099000' }

const darkTheme = {
  colors: {
    primary: '#4493F8',
    secondary: '#161b23',
    secondaryTranslucent: '#161b23bf',
    border: '#3d444db3',
    background: '#0e1117',
    overlay: 'rgba(0, 0, 0, 0.850)',
    scrim: 'rgba(0, 0, 0, 0.750)',
    onScrim: '#ffffff',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    text: {
      color: '#f0f6fc',
      muted: '#f0f6fcb0',
    },
    initials: '#4493F8',
    onPrimary: '#0e1117',
    error: '#8e1b1b',
    onError: '#ffffff',
    qr: {
      foreground: '#000000',
      background: '#ffffff',
    },
    resource: {
      action: { strong: GREEN.border, muted: GREEN.surface },
      bonus: { strong: '#db4400', muted: '#290e00' },
      movement: { strong: '#fae100', muted: '#292500' },
      spell: { strong: '#2487ff', muted: '#001229' },
      special: { strong: RED.border, muted: RED.surface },
      empty: '#707070',
    },
    // Negative (e.g. enemy, defeated) and positive (e.g. ally); the same in both themes
    negative: { text: '#ff6b6b', ...RED },
    positive: { text: '#3fd033', ...GREEN },
  },
}

export default darkTheme
