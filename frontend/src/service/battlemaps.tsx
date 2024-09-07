import { getData } from "../api/apiMethods";
import { Battlemap, BattlemapLight } from "../models/models"

export const getBattlemaps = async (setBattlemaps: React.Dispatch<React.SetStateAction<Battlemap[]>>) => {
    const battlemaps =  await getData('battlemaps/');
    setBattlemaps(battlemaps);
}

export const getBattlemapsfiltered = async (setBattlemaps: React.Dispatch<React.SetStateAction<BattlemapLight[]>>, params: { [key: string]: any }) => {
    console.log(params)
    const battlemaps =  await getData('battlemaps/', params);
    
    //setBattlemaps(battlemaps);
}