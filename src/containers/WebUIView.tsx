import { openLink } from "@/lib/api"

interface WebUIViewProps {
  url: string
}

export const WebUIView: React.FC<WebUIViewProps> = ({ url }: WebUIViewProps) => {
  const openInBrowser = () => {
    void openLink(url)
  }

  return url ? (
    <>
      <div className="flex-1 p-2 btn-group bg-base-300">
        <button className="btn btn-outline">WebUI is Running on {url}</button>
        <button className="btn btn-primary" onClick={openInBrowser}>
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
            className="lucide lucide-external-link"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" x2="21" y1="14" y2="3"></line>
          </svg>
        </button>
      </div>
      <iframe src={url} className="mt-1 h-full" />
    </>
  ) : (
    <div className="hero h-full bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Hello there</h1>
          <p className="py-6">
            First, you have to download the stable-diffusion-webui. Then, You need to
            click the Start button to get started.
          </p>
          <button className="btn btn-primary">Get Started</button>
        </div>
      </div>
    </div>
  )
}
