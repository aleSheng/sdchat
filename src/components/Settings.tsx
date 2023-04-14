/* eslint-disable radix */
import { useSettings } from "@/lib/chatbot"

export function Settings() {
  const [settings, setSettings] = useSettings((state) => [
    state.settings,
    state.setSettings,
  ])

  return (
    <div className="h-full w-full max-w-[60rem] duration-200 flex flex-col gap-4 p-3 bg-base-100">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="font-semibold">With</h1>
          <p className="text">{settings.width}</p>
        </div>
        <input
          type="range"
          className="range range-accent"
          min={64}
          max={2048}
          step={64}
          value={settings.width}
          onChange={(e) => {
            setSettings({
              ...settings,
              width: parseInt(e.target.value),
            })
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text font-semibold">Height</h1>
          <p className="text">{settings.height}</p>
        </div>
        <input
          type="range"
          className="range range-accent"
          min={64}
          max={2048}
          step={64}
          value={settings.height}
          onChange={(e) => {
            setSettings({
              ...settings,
              height: parseInt(e.target.value),
            })
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text font-semibold">Image Count</h1>
          <p className="text">{settings.count}</p>
        </div>
        <input
          type="range"
          className="range range-accent"
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
          <h1 className=" text font-semibold">Steps</h1>
          <p className="text">{settings.steps}</p>
        </div>
        <input
          type="range"
          className="range range-accent"
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
          <h1 className="text font-semibold">CFG Scale</h1>
          <p className="text">{settings.scale}</p>
        </div>
        <input
          type="range"
          className="range range-accent"
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
    </div>
  )
}
