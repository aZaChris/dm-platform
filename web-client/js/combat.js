// Combat Tracker Web Module
class CombatModule {
  constructor() {
    this.currentCampaignId = null;
    this.combat = null;
  }

  async open(campaignId) {
    this.currentCampaignId = campaignId;
    try { const p = await api.getCampaignPermissions(campaignId); this.perms = p.success ? p.data : { role: 'PLAYER' }; } catch(_) { this.perms = { role: 'PLAYER' }; }
    await this.loadCombat();
    this.showModal();
  }

  async loadCombat() {
    try {
      const res = await api.getCombatsByCampaign(this.currentCampaignId);
      const list = res.success ? res.data : [];
      this.combat = Array.isArray(list) && list.length ? list[0] : null;
      if (!this.combat) {
        const created = await api.createCombat(this.currentCampaignId, 'Encounter');
        this.combat = created.success ? created.data : null;
      }
    } catch {
      this.combat = null;
    }
  }

  showModal() {
    const isActive = !!(this.combat && this.combat.isActive);
    const canManage = !!(this.perms && (this.perms.role==='OWNER' || this.perms.role==='DM' || this.perms.canManageCombat));
    // Sorting participants: default by initiative desc, fallback by order
    const sortKey = this._sortKey || 'initiative';
    const sortDir = this._sortDir || 'desc';
    const participants = (this.combat?.participants || []).slice().sort((a,b)=>{
      const av = (sortKey==='initiative' ? (a.initiative ?? -Infinity) : (a.order ?? 0));
      const bv = (sortKey==='initiative' ? (b.initiative ?? -Infinity) : (b.order ?? 0));
      return sortDir==='desc' ? (bv - av) : (av - bv);
    });
    const header = `<div class="combat-header">
      <h3 style="margin:0">Combat Tracker</h3>
      ${this.combat? `<span class=\"badge badge-round\">Round ${this.combat.round} • Turn ${this.combat.currentTurn+1}</span>`: ''}
      <span class="badge badge-info">Campaign: ${this.currentCampaignId}</span>
    </div>`;
    const controls = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;align-items:center">
        ${canManage && !isActive ? '<button class="btn btn-primary" id="cb-start">Start Combat</button>' : ''}
        ${canManage && isActive ? '<button class="btn" id="cb-next">Next Turn</button>' : ''}
        ${canManage && isActive ? '<button class="btn btn-outline" id="cb-end">End Combat</button>' : ''}
        ${canManage ? '<button class="btn btn-outline" id="cb-add">Add Participant</button>' : ''}
        ${canManage ? '<button class="btn btn-outline" id="cb-apply-init-order" title="Set order by current initiative">Apply Init → Order</button>' : ''}
        <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
          <span style="font-size:12px;color:#666">Dice:</span>
          <input id="die-count" type="number" min="1" value="1" title="Count" style="width:56px;padding:8px;border:1px solid #e1e5e9;border-radius:6px" />
          ${[20,12,10,8,6,4].map(s=>`<button class=\"btn btn-outline\" data-die=\"d${s}\">d${s}</button>`).join('')}
          <button class="btn btn-outline" id="die-adv" title="Advantage">Adv</button>
          <button class="btn btn-outline" id="die-dis" title="Disadvantage">Dis</button>
          <input id="die-custom" type="text" placeholder="e.g. 2d6+3" style="width:120px;padding:8px;border:1px solid #e1e5e9;border-radius:6px" />
          <button class="btn" id="die-roll">Roll</button>
          <button class="btn btn-outline" id="die-clear" title="Clear log">Clear</button>
        </div>
      </div>
      <div id="dice-results" style="font-size:13px;color:#333;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:8px;max-height:120px;overflow:auto"></div>`;
    const table = `
      <div style="overflow:auto;max-height:50vh;border:1px solid #eee;border-radius:8px">
        <table class="combat-table">
          <thead>
            <tr style="background:#fafafa">
              <th style="text-align:left;padding:8px">#</th>
              <th style="text-align:left;padding:8px">Name</th>
              <th style="text-align:left;padding:8px">Type</th>
              <th style="text-align:right;padding:8px;cursor:pointer" id="cb-sort-init" title="Sort by initiative">Init ${sortKey==='initiative' ? (sortDir==='desc'?'▼':'▲') : ''}</th>
              <th style="text-align:right;padding:8px;cursor:pointer" id="cb-sort-order" title="Sort by order">Order ${sortKey==='order' ? (sortDir==='desc'?'▼':'▲') : ''}</th>
              <th style="text-align:right;padding:8px">HP</th>
              <th style="text-align:right;padding:8px">AC</th>
              <th style="text-align:left;padding:8px">Conditions</th>
              <th style="text-align:right;padding:8px">Actions</th>
            </tr>
          </thead>
          <tbody id="cb-body">
            ${participants.map((p,idx)=>`
              <tr class="combat-row ${this.combat?.currentTurn===idx?'active':''}" draggable="true" data-id="${p.id}">
                <td style="padding:8px">${idx+1}${this.combat?.currentTurn===idx?' ▶':''}</td>
                <td style="padding:8px">${this.escape(p.name)}</td>
                <td style="padding:8px">${this.escape(p.type||'')}</td>
                <td style="padding:8px;text-align:right">${p.initiative??''}</td>
                <td style="padding:8px;text-align:right">${p.order??''}</td>
                <td style="padding:8px;text-align:right;">
                  <div style="display:flex;gap:6px;align-items:center;justify-content:flex-end">
                    ${canManage ? `<div style="display:flex;gap:4px">
                      <button class="btn btn-outline" data-hp-delta="-5" data-id="${p.id}">-5</button>
                      <button class="btn btn-outline" data-hp-delta="-1" data-id="${p.id}">-1</button>
                      <button class="btn btn-outline" data-hp-delta="+1" data-id="${p.id}">+1</button>
                      <button class="btn btn-outline" data-hp-delta="+5" data-id="${p.id}">+5</button>
                    </div>` : ''}
                    <div style="min-width:110px;text-align:right">
                      <input ${canManage?'':'disabled'} data-id="${p.id}" data-field="hp" type="number" value="${p.hp??''}" style="width:72px${(p.maxHp>0 && p.hp/p.maxHp<=0.25)?';border-color:#dc2626;background:#fef2f2':''}" />
                      / ${p.maxHp??''}
                    </div>
                  </div>
                </td>
                <td style="padding:8px;text-align:right"><input ${canManage?'':'disabled'} data-id="${p.id}" data-field="ac" type="number" value="${p.ac??''}" style="width:56px" /></td>
                <td class="conditions-cell" style="padding:8px;min-width:220px">
                  <div class="chips" id="cond-${p.id}" style="margin-bottom:6px"></div>
                  ${canManage ? `<div style=\"display:flex;gap:6px;flex-wrap:wrap\">
                    ${['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'].map(c=>`<button class=\\\"btn btn-outline\\\" data-cond-add=\\\"${p.id}\\\" data-cond=\\\"${c}\\\">${c}</button>`).join('')}
                  </div>` : ''}
                </td>
                <td style="padding:8px;text-align:right">
                  ${canManage ? `<button class=\"btn btn-outline\" data-action=\"save\" data-id=\"${p.id}\">Save</button>` : ''}
                  ${canManage ? `<button class=\"btn btn-outline\" data-action=\"edit\" data-id=\"${p.id}\">Edit</button>` : ''}
                  ${canManage ? `<button class=\"btn btn-outline\" data-action=\"remove\" data-id=\"${p.id}\">Remove</button>` : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    const html = `<div style="position:relative;padding:24px;max-width:900px">
      ${header}
      ${controls}
      ${this.combat? `<div style="margin:4px 0;color:#666">Round ${this.combat.round} • Turn ${this.combat.currentTurn+1}</div>` : ''}
      ${table}
      <div style="margin-top:16px;text-align:right"><button class="btn btn-outline modal-close">Close</button></div>
    </div>`;
    app.modules.ui?.showModal(html);

    // bind actions
    document.getElementById('cb-sort-init')?.addEventListener('click', ()=>{
      this._sortKey = 'initiative';
      this._sortDir = this._sortDir==='desc' ? 'asc' : 'desc';
      this.showModal();
    });
    document.getElementById('cb-sort-order')?.addEventListener('click', ()=>{
      this._sortKey = 'order';
      this._sortDir = this._sortDir==='desc' ? 'asc' : 'desc';
      this.showModal();
    });
    document.getElementById('cb-start')?.addEventListener('click', ()=> this.start());
    document.getElementById('cb-next')?.addEventListener('click', ()=> this.next());
    document.getElementById('cb-end')?.addEventListener('click', ()=> this.end());
    document.getElementById('cb-add')?.addEventListener('click', ()=> this.addParticipant());
    document.getElementById('cb-apply-init-order')?.addEventListener('click', ()=> this.applyInitiativeOrder());
    document.querySelectorAll('button[data-action="save"]').forEach(btn=>btn.addEventListener('click', (e)=> this.saveParticipant(e.currentTarget.getAttribute('data-id'))));
    document.querySelectorAll('button[data-action="remove"]').forEach(btn=>btn.addEventListener('click', (e)=> this.removeParticipant(e.currentTarget.getAttribute('data-id'))));
    document.querySelectorAll('button[data-action="edit"]').forEach(btn=>btn.addEventListener('click', (e)=> this.openEditParticipant(e.currentTarget.getAttribute('data-id'))));

    // quick HP deltas
    document.querySelectorAll('button[data-hp-delta]')?.forEach(btn=>btn.addEventListener('click', async (e)=>{
      const id = e.currentTarget.getAttribute('data-id');
      const delta = Number(e.currentTarget.getAttribute('data-hp-delta')) || 0;
      if (!id || !delta) return;
      const input = document.querySelector(`input[data-id="${id}"][data-field="hp"]`);
      const current = input && 'value' in input ? Number(input.value||0) : 0;
      const next = current + delta;
      if (input) input.value = String(next);
      try { await this.saveParticipant(id); } catch {}
    }));

    // Drag & Drop reordering
    const tbody = document.getElementById('cb-body');
    let dragEl = null;
    const onDragStart = (e) => {
      dragEl = e.currentTarget;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragEl.getAttribute('data-id'));
      dragEl.classList.add('dragging');
    };
    const onDragOver = (e) => {
      e.preventDefault();
      if (!tbody) return;
      const afterEl = getDragAfterElement(tbody, e.clientY);
      const cur = document.querySelector('tr.dragging');
      if (!cur) return;
      if (afterEl == null) tbody.appendChild(cur); else tbody.insertBefore(cur, afterEl);
    };
    const onDrop = async () => {
      const rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
      // Persist order by new index
      for (let i = 0; i < rows.length; i++) {
        const pid = rows[i].getAttribute('data-id');
        const p = (this.combat?.participants||[]).find(x=>String(x.id)===String(pid));
        if (pid && p && p.order !== i) {
          try { await api.updateParticipant(pid, { order: i }); } catch {}
        }
      }
      await this.loadCombat();
      this._sortKey = 'order';
      this._sortDir = 'asc';
      this.showModal();
    };
    const onDragEnd = () => { const cur = document.querySelector('tr.dragging'); if (cur) cur.classList.remove('dragging'); };
    const getDragAfterElement = (container, y) => {
      const els = [...container.querySelectorAll('tr[data-id]:not(.dragging)')];
      return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        else return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    };
    document.querySelectorAll('tr[draggable="true"]').forEach(row=>{
      row.addEventListener('dragstart', onDragStart);
      row.addEventListener('dragend', onDragEnd);
    });
    tbody?.addEventListener('dragover', onDragOver);
    tbody?.addEventListener('drop', onDrop);

    // Dice roller
    const log = (text) => {
      const box = document.getElementById('dice-results');
      if (!box) return;
      const time = new Date().toLocaleTimeString();
      box.innerHTML = `<div><strong>[${time}]</strong> ${this.escape(text)}</div>` + box.innerHTML;
    };
    const roll = (count, sides, bonus=0, mode='normal') => {
      let rolls = [];
      if (sides === 20 && (mode === 'adv' || mode === 'dis')) {
        rolls = Array.from({length: count}, ()=> {
          const a = 1 + Math.floor(Math.random()*20);
          const b = 1 + Math.floor(Math.random()*20);
          return mode === 'adv' ? Math.max(a,b) : Math.min(a,b);
        });
        const total = rolls.reduce((a,b)=>a+b,0) + bonus;
        log(`Roll ${count}d20 ${mode==='adv'?'(Adv)':'(Dis)'}${bonus? (bonus>0?`+${bonus}`:`${bonus}`):''}: [${rolls.join(', ')}] ${bonus?` ${bonus>0?'+':''}${bonus}`:''} = ${total}`);
        return { rolls, total };
      }
      rolls = Array.from({length: count}, ()=> 1 + Math.floor(Math.random()*sides));
      const total = rolls.reduce((a,b)=>a+b,0) + bonus;
      log(`Roll ${count}d${sides}${bonus? (bonus>0?`+${bonus}`:`${bonus}`):''}: [${rolls.join(', ')}] ${bonus?` ${bonus>0?'+':''}${bonus}`:''} = ${total}`);
      return { rolls, total };
    };
    document.querySelectorAll('[data-die]')?.forEach(btn=>btn.addEventListener('click', (e)=>{
      const d = String(e.currentTarget.getAttribute('data-die')||'').slice(1);
      const sides = Number(d)||20;
      const cntEl = document.getElementById('die-count');
      const count = Math.max(1, Number((cntEl&&'value' in cntEl)? cntEl.value : 1) || 1);
      const isAdv = document.getElementById('die-adv')?.classList.contains('active');
      const isDis = document.getElementById('die-dis')?.classList.contains('active');
      const mode = isAdv? 'adv' : (isDis? 'dis' : 'normal');
      roll(count, sides, 0, mode);
    }));
    document.getElementById('die-roll')?.addEventListener('click', ()=>{
      const expr = (document.getElementById('die-custom')||{}).value || '';
      const m = String(expr).trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);
      if (!m) { log(`Invalid expression: ${expr}`); return; }
      const count = Number(m[1]||'1');
      const sides = Number(m[2]);
      const bonus = m[3]? Number(m[3]) : 0;
      const isAdv = (sides===20) && document.getElementById('die-adv')?.classList.contains('active');
      const isDis = (sides===20) && document.getElementById('die-dis')?.classList.contains('active');
      const mode = isAdv? 'adv' : (isDis? 'dis' : 'normal');
      roll(count, sides, bonus, mode);
    });
    document.getElementById('die-adv')?.addEventListener('click', (e)=>{
      e.currentTarget.classList.toggle('active');
      if (e.currentTarget.classList.contains('active')) document.getElementById('die-dis')?.classList.remove('active');
    });
    document.getElementById('die-dis')?.addEventListener('click', (e)=>{
      e.currentTarget.classList.toggle('active');
      if (e.currentTarget.classList.contains('active')) document.getElementById('die-adv')?.classList.remove('active');
    });
    document.getElementById('die-clear')?.addEventListener('click', ()=>{
      const box = document.getElementById('dice-results'); if (box) box.innerHTML='';
    });

    // Conditions UI (client-side only for now)
    this._conditions = this._conditions || {};
    document.querySelectorAll('[data-cond-add]')?.forEach(btn=>btn.addEventListener('click', (e)=>{
      const pid = e.currentTarget.getAttribute('data-cond-add');
      const cond = e.currentTarget.getAttribute('data-cond');
      if (!pid || !cond) return;
      if (!this._conditions[pid]) this._conditions[pid] = new Set();
      if (this._conditions[pid].has(cond)) this._conditions[pid].delete(cond); else this._conditions[pid].add(cond);
      const wrap = document.getElementById(`cond-${pid}`);
      if (wrap) {
        const arr = Array.from(this._conditions[pid]);
        wrap.innerHTML = arr.length? arr.map(c=>`<span class=\"chip\"><span class=\"dot\"></span> ${this.escape(c)}</span>`).join('') : '<span style="color:#888;font-size:12px">No conditions</span>';
      }
    }));
  }

  async start() {
    try {
      await api.startCombatById(this.combat.id);
      await this.loadCombat();
      this.showModal();
      app.showMessage('Combat started', 'success');
    } catch (e) { app.showMessage(e.message||'Failed to start combat','error'); }
  }

  async next() {
    try {
      await api.nextTurn(this.combat.id);
      await this.loadCombat();
      this.showModal();
    } catch (e) { app.showMessage(e.message||'Failed to advance turn','error'); }
  }

  async end() {
    try { await api.endCombatById(this.combat.id); await this.loadCombat(); this.showModal(); app.showMessage('Combat ended','success'); }
    catch (e) { app.showMessage(e.message||'Failed to end combat','error'); }
  }

  async addParticipant() {
    const html = `
      <div style="position:relative;padding:24px;max-width:520px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">Add Participant</h3>
          <button class="btn btn-outline modal-close">Close</button>
        </div>
        <form id="cb-add-form" style="display:grid;gap:10px">
          <label style="display:grid;gap:6px">
            <span>Name</span>
            <input type="text" id="cb-name" placeholder="e.g. Goblin" required style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
          </label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            <label style="display:grid;gap:6px">
              <span>Initiative</span>
              <input type="number" id="cb-init" value="0" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
            </label>
            <label style="display:grid;gap:6px">
              <span>HP</span>
              <input type="number" id="cb-hp" value="10" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
            </label>
            <label style="display:grid;gap:6px">
              <span>AC</span>
              <input type="number" id="cb-ac" value="10" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
            </label>
          </div>
          <label style="display:grid;gap:6px">
            <span>Type</span>
            <select id="cb-type" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px">
              <option value="npc">NPC</option>
              <option value="character">Character</option>
              <option value="monster">Monster</option>
            </select>
          </label>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
            <button type="button" class="btn btn-outline modal-close">Cancel</button>
            <button type="submit" class="btn btn-primary" id="cb-submit">Add</button>
          </div>
        </form>
      </div>`;
    app.modules.ui?.showModal(html);
    const form = document.getElementById('cb-add-form');
    const submitBtn = document.getElementById('cb-submit');
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const nameEl = document.getElementById('cb-name');
      const initEl = document.getElementById('cb-init');
      const hpEl = document.getElementById('cb-hp');
      const acEl = document.getElementById('cb-ac');
      const typeEl = document.getElementById('cb-type');
      const name = nameEl && 'value' in nameEl ? String(nameEl.value).trim() : '';
      const initiative = initEl && 'value' in initEl ? Number(initEl.value||0) : 0;
      const hp = hpEl && 'value' in hpEl ? Number(hpEl.value||0) : 0;
      const ac = acEl && 'value' in acEl ? Number(acEl.value||10) : 10;
      const type = typeEl && 'value' in typeEl ? String(typeEl.value||'npc') : 'npc';
      if (!name) { app.showMessage('Name is required', 'error'); return; }
      try {
        if (submitBtn) { submitBtn.disabled = true; const prev = submitBtn.innerHTML; submitBtn.dataset.prev = prev; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving'; }
        await api.addParticipant(this.combat.id, { name, initiative, hp, maxHp: hp, ac, type });
        await this.loadCombat();
        app.modules.ui?.hideModal();
        this.showModal();
        app.showMessage('Participant added', 'success');
      } catch (err) { app.showMessage(err.message||'Failed to add participant','error'); }
      finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitBtn.dataset.prev || 'Add'; } }
    });
  }

  openEditParticipant(id) {
    const p = (this.combat?.participants || []).find(x => String(x.id) === String(id));
    if (!p) { app.showMessage('Participant not found','error'); return; }
    const html = `
      <div style="position:relative;padding:24px;max-width:520px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">Edit Participant</h3>
          <button class="btn btn-outline modal-close">Close</button>
        </div>
        <form id="cb-edit-form" style="display:grid;gap:10px">
          <label style="display:grid;gap:6px">
            <span>Name</span>
            <input type="text" id="cb-e-name" value="${this.escape(p.name||'')}" required style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
          </label>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
            <label style="display:grid;gap:6px">
              <span>Initiative</span>
              <input type="number" id="cb-e-init" value="${Number(p.initiative||0)}" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
            </label>
            <label style="display:grid;gap:6px">
              <span>HP</span>
              <input type="number" id="cb-e-hp" value="${Number(p.hp||0)}" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
            </label>
            <label style="display:grid;gap:6px">
              <span>Max HP</span>
              <input type="number" id="cb-e-maxhp" value="${Number(p.maxHp||p.hp||0)}" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
            </label>
            <label style="display:grid;gap:6px">
              <span>AC</span>
              <input type="number" id="cb-e-ac" value="${Number(p.ac||10)}" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
            </label>
          </div>
          <label style="display:grid;gap:6px">
            <span>Type</span>
            <select id="cb-e-type" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px">
              ${['npc','character','monster'].map(t=>`<option value="${t}" ${String(p.type||'npc')===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </label>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
            <button type="button" class="btn btn-outline modal-close">Cancel</button>
            <button type="submit" class="btn btn-primary" id="cb-e-submit">Save</button>
          </div>
        </form>
      </div>`;
    app.modules.ui?.showModal(html);
    const form = document.getElementById('cb-edit-form');
    const submitBtn = document.getElementById('cb-e-submit');
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const nameEl = document.getElementById('cb-e-name');
      const initEl = document.getElementById('cb-e-init');
      const hpEl = document.getElementById('cb-e-hp');
      const maxEl = document.getElementById('cb-e-maxhp');
      const acEl = document.getElementById('cb-e-ac');
      const typeEl = document.getElementById('cb-e-type');
      const payload = {
        name: nameEl && 'value' in nameEl ? String(nameEl.value).trim() : p.name,
        initiative: initEl && 'value' in initEl ? Number(initEl.value||0) : p.initiative,
        hp: hpEl && 'value' in hpEl ? Number(hpEl.value||0) : p.hp,
        maxHp: maxEl && 'value' in maxEl ? Number(maxEl.value||0) : (p.maxHp||p.hp||0),
        ac: acEl && 'value' in acEl ? Number(acEl.value||10) : p.ac,
        type: typeEl && 'value' in typeEl ? String(typeEl.value||p.type||'npc') : (p.type||'npc')
      };
      if (!payload.name) { app.showMessage('Name is required','error'); return; }
      try {
        if (submitBtn) { submitBtn.disabled = true; const prev = submitBtn.innerHTML; submitBtn.dataset.prev = prev; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving'; }
        await api.updateParticipant(id, payload);
        await this.loadCombat();
        app.modules.ui?.hideModal();
        this.showModal();
        app.showMessage('Participant updated','success');
      } catch (err) { app.showMessage(err.message||'Failed to update participant','error'); }
      finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitBtn.dataset.prev || 'Save'; } }
    });
  }

  async saveParticipant(id) {
    try {
      const hpInput = document.querySelector(`input[data-id="${id}"][data-field="hp"]`);
      const acInput = document.querySelector(`input[data-id="${id}"][data-field="ac"]`);
      const hp = hpInput && 'value' in hpInput ? Number(hpInput.value) : undefined;
      const ac = acInput && 'value' in acInput ? Number(acInput.value) : undefined;
      const conditions = Array.from((this._conditions && this._conditions[id]) ? this._conditions[id] : []);
      await api.updateParticipant(id, { hp, ac, conditions });
      await this.loadCombat();
      this.showModal();
    } catch (e) { app.showMessage(e.message||'Failed to save participant','error'); }
  }

  async removeParticipant(id) {
    try {
      await api.removeParticipant(id);
      await this.loadCombat();
      this.showModal();
    } catch (e) { app.showMessage(e.message||'Failed to remove participant','error'); }
  }

  async applyInitiativeOrder() {
    try {
      if (!this.combat || !Array.isArray(this.combat.participants)) return;
      // Compute new orders by current initiative (desc), stable by previous order
      const sorted = this.combat.participants.slice().sort((a,b)=>{
        const ai = a.initiative ?? -Infinity;
        const bi = b.initiative ?? -Infinity;
        if (bi !== ai) return bi - ai;
        return (a.order ?? 0) - (b.order ?? 0);
      });
      // Persist sequential order starting from 0
      for (let index = 0; index < sorted.length; index++) {
        const p = sorted[index];
        const newOrder = index;
        if (p.order !== newOrder) {
          await api.updateParticipant(p.id, { order: newOrder });
        }
      }
      await this.loadCombat();
      this._sortKey = 'order';
      this._sortDir = 'asc';
      this.showModal();
      app.showMessage('Ordine applicato in base all\'iniziativa','success');
    } catch (e) {
      app.showMessage(e.message || 'Failed to apply initiative order','error');
    }
  }

  escape(str) { return String(str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
}

window.Combat = new CombatModule();


