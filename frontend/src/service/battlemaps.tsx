import { getData } from '../api/apiMethods'
import { Map } from '../models/models'

export const getBattlemaps = async (setBattlemaps: React.Dispatch<React.SetStateAction<Map[]>>) => {
    const battlemaps =  await getData('maps/battlemaps/')
    setBattlemaps(battlemaps)
}

export const getBattlemapsfiltered = async (setBattlemaps: React.Dispatch<React.SetStateAction<Map[]>>, params: { [key: string]: boolean }) => {
    const battlemaps =  await getData('maps/battlemaps/', params)
    setBattlemaps(battlemaps)
}