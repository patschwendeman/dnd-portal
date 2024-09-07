import { createContext, Dispatch, SetStateAction } from 'react'

type ActiveSceneContextType = {
  activeScene: number
  setActiveScene: Dispatch<SetStateAction<number>>
}

export const ActiveSceneContext = createContext<ActiveSceneContextType>({
  activeScene: 1,
  setActiveScene: () => {},
})
