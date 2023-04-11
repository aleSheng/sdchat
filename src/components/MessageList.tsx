import { useMessageList, useSettings } from "@/lib/chatbot"
import { open } from "@/lib/dialog"
import { invoke } from "@/lib/tauri"

import { Message } from "./Message"

export function MessageList() {
  const history = useMessageList((state) => state.messages)
  const [llama_model_path, setLlamaModelPath] = useSettings((state) => [
    state.llama_model_path,
    state.setLlamaModelPath,
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
      }
    })()
  }

  const onStartLlamaClick = () => {
    // invoke command start_llama
    invoke("start_llama", { modelpath: llama_model_path })
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {
        console.error(err)
      })
  }

  return (
    <>
      <div className="flex p-2 btn-group bg-base-300">
        <button className="btn btn-outline" onClick={onSelectLlamaModelClick}>
          {llama_model_path}
        </button>
        <button className="btn btn-primary" onClick={onStartLlamaClick}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-external-link"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" x2="21" y1="14" y2="3"></line>
          </svg>
        </button>
      </div>
      <div className="flex-1 h-full overflow-auto">
        {Object.values(history).map((message) => (
          <>{message && <Message key={message.id} message={message} />}</>
        ))}
      </div>
    </>
  )
}
