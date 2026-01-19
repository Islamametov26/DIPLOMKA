import { useMemo } from 'react'

type Props = {
  selected: string[]
  onChange: (seats: string[]) => void
}

const rows = ['A', 'B', 'C', 'D', 'E', 'F']
const seatsPerRow = 10

const reservedSeats = new Set([
  'A-1',
  'A-2',
  'B-5',
  'C-7',
  'D-4',
  'E-9',
])

function SeatPicker({ selected, onChange }: Props) {
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const seatMap = useMemo(() => {
    return rows.map((row) =>
      Array.from({ length: seatsPerRow }, (_, index) => {
        const seatNumber = index + 1
        return `${row}-${seatNumber}`
      }),
    )
  }, [])

  const toggleSeat = (seatId: string) => {
    if (reservedSeats.has(seatId)) {
      return
    }
    const next = new Set(selected)
    if (next.has(seatId)) {
      next.delete(seatId)
    } else {
      next.add(seatId)
    }
    onChange(Array.from(next))
  }

  const selectedList = [...selected].sort()

  return (
    <section className="seats">
      <div className="seats__header">
        <div>
          <p className="seats__eyebrow">Кинотеатр Север</p>
          <h2 className="seats__title">Выбор мест</h2>
          <p className="seats__subtitle">
            Кликните по свободным местам, чтобы отметить подходящие. Серые
            заняты, оранжевые выбраны.
          </p>
        </div>
        <div className="seats__summary">
          <span className="seats__summary-label">Выбрано</span>
          <span className="seats__summary-value">
            {selectedList.length > 0 ? selectedList.join(', ') : 'ничего'}
          </span>
        </div>
      </div>

      <div className="seats__screen">Экран</div>

      <div className="seats__grid" role="grid">
        {seatMap.map((rowSeats, rowIndex) => (
          <div className="seats__row" key={rows[rowIndex]} role="row">
            <span className="seats__row-label">{rows[rowIndex]}</span>
            <div className="seats__row-seats" role="presentation">
              {rowSeats.map((seatId) => {
                const isReserved = reservedSeats.has(seatId)
                const isSelected = selectedSet.has(seatId)
                return (
                  <button
                    key={seatId}
                    type="button"
                    className={`seat${isReserved ? ' seat--reserved' : ''}${
                      isSelected ? ' seat--selected' : ''
                    }`}
                    onClick={() => toggleSeat(seatId)}
                    aria-pressed={isSelected}
                    disabled={isReserved}
                  >
                    {seatId.split('-')[1]}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="seats__legend">
        <span className="seat seat--legend">Свободно</span>
        <span className="seat seat--legend seat--selected">Выбрано</span>
        <span className="seat seat--legend seat--reserved">Занято</span>
      </div>
    </section>
  )
}

export default SeatPicker
