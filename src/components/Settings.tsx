/* eslint-disable radix */
import { AnimatePresence, motion } from "framer-motion"
import { Check } from "lucide-react"
import create from "zustand"

export function Settings() {
  const [open, settings, setSettings] = Settings.use((state) => [
    state.isOpen,
    state.settings,
    state.setSettings,
  ])

  return (
    <div
      className={`absolute bottom-[3.75rem] duration-200 flex flex-col gap-4 p-3 w-80 bg-base-100 border border-base-100 rounded-lg drop-shadow-md ${
        open
          ? "block right-[0.75rem] lg:right-[0.5rem]"
          : "hidden opacity-0 right-[0.75rem]"
      }`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-sm font-semibold">Model</h1>
        </div>
        <div className="flex flex-row gap-2 p-1 rounded-lg bg-white/5 border border-white/10 w-fit">
          {["1.5", "2.1", "2.1 large", "anime"].map((model) => (
            <button
              key={model}
              className={`rounded flex justify-center relative font-semibold px-2 items-center ${
                settings.model ===
                (model === "1.5"
                  ? "stable-diffusion-v1-5"
                  : model === "2.1"
                  ? "stable-diffusion-512-v2-1"
                  : model === "2.1 large"
                  ? "stable-diffusion-768-v2-1"
                  : "anything-v3.0")
                  ? "text-neutral "
                  : "hover:text-neutral  text-neutral/75"
              }`}
              onClick={() => {
                setSettings({
                  ...settings,
                  model:
                    model === "1.5"
                      ? "stable-diffusion-v1-5"
                      : model === "2.1"
                      ? "stable-diffusion-512-v2-1"
                      : model === "2.1 large"
                      ? "stable-diffusion-768-v2-1"
                      : "anything-v3.0",
                  width: Math.max(
                    model === "v2.1 large" ? 768 : 512,
                    Math.min(model === "anime" ? 768 : 1024, settings.width),
                  ),
                  height: Math.max(
                    model === "v2.1 large" ? 768 : 512,
                    Math.min(model === "anime" ? 768 : 1024, settings.height),
                  ),
                })
              }}
            >
              {settings.model ===
                (model === "1.5"
                  ? "stable-diffusion-v1-5"
                  : model === "2.1"
                  ? "stable-diffusion-512-v2-1"
                  : model === "2.1 large"
                  ? "stable-diffusion-768-v2-1"
                  : "anything-v3.0") &&
                open && (
                  <motion.div
                    layoutId="model"
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0 rounded bg-white/10"
                    initial={false}
                  />
                )}
              {model}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-sm font-semibold">Size</h1>
          <p className="text-sm">
            {settings.width}x{settings.height}
          </p>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-white/10 rounded-full appearance-none"
          min={settings.model === "stable-diffusion-768-v2-1" ? 768 : 512}
          max={settings.model === "anything-v3.0" ? 768 : 1024}
          step={64}
          value={settings.width}
          onChange={(e) => {
            setSettings({
              ...settings,
              width: parseInt(e.target.value),
              height: parseInt(e.target.value),
            })
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-sm font-semibold">Image Count</h1>
          <p className="text-sm">{settings.count}</p>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-white/10 rounded-full appearance-none"
          min={1}
          max={10}
          step={1}
          value={settings.count}
          onChange={(e) => {
            setSettings({
              ...settings,
              count: parseInt(e.target.value),
            })
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className=" text-sm font-semibold">Steps</h1>
          <p className="text-sm">{settings.steps}</p>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-white/10 rounded-full appearance-none"
          min={10}
          max={150}
          step={1}
          value={settings.steps}
          onChange={(e) => {
            setSettings({
              ...settings,
              steps: parseInt(e.target.value),
            })
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-sm font-semibold">CFG Scale</h1>
          <p className="text-sm">{settings.scale}</p>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-white/10 rounded-full appearance-none"
          min={0}
          max={35}
          step={0.1}
          value={settings.scale}
          onChange={(e) => {
            setSettings({
              ...settings,
              scale: parseInt(e.target.value),
            })
          }}
        />
      </div>

      <div
        className="flex flex-row justify-between cursor-pointer select-none"
        onClick={() => {
          setSettings({
            ...settings,
            modify: !settings.modify,
          })
        }}
      >
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-semibold">Prompt Magic</h1>
          <p className="text-[0.65rem]">
            Adds modifiers and negative prompts to your generations
          </p>
        </div>
        <div className="relative w-5 h-5">
          {settings.modify && (
            <Check
              strokeWidth={4}
              size={20}
              className="absolute p-0.5 pointer-events-none inset-0 mx-auto my-auto"
            />
          )}
          <input
            type="checkbox"
            className={`w-5 h-5 rounded appearance-none cursor-pointer ${
              settings.modify ? "bg-[#99c8ff]" : "bg-white/10"
            }`}
            checked={settings.modify}
            onChange={(e) => {
              setSettings({
                ...settings,
                modify: e.target.checked,
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export type Settings = {
  model:
    | "stable-diffusion-v1-5"
    | "stable-diffusion-512-v2-1"
    | "stable-diffusion-768-v2-1"
    | "anything-v3.0"
  width: number
  height: number
  count: number
  steps: number
  scale: number
  modify: boolean
}

export type SettingsState = {
  settings: Settings
  setSettings: (settings: Settings) => void

  isOpen: boolean
  setOpen: (isOpen: boolean) => void
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Settings {
  export const use = create<SettingsState>()((set) => ({
    settings: {
      model: "stable-diffusion-v1-5",
      width: 512,
      height: 512,
      count: 4,
      steps: 30,
      scale: 7,
      modify: true,
    } as Settings,
    setSettings: (settings: Settings) =>
      set((state: SettingsState) => ({
        settings: { ...state.settings, ...settings },
      })),

    isOpen: false,
    setOpen: (isOpen: boolean) => set((state: SettingsState) => ({ isOpen })),
  }))
}
