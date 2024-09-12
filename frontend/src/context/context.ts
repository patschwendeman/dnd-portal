import { createContext, Dispatch, SetStateAction } from 'react'

type ActiveSceneContextType = {
  activeSceneId: number
  setActiveSceneId: Dispatch<SetStateAction<number>>
}

type ActiveMapContextType = {
  activeMapId: number
  setActiveMapId: Dispatch<SetStateAction<number>>
}

export const ActiveSceneContext = createContext<ActiveSceneContextType>({
  activeSceneId: 1,
  setActiveSceneId: () => {},
})

export const ActiveMapContext = createContext<ActiveMapContextType>({
  activeMapId: 0,
  setActiveMapId: () => {},
})
