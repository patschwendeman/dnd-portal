import Slider from '@mui/material/Slider'
import styled from 'styled-components'

import { textStyle } from '../style/tokens'

const PANEL_SLIDER_THUMB_SIZE = '16px'
// Room for three digits, so the slider does not shift while dragging
const SLIDER_VALUE_MIN_WIDTH = '3ch'

// The rail takes the colour of the panel area (`background`)
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

// Half a thumb left and right, so the thumb stays inside the panel at both ends; the invisible
// touch area around the thumb is cut off instead of overflowing the panel
const PanelSliderArea = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 calc(${PANEL_SLIDER_THUMB_SIZE} / 2);
  overflow: hidden;
`

const SliderValue = styled.span`
  min-width: ${SLIDER_VALUE_MIN_WIDTH};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
  text-align: right;
`

export { PanelSlider, PanelSliderArea, SliderValue }
