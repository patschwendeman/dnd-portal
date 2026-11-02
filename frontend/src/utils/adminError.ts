type AdminError = 'connection' | 'load' | 'save'

// Most important first: without a connection nothing loads or saves, and without loaded data a
// failed save matters less
const ERROR_PRIORITY: AdminError[] = ['connection', 'load', 'save']

// The header shows a single error, so it keeps one line; once it is resolved the next one shows
const mostImportantError = (errors: Record<AdminError, boolean>): AdminError | null => (
  ERROR_PRIORITY.find((error) => errors[error]) ?? null
)

export default mostImportantError
