import { apiClient } from "./apiClient";

export const getData = async (
  path: string,
  params?: { [key: string]: boolean }
) => {
  try {
    const response = await apiClient.get(path, { params });
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
