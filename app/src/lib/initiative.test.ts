import { describe, expect, it } from 'vitest'
import { nextTurn, prevTurn, sortParticipants, tied, turnAfterRemoval, type Participant } from './initiative'

const p = (token_id: string, initiative: number | null, modifier = 0, tiebreak = 0): Participant => ({
  token_id,
  campaign_id: 'c',
  initiative,
  modifier,
  tiebreak,
})
const ids = (ps: Participant[]) => sortParticipants(ps).map((x) => x.token_id)

describe('sortParticipants', () => {
  it('ordina per iniziativa decrescente', () => {
    expect(ids([p('a', 12), p('b', 18), p('c', 15)])).toEqual(['b', 'c', 'a'])
  })
  it('a parità di iniziativa decide il modificatore', () => {
    expect(ids([p('a', 14, 1), p('b', 14, 3)])).toEqual(['b', 'a'])
  })
  it('a parità totale decide il DM con il tiebreak', () => {
    expect(ids([p('a', 14, 2, 0), p('b', 14, 2, 1)])).toEqual(['b', 'a'])
    expect(tied(p('a', 14, 2), p('b', 14, 2, 5))).toBe(true)
  })
  it('chi non ha iniziativa va in fondo', () => {
    expect(ids([p('a', null), p('b', -3)])).toEqual(['b', 'a'])
  })
})

describe('turni', () => {
  const ordine = ['a', 'b', 'c']
  it("dopo l'ultimo torna al primo e il round sale", () => {
    expect(nextTurn(ordine, 'b', 1)).toEqual({ turn: 'c', round: 1 })
    expect(nextTurn(ordine, 'c', 1)).toEqual({ turn: 'a', round: 2 })
  })
  it('con un solo partecipante ogni passo fa salire il round', () => {
    expect(nextTurn(['a'], 'a', 3)).toEqual({ turn: 'a', round: 4 })
  })
  it('indietro dal primo va al round prima; dal primo del round 1 no', () => {
    expect(prevTurn(ordine, 'b', 2)).toEqual({ turn: 'a', round: 2 })
    expect(prevTurn(ordine, 'a', 2)).toEqual({ turn: 'c', round: 1 })
    expect(prevTurn(ordine, 'a', 1)).toBeNull()
  })
  it('togliere chi è di turno passa al successivo', () => {
    expect(turnAfterRemoval(ordine, 'a', 1)).toEqual({ turn: 'b', round: 1 })
    expect(turnAfterRemoval(ordine, 'b', 1)).toEqual({ turn: 'c', round: 1 })
    expect(turnAfterRemoval(ordine, 'c', 1)).toEqual({ turn: 'a', round: 2 })
    expect(turnAfterRemoval(['a'], 'a', 1)).toBeNull()
  })
})
