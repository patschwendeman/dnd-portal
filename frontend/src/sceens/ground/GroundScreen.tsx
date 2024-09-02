import React from 'react'
import { FunctionComponent, ReactElement } from "react"
import './GroundScreen.css'


const GroundScreen: FunctionComponent = (): ReactElement => {

    return(
        <div className='ground-screen'>
            <img src="/test.jpg" alt="" />  
        </div>       
    )

}
export { GroundScreen }