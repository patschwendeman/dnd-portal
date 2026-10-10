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

// Like loadSafely, but drops the result and the error once isStale() reports that the load was overtaken
// (e.g. by a newer scene or tab), so a slow, outdated response never overwrites the current one.
export const loadLatest = <T>(
  load: () => Promise<T>,
  apply: (result: T) => void,
  onError: (error: unknown) => void,
  isStale: () => boolean
): Promise<void> => loadSafely(
  async () => {
    const result = await load()
    if (!isStale()) {
      apply(result)
    }
  },
  (error) => {
    if (!isStale()) {
      onError(error)
    }
  }
)
