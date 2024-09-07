import { apiClient } from "./apiClient";

export const getData = async (path: string, params: { [key: string]: any }) => {
  console.log(path);
  console.log(params);
  try {
    const response = await apiClient.get(path, { params });
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
