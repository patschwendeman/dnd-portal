import { createContext, Dispatch, SetStateAction } from 'react'

// null: no scene is active (Wall and Ground show only the background)
type ActiveSceneContextType = {
  activeSceneId: number | null
  setActiveSceneId: Dispatch<SetStateAction<number | null>>
}

export const ActiveSceneContext = createContext<ActiveSceneContextType>({
  activeSceneId: null,
  setActiveSceneId: () => {},
})

// null: no adventure is selected (yet), so no scenes or maps are loaded
type ActiveAdventureContextType = {
  activeAdventureId: number | null
  setActiveAdventureId: Dispatch<SetStateAction<number | null>>
}

export const ActiveAdventureContext = createContext<ActiveAdventureContextType>({
  activeAdventureId: null,
  setActiveAdventureId: () => {},
})
