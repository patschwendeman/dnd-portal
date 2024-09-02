import React from 'react'
import { FunctionComponent, ReactElement } from "react"
import './MapOverview.css'
import { MapElement } from '../map_element/MapElement'

interface MapOverviewProps {
    gap: string,
    src: string

}

const MapOverview: FunctionComponent<MapOverviewProps> = ({ gap, src }): ReactElement => {



    return(
            <div className='container__battlemaps'  style={{ gap: gap }}>
                <div className='battlemaps__col' style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </div>
                <div className='battlemaps__col' style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </div>
                <div className='battlemaps__col' style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </div>
                <div className='battlemaps__col' style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </div>
                
            </div>
        
    )

}
export { MapOverview }