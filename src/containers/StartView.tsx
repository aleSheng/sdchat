import { satisfies } from "compare-versions"

import { openLink } from "@/lib/api"
import { open } from "@/lib/dialog"
import { StoreType } from "@/lib/store"
interface StartViewProps {
  store: StoreType
  output_lines: string[]
  downloading: boolean
  downloadingFile: string
  downloadProgress: number
}

export const StartView: React.FC<StartViewProps> = ({
  store,
  output_lines,
  downloading,
  downloadingFile,
  downloadProgress,
}: StartViewProps) => {
  const goToPythonDownload = () => {
    void openLink("https://www.python.org/downloads/")
  }
  const goToGitDownload = () => {
    void openLink("https://git-scm.com/downloads")
  }
  const getPythonLocation = () => {
    void (async () => {
      // Open a selection dialog for directories
      const selected = await open({
        directory: false,
        multiple: false,
        defaultPath: "$HOME\\AppData\\Local\\Programs",
      })
      if (Array.isArray(selected)) {
        // user selected multiple directories
      } else if (selected === null) {
        // user cancelled the selection
      } else {
        store.setSettings({
          ...store.settings,
          python_path: selected,
        })
      }
    })()
  }

  return (
    <>
      <div className="stats shadow mx-2">
        <div className="stat">
          <div className="stat-title">System Info</div>
          <div className="stat-value">{store.systemInfo.archName}</div>
          <div className="stat-desc">{store.systemInfo.platformName}</div>
          {store.systemInfo.archName === "x86_64" ? (
            <button className="btn btn-sm btn-success">Good</button>
          ) : (
            <button className="btn btn-sm btn-error">Not enough</button>
          )}
        </div>
        <div className="stat">
          <div className="stat-title">GPU Memory</div>
          <div className="stat-value">{store.systemInfo.gpuMemory}GB</div>
          <div className="stat-desc">{store.systemInfo.gpuName}</div>
          {store.systemInfo.gpuMemory >= 8 ? (
            <button className="btn btn-sm btn-success">Good</button>
          ) : (
            <button className="btn btn-sm btn-error">Not enough</button>
          )}
        </div>
      </div>
      <div className="stats shadow mx-2">
        <div className="stat">
          <div className="stat-title">CUDA Version</div>
          <div className="stat-value">{store.systemInfo.cudaVersion}</div>
          <div className="stat-desc">--</div>
          {store.systemInfo.cudaVersion && store.systemInfo.cudaVersion >= 11 ? (
            <button className="btn btn-sm btn-success">Good</button>
          ) : (
            <div className="stat-actions">
              <button className="btn btn-sm btn-error">Get the cudatoolkit</button>
            </div>
          )}
        </div>
        <div className="stat">
          <div className="stat-title">Python Version</div>
          <div className="stat-value">{store.python_version}</div>
          <div className="stat-desc">{store.settings.python_path || "--"}</div>
          {satisfies(store.python_version || "0.0.0", "^3.10.0") ? (
            <button className="btn btn-sm btn-success">Good</button>
          ) : (
            <div className="stat-actions">
              <button className="btn btn-sm btn-error" onClick={getPythonLocation}>
                Locate python
              </button>
              <button className="btn btn-sm btn-error" onClick={goToPythonDownload}>
                Get the python
              </button>
            </div>
          )}
        </div>
        <div className="stat">
          <div className="stat-title">Git Version</div>
          <div className="stat-value">{store.git_version}</div>
          <div className="stat-desc">--</div>
          {store.git_version ? (
            <button className="btn btn-sm btn-success">Good</button>
          ) : (
            <div className="stat-actions">
              <button className="btn btn-sm btn-error" onClick={goToGitDownload}>
                Get the git
              </button>
            </div>
          )}
        </div>
      </div>
      {downloading && (
        <div>
          <p>Downloading {downloadingFile}</p>
          <progress
            className="progress progress-primary w-56"
            value={downloadProgress}
            max="100"
          ></progress>
        </div>
      )}
      <div className="mx-2">
        <div className="mockup-code max-h-[20rem] overflow-y-auto">
          {output_lines.map((line) => (
            // eslint-disable-next-line react/jsx-key
            <pre data-prefix=">" className="text-warning">
              <code>{line}</code>
            </pre>
          ))}
        </div>
      </div>
    </>
  )
}
