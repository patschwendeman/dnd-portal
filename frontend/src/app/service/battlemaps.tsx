import { getData } from "../../api/apiMethods";
import { Battlemap } from "../../models/models"

export const getBattlemaps = async (setBattlemaps: React.Dispatch<React.SetStateAction<Battlemap[]>>) => {
    const battlemaps =  await getData('battlemaps/');
    setBattlemaps(battlemaps);
}