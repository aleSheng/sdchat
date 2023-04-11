/* eslint-disable radix */
import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { useSettings } from "@/lib/chatbot"

export function Settings() {
  const [open, settings, setSettings] = useSettings((state) => [
    state.isOpen,
    state.settings,
    state.setSettings,
  ])

  return (
    <div className="h-full w-full max-w-[60rem] duration-200 flex flex-col gap-4 p-3 bg-base-100">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-sm font-semibold">Model</h1>
        </div>
        <div className="flex flex-row gap-2 p-1 rounded-lg border w-fit">
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
                    className="absolute inset-0 rounded"
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
          className="w-full h-2 rounded-full appearance-none"
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
          className="w-full h-2 rounded-full appearance-none"
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
          className="w-full h-2 rounded-full appearance-none"
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
          className="w-full h-2  rounded-full appearance-none"
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
              settings.modify ? "bg-[#99c8ff]" : ""
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
