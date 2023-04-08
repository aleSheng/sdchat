import { Wand2 } from "lucide-react"
import React from "react"

import {
  MessageStatusEnum,
  MessageType,
  MessageTypeEnum,
  sendPromptMessage,
  usePromptBook,
  useWebuiUrl,
} from "@/lib/chatbot"

import { Image } from "./Image"

function saveImage(image: string, name: string) {
  // download image from external URL
  void fetch(image)
    .then((res) => res.blob())
    .then((blob) => {
      // create blob link to download
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.setAttribute("download", `${name}.png`)
      link.setAttribute("href", url)
      document.body.appendChild(link)
      link.click()
      link.remove()
    })
}

export const Message = ({ message }: { message: MessageType }) => {
  const [selectedImage, setSelectedImage] = React.useState(-1)
  const addPrompt = usePromptBook((state) => state.addPrompt)
  const [url] = useWebuiUrl((state) => [state.url])
  return (
    <div className={`my-2 w-full hover:bg-black/10 group`}>
      <div
        className={`mx-auto max-w-[60rem] relative px-2 lg:px-0 flex flex-col w-full ${
          message.type === MessageTypeEnum.YOU ? "items-start" : "items-end"
        }`}
      >
        <div className="flex flex-row gap-2 items-end h-fit">
          <h1 className="font-semibold">
            {message.type === MessageTypeEnum.YOU ? "You" : "Stable Diffusion"}
          </h1>
          {message.timestamp && (
            <p className="text-xs pb-0.5">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          )}
          {message.modifiers && <Wand2 className="pb-[3px]" size={16} />}
        </div>
        {message.prompt && <p className="text-left break-word">{message.prompt}</p>}
        {message.images && message.settings && message.images.length > 0 && (
          <div className={`flex flex-row gap-2 overflow-hidden flex-wrap max-w-full`}>
            {message.images.map((image, i) => (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <Image
                key={i}
                i={i}
                image={image}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                message={message}
              />
            ))}
          </div>
        )}
        {message.error && <p className="text-red-500">{message.error}</p>}
        {message.loading && message.images && message.images.length === 0 && (
          <div className="flex flex-row gap-1 my-3">
            <div className="animate-pulse bg-white/25 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/25 delay-75 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/25 delay-150 w-3 h-3 rounded-full" />
          </div>
        )}
        <div className="flex flex-row flex-wrap gap-2 my-2">
          {message.status === MessageStatusEnum.ERROR && (
            <button
              className="border-white/10 border rounded px-3 py-1 font-semibold hover:bg-backgroundSecondary duration-200"
              onClick={() => {
                void sendPromptMessage(url, message.prompt, message.modifiers)
              }}
            >
              Retry
            </button>
          )}
          {message.status === MessageStatusEnum.RECEIVED && (
            <>
              <button
                className="border-white/10 border rounded px-3 py-1 font-semibold hover:bg-backgroundSecondary duration-200"
                onClick={() => {
                  void sendPromptMessage(url, message.prompt, message.modifiers)
                }}
              >
                Retry
              </button>
              <button
                className="border-white/10 border rounded px-3 py-1 font-semibold hover:bg-backgroundSecondary duration-200"
                onClick={() => {
                  if (selectedImage === -1) {
                    message.images.forEach((image, i) =>
                      saveImage(
                        image,
                        `${message.prompt.replace(/[^a-zA-Z0-9]/g, "_")}-${i}`,
                      ),
                    )
                  } else {
                    saveImage(
                      message.images[selectedImage],
                      message.prompt.replace(/[^a-zA-Z0-9]/g, "_"),
                    )
                  }
                }}
              >
                Save Image
              </button>
              <button
                className="border-white/10 border rounded px-3 py-1 font-semibold hover:bg-backgroundSecondary duration-200"
                onClick={() => {
                  addPrompt(message.prompt)
                }}
              >
                Save Prompt
              </button>
              {message.modifiers && (
                <button
                  className="border-white/10 border rounded px-3 py-1 font-semibold hover:bg-backgroundSecondary duration-200"
                  onClick={() => {
                    void sendPromptMessage(url, message.prompt, message.modifiers)
                  }}
                >
                  Remix
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
