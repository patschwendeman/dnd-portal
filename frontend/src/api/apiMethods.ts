import { apiClient } from './apiClient'

export const getData = async (
  path: string,
  params?: { [key: string]: boolean }
) => {
  const response = await apiClient.get(path, { params })
  return response.data
}

export const patchData = async (path: string, body: object) => {
  const response = await apiClient.patch(path, body)
  return response.data
}

export const postData = async (path: string, body?: object) => {
  const response = await apiClient.post(path, body)
  return response.data
}
