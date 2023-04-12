import { create } from "zustand"

import { windowEmit } from "./api"

export enum MessageTypeEnum {
  YOU = "you",
  SD = "stable diffusion",
  LLAMA = "llama",
  SYSTEM = "system",
}
export enum MessageStatusEnum {
  SENT = "sent",
  RECEIVED = "received",
  ERROR = "error",
  LOADING = "loading",
}
export type MessageType = {
  type: MessageTypeEnum
  id: string
  timestamp: number
  content: string
  status: string
  prompt: string
  loading: boolean
  error: string | null
  images: string[]
  settings: Settings | null
  rating: number
}

export type ChatBarType = {
  prompt: string
  setPrompt: (prompt: string) => void
}

export const useChatBar = create<ChatBarType>()((set) => ({
  prompt: "",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPrompt: (prompt: string) => set((_state: ChatBarType) => ({ prompt })),
}))

export const b64toBlob = (b64Data: string, contentType = "") => {
  // Decode the base64 string into a new Buffer object
  const buffer = Buffer.from(b64Data, "base64")

  // Create a new blob object from the buffer
  return new Blob([buffer], { type: contentType })
}
export const makeId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const sessionID = makeId()

export type WebuiUrlType = {
  url: string
  setWebuiUrl: (url: string) => void
}
export const useWebuiUrl = create<WebuiUrlType>()((set) => ({
  url: "",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setWebuiUrl: (url: string) => set((_state) => ({ url })),
}))

export type MessageHistory = {
  messages: Record<string, MessageType>
  addMessage: (message: MessageType) => void
  editMessage: (id: string, message: MessageType) => void
  deleteMessage: (id: string) => void
}

export const useMessageList = create<MessageHistory>()((set) => ({
  messages: {},
  addMessage: (message: MessageType) =>
    set((state: MessageHistory) => ({
      messages: { ...state.messages, [message.id]: message },
    })),
  editMessage: (id: string, message: MessageType) =>
    set((state: MessageHistory) => ({
      messages: { ...state.messages, [id]: message },
    })),
  deleteMessage: (id: string) => {
    const messages = { ...useMessageList.getState().messages }
    delete messages[id]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set((_state: MessageHistory) => ({
      messages,
    }))
  },
}))

export const useMessage = (id: string) => {
  const message = useMessageList((state) => state.messages[id])
  const setMessage = (message: MessageType) =>
    useMessageList.getState().editMessage(id, message)
  return [message, setMessage] as const
}

export const getLastNMessages = (n: number) => {
  const messages = useMessageList.getState().messages

  const values = Object.values(messages)
  return values.sort((a, b) => b.timestamp - a.timestamp).slice(0, n)
}

export const createMsg = (
  type: MessageTypeEnum,
  prompt: string,
  settings: Settings | null,
) => {
  const uid = makeId()
  const newMsg: MessageType = {
    type: type,
    id: uid,
    prompt: prompt,
    timestamp: Date.now(),
    loading: true,
    error: null,
    images: [],
    settings: settings,
    rating: 3,
    content: "",
    status: MessageStatusEnum.LOADING,
  }
  useMessageList.getState().addMessage(newMsg)
  return newMsg
}

