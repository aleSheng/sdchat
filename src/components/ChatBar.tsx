import { Album, Send, Settings2 } from "lucide-react"

import {
  sendPromptMessage,
  useChatBar,
  useMessageList,
  useMsgBox,
  usePromptBook,
  useSettings,
} from "@/lib/chatbot"

export const ChatBar = () => {
  const [prompt, setPrompt] = useChatBar((state) => [state.prompt, state.setPrompt])

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [msgboxOpen, setMsgboxOpen] = useMsgBox((state) => [
    state.isOpen,
    state.setOpen,
  ])
  const [promptBookOpen, setPromptBookOpen] = usePromptBook((state) => [
    state.isOpen,
    state.setOpen,
  ])

  const [settingsOpen, setSettingsOpen] = useSettings((state) => [
    state.isOpen,
    state.setOpen,
  ])

  const history = useMessageList((state) => state.messages)

  const onMsgboxClick = () => {
    setPromptBookOpen(false)
    setSettingsOpen(false)
    setMsgboxOpen(true)
  }

  return (
    <div className="w-full max-w-[60rem]">
      <div className="px-4 py-3 z-10 bg-base-200 flex flex-row items-center w-full border-background rounded-t-lg">
        <a href="#msgbox" className="cursor-pointer" onClick={onMsgboxClick}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`lucide lucide-message-circle ${
              msgboxOpen ? "text-primary" : "hover:text-sencodary"
            }`}
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </a>
        <div className="divider divider-horizontal" />
        <a
          href="#promptbook"
          className="cursor-pointer"
          onClick={() => {
            setPromptBookOpen(true)
            setSettingsOpen(false)
            setMsgboxOpen(false)
          }}
        >
          <Album
            className={`${
              promptBookOpen ? "text-primary" : "hover:text-sencodary"
            } duration-200`}
            size={20}
          />
        </a>
        <div className="divider divider-horizontal" />
        <a
          href="#settings"
          className="cursor-pointer"
          onClick={() => {
            setSettingsOpen(true)
            setPromptBookOpen(false)
            setMsgboxOpen(false)
          }}
        >
          <Settings2
            className={`${
              settingsOpen ? "text-primary" : "hover:text-sencodary"
            } duration-200`}
            size={20}
          />
        </a>
      </div>
      <div className="w-full">
        <div
          className={`px-4 py-3 z-10 bg-base-200 flex flex-row items-center w-full mb-6 ${
            !prompt && Object.keys(history).length < 10
              ? "border-t border-background rounded-b-lg"
              : "rounded-lg"
          }`}
        >
          <input
            type="text"
            className="w-full text-lg outline-none focus:border-none bg-transparent"
            placeholder="Type what you want to say or see..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void sendPromptMessage(prompt)
                e.preventDefault()
              } else if (
                e.key === "ArrowUp" &&
                !prompt &&
                Object.keys(history).length > 0
              ) {
                setPrompt(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                  Object.values(history).sort((a, b) => b.timestamp - a.timestamp)[0]
                    .prompt,
                )

                e.preventDefault()
              }
            }}
            style={{
              background: "transparent",
              padding: "0",
              border: "none",
              outline: "none",
            }}
            autoFocus
          />
          <div className="shrink-0 flex flex-row gap-2 items-center h-full ml-4">
            <button
              className={String(prompt ? "cursor-pointer" : "cursor-default")}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={() => sendPromptMessage(prompt)}
            >
              <Send
                className={`text-accent rotate-45 ${
                  prompt ? "hover:opacity-50" : "opacity-25"
                } duration-200`}
                size={20}
                fill="currentColor"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
