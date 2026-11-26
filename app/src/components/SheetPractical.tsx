import { useState } from 'react'
import {
  ABILITIES, SKILLS, abilityMod, applyHp, attackBonus, classLabel, formatMod, initiative, passivePerception,
  profBonus, saveBonus, setTempHp, skillBonus, spellAttack, spellDc, totalLevel, type CharacterData, type SlotLevel,
} from '../lib/character'
import { SheetField } from './SheetField'

type Props = {
  data: CharacterData
  canEdit: boolean
  patch: (path: string[], value: unknown) => void
  roll: (label: string, modifier: number) => void
}

const PROF_SEGNO = ['○', '●', '◆'] as const
const PROF_NOME = ['nessuna competenza', 'competenza', 'maestria'] as const

// Vista pratica: quello che serve al tavolo, con i tiri a un clic. Modificabile solo per proprietario e DM.
export function SheetPractical({ data: d, canEdit, patch, roll }: Props) {
  const [delta, setDelta] = useState('')
  const hpPct = Math.max(0, Math.min(100, (d.hp.current / Math.max(1, d.hp.max)) * 100))
  const dc = spellDc(d)
  const sa = spellAttack(d)
  const livelli = [...new Set(d.spells.map((s) => s.level))].sort((a, b) => a - b)
  const slotLivelli = (Object.keys(d.slots) as SlotLevel[]).filter((k) => (d.slots[k]?.max ?? 0) > 0).sort()

  // Un pulsante di tiro; senza permessi diventa un valore da leggere.
  const Tiro = ({ label, n, nome }: { label: string; n: number; nome?: string }) =>
    canEdit ? (
      <button type="button" className="roll-btn" onClick={() => roll(label, n)} aria-label={`Tira ${label} ${formatMod(n)}`}>
        <span>{nome ?? label}</span> <b>{formatMod(n)}</b>
      </button>
    ) : (
      <span className="roll-btn ro"><span>{nome ?? label}</span> <b>{formatMod(n)}</b></span>
    )

  function applica(tipo: 'danno' | 'cura' | 'temp') {
    const n = Math.abs(Math.round(Number(delta)))
    if (!n) return
    patch(['hp'], tipo === 'temp' ? setTempHp(d.hp, n) : applyHp(d.hp, tipo === 'danno' ? -n : n))
    setDelta('')
  }

  return (
    <div className="sheet sheet-practical">
      <header className="sheet-head">
        <p className="muted small">{classLabel(d)} · {d.race || 'Razza'} · Livello {totalLevel(d)} · Competenza {formatMod(profBonus(totalLevel(d)))}</p>
        {canEdit && (
          <div className="sheet-inline">
            <SheetField label="Classe" value={d.classes[0]?.name ?? ''} onSave={(v) => patch(['classes'], [{ name: String(v), subclass: d.classes[0]?.subclass ?? '', level: d.classes[0]?.level ?? 1 }, ...d.classes.slice(1)])} />
            <SheetField label="Livello" type="number" min={1} max={20} value={d.classes[0]?.level ?? 1} onSave={(v) => patch(['classes'], [{ name: d.classes[0]?.name ?? '', subclass: d.classes[0]?.subclass ?? '', level: Number(v) }, ...d.classes.slice(1)])} />
            <SheetField label="Razza" value={d.race} onSave={(v) => patch(['race'], v)} />
          </div>
        )}
      </header>

      <section className="sheet-top" aria-label="Combattimento">
        <div className={`hp-box ${d.hp.current === 0 ? 'down' : hpPct < 50 ? 'low' : ''}`}>
          <p className="eyebrow">Punti ferita</p>
          <p className="hp-num"><b>{d.hp.current}</b> / {d.hp.max}{d.hp.temp > 0 && <span className="hp-temp"> +{d.hp.temp} temp</span>}</p>
          <div className="hp-bar" aria-hidden="true"><i style={{ width: `${hpPct}%` }} /></div>
          {canEdit && (
            <div className="hp-ctrl">
              <input type="number" inputMode="numeric" min={0} value={delta} onChange={(e) => setDelta(e.target.value)} aria-label="Punti ferita da applicare" placeholder="0" onKeyDown={(e) => e.key === 'Enter' && applica('danno')} />
              <button type="button" onClick={() => applica('danno')}>Danno</button>
              <button type="button" onClick={() => applica('cura')}>Cura</button>
              <button type="button" onClick={() => applica('temp')}>Temp</button>
            </div>
          )}
          {canEdit && <SheetField label="PF massimi" type="number" min={1} max={999} value={d.hp.max} onSave={(v) => patch(['hp'], { ...d.hp, max: Number(v), current: Math.min(d.hp.current, Number(v)) })} className="sf-small" />}
        </div>
        <div className="stat-box"><p className="eyebrow">CA</p>{canEdit ? <SheetField label="Classe armatura" hideLabel type="number" min={0} max={40} value={d.ac} onSave={(v) => patch(['ac'], v)} className="sf-big" /> : <b className="stat-num">{d.ac}</b>}</div>
        <div className="stat-box"><p className="eyebrow">Iniziativa</p><Tiro label="Iniziativa" n={initiative(d)} nome="d20" /></div>
        <div className="stat-box"><p className="eyebrow">Velocità</p>{canEdit ? <SheetField label="Velocità" hideLabel value={d.speed} onSave={(v) => patch(['speed'], v)} className="sf-big" /> : <b className="stat-num">{d.speed}</b>}</div>
        <div className="stat-box"><p className="eyebrow">Percezione passiva</p><b className="stat-num">{passivePerception(d)}</b></div>
      </section>

      {d.hp.current === 0 && (
        <section className="death" aria-label="Tiri salvezza contro la morte">
          {(['success', 'fail'] as const).map((k) => (
            <div key={k} className="death-row">
              <span>{k === 'success' ? 'Successi' : 'Fallimenti'}</span>
              {[1, 2, 3].map((i) => (
                <input key={i} type="checkbox" disabled={!canEdit} aria-label={`${k === 'success' ? 'Successo' : 'Fallimento'} ${i}`} checked={d.death_saves[k] >= i}
                  onChange={(e) => patch(['death_saves', k], e.target.checked ? i : i - 1)} />
              ))}
            </div>
          ))}
          {canEdit && <Tiro label="Tiro contro la morte" n={d.save_bonus_all} nome="Tira" />}
        </section>
      )}

      {d.resources.length > 0 && (
        <section aria-labelledby="ris-h">
          <h3 id="ris-h" className="side-h">Risorse</h3>
          <ul className="res-list">
            {d.resources.map((r, i) => (
              <li key={r.id}>
                <span className="res-name">{r.name}</span>
                {canEdit && <button type="button" className="icon-btn" aria-label={`Usa ${r.name}`} disabled={r.current <= 0} onClick={() => patch(['resources', String(i), 'current'], r.current - 1)}>−</button>}
                <b>{r.current}/{r.max}</b>
                {canEdit && <button type="button" className="icon-btn" aria-label={`Recupera ${r.name}`} disabled={r.current >= r.max} onClick={() => patch(['resources', String(i), 'current'], r.current + 1)}>+</button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="car-h">
        <h3 id="car-h" className="side-h">Caratteristiche e tiri salvezza</h3>
        <div className="abil-grid">
          {ABILITIES.map((a) => (
            <div key={a.key} className="abil">
              <p className="abil-name">{a.nome}</p>
              {canEdit ? <SheetField label={`Punteggio di ${a.nome}`} hideLabel type="number" min={1} max={30} value={d.abilities[a.key]} onSave={(v) => patch(['abilities', a.key], v)} className="sf-score" /> : <b className="abil-score">{d.abilities[a.key]}</b>}
              <Tiro label={`Prova di ${a.nome}`} n={abilityMod(d, a.key)} nome="Prova" />
              <div className="abil-save">
                {canEdit && (
                  <button type="button" className={`prof-dot ${d.saves[a.key]?.prof ? 'on' : ''}`} aria-pressed={!!d.saves[a.key]?.prof} aria-label={`Competenza nel tiro salvezza di ${a.nome}`}
                    onClick={() => patch(['saves', a.key], { prof: !d.saves[a.key]?.prof, bonus: d.saves[a.key]?.bonus ?? 0 })}>{d.saves[a.key]?.prof ? '●' : '○'}</button>
                )}
                <Tiro label={`Tiro salvezza su ${a.nome}`} n={saveBonus(d, a.key)} nome="TS" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="abi-h">
        <h3 id="abi-h" className="side-h">Abilità</h3>
        <ul className="skill-list">
          {SKILLS.map((s) => {
            const p = d.skills[s.key]?.prof ?? 0
            return (
              <li key={s.key}>
                {canEdit ? (
                  <button type="button" className={`prof-dot p${p}`} aria-label={`${s.nome}: ${PROF_NOME[p]}. Cambia`} title={PROF_NOME[p]}
                    onClick={() => patch(['skills', s.key], { prof: (p + 1) % 3, bonus: d.skills[s.key]?.bonus ?? 0 })}>{PROF_SEGNO[p]}</button>
                ) : <span className={`prof-dot p${p}`} title={PROF_NOME[p]} aria-label={PROF_NOME[p]}>{PROF_SEGNO[p]}</span>}
                <Tiro label={s.nome} n={skillBonus(d, s.key)} />
              </li>
            )
          })}
        </ul>
      </section>

      {d.attacks.length > 0 && (
        <section aria-labelledby="att-h">
          <h3 id="att-h" className="side-h">Attacchi</h3>
          <ul className="atk-list">
            {d.attacks.map((a) => (
              <li key={a.id}>
                {a.tohit ? <Tiro label={a.name} n={attackBonus(d, a)} /> : <span className="roll-btn ro"><span>{a.name}</span></span>}
                <span className="muted small">{[a.damage, a.range].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(slotLivelli.length > 0 || d.spells.length > 0) && (
        <section aria-labelledby="inc-h">
          <h3 id="inc-h" className="side-h">Incantesimi</h3>
          {dc != null && <p className="muted small">CD {dc} · {sa != null && <Tiro label="Attacco con incantesimo" n={sa} nome="Attacco" />}</p>}
          {slotLivelli.map((k) => {
            const s = d.slots[k]!
            return (
              <div key={k} className="slot-row">
                <span>{k}° livello</span>
                {Array.from({ length: s.max }, (_, i) => (
                  <input key={i} type="checkbox" disabled={!canEdit} aria-label={`Slot di ${k}° livello ${i + 1} usato`} checked={i < s.used}
                    onChange={(e) => patch(['slots', k], { ...s, used: e.target.checked ? i + 1 : i })} />
                ))}
                <span className="muted small">{s.max - s.used} liberi</span>
              </div>
            )
          })}
          {livelli.map((l) => (
            <div key={l} className="spell-level">
              <p className="eyebrow">{l === 0 ? 'Trucchetti' : `${l}° livello`}</p>
              {d.spells.filter((s) => s.level === l).map((s) => (
                <details key={s.id} className="spell">
                  <summary>{s.name}{s.concentration && <span className="tag"> C</span>}{s.ritual && <span className="tag"> R</span>}</summary>
                  <p className="muted small">{[s.school, s.casting_time, s.range, s.components, s.duration].filter(Boolean).join(' · ')}</p>
                  {s.description && <p className="spell-text">{s.description}</p>}
                </details>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
