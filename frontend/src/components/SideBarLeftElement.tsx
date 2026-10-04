import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { textStyle } from '../style/tokens'

const NavigationElement = styled.div<{$isElementActive: boolean}>`
  display: flex;
  width: 100%;
  height: ${(props) => props.theme.size.control.md};
  background-color:${( props ) => (props.$isElementActive ? props.theme.colors.primary : props.theme.colors.secondary)};
  border-radius: ${(props) => props.theme.radius.md};
  margin: 0;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  cursor: pointer;
  padding: 0 ${(props) => props.theme.space[3]};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  color: ${(props) => (props.$isElementActive ? props.theme.colors.onPrimary : props.theme.colors.text.color)};
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
