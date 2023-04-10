import { Dispatch, SetStateAction } from "react"

export const QuickStartMenu = {
  key: 0,
  name: "Quick Start",
  state: "active",
  desc: "One Click to start",
}
export const WebUIMenu = {
  key: 1,
  name: "WebUI",
  desc: "Open WebUI",
}
export const ChatViewMenu = {
  key: 2,
  name: "Chat",
  desc: "Chat with the sd",
}
export const ConfigMenu = {
  key: 3,
  name: "Configuration",
  desc: "A lot of configurations",
}
export const ModelsMenu = {
  key: 4,
  name: "Models",
  desc: "Model files",
}
export const PromptsMenu = {
  key: 5,
  name: "Prompts",
  desc: "Prompt collections",
}
interface SidebarProps {
  menu: number
  setMenu: Dispatch<SetStateAction<number>>
}
export const Sidebar: React.FC<SidebarProps> = ({ menu, setMenu }) => {
  const MenusData = [
    QuickStartMenu,
    WebUIMenu,
    ChatViewMenu,
    ConfigMenu,
    ModelsMenu,
    PromptsMenu,
  ]
  MenusData.forEach((menu, index) => {
    menu.key = index
  })

  return (
    <ul className="menu w-48 bg-base-200 text-base-content">
      {MenusData.map((item) => (
        <li
          key={item.key}
          onClick={() => {
            setMenu(item.key)
          }}
        >
          <a className={menu === item.key ? "active" : ""}>{item.name}</a>
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
  )
}
