import { getData } from '../api/apiMethods'
import { Map } from '../models/models'

export const getBattlemaps = async (setBattlemaps: React.Dispatch<React.SetStateAction<Map[]>>) => {
    const battlemaps =  await getData('battlemaps/')
    setBattlemaps(battlemaps)
}

export const getBattlemapsfiltered = async (setBattlemaps: React.Dispatch<React.SetStateAction<Map[]>>, params: { [key: string]: boolean }) => {
    const battlemaps =  await getData('battlemaps/', params)
    setBattlemaps(battlemaps)
}