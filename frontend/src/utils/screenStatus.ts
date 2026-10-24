// Texts of the dashboard panel "Screens"; null: the server has not sent the counts yet
export const NO_STATUS = '–'

export const screenStatusText = (count: number | null): string => {
  if (count === null) {
    return NO_STATUS
  }
  if (count === 0) {
    return 'nicht verbunden'
  }
  return count === 1 ? 'verbunden' : `${count} verbunden`
}

export const playerStatusText = (count: number | null): string => (
  count === null ? NO_STATUS : `${count} Spieler verbunden`
)
