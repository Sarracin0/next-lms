/* eslint-disable no-console */
export const logError = (scope: string, error: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${scope}]`, error)
  }
}

export const logWarn = (scope: string, message: string, ...metadata: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[${scope}]`, message, ...metadata)
  }
}
