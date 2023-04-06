import React from "react"

import { ChatBar } from "@/components/ChatBar"
import { MessageList } from "@/components/MessageList"

export default function ChatView() {
  return (
    <>
      <MessageList />
      <div className="fixed bottom-0 w-full bg-base-100">
        <ChatBar />
      </div>
    </>
  )
}
