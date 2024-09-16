import { getData } from '../api/apiMethods'
import { Map } from '../models/models'

export const getBattlemaps = async (setBattlemaps: React.Dispatch<React.SetStateAction<Map[]>>) => {
    const battlemaps =  await getData('maps/battlemaps/')
    setBattlemaps(battlemaps)
}

export const getBattlemapById = async (setBattlemap: React.Dispatch<React.SetStateAction<Map[]>>, id: number) => {
    const battlemap =  await getData(`maps/battlemaps/${id}`)
    setBattlemap(battlemap)
}

export const getsidemaps = async (setSidemaps: React.Dispatch<React.SetStateAction<Map[]>>) => {
    const sidemaps =  await getData('maps/sidemaps/')
    setSidemaps(sidemaps)
}

export const getBattlemapsfiltered = async (setBattlemaps: React.Dispatch<React.SetStateAction<Map[]>>, params: { [key: string]: boolean }) => {
    const battlemaps =  await getData('maps/battlemaps/', params)
    setBattlemaps(battlemaps)
}