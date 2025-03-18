import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import { FunctionComponent, ReactElement, useState } from 'react'
import styled from 'styled-components'


const ControlBar = styled.div`
    display: flex;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.5s ease, visibility 0.5s ease;
    width: 100%;
    height: 50px;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    align-items: center;
    justify-content: center;
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
    z-index: 99999;
    &:hover ${ControlBar} {
    opacity: 1;
    visibility: visible;
  }

`

const Button = styled.div<{$isActive: boolean}>`
    margin: 0 10px 0 10px; 
    width: 120px;
    height: 40px;
    cursor: pointer;
    border-radius: 6px;
    border: none;
    background-color: ${(props) => (props.$isActive ? props.theme.colors.primary : props.theme.colors.secondary)};
    color: ${(props) => props.theme.colors.text.color};
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
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
}

const ScreenControlBar: FunctionComponent<ScreenControlBarProps> = ({ onVisibilityChange, onSliderChange, buttonLabels }): ReactElement => {
    const [activeButton, setActiveButton] = useState<number | null>(null)
    const [sliderValue, setSliderValue] = useState<number>(100)

    function handleVisibility(option: number) {
        setActiveButton(option)
        onVisibilityChange(option)
    }

    function handleSliderChange(event: Event, option: number | number[]) {
        if(onSliderChange) {
            setSliderValue(option as number)
            onSliderChange(option as number)
        }
    }

    return(
        <Overlay>
            <ControlBar>
                {buttonLabels.map( (label, index) => (
                    <Button 
                        key={index} 
                        onClick={() => handleVisibility(index)} 
                        $isActive={activeButton === index}
                    >
                        { label }
                    </Button>
                ))}
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

export { ScreenControlBar }