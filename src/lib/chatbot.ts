import { create } from "zustand"

import { getPromptModifers } from "@/components/PromptEngine"

export enum MessageTypeEnum {
  YOU = "you",
  STABLE_DIFFUSION = "stable diffusion",
  OTHER = "other",
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
  modifiers: string | undefined
  loading: boolean
  error: string | null
  images: Artifact[]
  settings: Settings | null
  rating: number
}

export type Artifact = {
  image: string
  seed: number
  id: string
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

export const sendPromptMessage = async (
  webui_url: string,
  prompt: string,
  modifiers?: string,
) => {
  if (!prompt && !modifiers) return

  const settings = useSettings.getState().settings
  useSettings.getState().setOpen(false)

  if (prompt.length < 150 && !modifiers) {
    modifiers = getPromptModifers()
  }

  if (prompt.length < 35) {
    if (modifiers) {
      modifiers = `${prompt} ${modifiers}`
    } else {
      modifiers = prompt
    }
  }

  if (!settings.modify) {
    modifiers = undefined
  }

  useChatBar.getState().setPrompt("")

  const uid = makeId()
  const newMsg: MessageType = {
    type: MessageTypeEnum.YOU,
    id: uid,
    prompt: prompt,
    modifiers: modifiers || undefined,
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

  let res = null

  try {
    res = await fetch(`${webui_url}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        modifiers,
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
  newMsg.loading = false

  if (!res || !res.ok) {
    switch (res?.status) {
      case 400:
        newMsg.error = "Bad request"
        break
      case 429:
        newMsg.error = "You're too fast! Slow down!"
        break
      default:
        newMsg.error = "Something went wrong"
        break
    }

    newMsg.status = MessageStatusEnum.ERROR
    useMessageList.getState().editMessage(uid, newMsg)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  newMsg.images = data

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (data.length === 0) {
    newMsg.error = "No results"
    newMsg.status = MessageStatusEnum.ERROR
    useMessageList.getState().editMessage(uid, newMsg)
    return
  }
  newMsg.status = MessageStatusEnum.RECEIVED

  console.log("new msg", newMsg)
  useMessageList.getState().editMessage(uid, newMsg)
}

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
}))
