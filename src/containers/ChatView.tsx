import React from "react"

import { ChatBar } from "@/components/ChatBar"
import { MessageList } from "@/components/MessageList"
import { useWebuiUrl } from "@/lib/chatbot"

export const ChatView = ({ webui_url }: { webui_url: string }) => {
  useWebuiUrl.getState().setWebuiUrl(webui_url)
  return (
    <>
      <MessageList />
      <div className="fixed bottom-0 w-full bg-base-100">
        <ChatBar />
      </div>
    </>
  )
}
