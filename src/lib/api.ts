/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { EventCallback, UnlistenFn } from "@tauri-apps/api/event"
import { WindowOptions } from "@tauri-apps/api/window"

import { Settings } from "./store"

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const isNode = (): boolean =>
  Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) ===
  "[object process]"

export const openWebview = async (
  label: string,
  options: WindowOptions | undefined,
  okCallback: () => void,
  errCallback: () => void,
) => {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as string)
  }
  const tauriWindow = await import("@tauri-apps/api/window")
  const webview = new tauriWindow.WebviewWindow(label, options)
  // since the webview window is created asynchronously,
  // Tauri emits the `tauri://created` and `tauri://error` to notify you of the creation response
  webview.once("tauri://created", () => {
    // webview window successfully created
    okCallback()
  })
  webview.once("tauri://error", (e) => {
    // an error occurred during webview window creation
    console.error(e) //TODO
    errCallback()
  })
}

export const windowEmit = async (event: string, payload: unknown) => {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve()
  }
  const tauriWindow = await import("@tauri-apps/api/window")
  return tauriWindow.appWindow.emit(event, payload)
}

export const listen = async (
  event: string,
  handler: EventCallback<unknown>,
): Promise<UnlistenFn> => {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return Promise.resolve(() => {})
  }
  const tauriWindow = await import("@tauri-apps/api/window")
  return tauriWindow.appWindow.listen(event, handler)
}

export const getVersion = async () => {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as string)
  }
  const app = await import("@tauri-apps/api/app")
  return app.getVersion()
}

export const openLink = async (url: string) => {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve()
  }
  const shell = await import("@tauri-apps/api/shell")
  return shell.open(url)
}

export const writeStore = async (key: string, value: Settings) => {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve()
  }
  const fs = await import("@tauri-apps/api/fs")
  const config = await readConfig()
  config[key] = value
  await fs.writeTextFile("config.json", JSON.stringify(config), {
    dir: fs.Dir.AppLocalData,
  })
}

export const readStore = async (key: string) => {
  const config = await readConfig()
  return config[key]
}

async function readConfig() {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as string)
  }
  const fs = await import("@tauri-apps/api/fs")
  const configExists = await fs.exists("config.json", { dir: fs.Dir.AppLocalData })
  if (!configExists) {
    await fs.writeTextFile("config.json", "{}", { dir: fs.Dir.AppLocalData })
  }
  const configJson = await fs.readTextFile("config.json", { dir: fs.Dir.AppLocalData })
  return JSON.parse(configJson)
}

export const resolveResource = async (resourcePath: string): Promise<string> => {
  if (isNode()) {
    // This shouldn't ever happen when React fully loads
    return Promise.resolve(undefined as unknown as string)
  }
  const tauriPath = await import("@tauri-apps/api/path")
  return tauriPath.resolveResource(resourcePath)
}

// export const shouldUseDarkColors = async (): Promise<boolean> => {
//   const theme = await window.appWindow.theme()
//   return theme === "dark"
// }

// export async function onSystemThemeChange(callback: () => void) {
//     return window.appWindow.onThemeChanged(callback)
// }
