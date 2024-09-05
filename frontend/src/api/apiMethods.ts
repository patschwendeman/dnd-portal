import { apiClient } from "./apiClient";

export const getData = async (path: string) => {
  try {
    const response = await apiClient.get(path);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
