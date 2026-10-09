import { apiClient } from './apiClient'

export const getData = async (
  path: string,
  params?: { [key: string]: boolean }
) => {
  const response = await apiClient.get(path, { params })
  return response.data
}
