import { useEffect, useMemo, useRef, useState } from 'react'
import { MAX_MESSAGGIO, type Message } from '../hooks/useChat'
import type { Member, Roll } from '../hooks/useTable'
import { esito } from './DiceOverlay'
import { Icon } from './Icon'

type Props = {
  userId: string
  isDm: boolean
  messages: Message[]
  rolls: Roll[] // più recente per primo, come li dà useTable
  members: Member[]
  errore: string
  onSend: (body: string, recipientId: string | null) => Promise<string | null>
  onRemove: (id: string) => Promise<void>
}

type Voce = ({ kind: 'msg' } & Message) | ({ kind: 'roll' } & Roll)

const ora = (iso: string) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const lunghezza = (s: string) => [...s].length // come char_length di Postgres: le emoji contano 1

// Messaggi e tiri in un solo flusso, ordinati per orario del database (a parità, per id: stesso ordine per tutti).
function flusso(messages: Message[], rolls: Roll[]): Voce[] {
  const voci: Voce[] = [...messages.map((m) => ({ ...m, kind: 'msg' as const })), ...rolls.map((r) => ({ ...r, kind: 'roll' as const }))]
  voci.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || (a.id < b.id ? -1 : 1))
  return voci.slice(-100)
}

export function Chat({ userId, isDm, messages, rolls, members, errore, onSend, onRemove }: Props) {
  const [testo, setTesto] = useState('')
  const [destinatario, setDestinatario] = useState('') // '' = a tutti
  const [invio, setInvio] = useState(false)
  const [erroreInvio, setErroreInvio] = useState('')
  const logRef = useRef<HTMLOListElement>(null)
  const inFondo = useRef(true)

  const voci = useMemo(() => flusso(messages, rolls), [messages, rolls])
  const nomi = useMemo(() => new Map(members.map((m) => [m.user_id, m.display_name])), [members])
  // Il DM sussurra a chiunque altro, un Player solo al DM (come la policy di insert).
  const destinatari = members.filter((m) => m.user_id !== userId && (isDm || m.role === 'dm'))

  // Scende all'ultimo messaggio solo se l'utente era già in fondo: non gli strappa la lettura.
  useEffect(() => {
    const el = logRef.current
    if (el && inFondo.current) el.scrollTop = el.scrollHeight
  }, [voci])

  const pulito = testo.trim()
  const eccesso = lunghezza(pulito) - MAX_MESSAGGIO
  const valido = pulito.length > 0 && eccesso <= 0

  async function invia(e?: React.FormEvent) {
    e?.preventDefault()
    if (!valido || invio) return
    setInvio(true)
    const err = await onSend(pulito, destinatario || null)
    setInvio(false)
    setErroreInvio(err ?? '')
    if (!err) setTesto('') // se fallisce il testo resta nel campo
  }

  function etichettaPrivato(m: Message) {
    if (!m.recipient_id) return null
    if (m.user_id === userId) return `privato a ${nomi.get(m.recipient_id) ?? '…'}`
    return 'privato per te'
  }

  return (
    <section>
      <h2 className="side-h">Chat</h2>
      <ol
        className="chat-log"
        role="log"
        aria-label="Messaggi e tiri del tavolo"
        tabIndex={0}
        ref={logRef}
        onScroll={(e) => {
          const el = e.currentTarget
          inFondo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
        }}
      >
        {voci.length === 0 && <li className="muted">Ancora nessun messaggio.</li>}
        {voci.map((v) =>
          v.kind === 'roll' ? (
            <li key={`r-${v.id}`} className="chat-msg chat-roll">
              <div className="chat-meta">
                <Icon name="dice" size={14} />
                <b>{v.display_name}</b>
                <time dateTime={v.created_at}>{ora(v.created_at)}</time>
              </div>
              <p className="chat-body">
                {v.label}:{' '}
                <span className={v.face === 20 ? 'crit-txt' : v.face === 1 ? 'fail-txt' : ''}>
                  {v.face}
                  {v.modifier ? (v.modifier > 0 ? ` + ${v.modifier}` : ` − ${-v.modifier}`) : ''} = {v.total}
                </span>
                {v.dc != null && <> · {esito(v) ? 'riuscito' : 'fallito'} contro CD {v.dc}</>}
              </p>
            </li>
          ) : (
            <li key={`m-${v.id}`} className={`chat-msg${v.recipient_id ? ' chat-whisper' : ''}`}>
              <div className="chat-meta">
                <b>{v.display_name}</b>
                <time dateTime={v.created_at}>{ora(v.created_at)}</time>
                {v.recipient_id && <span className="chat-tag">{etichettaPrivato(v)}</span>}
                {(v.user_id === userId || isDm) && (
                  <button
                    className="link-btn chat-del"
                    aria-label={`Elimina il messaggio di ${v.display_name}: ${v.body.slice(0, 40)}`}
                    onClick={() => confirm('Eliminare questo messaggio per tutti?') && void onRemove(v.id)}
                  >
                    Elimina
                  </button>
                )}
              </div>
              <p className="chat-body">{v.body}</p>
            </li>
          ),
        )}
      </ol>
      {(erroreInvio || errore) && <p className="error" role="alert">{erroreInvio || errore}</p>}
      <form className="chat-form" onSubmit={invia}>
        <label htmlFor="chat-testo" className="muted">Messaggio</label>
        <textarea
          id="chat-testo"
          name="messaggio"
          rows={2}
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          onKeyDown={(e) => {
            // Invio manda, Maiusc+Invio va a capo; durante la composizione (accenti, IME) Invio non manda.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void invia()
            }
          }}
          aria-describedby={eccesso > 0 ? 'chat-conta' : undefined}
        />
        {eccesso > 0 && <p id="chat-conta" className="error">{eccesso} caratteri di troppo</p>}
        <div className="row">
          {destinatari.length > 0 && (
            <select aria-label="Destinatario" value={destinatario} onChange={(e) => setDestinatario(e.target.value)}>
              <option value="">Tutti</option>
              {destinatari.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  Solo a {m.display_name}
                </option>
              ))}
            </select>
          )}
          <button disabled={!valido || invio}>Invia</button>
        </div>
      </form>
    </section>
  )
}
