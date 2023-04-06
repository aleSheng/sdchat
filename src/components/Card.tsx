interface CardProps {
  title: string
  description: string
  bgColor: string
  actionName?: string
  locationBtn?: string
  className?: string
  checkFunc: () => void
  takeAction?: () => void
  locationAction?: () => void
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  bgColor = "bg-base-100",
  actionName,
  locationBtn,
  className,
  checkFunc,
  takeAction,
  locationAction,
}: CardProps) => (
  <div className={`card w-full ${bgColor} shadow-xl ${className || ""}`}>
    <div className="card-body">
      <h2 className="card-title">{title}</h2>
      <div className="whitespace-pre-wrap overflow-hidden text-ellipsis ">
        {description}
      </div>
      <div className="card-actions justify-end">
        {locationBtn && (
          <button className="btn btn-outline" onClick={locationAction}>
            {locationBtn}
          </button>
        )}
        {actionName && (
          <button className="btn btn-second" onClick={takeAction}>
            {actionName}
          </button>
        )}
        <button className="btn btn-primary" onClick={checkFunc}>
          Check
        </button>
      </div>
    </div>
  </div>
)
