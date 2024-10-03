import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { SpellIcon } from './SpellIcon'


const SpellContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    @media (max-width: 649px) {
        display: none;
  }

`

const SpellBar = styled.div`
    display: flex;
    width: 100%;
    height: 80px;
    /* background-color: ${(props) => props.theme.colors.secondary}; */
    /* border-top: 2px solid ${(props) => props.theme.colors.border}; */
    overflow-x: auto;
    white-space: nowrap;
    align-items: center;
    padding: 5px 20px;

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
`

const SpellDescription = styled.div`
    width: 50%;
    height: 100%;
    background-color: ${(props) => props.theme.colors.secondary};
    margin: 5px 0 15px 0;
    border-radius: 0 0 12px 12px;
    

`

const SpellBarPlayer: FunctionComponent = (): ReactElement => {


    return (
        <SpellContainer>
            <SpellBar>
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
                <SpellIcon />
            </SpellBar>
            <SpellDescription>
                Rage

            </SpellDescription>
        </SpellContainer>
        
    )
}

export { SpellBarPlayer }
