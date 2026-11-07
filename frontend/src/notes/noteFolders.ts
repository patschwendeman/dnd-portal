/**
 * The entries of the panel "Notizen", each one a folder of public/story/. A new folder only needs a
 * line here.
 */
export const NOTE_FOLDERS = [
  { id: 'main', label: 'Main' },
  { id: 'fight', label: 'Fight' },
  { id: 'leveling', label: 'Leveling' },
  { id: 'mechanics', label: 'Mechaniken' },
] as const

export type NoteFolderId = typeof NOTE_FOLDERS[number]['id']

export const DEFAULT_NOTE_FOLDER_ID: NoteFolderId = 'main'

// Only the paths are used: the files are fetched from public/ when the Admin shows the notes
const GLOB_PREFIX = '../../public/story/'
const globbedFiles = Object.keys(import.meta.glob('../../public/story/*/*.md'))

/** Note paths relative to public/story/, e.g. "mechanics/rest.md" */
export const noteFolderOf = (path: string): string => path.split('/')[0]

export const noteFolderIdOf = (path: string): NoteFolderId | null => (
  NOTE_FOLDERS.find((folder) => folder.id === noteFolderOf(path))?.id ?? null
)

/** Files in folders without an entry cannot be shown, so they are no link targets either */
export const NOTE_FILES: string[] = globbedFiles
  .map((file) => file.slice(GLOB_PREFIX.length))
  .filter((path) => noteFolderIdOf(path) !== null)

export const noteFileUrl = (path: string): string => `/story/${path}`
