import { useEffect, useRef } from "react"

import { useMessageList } from "@/lib/chatbot"

import { Message } from "./Message"

export function MessageList() {
  const history = useMessageList((state) => state.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [history])

  return (
    <div className="h-full justify-end overflow-y-auto p-5">
      {Object.values(history).map((message) => (
        <>{message && <Message key={message.id} message={message} />}</>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
