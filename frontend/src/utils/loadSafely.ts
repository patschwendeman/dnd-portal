// Runs a load and hands a failure to onError, so a load started from an effect never ends in an
// unhandled promise rejection.
export const loadSafely = async (
  load: () => Promise<void>,
  onError: (error: unknown) => void
): Promise<void> => {
  try {
    await load()
  } catch (error) {
    onError(error)
  }
}
