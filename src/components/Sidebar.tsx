import { Dispatch, SetStateAction } from "react"

export const QuickStartMenu = {
  key: 0,
  name: "Quick Start",
  state: "active",
  desc: "One Click to start",
}
export const ChatViewMenu = {
  key: 1,
  name: "Chat",
  state: "",
  desc: "Chat with the sd",
}
export const ConfigMenu = {
  key: 2,
  name: "Configuration",
  state: "",
  desc: "A lot of configurations",
}
export const ModelsMenu = {
  key: 3,
  name: "Models",
  state: "",
  desc: "Model files",
}
export const PromptsMenu = {
  key: 4,
  name: "Prompts",
  state: "",
  desc: "Prompt collections",
}
interface SidebarProps {
  setMenu: Dispatch<SetStateAction<number>>
}
export const Sidebar: React.FC<SidebarProps> = ({ setMenu }) => {
  const MenusData = [QuickStartMenu, ChatViewMenu, ConfigMenu, ModelsMenu, PromptsMenu]
  MenusData.forEach((menu, index) => {
    menu.key = index
  })

  return (
    <ul className="menu w-48 p-4 bg-base-200 text-base-content">
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
  )
}
