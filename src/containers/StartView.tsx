import { satisfies } from "compare-versions"

import { openLink } from "@/lib/api"
import { open } from "@/lib/dialog"
import { StoreType } from "@/lib/store"
interface StartViewProps {
  store: StoreType
  running: boolean
  output: string
  downloading: boolean
  downloadingFile: string
  downloadProgress: number
  onSelectDirClick: () => void
  onStartClick: () => void
  onInitClick: () => void
}

export const StartView: React.FC<StartViewProps> = ({
  store,
  running,
  output,
  downloading,
  downloadingFile,
  downloadProgress,
  onSelectDirClick,
  onInitClick,
  onStartClick,
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
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">System Info</div>
          <div className="stat-value">{store.systemInfo.archName}</div>
          <div className="stat-desc">{store.systemInfo.platformName}</div>
        </div>
        <div className="stat">
          <div className="stat-title">GPU Memory</div>
          <div className="stat-value">{store.systemInfo.gpuMemory}GB</div>
          <div className="stat-desc">{store.systemInfo.gpuName}</div>
        </div>
        <div className="stat">
          <div className="stat-title">CUDA Version</div>
          <div className="stat-value">{store.systemInfo.cudaVersion}</div>
          {store.systemInfo.cudaVersion && store.systemInfo.cudaVersion < 11 && (
            <div className="stat-actions">
              <button className="btn btn-sm btn-error">Get the cudatoolkit</button>
            </div>
          )}
        </div>
        <div className="stat">
          <div className="stat-title">Python Version</div>
          <div className="stat-value">{store.python_version}</div>
          <div className="stat-desc">{store.settings.python_path}</div>
          {satisfies(store.python_version || "0.0.0", "^3.10.0") || (
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
          {Boolean(store.git_version) || (
            <div className="stat-actions">
              <button className="btn btn-sm btn-error" onClick={goToGitDownload}>
                Get the git
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="container m-4 flex justify-center">
        <div className="btn-group">
          <button onClick={onSelectDirClick} className="btn btn-lg btn-outline">
            {store.settings.work_folder || "Start by selecting a folder"}
          </button>
          {running ? (
            <>
              <button className="btn btn-lg btn-primary loading" disabled>
                Running
              </button>
              <button className="btn btn-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button onClick={onInitClick} className="btn btn-lg btn-secondary">
                Init
              </button>
              <button onClick={onStartClick} className="btn btn-lg btn-primary">
                Start
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Output:</h2>
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
          <p>{output || "Output goes here"}</p>
        </div>
      </div>
    </>
  )
}
