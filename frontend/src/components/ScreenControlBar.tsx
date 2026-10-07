import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import { FunctionComponent, ReactElement, useState } from 'react'
import styled from 'styled-components'

import { TextButton } from './TextButton'

// Space the floating control bar needs above the bottom edge:
// space.5 (gap) + size.bar.md (bar) + space.5 (air) = 104px (DESIGN.md 1.3)
const CONTROL_BAR_CLEARANCE = '104px'

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

const Button = styled(TextButton)`
    letter-spacing: ${(props) => props.theme.letterSpacing.label};
`

const StyledSlider = styled(Slider)`
  & .MuiSlider-thumb {
    background-color: ${(props) => props.theme.colors.text.color};
    &:focus,
    &:hover,
    &:active {
      box-shadow: none;
    }
  }
  & .MuiSlider-rail {
    background-color: ${(props) => props.theme.colors.secondary};
    height: 10px;
    
  }
  & .MuiSlider-track {
    background-color: ${(props) => props.theme.colors.primary};
    height: 10px;
    border: none;
  }
  & .MuiSlider-mark {
    background-color: ${(props) => props.theme.colors.text.color};
    height: 5px;
    width: 5px;
    border-radius: 50%;
  }
  & .MuiSlider-markLabel {
    color: ${(props) => props.theme.colors.text.color};
    font-size: 0.75rem;
  }
  & .MuiSlider-valueLabel {
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
    font-size: 0.8rem;
    border-radius: 6px;
    padding: 4px 8px;
  }
`

interface ScreenControlBarProps {
    onVisibilityChange: (option: number) => void
    onSliderChange?: (option: number) => void
    buttonLabels: string[]
    // Controlled active button; if omitted, the bar tracks the last clicked button itself
    activeIndex?: number | null
}

const ScreenControlBar: FunctionComponent<ScreenControlBarProps> = ({ onVisibilityChange, onSliderChange, buttonLabels, activeIndex }): ReactElement => {
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
                    <Box sx={{ width: 200, margin: 1 }}>
                        <StyledSlider
                            aria-label="DPI"
                            defaultValue={100}
                            value={sliderValue}
                            onChange={handleSliderChange}
                            valueLabelDisplay="auto"
                            shiftStep={100}
                            step={10}
                            marks
                            min={100}
                            max={200}
                        />
                    </Box>
                )}
            </ControlBar>
        </Overlay>
    )
}

export { CONTROL_BAR_CLEARANCE, ScreenControlBar }