export const sendPromptMessage = async (
  webui_url: string,
  prompt: string,
  talkToType: string,
) => {
  if (!prompt) return

  const settings = useSettings.getState().settings
  useSettings.getState().setOpen(false)
  useChatBar.getState().setPrompt("")

  const newMsg = createMsg(MessageTypeEnum.YOU, prompt, settings)

  if (talkToType === "llama") {
    void windowEmit("llamamsg", { message: prompt })
    return
  }

  let res = null

  const reply_msg = createMsg(MessageTypeEnum.SD, prompt, newMsg.settings)

  try {
    res = await fetch(`${webui_url}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        model: settings.model,
        width: settings.width,
        height: settings.height,
        count: settings.count,
        steps: settings.steps,
        scale: settings.scale,
        session: sessionID,
      }),
    })
  } catch (e) {
    console.log(e)
  }
  reply_msg.loading = false

  if (!res || !res.ok) {
    switch (res?.status) {
      case 400:
        reply_msg.error = "Bad request"
        break
      case 429:
        reply_msg.error = "You're too fast! Slow down!"
        break
      default:
        reply_msg.error = "Something went wrong"
        break
    }

    reply_msg.status = MessageStatusEnum.ERROR
    useMessageList.getState().editMessage(reply_msg.id, newMsg)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  reply_msg.images = data.images

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (data.length === 0) {
    reply_msg.error = "No results"
    reply_msg.status = MessageStatusEnum.ERROR
    useMessageList.getState().editMessage(reply_msg.id, reply_msg)
    return
  }
  reply_msg.status = MessageStatusEnum.RECEIVED

  useMessageList.getState().editMessage(reply_msg.id, reply_msg)
}
// msg box
export type MsgBox = {
  isOpen: boolean
  setOpen: (isOpen: boolean) => void
}
export const useMsgBox = create<MsgBox>()((set) => ({
  isOpen: false,
  setOpen: (isOpen: boolean) => set((_state) => ({ isOpen })),
}))

// prompt book
export type PromptBook = {
  prompts: string[]
  addPrompt: (prompt: string) => void
  deletePrompt: (prompt: string) => void
  setPrompts: (prompts: string[]) => void

  isOpen: boolean
  setOpen: (isOpen: boolean) => void
}

export const usePromptBook = create<PromptBook>()((set) => ({
  prompts: [],
  addPrompt: (prompt: string) =>
    set((state: PromptBook) => ({
      prompts: [...state.prompts, prompt],
    })),
  deletePrompt: (prompt: string) =>
    set((state: PromptBook) => ({
      prompts: state.prompts.filter((p) => p !== prompt),
    })),
  setPrompts: (prompts: string[]) => set((_state: PromptBook) => ({ prompts })),

  isOpen: false,
  setOpen: (isOpen: boolean) => set((_state: PromptBook) => ({ isOpen })),
}))

// settings

export type Settings = {
  model:
    | "stable-diffusion-v1-5"
    | "stable-diffusion-512-v2-1"
    | "stable-diffusion-768-v2-1"
    | "anything-v3.0"
  width: number
  height: number
  count: number
  steps: number
  scale: number
  modify: boolean
}

export type SettingsState = {
  settings: Settings
  setSettings: (settings: Settings) => void

  isOpen: boolean
  setOpen: (isOpen: boolean) => void

  llama_model_path: string
  setLlamaModelPath: (path: string) => void

  talkToType: "llama" | "sd"
  setTalkToType: (type: "llama" | "sd") => void

  llamaStatus: "inactive" | "loading" | "error" | "active"
  setLlamaStatus: (status: "inactive" | "loading" | "error" | "active") => void
}

export const useSettings = create<SettingsState>()((set) => ({
  settings: {
    model: "stable-diffusion-v1-5",
    width: 512,
    height: 512,
    count: 4,
    steps: 30,
    scale: 7,
    modify: true,
  } as Settings,
  setSettings: (settings: Settings) =>
    set((state: SettingsState) => ({
      settings: { ...state.settings, ...settings },
    })),

  isOpen: false,
  setOpen: (isOpen: boolean) => set((state: SettingsState) => ({ isOpen })),

  llama_model_path: "F:\\ai\\gptworks\\llama.cpp\\zh-models\\13B\\ggml-model-q4_0.bin",
  setLlamaModelPath: (path: string) =>
    set((state: SettingsState) => ({ llama_model_path: path })),

  talkToType: "llama",
  setTalkToType: (type) => set((state: SettingsState) => ({ talkToType: type })),

  llamaStatus: "inactive",
  setLlamaStatus: (status) => set((state: SettingsState) => ({ llamaStatus: status })),
}))
