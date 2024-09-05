import { getData } from "../api/apiMethods";

export const getSceneDetails = async (setSceneDetails: any) => {
    const scenes =  await getData('scenes/details/');
    setSceneDetails(scenes);
}