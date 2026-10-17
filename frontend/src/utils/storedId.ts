// IDs in localStorage are strings; a missing, empty or malformed value means "nothing selected".
export const parseStoredId = (value: string | null): number | null => {
  if (value === null || !/^\d+$/.test(value.trim())) {
    return null
  }
  const id = Number(value.trim())
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
