import { loadData } from '../api/loadData'
import { AdventureDetail } from '../models/models'

// Players and background images of the active adventure for the selection and the Player Screen
const getPlayerAdventure = async (id: number): Promise<AdventureDetail> => (
  loadData(`adventure ${id}`, `adventures/${id}`)
)

export default getPlayerAdventure
