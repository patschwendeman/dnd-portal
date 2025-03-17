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

interface ScreenControlBarProps {
    onVisibilityChange: (option: number) => void;
    buttonLabels: string[];
}

const ScreenControlBar: FunctionComponent<ScreenControlBarProps> = ({ onVisibilityChange, buttonLabels }): ReactElement => {

    const [activeButton, setActiveButton] = useState<number | null>(null)

    function handleVisibility(option: number) {
        setActiveButton(option)
        onVisibilityChange(option)
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
            </ControlBar>
        </Overlay>
    )
}

export { ScreenControlBar }