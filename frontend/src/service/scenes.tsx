import { getData } from '../api/apiMethods'
import { SceneDetail } from '../models/models'
import { getMediaSRC } from '../utils/utils'

export const getSceneDetails = async (setSceneDetails: React.Dispatch<React.SetStateAction<SceneDetail[]>>) => {
    const scenes =  await getData('scenes/details/')
    setSceneDetails(scenes)
}

export const handleGroundScreen = async <K extends keyof SceneDetail>(id: number, key: K, setMediaSource: React.Dispatch<React.SetStateAction<string>>) => {
    const scene =  await getData(`scenes/details/${id}`)
    const src = getMediaSRC(scene, key)
    setMediaSource(src)
}