import { apiClient } from './apiClient'

export const getData = async (
  path: string,
  params?: Record<string, boolean>,
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

export const putData = async (path: string, body: object) => {
  const response = await apiClient.put(path, body)
  return response.data
}

export const deleteData = async (path: string) => {
  const response = await apiClient.delete(path)
  return response.data
}
