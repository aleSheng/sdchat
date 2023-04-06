import { useState } from "react"

import { Card } from "@/components/Card"
import { openLink } from "@/lib/api"
import { open } from "@/lib/dialog"
import { StoreType } from "@/lib/store"
import { invoke } from "@/lib/tauri"

interface ConfigViewProps {
  store: StoreType
}

const PythonData = {
  title: "Python",
  desc: "Path:",
  bgColor: "",
}

const GitData = {
  title: "Git",
  desc: "Version:",
  bgColor: "",
}
/**
 * 设置页面. 可以检查各项配置是否满足要求
 * 每个卡片是一项设置, 可以检查是否安装, 没有的话可以去下载, 或者手动定位
 * @param param0
 * @returns
 */
export const ConfigView: React.FC<ConfigViewProps> = ({ store }: ConfigViewProps) => {
  const [errorInfo, setErrorInfo] = useState<string>("")
  const [count, setCount] = useState(0)
  const checkPython = () => {
    invoke<string>("detect_python", {
      pythonpath: "python",
    })
      .then((value) => {
        PythonData.bgColor = "bg-green-100"
        PythonData.desc = value
        setCount(count + 1)
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/restrict-template-expressions
      .catch((err) => console.log(`error: ${err}`))
  }
  const checkGit = () => {
    invoke<string>("detect_git")
      .then((value) => {
        GitData.bgColor = "bg-green-100"
        GitData.desc = value
        setCount(count + 1)
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/restrict-template-expressions
      .catch((err) => console.log(`error: ${err}`))
  }

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
      <p>{errorInfo}</p>
      <p>{store.settings.work_folder}</p>
      <p>{store.settings.python_path}</p>
      <div className="flex flex-wrap">
        <Card
          className=""
          title={PythonData.title}
          description={PythonData.desc}
          checkFunc={checkPython}
          bgColor={PythonData.bgColor}
          actionName={"Go to Download"}
          takeAction={goToPythonDownload}
          locationBtn={"location"}
          locationAction={getPythonLocation}
        ></Card>
        <Card
          title={GitData.title}
          description={GitData.desc}
          checkFunc={checkGit}
          bgColor={GitData.bgColor}
          actionName={"Go to Download"}
          takeAction={goToGitDownload}
        ></Card>
      </div>
    </>
  )
}
