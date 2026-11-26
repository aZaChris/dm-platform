import { useEffect, useState } from 'react'

type Props = {
  label: string
  value: string | number
  onSave: (v: string | number) => void
  type?: 'text' | 'number' | 'area'
  min?: number
  max?: number
  readOnly?: boolean
  hideLabel?: boolean // l'etichetta resta per il lettore di schermo
  className?: string
}

// Campo della scheda: tiene il valore locale mentre lo scrivi (un aggiornamento remoto non te lo cambia sotto le dita)
// e salva all'uscita o con Invio. I numeri fuori scala non si salvano e il campo spiega il limite.
export function SheetField({ label, value, onSave, type = 'text', min, max, readOnly, hideLabel, className = '' }: Props) {
  const [v, setV] = useState(String(value))
  const [focus, setFocus] = useState(false)
  const [errore, setErrore] = useState('')

  useEffect(() => {
    if (!focus) setV(String(value))
  }, [value, focus])

  if (readOnly) {
    return (
      <div className={`sf sf-ro ${className}`}>
        <span className={hideLabel ? 'sr-only' : 'sf-label'}>{label}</span>
        <span className="sf-value">{String(value) || '—'}</span>
      </div>
    )
  }

  function salva() {
    setFocus(false)
    if (type === 'number') {
      const n = Number(v.replace(',', '.'))
      if (v.trim() === '' || !Number.isFinite(n) || (min != null && n < min) || (max != null && n > max)) {
        setErrore(`Serve un numero${min != null ? ` da ${min}` : ''}${max != null ? ` a ${max}` : ''}.`)
        return
      }
      setErrore('')
      if (n !== Number(value)) onSave(n)
    } else if (v !== String(value)) onSave(v)
  }

  const comuni = {
    value: v,
    'aria-label': label,
    'aria-invalid': errore ? true : undefined,
    onFocus: () => setFocus(true),
    onBlur: salva,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV(e.target.value),
  }
  return (
    <label className={`sf ${className}`}>
      <span className={hideLabel ? 'sr-only' : 'sf-label'}>{label}</span>
      {type === 'area' ? (
        <textarea {...comuni} rows={4} />
      ) : (
        <input
          {...comuni}
          type={type === 'number' ? 'number' : 'text'}
          inputMode={type === 'number' ? 'numeric' : undefined}
          min={min}
          max={max}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      )}
      {errore && <span className="sf-error" role="alert">{errore}</span>}
    </label>
  )
}
