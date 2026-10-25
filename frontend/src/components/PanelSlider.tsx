import Slider from '@mui/material/Slider'
import styled from 'styled-components'

const PANEL_SLIDER_THUMB_SIZE = '16px'

// Slider in a dashboard panel: the rail takes the colour of the panel area (`background`)
const PanelSlider = styled(Slider)`
  & .MuiSlider-thumb {
    width: ${PANEL_SLIDER_THUMB_SIZE};
    height: ${PANEL_SLIDER_THUMB_SIZE};
    background-color: ${(props) => props.theme.colors.text.color};
    &:focus,
    &:hover,
    &:active {
      box-shadow: none;
    }
  }
  & .MuiSlider-rail {
    background-color: ${(props) => props.theme.colors.background};
    border-radius: ${(props) => props.theme.radius.pill};
  }
  & .MuiSlider-track {
    background-color: ${(props) => props.theme.colors.primary};
    border: none;
  }
`

export { PANEL_SLIDER_THUMB_SIZE, PanelSlider }
