import { apiClient } from './apiClient'

export const getData = async (
  path: string,
  params?: { [key: string]: boolean }
) => {
  try {
    const response = await apiClient.get(path, { params })
    return response.data
  } catch (error) {
    console.error(error)
  }
}

export const updateData = async (path: string, id: number) => {
  try {
    const body = {
      updates: {
        locked: false,
      },
    }
    const response = await apiClient.put(path + id, body)
    return response.data
  } catch (error) {
    console.error(error)
  }
}
