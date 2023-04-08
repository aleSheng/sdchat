/* eslint-disable @typescript-eslint/restrict-template-expressions */
import React from "react"

import { MessageType } from "@/lib/chatbot"

export function Image({
  image,
  selectedImage,
  setSelectedImage,
  message,
  i,
}: {
  image: string
  selectedImage: number
  setSelectedImage(i: number): void
  message: MessageType
  i: number
}) {
  const [loaded, setLoaded] = React.useState(false)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={i}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      src={`data:image/bmp;base64,${image}`}
      alt="Generated image"
      className={`rounded mt-2 duration-300 cursor-pointer ${
        loaded ? "opacity-100 hover:opacity-75" : "opacity-0"
      } ${
        selectedImage > -1 && selectedImage !== i && message.images?.length !== 1
          ? "-mx-1"
          : ""
      }`}
      style={{
        maxHeight:
          selectedImage === i || message.images?.length === 1 ? "25rem" : "10rem",
        maxWidth:
          selectedImage === i || message.images?.length === 1 ? "25rem" : "10rem",
        height:
          selectedImage > -1 && selectedImage !== i && message.images?.length !== 1
            ? "0"
            : `${message.settings?.height}px`,
        width:
          selectedImage > -1 && selectedImage !== i && message.images?.length !== 1
            ? "0"
            : `${message.settings?.width}px`,
      }}
      onClick={() => {
        if (message.images?.length === 1) return

        if (selectedImage === i) {
          setSelectedImage(-1)
        } else {
          setSelectedImage(i)

          if (
            window.innerHeight + document.documentElement.scrollTop ===
            document.documentElement.offsetHeight
          ) {
            setTimeout(() => {
              window.scrollTo({
                behavior: "smooth",
                top: document.body.scrollHeight,
              })
            }, 300)
          }
        }
      }}
      onLoad={() => {
        window.scrollTo({
          behavior: "smooth",
          top: document.body.scrollHeight,
        })
        setLoaded(true)
      }}
    />
  )
}
