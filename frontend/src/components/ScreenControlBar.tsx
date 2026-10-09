import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import { FunctionComponent, ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { TextButton } from './TextButton'
import { textStyle } from '../style/tokens'

// Space the floating control bar needs above the bottom edge:
// space.5 (gap) + size.bar.md (bar) + space.5 (air) = 104px
const CONTROL_BAR_CLEARANCE = '104px'
const SLIDER_WIDTH = '200px'
const SLIDER_THUMB_SIZE = '16px'
// Room for three digits, so the bar does not shift while dragging
const SLIDER_VALUE_MIN_WIDTH = '3ch'

const ControlBar = styled.div`
    display: flex;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.5s ease, visibility 0.5s ease;
    width: auto;
    height: auto;
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: ${(props) => props.theme.space[5]};
    padding: ${(props) => props.theme.space[2]};
    gap: ${(props) => props.theme.space[5]};
    align-items: center;
    border-radius: ${(props) => props.theme.radius.xl};
    background-color: ${(props) => props.theme.colors.dark};
`

const Overlay = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: ${(props) => props.theme.layer.controls};
    &:hover ${ControlBar} {
    opacity: 1;
    visibility: visible;
  }

`

const ButtonGroup = styled.div`
    display: flex;
    gap: ${(props) => props.theme.space[1]};
`

const BarLabel = styled(Label)`
    padding-left: ${(props) => props.theme.space[3]};
`

const Button = styled(TextButton)`
    letter-spacing: ${(props) => props.theme.letterSpacing.label};
`

const SliderGroup = styled.div`
    display: flex;
    align-items: center;
    gap: ${(props) => props.theme.space[3]};
    padding-right: ${(props) => props.theme.space[3]};
`

const SliderValue = styled.span`
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
    font-variant-numeric: tabular-nums;
    text-align: right;
    min-width: ${SLIDER_VALUE_MIN_WIDTH};
`

const StyledSlider = styled(Slider)`
  & .MuiSlider-thumb {
    width: ${SLIDER_THUMB_SIZE};
    height: ${SLIDER_THUMB_SIZE};
    background-color: ${(props) => props.theme.colors.text.color};
    &:focus,
    &:hover,
    &:active {
      box-shadow: none;
    }
  }
  & .MuiSlider-rail {
    background-color: ${(props) => props.theme.colors.secondary};
    border-radius: ${(props) => props.theme.radius.pill};
  }
  & .MuiSlider-track {
    background-color: ${(props) => props.theme.colors.primary};
    border: none;
  }
`

interface ScreenControlBarProps {
    onVisibilityChange: (option: number) => void
    onSliderChange?: (option: number) => void
    buttonLabels: string[]
    // Optional caption in front of the button group (e.g. "Raster" on the ground screen)
    label?: string
    // Controlled active button; if omitted, the bar tracks the last clicked button itself
    activeIndex?: number | null
}

const ScreenControlBar: FunctionComponent<ScreenControlBarProps> = ({ onVisibilityChange, onSliderChange, buttonLabels, label, activeIndex }): ReactElement => {
    const [clickedButton, setClickedButton] = useState<number | null>(null)
    const activeButton = activeIndex !== undefined ? activeIndex : clickedButton
    const [sliderValue, setSliderValue] = useState<number>(100)

    function handleVisibility(option: number) {
        setClickedButton(option)
        onVisibilityChange(option)
    }

    function handleSliderChange(_event: Event, option: number | number[]) {
        if(onSliderChange) {
            setSliderValue(option as number)
            onSliderChange(option as number)
        }
    }

    return(
        <Overlay>
            <ControlBar>
                {label && <BarLabel>{ label }</BarLabel>}
                <ButtonGroup>
                    {buttonLabels.map( (label, index) => (
                        <Button 
                            key={index} 
                            onClick={() => handleVisibility(index)} 
                            $variant={activeButton === index ? 'active' : 'default'}
                        >
                            { label }
                        </Button>
                    ))}
                </ButtonGroup>
                {onSliderChange && (
                    <SliderGroup>
                        <Label>Zelle</Label>
                        <Box sx={{ width: SLIDER_WIDTH, margin: 0 }}>
                            <StyledSlider
                                aria-label="DPI"
                                defaultValue={100}
                                value={sliderValue}
                                onChange={handleSliderChange}
                                shiftStep={100}
                                step={10}
                                min={100}
                                max={200}
                            />
                        </Box>
                        <SliderValue>{ sliderValue }</SliderValue>
                    </SliderGroup>
                )}
            </ControlBar>
        </Overlay>
    )
}

export { CONTROL_BAR_CLEARANCE, ScreenControlBar }