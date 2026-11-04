// Shared by resource.special/negative and resource.action/positive; the roles stay separate
const RED = { surface: '#290000', border: '#ff2424' }
const GREEN = { surface: '#072900', border: '#099000' }

const tavernTheme = {
  colors: {
    primary: '#C05E5E',
    secondary: '#3D271C',
    secondaryTranslucent: '#3D271Ceb',
    border: '#956F01',
    background: '#140701',
    overlay: 'rgba(0, 0, 0, 0.850)',
    scrim: 'rgba(0, 0, 0, 0.750)',
    onScrim: '#ffffff',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    text: {
      color: '#CBAB96',
      muted: '#CBAB96b0',
    },
    initials: '#CBAB96',
    onPrimary: '#140701',
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

export default tavernTheme
