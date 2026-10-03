import { FunctionComponent, ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled from 'styled-components'

import settingsIcon from '/assets/icons/settings.svg'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const Spell = styled.div`
    width: 50px;
    height: 50px;
    background-color: ${(props) => props.theme.colors.secondary};
    margin: 0 5px;
    display: inline-flex; 
    flex-shrink: 0;
    border: 1px solid red;
    svg {
      width: 100%;
      height: 100%; 
    }
`

const SpellIcon: FunctionComponent = (): ReactElement => {
    return (
        <Spell>
            <ReactSVG
                src={settingsIcon}
                beforeInjection={(svg) => {
                    svg.setAttribute('style', 'fill: red')
                }}
            />
        </Spell>  
    )
}

export { SpellIcon }