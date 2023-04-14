import { useEffect, useRef } from "react"

import { listen } from "@/lib/api"
import {
  makeId,
  MessageStatusEnum,
  MessageType,
  MessageTypeEnum,
  useMessageList,
  useSettings,
} from "@/lib/chatbot"
import { open } from "@/lib/dialog"
import { invoke } from "@/lib/tauri"

import { Message } from "./Message"

export function MessageList() {
  const history = useMessageList((state) => state.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [
    llama_model_path,
    setLlamaModelPath,
    llamaStatus,
    setLlamaStatus,
    talkToType,
    settings,
  ] = useSettings((state) => [
    state.llama_model_path,
    state.setLlamaModelPath,
    state.llamaStatus,
    state.setLlamaStatus,
    state.talkToType,
    state.settings,
  ])

  const onSelectLlamaModelClick = () => {
    void (async () => {
      // Open a selection dialog for directories
      const selected = await open({
        directory: false,
        multiple: false,
        defaultPath: "",
      })
      if (Array.isArray(selected)) {
        // user selected multiple directories
      } else if (selected === null) {
        // user cancelled the selection
      } else {
        console.log("llama model path:", selected)
        setLlamaModelPath(selected)
        setLlamaStatus("inactive")
      }
    })()
  }

  const onStartLlamaClick = () => {
    if (useSettings.getState().llama_model_path === "Please select a llama model") {
      return
    }
    const unlisten = listen("llamamsg", (data: any) => {
      const llamaStatus = useSettings.getState().llamaStatus
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const line: string = data.payload.message
      console.log("llamamsg:", line)
      console.log("status:", llamaStatus)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const is_running = line.indexOf("Running in interactive mode.")
      if (is_running >= 0 && llamaStatus === "loading") {
        setLlamaStatus("active")
      }
      if (llamaStatus === "active") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const is_reply = line.indexOf(">") === 0
        const content = line.replace(">", "").trim()
        if (content.length <= 0) {
          return
        }
        if (is_reply) {
          const loading_id = useMessageList.getState().loading_msg_id
          if (loading_id) {
            const msg: MessageType = {
              type: MessageTypeEnum.LLAMA,
              id: loading_id,
              prompt: content,
              timestamp: Date.now(),
              error: null,
              images: [],
              settings: settings,
              status: MessageStatusEnum.RECEIVED,
            }
            useMessageList.getState().editMessage(loading_id, msg)
            useMessageList.getState().loading_msg_id = null
          } else {
            const uid = makeId()
            const msg: MessageType = {
              type: MessageTypeEnum.LLAMA,
              id: uid,
              prompt: content,
              timestamp: Date.now(),
              error: null,
              images: [],
              settings: settings,
              status: MessageStatusEnum.RECEIVED,
            }
            useMessageList.getState().addMessage(msg)
          }
        }
      }
    })
    setLlamaStatus("loading")
    // invoke command start_llama
    invoke("start_llama", { modelpath: llama_model_path })
      .then((res) => {
        console.log("start_llama:", res)
      })
      .catch(async (err) => {
        console.log("start_llama error:", err)
        ;(await unlisten)()
        console.error(err)
        setLlamaStatus("error")
      })
  }

  const onStopLlamaClick = () => {
    invoke("stop_llama")
      .then((value) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`stop llama:${value}`)
        setLlamaStatus("inactive")
      })
      .catch((err) => {
        console.error(err)
      })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [history])

  return (
    <>
      {talkToType === "llama" && (
        <div className="flex p-2 btn-group bg-base-300">
          <button className="btn btn-accent">Llama Model Path:</button>
          <button className="btn btn-outline" onClick={onSelectLlamaModelClick}>
            {llama_model_path}
          </button>
          {llamaStatus === "inactive" && (
            <button className="btn btn-primary" onClick={onStartLlamaClick}>
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
                className="lucide lucide-play"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          )}
          {llamaStatus === "loading" && (
            <button className="btn btn-info loading" onClick={onStartLlamaClick}>
              Loading
            </button>
          )}
          {llamaStatus === "active" && (
            <>
              <button className="btn btn-accent" onClick={onStartLlamaClick}>
                Waiting for input...
              </button>
              <button className="btn" onClick={onStopLlamaClick}>
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
          )}
          {llamaStatus === "error" && (
            <label className="btn btn-outline">
              Error. Reselect the llama directory
            </label>
          )}
        </div>
      )}
      <div className="h-full justify-end overflow-y-auto p-5">
        {Object.values(history).map((message) => (
          <>{message && <Message key={message.id} message={message} />}</>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </>
  )
}
