import React from 'react'
import { FunctionComponent, ReactElement } from "react"
import { Map } from "../../components/map/Map"
import './AdminScreen.css'

const AdminScreen: FunctionComponent = (): ReactElement => {

    return(
        <div className='admin-screen'>
            <div className='sidebar-right'>
                <div className='sidebar__map-container'>
                    <Map />
                </div>
                
            </div>
            <div className='bottombar'></div>

        </div>
        
    )

}
export { AdminScreen }