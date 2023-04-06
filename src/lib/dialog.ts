import type { OpenDialogOptions } from "@tauri-apps/api/dialog"

const isNode = (): boolean =>
  Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) ===
  "[object process]"

export async function open(
  options?: OpenDialogOptions,
): Promise<null | string | string[]> {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as null | string | string[])
  }
  const tauriAppsApi = await import("@tauri-apps/api/dialog")
  const open = tauriAppsApi.open
  return open(options)
}
