import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const Spell = styled.div`
    width: 50px;
    height: 50px;
    background-color: blue;
    margin: 0 5px;
    display: inline-flex; /* Ensures SpellIcon is treated like an inline element */
    flex-shrink: 0; /* Prevent shrinking, so all icons stay the same size */
`


const SpellIcon: FunctionComponent = (): ReactElement => {


    return (
        <Spell>
        </Spell>
        
    )
}

export { SpellIcon }