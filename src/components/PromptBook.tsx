import { Plus, Trash2, X } from "lucide-react"
import React from "react"

import { useChatBar, usePromptBook } from "@/lib/chatbot"

export function PromptBook() {
  const [prompts, addPrompt, deletePrompt, setPrompts] = usePromptBook((state) => [
    state.prompts,
    state.addPrompt,
    state.deletePrompt,
    state.setPrompts,
  ])

  const [prompt, setPrompt] = useChatBar((state) => [state.prompt, state.setPrompt])

  React.useEffect(() => {
    // load from local storage
    const loadedPrompts = localStorage.getItem("prompts")
    if (loadedPrompts?.startsWith("[") && loadedPrompts?.endsWith("]")) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setPrompts(JSON.parse(loadedPrompts))
    }

    // write serializer
    const unsub = usePromptBook.subscribe((newPrompts) => {
      localStorage.setItem("prompts", JSON.stringify(newPrompts.prompts))
    })

    return () => unsub()
  }, [setPrompts])

  return (
    <div className="btn-group btn-group-vertical h-full w-full max-w-[60rem] overflow-y-auto duration-200 flex flex-col gap-1 p-2 bg-base-100">
      {prompts.length > 0 ? (
        <>
          {prompt && !prompts.includes(prompt) && (
            <button
              className="btn flex flex-row justify-between items-center w-full duration-150 rounded"
              onClick={() => {
                addPrompt(prompt)
              }}
            >
              <p className="text-center p-2 w-full text-sm font-semibold flex flex-row items-center justify-center gap-2">
                Save Current prompt <Plus className="w-4 h-4" />
              </p>
            </button>
          )}
          {prompts.map((prompt, i) => (
            <button
              key={prompt}
              className="btn btn-outline flex flex-row justify-between group relative items-center w-full"
              onClick={() => {
                setPrompt(prompt)
              }}
            >
              <p className="text-sm text-left break-word max-h-[5rem] overflow-hidden text-ellipsis">
                {prompt}
              </p>
              <div
                className="flex justify-center absolute top-0 right-0 items-center w-6 h-6 hover:bg-[#32363d] text-red-500 hover:text-bold bg-[#292d33] opacity-0 group-hover:opacity-100 rounded-full duration-100"
                onClick={(e) => {
                  e.stopPropagation()
                  deletePrompt(prompt)
                }}
              >
                <X className="w-4 h-4" />
              </div>
            </button>
          ))}
        </>
      ) : (
        <div className="w-full h-full flex justify-center grow items-center">
          {prompt ? (
            <button
              className="text-sm font-semibold border border-white/10 hover:border-white/25 duration-200 p-2 px-3 rounded-lg"
              onClick={() => addPrompt(prompt)}
            >
              Save current prompt
            </button>
          ) : (
            <p className="text-sm font-semibold">No prompts saved</p>
          )}
        </div>
      )}
    </div>
  )
}
