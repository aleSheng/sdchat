/* eslint-disable @typescript-eslint/no-floating-promises */
import { invoke } from "@tauri-apps/api/tauri"
import { useEffect, useState } from "react"

import { arch, platform } from "@/lib/os"

import * as api from "./api"

// typescript type for the GPU info
type GPUInfo = {
  name: string
  cuda_version: string
  memory: number
}

export interface Settings {
  work_folder: string
  python_path: string
  model: string
  // theme: ThemeMode
}

export interface SystemInfoType {
  platformName: string
  archName: string
  gpuName: string
  gpuMemory: number
  cudaVersion: number
}

export interface StoreType {
  version: string
  settings: Settings
  systemInfo: SystemInfoType
  git_version: string
  python_version: string
  loading: boolean
  readSettings: () => Promise<Settings>
  setSettings: (settings: Settings) => void
}

// setting store

export function getDefaultSettings(): Settings {
  return {
    work_folder: "",
    python_path: "",
    model: "",
    // theme: ThemeMode.System,
  }
}

export async function readSettings(): Promise<Settings> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const settings: Settings | undefined = await api.readStore("settings")
  if (!settings) {
    return getDefaultSettings()
  }

  return settings
}

export async function writeSettings(settings: Settings) {
  return api.writeStore("settings", settings)
}

// react hook

export default function useStore() {
  const [version, _setVersion] = useState("unknown")
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.getVersion().then((version: string) => {
      _setVersion(version)
    })
  }, [])

  const [settings, _setSettings] = useState<Settings>(getDefaultSettings())
  const [platformName, setPlatformName] = useState<string>("")
  const [archName, setArchName] = useState<string>("")
  const [gpuName, setGPUName] = useState<string>("")
  const [gpuMemory, setGPUMemory] = useState<number>(0)
  const [cudaVersion, setCUDAVersion] = useState<number>(0)
  const [git_version, setGitVersion] = useState<string>("")
  const [python_version, setPythonVersion] = useState<string>("")

  useEffect(() => {
    readSettings().then((settings) => {
      _setSettings(settings)
      setLoading(false)
    })
  }, [])
  const setSettings = (settings: Settings) => {
    _setSettings(settings)
    writeSettings(settings)
  }

  useEffect(() => {
    void (async () => {
      const archName = await arch()
      const platformName = await platform()

      invoke<GPUInfo>("get_gpu_info")
        .then((value: GPUInfo) => {
          const { name, cuda_version, memory } = value
          setPlatformName(platformName)
          setArchName(archName)
          setGPUName(name)
          setGPUMemory(memory)
          setCUDAVersion(parseFloat(cuda_version))
        })
        .catch((err) => {
          console.error(err)
        })
    })()
  }, [])

  useEffect(() => {
    invoke<string>("detect_python", {
      pythonpath: "python",
    })
      .then((value) => {
        setPythonVersion(value)
      })
      .catch((err) => {
        console.error(err)
        setPythonVersion("Error")
      })
  }, [])

  useEffect(() => {
    invoke<string>("detect_git", {})
      .then((value) => {
        setGitVersion(value)
      })
      .catch((err) => {
        console.error(err)
        setGitVersion("Error")
      })
  }, [])

  return {
    version,
    settings,
    systemInfo: {
      platformName,
      archName,
      gpuName,
      gpuMemory,
      cudaVersion,
    },
    git_version,
    python_version,
    readSettings,
    setSettings,
    loading,
  }
}
