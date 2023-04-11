/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-empty-function */
import { invoke } from "@tauri-apps/api/tauri"
import type { NextPage } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"
import { themeChange } from "theme-change"

import {
  ChatViewMenu,
  ModelsMenu,
  PromptsMenu,
  QuickStartMenu,
  Sidebar,
  WebUIMenu,
} from "@/components/Sidebar"
import { ChatView } from "@/containers/ChatView"
import { ModelsView } from "@/containers/ModelsView"
import { StartView } from "@/containers/StartView"
import { WebUIView } from "@/containers/WebUIView"
import { useGlobalShortcut } from "@/hooks/tauri/shortcuts"
import { listen } from "@/lib/api"
import { open } from "@/lib/dialog"
import useStore from "@/lib/store"

const regex = /(https?:\/\/[^ ]*)/

const Home: NextPage = () => {
  const store = useStore()

  const [menu, setMenu] = useState(0)

  const [running, setRunning] = useState<boolean>(false)
  const [shellOutput, setShellOutput] = useState<string[]>([])
  const [webui_url, setWebuiUrl] = useState<string>("")

  const [downloading, setDownloading] = useState<boolean>(false)
  const [downloadingFile, setDownloadingFile] = useState<string>("")
  const [downloadProgress, setDownloadProgress] = useState<number>(0)

  const [errorInfo, setErrorInfo] = useState<string>("")

  useEffect(() => {
    themeChange(false)
  }, [])

  const onSelectDirClick = () => {
    void (async () => {
      // Open a selection dialog for directories
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: "",
      })
      if (Array.isArray(selected)) {
        // user selected multiple directories
      } else if (selected === null) {
        // user cancelled the selection
      } else {
        store.setSettings({
          ...store.settings,
          work_folder: selected,
        })
      }
    })()
  }

  const onOpenWebUIClick = () => {
    WebUIMenu.key !== menu && setMenu(WebUIMenu.key)
  }

  const onStopWebuiClick = () => {
    invoke<string>("stop_webui")
      .then((value) => {
        console.log(`stop webui:${value}`)
      })
      .catch((err) => {
        console.error(err)
      })
  }

  const onStartWebuiClick = () => {
    if (store.settings.work_folder === "") {
      setErrorInfo("Please select a folder first")
      return
    }
    setRunning(true)
    const unlisten = listen("stdout", (data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const line = data.payload.message
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const is_url_line = line.indexOf("Running on local URL:")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return
      setShellOutput((prev) => [...prev, line])
      if (is_url_line >= 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const url: string = line.match(regex)[0]
        if (url) {
          setWebuiUrl(url)
        }
      }
    })
    const unlisten_download = listen("single_file_download", (data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const { progress, download_url } = data.payload
      setDownloading(progress < 100)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setDownloadProgress(progress)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setDownloadingFile(download_url)
    })

    invoke<string>("start_webui", {
      webuipath: store.settings.work_folder,
    })
      .then(async () => {
        ;(await unlisten)()
        ;(await unlisten_download)()
        setRunning(false)
        setWebuiUrl("")
      })
      .catch(async (err) => {
        ;(await unlisten)()
        ;(await unlisten_download)()
        setRunning(false)
        setWebuiUrl("")
        console.error(err)
      })
  }

  useGlobalShortcut("CommandOrControl+P", () => {
    console.log("Ctrl+P was pressed!")
  })

  return (
    <div className="min-h-screen drawer drawer-mobile">
      <Head>
        <title>SD Desk</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-center">
        <div className="w-full navbar bg-base-100">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block w-6 h-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </label>
          </div>
          <div className="flex-1 btn-group">
            <button onClick={onSelectDirClick} className="btn btn-lg btn-outline">
              {store.settings.work_folder || "Start by selecting a folder"}
            </button>
            {running ? (
              <>
                <button className="btn btn-lg btn-accent loading">Running</button>
                {webui_url && (
                  <button className="btn btn-lg btn-primary" onClick={onOpenWebUIClick}>
                    Open WebUI
                  </button>
                )}
                <button className="btn btn-lg" onClick={onStopWebuiClick}>
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
                <button onClick={onStartWebuiClick} className="btn btn-lg btn-primary">
                  Start
                </button>
              </>
            )}
          </div>
        </div>
        <main className="flex flex-1 flex-col w-full">
          {menu === QuickStartMenu.key && (
            <StartView
              store={store}
              output_lines={shellOutput}
              downloading={downloading}
              downloadingFile={downloadingFile}
              downloadProgress={downloadProgress}
            ></StartView>
          )}
          {menu === WebUIMenu.key && <WebUIView url={webui_url} />}
          {menu === ChatViewMenu.key && <ChatView webui_url={webui_url} />}
          {menu === ModelsMenu.key && <ModelsView />}
          {menu === PromptsMenu.key && (
            <button onClick={onSelectDirClick} className="btn btn-lg">
              {store.settings.work_folder}
            </button>
          )}
        </main>
      </div>
      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <Sidebar menu={menu} setMenu={setMenu}></Sidebar>
      </div>

      {errorInfo && (
        <div className="toast toast-top toast-end">
          <div className="alert alert-info">
            <div>
              <span>{errorInfo}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
