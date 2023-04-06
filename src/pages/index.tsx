/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-empty-function */
import { invoke } from "@tauri-apps/api/tauri"
import type { NextPage } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"
import { themeChange } from "theme-change"

import ChatView from "@/containers/ChatView"
import { ConfigView } from "@/containers/ConfigView"
import { StartView } from "@/containers/StartView"
import { useGlobalShortcut } from "@/hooks/tauri/shortcuts"
import { listen, openWebview, resolveResource } from "@/lib/api"
import { open } from "@/lib/dialog"
import useStore from "@/lib/store"

const regex = /(https?:\/\/[^ ]*)/
const QuickStartMenu = {
  key: 0,
  name: "Quick Start",
  state: "active",
  desc: "One Click to start",
}
const ChatViewMenu = {
  key: 1,
  name: "Chat",
  state: "",
  desc: "Chat with the sd",
}
const ConfigMenu = {
  key: 2,
  name: "Configuration",
  state: "",
  desc: "A lot of configurations",
}
const ModelsMenu = {
  key: 3,
  name: "Models",
  state: "",
  desc: "Model files",
}
const PromptsMenu = {
  key: 4,
  name: "Prompts",
  state: "",
  desc: "Prompt collections",
}

const Home: NextPage = () => {
  const MenusData = [QuickStartMenu, ChatViewMenu, ConfigMenu, ModelsMenu, PromptsMenu]
  MenusData.forEach((menu, index) => {
    menu.key = index
  })
  const store = useStore()

  const [menu, setMenu] = useState(QuickStartMenu.key)

  const [running, setRunning] = useState<boolean>(false)
  const [shellOutput, setShellOutput] = useState<string>("")

  const [downloading, setDownloading] = useState<boolean>(false)
  const [downloadingFile, setDownloadingFile] = useState<string>("")
  const [downloadProgress, setDownloadProgress] = useState<number>(0)

  const [errorInfo, setErrorInfo] = useState<string>("")

  useEffect(() => {
    themeChange(false)
  }, [])

  const onSelectDirClick = () => {
    void (async () => {
      const resourcePath = await resolveResource("resources/A1111sdwebui/").catch(
        (e) => {
          console.log(e)
        },
      )
      if (resourcePath === undefined) {
        return
      }
      // resolveResource returns a path with a prefix of "\\?\" which is not supported by nodejs
      const folderPath = resourcePath.replace("\\\\?\\", "")

      console.log(folderPath)
      store.setSettings({
        ...store.settings,
        work_folder: folderPath,
      })

      // Open a selection dialog for directories
      // const selected = await open({
      //   directory: true,
      //   multiple: false,
      //   defaultPath: "",
      // })
      // if (Array.isArray(selected)) {
      //   // user selected multiple directories
      // } else if (selected === null) {
      //   // user cancelled the selection
      // } else {
      //   store.setSettings({
      //     ...store.settings,
      //     work_folder: selected,
      //   })
      // }
    })()
  }

  const openWebui = (url: string) => {
    openWebview(
      "WebUI",
      { url: url },
      () => {
        //TODO
      },
      () => {
        setErrorInfo("Error")
      },
    )
  }

  const onInitWebuiClick = () => {
    if (store.settings.work_folder === "") {
      setErrorInfo("Please select a folder first")
      return
    }
    setRunning(true)
    const unlisten = listen("stdout", (data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      setShellOutput(String(data.payload.message))
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
    invoke<string>("init_webui", {
      webuipath: store.settings.work_folder,
    })
      .then(async (value) => {
        ;(await unlisten)()
        ;(await unlisten_download)()
        console.log(`start output:${value}`)
        // setShellOutput(value)
        setRunning(false)
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .catch(async (err) => {
        console.error(err)
        ;(await unlisten)()
        ;(await unlisten_download)()
        setRunning(false)
      })
  }
  const onStartWebuiClick = () => {
    if (store.settings.work_folder === "") {
      setErrorInfo("Please select a folder first")
      return
    }
    setRunning(true)
    const unlisten = listen("stdout", (data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      setShellOutput(String(data.payload.message))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const url = data.payload.message.match(regex)[0]
      if (url) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        openWebui(url)
      }
    })

    invoke<string>("start_webui", {
      webuipath: store.settings.work_folder,
    })
      .then(async (value) => {
        ;(await unlisten)()
        setRunning(false)
        console.log(`start webui:${value}`)
      })
      .catch(async (err) => {
        ;(await unlisten)()
        setRunning(false)
        console.error(err)
      })
  }

  useGlobalShortcut("CommandOrControl+P", () => {
    console.log("Ctrl+P was pressed!")
  })

  return (
    <div className="flex min-h-screen flex-row bg-base-100">
      <Head>
        <title>SD Desk</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ul className="menu w-48 bg-base-200 p-4">
        {MenusData.map((item) => (
          <li
            key={item.key}
            onClick={() => {
              MenusData.forEach((m) => (m.state = ""))
              MenusData[item.key].state = "active"
              setMenu(item.key)
            }}
          >
            <a className={item.state}>{item.name}</a>
          </li>
        ))}
        <select className="select m-4" data-choose-theme>
          <option value="">Default</option>
          <option value="cyberpunk">cyberpunk</option>
          <option value="cupcake">cupcake</option>
          <option value="dark">dark</option>
          <option value="bumblebee">bumblebee</option>
          <option value="corporate">corporate</option>
        </select>
      </ul>

      <main className="flex flex-1 flex-col p-4">
        {menu === ConfigMenu.key && <ConfigView store={store} />}
        {menu === QuickStartMenu.key && (
          <StartView
            running={running}
            store={store}
            output={shellOutput}
            onSelectDirClick={onSelectDirClick}
            onInitClick={onInitWebuiClick}
            onStartClick={onStartWebuiClick}
            downloading={downloading}
            downloadingFile={downloadingFile}
            downloadProgress={downloadProgress}
          ></StartView>
        )}
        {menu === ChatViewMenu.key && <ChatView />}
        {menu === ModelsMenu.key && (
          <button onClick={onSelectDirClick} className="btn btn-lg">
            {store.settings.work_folder}
          </button>
        )}
        {menu === PromptsMenu.key && (
          <button onClick={onSelectDirClick} className="btn btn-lg">
            {store.settings.work_folder}
          </button>
        )}
      </main>
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
