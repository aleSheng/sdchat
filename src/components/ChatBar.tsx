import { Album, Send, Settings2 } from "lucide-react"

import {
  sendPromptMessage,
  useChatBar,
  useMessageList,
  usePromptBook,
  useSettings,
  useWebuiUrl,
} from "@/lib/chatbot"

import { PromptBook } from "./PromptBook"
import { makePrompt } from "./PromptEngine"
import { Settings } from "./Settings"

export const ChatBar = () => {
  const [prompt, setPrompt] = useChatBar((state) => [state.prompt, state.setPrompt])
  const [url] = useWebuiUrl((state) => [state.url, state.setWebuiUrl])

  const [promptBookOpen, setPromptBookOpen] = usePromptBook((state) => [
    state.isOpen,
    state.setOpen,
  ])

  const [settingsOpen, setSettingsOpen] = useSettings((state) => [
    state.isOpen,
    state.setOpen,
  ])

  const history = useMessageList((state) => state.messages)

  return (
    <>
      <div
        className={`${
          !prompt && Object.keys(history).length < 1 ? "" : ""
        } relative w-full max-w-[60.75rem]`}
      >
        <div
          className={`absolute duration-200 ${
            !prompt && Object.keys(history).length < 10
              ? "-bottom-[1.5rem]"
              : "-bottom-[3.75rem]"
          } pr-[0.5rem] w-full lg:pl-0 pl-[0.5rem]`}
        >
          <div className="bg-base-200 rounded-lg w-full pb-5 px-4 pt-1.5 text-sm">
            {"Don't know what to say? "}{" "}
            <span
              className="text-blue-400 hover:underline cursor-pointer"
              onClick={() => setPrompt(makePrompt())}
            >
              Surprise Me!
            </span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[60.75rem] pr-[0.5rem] lg:pl-0 pl-[0.5rem] relative">
        <Settings />
        <PromptBook />
        <div
          className={`px-4 py-3 mt-2 z-10 bg-base-200 flex flex-row items-center w-full mb-6 ${
            !prompt && Object.keys(history).length < 10
              ? "border-t border-background rounded-b-lg"
              : "rounded-lg"
          }`}
        >
          <input
            type="text"
            className="w-full text-lg outline-none focus:border-none bg-transparent"
            placeholder="Type what you want to see..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void sendPromptMessage(url, prompt)
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
              className="cursor-pointer"
              onClick={() => {
                setPromptBookOpen(!promptBookOpen)
                setSettingsOpen(false)
              }}
            >
              <Album
                className={`${
                  promptBookOpen ? "text-primary" : "hover:text-sencodary"
                } duration-200`}
                size={20}
              />
            </button>
            <button
              className="cursor-pointer"
              onClick={() => {
                setSettingsOpen(!settingsOpen)
                setPromptBookOpen(false)
              }}
            >
              <Settings2
                className={`${
                  settingsOpen ? "text-primary" : "hover:text-sencodary"
                } duration-200`}
                size={20}
              />
            </button>
            <div className="h-[1.5rem] w-[1px] rounded" />
            <button
              className={String(prompt ? "cursor-pointer" : "cursor-default")}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={() => sendPromptMessage(url, prompt)}
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
    </>
  )
}
