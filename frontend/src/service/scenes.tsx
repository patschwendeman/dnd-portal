import { getData } from '../api/apiMethods'
import { SceneDetail } from '../models/models'

export const getSceneDetails = async (setSceneDetails: React.Dispatch<React.SetStateAction<SceneDetail[]>>) => {
    const scenes =  await getData('scenes/details/')
    setSceneDetails(scenes)
}