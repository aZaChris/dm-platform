import {
  ABILITIES, SKILLS, abilityMod, attackBonus, formatMod, initiative, newId, passivePerception, profBonus, saveBonus,
  skillBonus, spellAttack, spellDc, totalLevel, type Ability, type CharacterData, type SlotLevel,
} from '../lib/character'
import { SheetField } from './SheetField'

type Props = { data: CharacterData; canEdit: boolean; patch: (path: string[], value: unknown) => void }

const LIVELLI: SlotLevel[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const PROF_SEGNO = ['○', '●', '◆'] as const

// Vista classica: la disposizione della scheda 5e su carta, disegnata con il design system dell'app (research, punto 9).
// Ogni campo si modifica dove sta; le liste si riscrivono intere quando si aggiunge o toglie un elemento.
// ponytail: i campi dentro una lista puntano all'indice; se due persone riordinano la stessa lista insieme, vince l'ultima.
export function SheetClassic({ data: d, canEdit, patch }: Props) {
  const ro = !canEdit
  const pb = profBonus(totalLevel(d))
  const F = (label: string, path: string[], value: string | number, extra: Partial<Parameters<typeof SheetField>[0]> = {}) => (
    <SheetField label={label} value={value} readOnly={ro} onSave={(v) => patch(path, v)} {...extra} />
  )
  const N = (label: string, path: string[], value: number, min = 0, max = 999, extra: Partial<Parameters<typeof SheetField>[0]> = {}) =>
    F(label, path, value, { type: 'number', min, max, ...extra })
  const lista = <K extends 'attacks' | 'items' | 'features' | 'spells' | 'resources'>(k: K, nuova: CharacterData[K]) => patch([k], nuova)
  const togli = (k: 'attacks' | 'items' | 'features' | 'spells' | 'resources', id: string, nome: string) =>
    confirm(`Togliere «${nome || 'senza nome'}»?`) && patch([k], (d[k] as { id: string }[]).filter((x) => x.id !== id))
  const Aggiungi = ({ testo, onClick }: { testo: string; onClick: () => void }) => (canEdit ? <button type="button" className="link-btn add-btn" onClick={onClick}>+ {testo}</button> : null)
  const Togli = ({ k, id, nome }: { k: 'attacks' | 'items' | 'features' | 'spells' | 'resources'; id: string; nome: string }) =>
    canEdit ? <button type="button" className="icon-btn x-btn" aria-label={`Togli ${nome || 'voce'}`} onClick={() => togli(k, id, nome)}>×</button> : null

  return (
    <div className="sheet sheet-classic">
      {/* Intestazione */}
      <section className="cl-head" aria-label="Identità">
        <div className="cl-classes">
          {d.classes.map((c, i) => (
            <div key={i} className="cl-class">
              {F(`Classe ${i + 1}`, ['classes', String(i), 'name'], c.name)}
              {F(`Sottoclasse ${i + 1}`, ['classes', String(i), 'subclass'], c.subclass)}
              {N(`Livello ${i + 1}`, ['classes', String(i), 'level'], c.level, 1, 20)}
              {canEdit && d.classes.length > 1 && <button type="button" className="icon-btn x-btn" aria-label={`Togli la classe ${c.name}`} onClick={() => patch(['classes'], d.classes.filter((_, j) => j !== i))}>×</button>}
            </div>
          ))}
          <Aggiungi testo="Classe (multiclasse)" onClick={() => patch(['classes'], [...d.classes, { name: '', subclass: '', level: 1 }])} />
        </div>
        <div className="cl-id">
          {F('Razza', ['race'], d.race)}
          {F('Background', ['background'], d.background)}
          {F('Allineamento', ['alignment'], d.alignment)}
          {N('Punti esperienza', ['xp'], d.xp, 0, 999999)}
        </div>
      </section>

      <div className="cl-grid">
        {/* Colonna sinistra: caratteristiche, tiri salvezza, abilità */}
        <div className="cl-col">
          <div className="cl-abil">
            {ABILITIES.map((a) => (
              <div key={a.key} className="cl-abil-box">
                <span className="cl-abil-name">{a.nome}</span>
                <b className="cl-abil-mod">{formatMod(abilityMod(d, a.key))}</b>
                {N(`Punteggio di ${a.nome}`, ['abilities', a.key], d.abilities[a.key], 1, 30, { hideLabel: true, className: 'sf-score' })}
              </div>
            ))}
          </div>
          <div className="cl-box cl-row2">
            <div>{N('Ispirazione', ['inspiration'], d.inspiration, 0, 99)}</div>
            <div className="sf"><span className="sf-label">Bonus di competenza</span><b className="cl-big">{formatMod(pb)}</b></div>
          </div>
          <div className="cl-box">
            <h3 className="cl-h">Tiri salvezza</h3>
            {ABILITIES.map((a) => (
              <div key={a.key} className="cl-line">
                <input type="checkbox" disabled={ro} checked={!!d.saves[a.key]?.prof} aria-label={`Competenza nel tiro salvezza di ${a.nome}`}
                  onChange={(e) => patch(['saves', a.key], { prof: e.target.checked, bonus: d.saves[a.key]?.bonus ?? 0 })} />
                <b className="cl-val">{formatMod(saveBonus(d, a.key))}</b>
                <span className="cl-name">{a.nome}</span>
                {canEdit && N(`Bonus extra al tiro salvezza di ${a.nome}`, ['saves', a.key], d.saves[a.key]?.bonus ?? 0, -20, 20, { hideLabel: true, className: 'sf-tiny', onSave: (v) => patch(['saves', a.key], { prof: !!d.saves[a.key]?.prof, bonus: Number(v) }) })}
              </div>
            ))}
            {N('Bonus a tutti i tiri salvezza', ['save_bonus_all'], d.save_bonus_all, -20, 20, { className: 'sf-inline' })}
          </div>
          <div className="cl-box">
            <h3 className="cl-h">Abilità</h3>
            {SKILLS.map((s) => {
              const p = d.skills[s.key]?.prof ?? 0
              return (
                <div key={s.key} className="cl-line">
                  {canEdit ? (
                    <button type="button" className={`prof-dot p${p}`} aria-label={`${s.nome}: ${['nessuna competenza', 'competenza', 'maestria'][p]}. Cambia`}
                      onClick={() => patch(['skills', s.key], { prof: (p + 1) % 3, bonus: d.skills[s.key]?.bonus ?? 0 })}>{PROF_SEGNO[p]}</button>
                  ) : <span className={`prof-dot p${p}`}>{PROF_SEGNO[p]}</span>}
                  <b className="cl-val">{formatMod(skillBonus(d, s.key))}</b>
                  <span className="cl-name">{s.nome} <span className="muted">({ABILITIES.find((a) => a.key === s.ab)!.breve})</span></span>
                  {canEdit && N(`Bonus extra a ${s.nome}`, ['skills', s.key], d.skills[s.key]?.bonus ?? 0, -20, 20, { hideLabel: true, className: 'sf-tiny', onSave: (v) => patch(['skills', s.key], { prof: p, bonus: Number(v) }) })}
                </div>
              )
            })}
          </div>
          <div className="cl-box cl-row2"><span className="cl-name">Saggezza (Percezione) passiva</span><b className="cl-big">{passivePerception(d)}</b></div>
          <div className="cl-box">
            <h3 className="cl-h">Competenze e lingue</h3>
            {F('Armature', ['proficiencies', 'armor'], d.proficiencies.armor)}
            {F('Armi', ['proficiencies', 'weapons'], d.proficiencies.weapons)}
            {F('Strumenti', ['proficiencies', 'tools'], d.proficiencies.tools)}
            {F('Lingue', ['proficiencies', 'languages'], d.proficiencies.languages)}
          </div>
        </div>

        {/* Colonna centrale: combattimento, attacchi, equipaggiamento */}
        <div className="cl-col">
          <div className="cl-trio">
            <div className="cl-box cl-stat">{N('Classe armatura', ['ac'], d.ac, 0, 40, { className: 'sf-big' })}</div>
            <div className="cl-box cl-stat"><span className="sf-label">Iniziativa</span><b className="cl-big">{formatMod(initiative(d))}</b>{canEdit && N('Bonus extra all\'iniziativa', ['initiative_bonus'], d.initiative_bonus, -20, 20, { className: 'sf-tiny' })}</div>
            <div className="cl-box cl-stat">{F('Velocità', ['speed'], d.speed, { className: 'sf-big' })}</div>
          </div>
          <div className="cl-box">
            <h3 className="cl-h">Punti ferita</h3>
            <div className="cl-trio">
              {N('Massimi', ['hp', 'max'], d.hp.max, 1, 999)}
              {N('Attuali', ['hp', 'current'], d.hp.current, 0, d.hp.max)}
              {N('Temporanei', ['hp', 'temp'], d.hp.temp, 0, 999)}
            </div>
          </div>
          <div className="cl-box">
              <h3 className="cl-h">Dadi vita</h3>
              {d.hit_dice.map((h, i) => (
                <div key={i} className="cl-trio">
                  {N('Dado (d)', ['hit_dice', String(i), 'die'], h.die, 4, 12)}
                  {N('Totali', ['hit_dice', String(i), 'total'], h.total, 0, 20)}
                  {N('Usati', ['hit_dice', String(i), 'used'], h.used, 0, h.total)}
                </div>
              ))}
              <Aggiungi testo="Dado vita" onClick={() => patch(['hit_dice'], [...d.hit_dice, { die: 8, total: 1, used: 0 }])} />
            </div>
          <div className="cl-box">
              <h3 className="cl-h">Tiri contro la morte</h3>
              {(['success', 'fail'] as const).map((k) => (
                <div key={k} className="cl-death">
                  <span className="cl-name">{k === 'success' ? 'Successi' : 'Fallimenti'}</span>
                  {[1, 2, 3].map((i) => (
                    <input key={i} type="checkbox" disabled={ro} aria-label={`${k === 'success' ? 'Successo' : 'Fallimento'} ${i}`} checked={d.death_saves[k] >= i}
                      onChange={(e) => patch(['death_saves', k], e.target.checked ? i : i - 1)} />
                  ))}
                </div>
              ))}
          </div>

          <div className="cl-box">
            <h3 className="cl-h">Attacchi e incantesimi</h3>
            {d.attacks.map((a, i) => (
              <details key={a.id} className="cl-feature">
                <summary className="cl-atk">
                  <span>{a.name || 'Senza nome'}</span>
                  <b className="cl-val">{a.tohit ? formatMod(attackBonus(d, a)) : '—'}</b>
                  <span className="muted small">{[a.damage, a.range].filter(Boolean).join(' · ')}</span>
                </summary>
                <div className="cl-item-head">{F('Nome', ['attacks', String(i), 'name'], a.name)}<Togli k="attacks" id={a.id} nome={a.name} /></div>
                <div className="cl-item-body">
                  <label className="cl-check"><input type="checkbox" disabled={ro} checked={a.tohit} onChange={(e) => patch(['attacks', String(i), 'tohit'], e.target.checked)} /> Tiro per colpire</label>
                  <label className="cl-check"><input type="checkbox" disabled={ro} checked={a.prof} onChange={(e) => patch(['attacks', String(i), 'prof'], e.target.checked)} /> Competente</label>
                  <label className="sf"><span className="sf-label">Caratteristica</span>
                    <select disabled={ro} value={a.ability ?? ''} onChange={(e) => patch(['attacks', String(i), 'ability'], (e.target.value || null) as Ability | null)}>
                      <option value="">Nessuna</option>
                      {ABILITIES.map((x) => <option key={x.key} value={x.key}>{x.nome}</option>)}
                    </select>
                  </label>
                  {N('Bonus extra', ['attacks', String(i), 'bonus'], a.bonus, -20, 20)}
                  {F('Danno e tipo', ['attacks', String(i), 'damage'], a.damage)}
                  {F('Gittata', ['attacks', String(i), 'range'], a.range)}
                </div>
              </details>
            ))}
            <Aggiungi testo="Attacco" onClick={() => lista('attacks', [...d.attacks, { id: newId(), name: 'Nuovo attacco', tohit: true, ability: 'str', prof: true, bonus: 0, damage: '', range: '' }])} />
          </div>

          <div className="cl-box">
            <h3 className="cl-h">Equipaggiamento</h3>
            <div className="cl-coins">
              {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((c) => <span key={c}>{N({ cp: 'MR', sp: 'MA', ep: 'ME', gp: 'MO', pp: 'MP' }[c], ['coins', c], d.coins[c], 0, 999999)}</span>)}
            </div>
            {d.items.map((x, i) => (
              <div key={x.id} className="cl-item-head cl-inv">
                <input type="checkbox" disabled={ro} checked={x.equipped} aria-label={`${x.name} equipaggiato`} onChange={(e) => patch(['items', String(i), 'equipped'], e.target.checked)} />
                {F('Oggetto', ['items', String(i), 'name'], x.name, { hideLabel: true })}
                {N(`Quantità di ${x.name}`, ['items', String(i), 'qty'], x.qty, 0, 9999, { hideLabel: true, className: 'sf-tiny' })}
                <Togli k="items" id={x.id} nome={x.name} />
              </div>
            ))}
            <Aggiungi testo="Oggetto" onClick={() => lista('items', [...d.items, { id: newId(), name: 'Nuovo oggetto', qty: 1, weight: '', equipped: false, notes: '' }])} />
          </div>
        </div>

        {/* Colonna destra: personalità e privilegi */}
        <div className="cl-col">
          <div className="cl-box">
            {F('Tratti della personalità', ['traits'], d.traits, { type: 'area' })}
            {F('Ideali', ['ideals'], d.ideals, { type: 'area' })}
            {F('Legami', ['bonds'], d.bonds, { type: 'area' })}
            {F('Difetti', ['flaws'], d.flaws, { type: 'area' })}
          </div>
          <div className="cl-box">
            <h3 className="cl-h">Privilegi e tratti</h3>
            {d.features.map((f, i) => (
              <details key={f.id} className="cl-feature">
                <summary>{f.name || 'Senza nome'}{f.source && <span className="muted small"> · {f.source}</span>}</summary>
                <div className="cl-item-head">
                  {F('Nome', ['features', String(i), 'name'], f.name)}
                  <Togli k="features" id={f.id} nome={f.name} />
                </div>
                {F('Fonte', ['features', String(i), 'source'], f.source)}
                {F('Descrizione', ['features', String(i), 'text'], f.text, { type: 'area' })}
              </details>
            ))}
            <Aggiungi testo="Privilegio" onClick={() => lista('features', [...d.features, { id: newId(), name: 'Nuovo privilegio', source: '', text: '' }])} />
          </div>
          <div className="cl-box">
            <h3 className="cl-h">Risorse</h3>
            {d.resources.map((r, i) => (
              <div key={r.id} className="cl-item">
                <div className="cl-item-head">{F('Nome', ['resources', String(i), 'name'], r.name)}<Togli k="resources" id={r.id} nome={r.name} /></div>
                <div className="cl-trio">
                  {N('Attuali', ['resources', String(i), 'current'], r.current, 0, 999)}
                  {N('Massimo', ['resources', String(i), 'max'], r.max, 0, 999)}
                  {F('Si ricarica', ['resources', String(i), 'reset'], r.reset)}
                </div>
              </div>
            ))}
            <Aggiungi testo="Risorsa" onClick={() => lista('resources', [...d.resources, { id: newId(), name: 'Nuova risorsa', current: 1, max: 1, reset: 'riposo lungo' }])} />
          </div>
        </div>
      </div>

      {/* Incantesimi */}
      <section className="cl-box" aria-labelledby="cl-inc">
        <h3 className="cl-h" id="cl-inc">Incantesimi</h3>
        <div className="cl-spellhead">
          <label className="sf"><span className="sf-label">Caratteristica da incantatore</span>
            <select disabled={ro} value={d.spellcasting.ability ?? ''} onChange={(e) => patch(['spellcasting', 'ability'], e.target.value || null)}>
              <option value="">Nessuna</option>
              {ABILITIES.map((x) => <option key={x.key} value={x.key}>{x.nome}</option>)}
            </select>
          </label>
          <div className="sf"><span className="sf-label">CD del tiro salvezza</span><b className="cl-big">{spellDc(d) ?? '—'}</b></div>
          <div className="sf"><span className="sf-label">Bonus d'attacco</span><b className="cl-big">{spellAttack(d) != null ? formatMod(spellAttack(d)!) : '—'}</b></div>
          {N('Bonus extra', ['spellcasting', 'bonus'], d.spellcasting.bonus, -20, 20)}
        </div>
        <p className="muted small cl-slot-legend">Slot per livello: in alto i totali, sotto quelli usati.</p>
        <div className="cl-slots">
          {LIVELLI.map((l) => {
            const s = d.slots[l] ?? { max: 0, used: 0 }
            return (
              <div key={l} className="cl-slot">
                <span className="cl-abil-name">{l}°</span>
                {N(`Slot di ${l}° livello totali`, ['slots', l], s.max, 0, 9, { hideLabel: true, onSave: (v) => patch(['slots', l], { max: Number(v), used: Math.min(s.used, Number(v)) }) })}
                {N(`Slot di ${l}° livello usati`, ['slots', l], s.used, 0, s.max, { hideLabel: true, onSave: (v) => patch(['slots', l], { ...s, used: Number(v) }) })}
              </div>
            )
          })}
        </div>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((l) => d.spells.some((s) => s.level === l)).map((l) => (
          <div key={l} className="spell-level">
            <p className="eyebrow">{l === 0 ? 'Trucchetti' : `${l}° livello`}</p>
            {d.spells.map((s, i) => s.level !== l ? null : (
              <details key={s.id} className="cl-feature">
                <summary>
                  {s.name || 'Senza nome'}{s.concentration && <span className="tag"> C</span>}{s.ritual && <span className="tag"> R</span>}
                  {!s.prepared && <span className="muted small"> · non preparato</span>}
                </summary>
                <div className="cl-item-head">{F('Nome', ['spells', String(i), 'name'], s.name)}<Togli k="spells" id={s.id} nome={s.name} /></div>
                <div className="cl-item-body">
                  {N('Livello', ['spells', String(i), 'level'], s.level, 0, 9)}
                  <label className="cl-check"><input type="checkbox" disabled={ro} checked={s.prepared} onChange={(e) => patch(['spells', String(i), 'prepared'], e.target.checked)} /> Preparato</label>
                  <label className="cl-check"><input type="checkbox" disabled={ro} checked={s.concentration} onChange={(e) => patch(['spells', String(i), 'concentration'], e.target.checked)} /> Concentrazione</label>
                  <label className="cl-check"><input type="checkbox" disabled={ro} checked={s.ritual} onChange={(e) => patch(['spells', String(i), 'ritual'], e.target.checked)} /> Rituale</label>
                  {F('Scuola', ['spells', String(i), 'school'], s.school)}
                  {F('Tempo di lancio', ['spells', String(i), 'casting_time'], s.casting_time)}
                  {F('Gittata', ['spells', String(i), 'range'], s.range)}
                  {F('Componenti', ['spells', String(i), 'components'], s.components)}
                  {F('Durata', ['spells', String(i), 'duration'], s.duration)}
                </div>
                {F('Descrizione', ['spells', String(i), 'description'], s.description, { type: 'area' })}
              </details>
            ))}
          </div>
        ))}
        <Aggiungi testo="Incantesimo" onClick={() => lista('spells', [...d.spells, { id: newId(), name: 'Nuovo incantesimo', level: 1, prepared: true, school: '', casting_time: '1 azione', range: '', components: '', duration: '', concentration: false, ritual: false, description: '' }])} />
      </section>

      {/* Aspetto, storia, note */}
      <section className="cl-box" aria-label="Aspetto e storia">
        <div className="cl-details">
          {(['age', 'height', 'weight', 'eyes', 'skin', 'hair', 'size'] as const).map((k) =>
            <span key={k}>{F({ age: 'Età', height: 'Altezza', weight: 'Peso', eyes: 'Occhi', skin: 'Carnagione', hair: 'Capelli', size: 'Taglia' }[k], ['details', k], d.details[k])}</span>,
          )}
        </div>
        {F('Aspetto', ['appearance'], d.appearance, { type: 'area' })}
        {F('Storia del personaggio', ['backstory'], d.backstory, { type: 'area', className: 'sf-long' })}
        {F('Note', ['notes'], d.notes, { type: 'area' })}
      </section>

      {d.notes_import.length > 0 && (
        <section className="cl-box" aria-labelledby="cl-imp">
          <div className="cl-item-head">
            <h3 className="cl-h" id="cl-imp">Note importate da Roll20</h3>
            {canEdit && <button type="button" className="link-btn" onClick={() => confirm('Svuotare le note importate?') && patch(['notes_import'], [])}>Svuota</button>}
          </div>
          <p className="muted small">Dati del file Roll20 che la scheda non sa ancora rappresentare: restano qui per non perderli.</p>
          <ul className="cl-imp">
            {d.notes_import.map((n, i) => <li key={i}><span>{n.name}</span><b>{n.current}{n.max && ` / ${n.max}`}</b></li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
