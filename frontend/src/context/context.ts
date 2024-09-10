import { createContext, Dispatch, SetStateAction } from 'react'

type ActiveSceneContextType = {
  activeSceneId: number
  setActiveSceneId: Dispatch<SetStateAction<number>>
}

export const ActiveSceneContext = createContext<ActiveSceneContextType>({
  activeSceneId: 1,
  setActiveSceneId: () => {},
})
