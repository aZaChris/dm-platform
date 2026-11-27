# Data model: Misurazione delle distanze (005)

Nessuna tabella nuova: la misura non si salva (FR-006). Esiste solo come messaggio Broadcast e come stato locale dei
client che la ricevono.

## Misura (messaggio, effimero)

| Campo | Tipo | Regole |
|---|---|---|
| `user_id` | uuid | chi misura; il client lo prende dalla sessione |
| `name` | text | nome visibile del membro nella campagna |
| `from` | `[col, row]` | cella di partenza, dentro la mappa |
| `to` | `[col, row]` | cella d'arrivo, riportata dentro la mappa se il puntatore esce (edge case) |

Eventi sul canale `ruler:<campaign_id>`:

- `move` con la misura completa: inizia o aggiorna la misura di `user_id`.
- `end` con `{ user_id }`: la misura di `user_id` sparisce per tutti.

## Stato nel client

`Map<user_id, { name, from, to, visto: istante }>` delle misure degli altri, più la propria. Una misura altrui senza
aggiornamenti da 3 secondi si toglie (research, punto 4).

## Distanza (calcolata, mai salvata)

`distance(from, to)` in `app/src/lib/ruler.ts`:

| Valore | Formula |
|---|---|
| celle | `max(|Δcol|, |Δriga|)`: ogni passo in diagonale vale una cella (FR-003) |
| piedi | celle × 5 |
| metri | celle × 1,5, scritto con la virgola (`7,5 m`) |

Esempi della spec: 4 celle in orizzontale → 4 celle · 20 ft · 6 m; 3 in diagonale + 2 in orizzontale → 5 celle ·
25 ft · 7,5 m; stessa cella → 0 celle · 0 ft · 0 m.

## Permessi

Policy RLS su `realtime.messages` (migrazione `0012_righello.sql`): lettura (`select`) e invio (`insert`) di messaggi
`broadcast` sul topic `ruler:<campaign_id>` solo se `public.is_member(<campaign_id>)`.
