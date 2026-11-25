// Ordine di iniziativa e turni (feature 004). Funzioni pure: le usa il client e le prova initiative.test.ts.

export type Participant = {
  token_id: string
  campaign_id: string
  initiative: number | null // null = non ancora stabilita
  modifier: number
  tiebreak: number // scelta del DM a parità totale
}

export type Turn = { turn: string; round: number }

// Iniziativa ↓ (chi non ce l'ha va in fondo), poi modificatore ↓, scelta del DM ↓, id (stesso ordine per tutti).
export function sortParticipants(ps: Participant[]): Participant[] {
  return [...ps].sort(
    (a, b) =>
      (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity) ||
      b.modifier - a.modifier ||
      b.tiebreak - a.tiebreak ||
      (a.token_id < b.token_id ? -1 : a.token_id > b.token_id ? 1 : 0),
  )
}

// Pari per le regole: stessa iniziativa e stesso modificatore. Solo allora decide il DM.
export const tied = (a: Participant, b: Participant) => a.initiative === b.initiative && a.modifier === b.modifier

export function nextTurn(ordine: string[], turno: string, round: number): Turn {
  const i = ordine.indexOf(turno)
  if (i === -1 || i === ordine.length - 1) return { turn: ordine[0], round: i === -1 ? round : round + 1 }
  return { turn: ordine[i + 1], round }
}

// null al primo turno del round 1: non c'è un turno prima.
export function prevTurn(ordine: string[], turno: string, round: number): Turn | null {
  const i = ordine.indexOf(turno)
  if (i > 0) return { turn: ordine[i - 1], round }
  if (round <= 1) return null
  return { turn: ordine[ordine.length - 1], round: round - 1 }
}

// Il turno di chi è stato tolto passa al successivo nell'ordine di prima; null se non resta nessuno.
export function turnAfterRemoval(ordinePrima: string[], tolto: string, round: number): Turn | null {
  const resto = ordinePrima.filter((id) => id !== tolto)
  if (resto.length === 0) return null
  const i = ordinePrima.indexOf(tolto)
  if (i === -1 || i === ordinePrima.length - 1) return { turn: resto[0], round: round + 1 }
  return { turn: ordinePrima[i + 1], round }
}
