import React from "react"

import {
  MessageStatusEnum,
  MessageType,
  MessageTypeEnum,
  sendPromptMessage,
  usePromptBook,
} from "@/lib/chatbot"

import { Image } from "./Image"

export const Message = ({ message }: { message: MessageType }) => {
  const [selectedImage, setSelectedImage] = React.useState(-1)
  const addPrompt = usePromptBook((state) => state.addPrompt)
  return message.type === MessageTypeEnum.YOU ? (
    <div className="chat chat-end">
      <div className="chat-image avatar">
        <div className="w-10">
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
            className="lucide lucide-smile"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" x2="9.01" y1="9" y2="9"></line>
            <line x1="15" x2="15.01" y1="9" y2="9"></line>
          </svg>
        </div>
      </div>
      <div className="chat-header">
        {message.type}
        {message.timestamp && (
          <time className="text-xs opacity-50 pl-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        )}
      </div>
      <div className="chat-bubble chat-bubble-primary">
        {message.prompt && <p>{message.prompt}</p>}
      </div>
    </div>
  ) : (
    <div className="chat chat-start">
      <div className="chat-image avatar">
        <div className="w-10">
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
            className="lucide lucide-bot"
          >
            <rect width="18" height="10" x="3" y="11" rx="2"></rect>
            <circle cx="12" cy="5" r="2"></circle>
            <path d="M12 7v4"></path>
            <line x1="8" x2="8" y1="16" y2="16"></line>
            <line x1="16" x2="16" y1="16" y2="16"></line>
          </svg>
        </div>
      </div>
      <div className="chat-header">
        {message.type}
        {message.timestamp && (
          <time className="text-xs opacity-50 pl-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        )}
      </div>
      <div className="chat-bubble chat-bubble-info">
        {message.prompt && <p>{message.prompt}</p>}
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
        {message.status === MessageStatusEnum.LOADING &&
          message.images &&
          message.images.length === 0 && (
            <div className="flex flex-row gap-1 my-3">
              <div className="animate-pulse bg-white/25 w-3 h-3 rounded-full" />
              <div className="animate-pulse bg-white/25 delay-75 w-3 h-3 rounded-full" />
              <div className="animate-pulse bg-white/25 delay-150 w-3 h-3 rounded-full" />
            </div>
          )}
        {message.type === MessageTypeEnum.SD && (
          <div className="flex flex-row flex-wrap gap-2 my-2">
            {message.status === MessageStatusEnum.RECEIVED && (
              <>
                <button
                  className="border-white/10 border rounded px-3 py-1 font-semibold hover:bg-backgroundSecondary duration-200"
                  onClick={() => {
                    void sendPromptMessage(message.prompt)
                  }}
                >
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
                    className="lucide lucide-refresh-ccw"
                  >
                    <path d="M3 2v6h6"></path>
                    <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
                    <path d="M21 22v-6h-6"></path>
                    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
                  </svg>
                </button>
                <button
                  className="border-white/10 border rounded px-3 py-1 font-semibold hover:bg-backgroundSecondary duration-200"
                  onClick={() => {
                    addPrompt(message.prompt)
                  }}
                >
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
                    className="lucide lucide-save"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
