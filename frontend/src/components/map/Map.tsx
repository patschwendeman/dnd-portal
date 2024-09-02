import React from 'react'
import { FunctionComponent, ReactElement } from "react"
import './Map.css'

const Map: FunctionComponent = (): ReactElement => {

    return(
            <div className='container__battlemaps'>
                <div className='battlemaps__col'>
                    <div className='battlemap'>

                    </div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                </div>
                <div className='battlemaps__col'>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                </div>
                <div className='battlemaps__col'>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                </div>
                <div className='battlemaps__col'>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                    <div className='battlemap'></div>
                </div>
                
            </div>
        
    )

}
export { Map }