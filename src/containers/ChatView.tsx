import React from "react"

import { ChatBar } from "@/components/ChatBar"
import { MessageList } from "@/components/MessageList"
import { PromptBook } from "@/components/PromptBook"
import { Settings } from "@/components/Settings"
import { useWebuiUrl } from "@/lib/chatbot"

export const ChatView = ({ webui_url }: { webui_url: string }) => {
  useWebuiUrl.getState().setWebuiUrl(webui_url)
  return (
    <>
      <div className="grow carousel w-full">
        <div id="msgbox" className="carousel-item w-full flex justify-center">
          <MessageList />
        </div>
        <div id="promptbook" className="carousel-item w-full flex justify-center">
          <PromptBook />
        </div>
        <div id="settings" className="carousel-item w-full flex justify-center">
          <Settings />
        </div>
      </div>
      <div className="bottom-0 w-full bg-base-100 flex justify-center">
        <ChatBar />
      </div>
    </>
  )
}
