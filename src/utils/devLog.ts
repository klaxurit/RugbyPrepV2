/**
 * Logger tool that only emits in development.
 *
 * Use for trace-level logs that help during dev but pollute prod console
 * (and risk leaking PII via verbose payloads). Errors and warnings keep
 * using `console.error` / `console.warn` since they're useful in prod.
 */
const isDev = import.meta.env.DEV

export function devLog(...args: unknown[]): void {
  if (isDev) {
    // eslint-disable-next-line no-console -- intentional dev logging
    console.log(...args)
  }
}

export function devInfo(...args: unknown[]): void {
  if (isDev) {
    // eslint-disable-next-line no-console -- intentional dev logging
    console.info(...args)
  }
}
