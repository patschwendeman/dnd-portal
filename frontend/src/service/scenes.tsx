import { getData, updateData } from '../api/apiMethods'
import { SceneDetail } from '../models/models'
import { getMediaSRC } from '../utils/utils'

export const getSceneDetails = async (setSceneDetails: React.Dispatch<React.SetStateAction<SceneDetail[]>>) => {
    const scenes =  await getData('scenes/details/')
    if(!scenes) {
        throw new Error('Scene details not found')   
    }
    setSceneDetails(scenes)
}

export const handleGroundScreen = async <K extends keyof SceneDetail>(id: number, key: K, setMediaSource: React.Dispatch<React.SetStateAction<string>>) => {
    const scene =  await getData(`scenes/details/${id}`)
    const src = getMediaSRC(scene, key)
    setMediaSource(src)
}

export const handleDialogue = (option: boolean, sceneOption: SceneDetail | undefined, setActiveSceneId: React.Dispatch<React.SetStateAction<number>>, setDialogueVisibility: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (option === true) {
        if (!sceneOption) {
            throw new Error('Scene option not found')   
        }
        setActiveSceneId(sceneOption.id)
            if(sceneOption.fight === true) {
                if(!sceneOption.battlemaps_id) {
                    throw new Error('Battlemap not found')
                }
                updateData('maps/battlemaps/', sceneOption.battlemaps_id)
            }
    }
    setDialogueVisibility(false)
}
