import { useMessageList } from "@/lib/chatbot"

import { Message } from "./Message"

export function MessageList() {
  const history = useMessageList((state) => state.messages)

  return (
    <>
      {Object.values(history).map((message) => (
        <>{message && <Message key={message.id} message={message} />}</>
      ))}
    </>
  )
}
