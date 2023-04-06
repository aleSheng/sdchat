import type { Arch, Platform } from "@tauri-apps/api/os"

const isNode = (): boolean =>
  Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) ===
  "[object process]"

export async function arch(): Promise<Arch> {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as Arch)
  }
  const tauriAppsApi = await import("@tauri-apps/api/os")
  const arch = tauriAppsApi.arch
  return arch()
}

export async function platform(): Promise<Platform> {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as Platform)
  }
  const tauriAppsApi = await import("@tauri-apps/api/os")
  const platform = tauriAppsApi.platform
  return platform()
}
