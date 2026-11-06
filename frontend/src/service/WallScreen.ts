import { loadData } from '../api/loadData'
import {
  AdventureDetail, JoinInfo, Player, SceneDetail,
} from '../models/models'

export const getWallScene = async (sceneId: number): Promise<SceneDetail> => (
  loadData('scene detail', `scenes/${sceneId}`)
)

export const getWallPlayers = async (adventureId: number): Promise<Player[]> => {
  const adventure: AdventureDetail = await loadData(
    `adventure ${adventureId}`,
    `adventures/${adventureId}`,
  )
  return adventure.players
}

export const getJoinInfo = async (): Promise<JoinInfo> => loadData('join info', 'table/join')
