// Braci che salgono: solo decorazione, tutto il movimento è in CSS (.embers in index.css).
// Posizioni e tempi fissi, non casuali: ogni render è uguale e niente salta al ri-render.
const BRACI = [
  [6, 0, 9], [14, 3.1, 11], [23, 6.4, 8], [31, 1.7, 12], [42, 4.8, 10], [51, 7.9, 9],
  [60, 2.3, 13], [68, 5.5, 8.5], [77, 0.9, 11], [85, 3.9, 9.5], [93, 6.8, 12], [37, 8.6, 10],
]

export function Embers() {
  return (
    <div className="embers" aria-hidden="true">
      {BRACI.map(([x, ritardo, durata]) => (
        <span key={x} style={{ '--x': `${x}%`, '--d': `${ritardo}s`, '--t': `${durata}s` } as React.CSSProperties} />
      ))}
    </div>
  )
}
