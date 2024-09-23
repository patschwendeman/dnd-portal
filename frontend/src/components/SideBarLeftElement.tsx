import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'


const NavigationElement = styled.div<{$isElementActive: boolean}>`
  display: flex;
  width: 100%;
  height: 20px;
  background-color:${({ $isElementActive }) => ($isElementActive ? '#4493F8' : '#0e1117')};
  border-radius: 5px;
  margin: 5px;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  cursor: pointer;
`

interface SideBarLeftElementProps {
    name: string
    selectedStoryIndex: number
    handleStorySelect(id: number): void
    index: number
}

const SideBarLeftElement: FunctionComponent<SideBarLeftElementProps> = ({ name, selectedStoryIndex, handleStorySelect, index }): ReactElement => {
    const isElementActive = selectedStoryIndex === index
    return(
        <NavigationElement $isElementActive={isElementActive} onClick={() => handleStorySelect(index)}>
          { name}
        </NavigationElement>
    )

}

export { SideBarLeftElement }