// The stored active scene of an adventure is taken over once per selection: a retry after a load error must not
// overwrite a scene that was selected locally in the meantime, but every new selection takes it over again, even if
// the previous selection never finished loading.
export interface SceneAdoption {
  // Called when the Game Master selects an adventure
  select: () => void
  // True exactly once per selection for the loaded adventure
  claim: (adventureId: number) => boolean
}

export const createSceneAdoption = (): SceneAdoption => {
  let adoptedId: number | null = null
  return {
    select: () => {
      adoptedId = null
    },
    claim: (adventureId) => {
      if (adoptedId === adventureId) {
        return false
      }
      adoptedId = adventureId
      return true
    },
  }
}
