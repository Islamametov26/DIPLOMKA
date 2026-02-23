type Props = {
  selected: string[]
  reserved?: string[]
  onChange: (seats: string[]) => void
}

const ROWS = ['A', 'B', 'C', 'D', 'E']
const SEATS_PER_ROW = 8

function seatLabel(row: string, index: number) {
  return `${row}${index + 1}`
}

function SeatPicker({ selected, onChange, reserved = [] }: Props) {
  const reservedSet = new Set(reserved)
  const selectedSet = new Set(selected)

  const toggleSeat = (label: string) => {
    if (reservedSet.has(label)) {
      return
    }

    if (selectedSet.has(label)) {
      onChange(selected.filter((item) => item !== label))
      return
    }

    onChange([...selected, label])
  }

  return (
    <section className="seats">
      <div className="seats__header">
        <div>
          <p className="seats__eyebrow">Схема зала</p>
          <h3 className="seats__title">Выбор мест</h3>
          <p className="seats__subtitle">Выберите свободные места для покупки.</p>
        </div>
        <div className="seats__summary">
          <div className="seats__summary-label">Выбрано мест</div>
          <div className="seats__summary-value">{selected.length}</div>
        </div>
      </div>

      <div className="seats__screen">Экран / Сцена</div>

      <div className="seats__grid">
        {ROWS.map((row) => (
          <div className="seats__row" key={row}>
            <div className="seats__row-label">{row}</div>
            <div className="seats__row-seats">
              {Array.from({ length: SEATS_PER_ROW }).map((_, index) => {
                const label = seatLabel(row, index)
                const isReserved = reservedSet.has(label)
                const isSelected = selectedSet.has(label)
                return (
                  <button
                    key={label}
                    className={`seat${isSelected ? ' seat--selected' : ''}${isReserved ? ' seat--reserved' : ''}`}
                    type="button"
                    onClick={() => toggleSeat(label)}
                    disabled={isReserved}
                    aria-label={`Место ${label}`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="seats__legend">
        <div className="seat seat--legend" />
        <span>Свободно</span>
        <div className="seat seat--selected seat--legend" />
        <span>Выбрано</span>
        <div className="seat seat--reserved seat--legend" />
        <span>Занято</span>
      </div>
    </section>
  )
}

export default SeatPicker
