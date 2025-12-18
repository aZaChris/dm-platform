// Characters Module
class CharactersModule {
    constructor() {
        this.section = document.getElementById('characters-section');
        this.grid = document.getElementById('characters-grid');
        this.createBtn = document.getElementById('create-character-btn');
        this.currentCampaignId = null;
        this.perms = { role: 'PLAYER' };
        this.bindEvents();
        this.refresh();
    }

    async ensurePerms(campaignId) {
        try { const p = await api.getCampaignPermissions(campaignId); if (p.success) this.perms = p.data; } catch(_) { this.perms = { role: 'PLAYER' }; }
    }

    bindEvents() {
        if (this.createBtn) {
            this.createBtn.addEventListener('click', async () => {
                const campId = (document.getElementById('current-campaign-id')||{}).value || this.currentCampaignId || '';
                if (campId) { await this.ensurePerms(campId); }
                const canManage = (this.perms.role==='OWNER' || this.perms.role==='DM' || !!this.perms.canManageCharacters);
                if (!canManage) { app.showMessage('Non hai i permessi per creare personaggi in questa campagna','error'); return; }
                const html = `
                    <div style="position:relative;padding:24px;max-width:520px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                            <h3 style="margin:0">New Character</h3>
                            <button class="btn btn-outline modal-close">Close</button>
                        </div>
                        <form id="create-character-form" style="display:grid;gap:10px">
                            <label style="display:grid;gap:6px">
                                <span>Name</span>
                                <input type="text" id="ch-name" placeholder="e.g. Arannis" required style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
                            </label>
                            <label style="display:grid;gap:6px">
                                <span>Campaign ID</span>
                                <input type="text" id="ch-campaign" placeholder="Required" required style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" value="${campId||''}" />
                            </label>
                            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
                                <button type="button" class="btn btn-outline modal-close">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="ch-submit">Create</button>
                            </div>
                        </form>
                    </div>`;
                app.modules.ui?.showModal(html);
                const form = document.getElementById('create-character-form');
                const submitBtn = document.getElementById('ch-submit');
                form?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const nameEl = document.getElementById('ch-name');
                    const campEl = document.getElementById('ch-campaign');
                    const name = nameEl && 'value' in nameEl ? String(nameEl.value).trim() : '';
                    const campaignId = campEl && 'value' in campEl ? String(campEl.value).trim() : '';
                    if (!name) { app.showMessage('Name is required', 'error'); return; }
                    if (!campaignId) { app.showMessage('Campaign ID is required', 'error'); return; }
                    try {
                        if (submitBtn) { submitBtn.disabled = true; const prev = submitBtn.innerHTML; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating'; }
                        const res = await api.createCharacter({ name, campaignId });
                        if (!res.success) throw new Error(res.error || 'Create failed');
                        app.modules.ui?.hideModal();
                        this.refresh();
                        app.showMessage('Character created', 'success');
                    } catch (err) { app.showMessage(err.message || 'Failed to create character', 'error'); }
                    finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Create'; } }
                });
            });
        }
    }

    async refresh() {
        if (!this.grid) return;
        this.grid.innerHTML = '<div class="loading">Loading characters...</div>';
        try {
            const res = await api.getCharacters();
            const characters = res.success ? res.data : [];
            this.renderList(characters);
        } catch (e) {
            this.grid.innerHTML = '<div class="error">Failed to load characters</div>';
        }
    }

    renderList(list) {
        if (!list || list.length === 0) {
            this.grid.innerHTML = '<div class="empty">No characters yet. Create one!</div>';
            return;
        }
        this.grid.innerHTML = list.map(x => this.renderCard(x)).join('');
        // attach actions
        this.grid.querySelectorAll('[data-action="details"]').forEach(btn => btn.addEventListener('click', (e) => this.openDetails(e.currentTarget.getAttribute('data-id'))));
        this.grid.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const ch = list.find(c=>String(c.id)===String(id));
            const campId = ch?.campaignId || this.currentCampaignId;
            if (campId) { await this.ensurePerms(campId); }
            const canManage = (this.perms.role==='OWNER' || this.perms.role==='DM' || !!this.perms.canManageCharacters);
            if (!canManage) { app.showMessage('Non hai i permessi per modificare questo personaggio','error'); return; }
            this.openEdit(e.currentTarget.getAttribute('data-id'))
        }));
        this.grid.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const ch = list.find(c=>String(c.id)===String(id));
            const campId = ch?.campaignId || this.currentCampaignId;
            if (campId) { await this.ensurePerms(campId); }
            const canManage = (this.perms.role==='OWNER' || this.perms.role==='DM' || !!this.perms.canManageCharacters);
            if (!canManage) { app.showMessage('Non hai i permessi per eliminare questo personaggio','error'); return; }
            if (!id) return;
            if (!confirm('Delete this character?')) return;
            try {
                const res = await api.deleteCharacter(id);
                if (!res.success) throw new Error('Delete failed');
                this.refresh();
                app.showMessage('Character deleted', 'success');
            } catch (err) { app.showMessage(err.message || 'Failed to delete character', 'error'); }
        }));
        this.grid.querySelectorAll('[data-action="sheet"]').forEach(btn => btn.addEventListener('click', (e) => this.openSheet(e.currentTarget.getAttribute('data-id'))));
    }

    renderCard(ch) {
        const createdAt = ch.createdAt ? new Date(ch.createdAt).toLocaleString() : '';
        return `
            <div class="character-card">
                <div class="character-card-header">
                    <h3>${this.escape(ch.name)}</h3>
                    <div class="actions">
                        <button class="btn btn-outline" data-action="details" data-id="${ch.id}"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline" data-action="sheet" data-id="${ch.id}"><i class="fas fa-id-card"></i></button>
                        <button class="btn btn-outline" data-action="edit" data-id="${ch.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline" data-action="delete" data-id="${ch.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="character-card-body">
                    <div class="meta">Created: ${createdAt}</div>
                    <div class="meta">ID: ${ch.id}</div>
                </div>
            </div>
        `;
    }

    async openDetails(id) {
        try {
            const res = await api.getCharacter(id);
            if (!res.success) throw new Error('Fetch failed');
            const ch = res.data;
            const html = `
                <div style="position:relative;padding:24px;max-width:520px">
                    <h3>Character Details</h3>
                    <div><strong>Name:</strong> ${this.escape(ch.name)}</div>
                    <div><strong>ID:</strong> ${ch.id}</div>
                    <pre style="background:#f7f7f9;padding:12px;border-radius:8px;overflow:auto">${this.escape(JSON.stringify(ch.dataJson || {}, null, 2))}</pre>
                    <div style="margin-top:16px;text-align:right">
                        <button class="btn btn-outline modal-close">Close</button>
                    </div>
                </div>`;
            app.modules.ui?.showModal(html);
        } catch (e) { app.showMessage(e.message || 'Failed to load details', 'error'); }
    }

    async openEdit(id) {
        try {
            const res = await api.getCharacter(id);
            if (!res.success) throw new Error('Fetch failed');
            const ch = res.data;
            const html = `
                <div style="position:relative;padding:24px;max-width:520px">
                    <h3>Edit Character</h3>
                    <label>Name</label>
                    <input id="edit-name" type="text" value="${this.escape(ch.name)}" style="width:100%;margin:8px 0" />
                    <label>Data JSON</label>
                    <textarea id="edit-json" rows="10" style="width:100%;margin:8px 0">${this.escape(JSON.stringify(ch.dataJson || {}, null, 2))}</textarea>
                    <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
                        <button class="btn btn-outline modal-close">Cancel</button>
                        <button id="save-edit" class="btn btn-primary">Save</button>
                    </div>
                </div>`;
            app.modules.ui?.showModal(html);
            document.getElementById('save-edit')?.addEventListener('click', async () => {
                const nameInput = document.getElementById('edit-name');
                const jsonTextarea = document.getElementById('edit-json');
                const name = nameInput && 'value' in nameInput ? String(nameInput.value).trim() : '';
                const jsonText = jsonTextarea && 'value' in jsonTextarea ? String(jsonTextarea.value) : '';
                let dataJson = {};
                try { dataJson = jsonText ? JSON.parse(jsonText) : {}; } catch { return app.showMessage('Invalid JSON', 'error'); }
                try {
                    const upd = await api.updateCharacter(id, { name, dataJson });
                    if (!upd.success) throw new Error('Update failed');
                    app.modules.ui?.hideModal();
                    this.refresh();
                    app.showMessage('Character updated', 'success');
                } catch (err) { app.showMessage(err.message || 'Failed to update', 'error'); }
            });
        } catch (e) { app.showMessage(e.message || 'Failed to open editor', 'error'); }
    }

    async openSheet(id) {
        try {
            const res = await api.getCharacter(id);
            if (!res.success) throw new Error('Fetch failed');
            const ch = res.data;
            const d = ch.dataJson || {};
            const get = (obj, key, def='') => (obj && obj[key] !== undefined ? obj[key] : def);
            const abilities = get(d, 'abilities', { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 });
            const prof = Number(get(d, 'proficiency', 2));
            const hp = Number(get(d, 'hp', 10));
            const maxHp = Number(get(d, 'maxHp', 10));
            const ac = Number(get(d, 'ac', 10));
            const init = Number(get(d, 'initiative', 0));
            const speed = Number(get(d, 'speed', 30));
            const skills = get(d, 'skills', {});
            const saving = get(d, 'savingThrows', {});
            const inventory = Array.isArray(d.inventory) ? d.inventory : [];
            const attacks = Array.isArray(d.attacks) ? d.attacks : [];
            const spells = Array.isArray(d.spells) ? d.spells : [];
            const notes = typeof d.notes === 'string' ? d.notes : '';
            const deathSaves = d.deathSaves && typeof d.deathSaves === 'object' ? d.deathSaves : { successes: 0, failures: 0 };

            const abilityRow = (k) => {
                const val = Number(abilities[k]||10);
                const mod = Math.floor((val-10)/2);
                return `
                <div style="flex:1;min-width:120px;border:1px solid #e5e7eb;border-radius:10px;padding:10px;text-align:center;background:#fafafa">
                    <div style="font-weight:600;color:#374151">${k}</div>
                    <input type="number" id="ab-${k}" value="${val}" style="width:70px;margin:6px 0;text-align:center" />
                    <div style="font-size:12px;color:#6b7280">mod ${mod>=0?'+':''}${mod}</div>
                </div>`;
            };

            const skillList = [
                ['acrobatics','DEX'],['animalHandling','WIS'],['arcana','INT'],['athletics','STR'],
                ['deception','CHA'],['history','INT'],['insight','WIS'],['intimidation','CHA'],
                ['investigation','INT'],['medicine','WIS'],['nature','INT'],['perception','WIS'],
                ['performance','CHA'],['persuasion','CHA'],['religion','INT'],['sleightOfHand','DEX'],
                ['stealth','DEX'],['survival','WIS']
            ];

            const html = `
                <div class="sheet-modal">
                    <div class="sheet-header">
                        <h3 class="sheet-title">${this.escape(ch.name)} — 5e Sheet</h3>
                        <button class="btn btn-outline modal-close">Close</button>
                    </div>

                    <div class="sheet-grid">
                        <div class="sheet-abilities">
                            ${['STR','DEX','CON','INT','WIS','CHA'].map(k=>{
                                const val = Number(abilities[k]||10);
                                const mod = Math.floor((val-10)/2);
                                return `
                                <div class=\"ability-card\">
                                    <div class=\"ability-name\">${k}</div>
                                    <input class=\"ability-score\" type=\"number\" id=\"ab-${k}\" value=\"${val}\" />
                                    <div class=\"ability-mod\">mod ${mod>=0?'+':''}${mod}</div>
                                </div>`;
                            }).join('')}
                        </div>
                        <div class="sheet-core">
                            <div class="sheet-core-grid">
                                <label class="form-inline">HP <input id="cs-hp" type="number" value="${hp}" />/<input id="cs-maxhp" type="number" value="${maxHp}" /></label>
                                <label class="form-inline">AC <input id="cs-ac" type="number" value="${ac}" /></label>
                                <label class="form-inline">Init <input id="cs-init" type="number" value="${init}" /></label>
                                <label class="form-inline">Speed <input id="cs-speed" type="number" value="${speed}" /></label>
                                <label class="form-inline">Proficiency <input id="cs-prof" type="number" value="${prof}" /></label>
                            </div>
                            <div style="margin-top:10px">
                                <div class="chips">
                                    <span class="chip"><span class="dot"></span> ${speed} ft</span>
                                    <span class="chip"><span class="dot"></span> AC ${ac}</span>
                                    <span class="chip"><span class="dot"></span> Init ${init>=0?'+':''}${init}</span>
                                </div>
                                <div class="progress" style="margin-top:8px" title="HP">
                                    <div class="progress-bar" style="width:${Math.max(0, Math.min(100, Math.round((hp/Math.max(1,maxHp))*100)))}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="sheet-sections">
                        <div class="sheet-section">
                            <h4>Saving Throws</h4>
                            <div class="saving-throws">
                                ${['STR','DEX','CON','INT','WIS','CHA'].map(k=>`<label>${k} <input type=\"checkbox\" data-save=\"${k}\" ${saving[k]?'checked':''}></label>`).join('')}
                            </div>
                        </div>
                        <div class="sheet-section">
                            <h4>Skills</h4>
                            <div class="skills">
                                ${skillList.map(([s,abil])=>`<label class=\"skill-item\"><input type=\"checkbox\" data-skill=\"${s}\" ${skills[s]?'checked':''}/> <span style=\"flex:1\">${s}</span> <span style=\"opacity:.6\">(${abil})</span></label>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="sheet-sections" style="margin-top:12px">
                        <div class="sheet-section">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                                <h4 style="margin:0">Inventory</h4>
                                <button class="btn btn-outline" id="inv-add"><i class="fas fa-plus"></i> Add</button>
                            </div>
                            <div id="inv-list"></div>
                        </div>
                        <div class="sheet-section">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                                <h4 style="margin:0">Attacks</h4>
                                <button class="btn btn-outline" id="atk-add"><i class="fas fa-plus"></i> Add</button>
                            </div>
                            <div id="atk-list"></div>
                        </div>
                    </div>

                    <div class="sheet-section" style="margin-top:12px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                            <h4 style="margin:0">Spells</h4>
                            <button class="btn btn-outline" id="spl-add"><i class="fas fa-plus"></i> Add</button>
                        </div>
                        <div id="spl-list"></div>
                    </div>

                    <div class="sheet-sections" style="margin-top:12px">
                        <div class="sheet-section">
                            <h4>Death Saves</h4>
                            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;align-items:center">
                                <label class="form-inline">Successes
                                    <input id="ds-successes" type="number" min="0" max="3" value="${Number(deathSaves.successes)||0}" />
                                </label>
                                <label class="form-inline">Failures
                                    <input id="ds-failures" type="number" min="0" max="3" value="${Number(deathSaves.failures)||0}" />
                                </label>
                            </div>
                        </div>
                        <div class="sheet-section">
                            <h4>Notes</h4>
                            <textarea id="cs-notes" rows="6" style="width:100%">${this.escape(notes)}</textarea>
                        </div>
                    </div>

                    <div class="sheet-actions">
                        <button class="btn btn-primary" id="cs-save">Save</button>
                    </div>
                </div>`;

            app.modules.ui?.showModal(html);

            const readAbilities = () => {
                const out = {};
                ['STR','DEX','CON','INT','WIS','CHA'].forEach(k=>{
                    const el = document.getElementById(`ab-${k}`);
                    out[k] = el && 'value' in el ? Number(el.value) : 10;
                });
                return out;
            };

            const renderInventory = () => {
                const container = document.getElementById('inv-list');
                if (!container) return;
                if (!Array.isArray(inventory) || inventory.length === 0) {
                    container.innerHTML = '<div class="empty">No items</div>';
                    return;
                }
                container.innerHTML = inventory.map((it, idx) => `
                    <div class="card" style="padding:12px;margin-bottom:8px">
                        <div style="display:grid;grid-template-columns:2fr repeat(3,1fr) auto;gap:8px;align-items:center">
                            <input data-inv="name" data-idx="${idx}" type="text" value="${this.escape(it.name||'')}" placeholder="Name" />
                            <input data-inv="qty" data-idx="${idx}" type="number" value="${Number(it.qty||1)}" placeholder="Qty" />
                            <input data-inv="weight" data-idx="${idx}" type="number" value="${Number(it.weight||0)}" placeholder="Weight" />
                            <label style="display:flex;align-items:center;gap:6px;justify-content:center"><input data-inv="equipped" data-idx="${idx}" type="checkbox" ${it.equipped?'checked':''}/> equipped</label>
                            <button class="btn btn-outline" data-inv-remove="${idx}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`).join('');
                container.querySelectorAll('[data-inv-remove]')?.forEach(btn=>btn.addEventListener('click', (e)=>{
                    const i = Number(e.currentTarget.getAttribute('data-inv-remove'));
                    inventory.splice(i,1);
                    renderInventory();
                }));
                container.querySelectorAll('[data-inv]')?.forEach(input=>input.addEventListener('change', (e)=>{
                    const field = e.currentTarget.getAttribute('data-inv');
                    const idx = Number(e.currentTarget.getAttribute('data-idx'));
                    if (!inventory[idx]) return;
                    if (field === 'equipped') inventory[idx][field] = e.currentTarget.checked;
                    else if (field === 'qty' || field === 'weight') inventory[idx][field] = Number(e.currentTarget.value||0);
                    else inventory[idx][field] = e.currentTarget.value;
                }));
            };

            const renderAttacks = () => {
                const container = document.getElementById('atk-list');
                if (!container) return;
                if (!Array.isArray(attacks) || attacks.length === 0) {
                    container.innerHTML = '<div class="empty">No attacks</div>';
                    return;
                }
                container.innerHTML = attacks.map((at, idx) => `
                    <div class="card" style="padding:12px;margin-bottom:8px">
                        <div style="display:grid;grid-template-columns:2fr repeat(3,1fr) auto;gap:8px;align-items:center">
                            <input data-atk="name" data-idx="${idx}" type="text" value="${this.escape(at.name||'')}" placeholder="Name" />
                            <input data-atk="toHit" data-idx="${idx}" type="number" value="${Number(at.toHit||0)}" placeholder="To Hit" />
                            <input data-atk="damage" data-idx="${idx}" type="text" value="${this.escape(at.damage||'')}}" placeholder="Damage" />
                            <input data-atk="type" data-idx="${idx}" type="text" value="${this.escape(at.type||'')}" placeholder="Type" />
                            <button class="btn btn-outline" data-atk-remove="${idx}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`).join('');
                container.querySelectorAll('[data-atk-remove]')?.forEach(btn=>btn.addEventListener('click', (e)=>{
                    const i = Number(e.currentTarget.getAttribute('data-atk-remove'));
                    attacks.splice(i,1);
                    renderAttacks();
                }));
                container.querySelectorAll('[data-atk]')?.forEach(input=>input.addEventListener('change', (e)=>{
                    const field = e.currentTarget.getAttribute('data-atk');
                    const idx = Number(e.currentTarget.getAttribute('data-idx'));
                    if (!attacks[idx]) return;
                    if (field === 'toHit') attacks[idx][field] = Number(e.currentTarget.value||0);
                    else attacks[idx][field] = e.currentTarget.value;
                }));
            };

            const renderSpells = () => {
                const container = document.getElementById('spl-list');
                if (!container) return;
                if (!Array.isArray(spells) || spells.length === 0) {
                    container.innerHTML = '<div class="empty">No spells</div>';
                    return;
                }
                container.innerHTML = spells.map((sp, idx) => `
                    <div class="card" style="padding:12px;margin-bottom:8px">
                        <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:center">
                            <input data-spl="name" data-idx="${idx}" type="text" value="${this.escape(sp.name||'')}" placeholder="Name" />
                            <input data-spl="level" data-idx="${idx}" type="number" value="${Number(sp.level||0)}" placeholder="Level" />
                            <label style="display:flex;align-items:center;gap:6px;justify-content:center"><input data-spl="prepared" data-idx="${idx}" type="checkbox" ${sp.prepared?'checked':''}/> prepared</label>
                            <button class="btn btn-outline" data-spl-remove="${idx}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`).join('');
                container.querySelectorAll('[data-spl-remove]')?.forEach(btn=>btn.addEventListener('click', (e)=>{
                    const i = Number(e.currentTarget.getAttribute('data-spl-remove'));
                    spells.splice(i,1);
                    renderSpells();
                }));
                container.querySelectorAll('[data-spl]')?.forEach(input=>input.addEventListener('change', (e)=>{
                    const field = e.currentTarget.getAttribute('data-spl');
                    const idx = Number(e.currentTarget.getAttribute('data-idx'));
                    if (!spells[idx]) return;
                    if (field === 'prepared') spells[idx][field] = e.currentTarget.checked;
                    else if (field === 'level') spells[idx][field] = Number(e.currentTarget.value||0);
                    else spells[idx][field] = e.currentTarget.value;
                }));
            };

            document.getElementById('inv-add')?.addEventListener('click', ()=>{ inventory.push({ name:'', qty:1, weight:0, equipped:false }); renderInventory(); });
            document.getElementById('atk-add')?.addEventListener('click', ()=>{ attacks.push({ name:'', toHit:0, damage:'', type:'' }); renderAttacks(); });
            document.getElementById('spl-add')?.addEventListener('click', ()=>{ spells.push({ name:'', level:0, prepared:false }); renderSpells(); });

            renderInventory();
            renderAttacks();
            renderSpells();

            document.getElementById('cs-save')?.addEventListener('click', async () => {
                const newData = {
                    ...d,
                    abilities: readAbilities(),
                    proficiency: Number((document.getElementById('cs-prof')||{}).value||prof),
                    hp: Number((document.getElementById('cs-hp')||{}).value||hp),
                    maxHp: Number((document.getElementById('cs-maxhp')||{}).value||maxHp),
                    ac: Number((document.getElementById('cs-ac')||{}).value||ac),
                    initiative: Number((document.getElementById('cs-init')||{}).value||init),
                    speed: Number((document.getElementById('cs-speed')||{}).value||speed),
                    skills: (()=>{ const o={}; skillList.forEach(([s])=>{ const cb=document.querySelector(`[data-skill=\"${s}\"]`); o[s]=cb?cb.checked:false; }); return o;})(),
                    savingThrows: (()=>{ const o={}; ['STR','DEX','CON','INT','WIS','CHA'].forEach(k=>{ const cb=document.querySelector(`[data-save=\"${k}\"]`); o[k]=cb?cb.checked:false; }); return o;})(),
                    inventory,
                    attacks,
                    spells,
                    notes: (document.getElementById('cs-notes')||{}).value || '',
                    deathSaves: {
                        successes: Math.max(0, Math.min(3, Number((document.getElementById('ds-successes')||{}).value||0))),
                        failures: Math.max(0, Math.min(3, Number((document.getElementById('ds-failures')||{}).value||0)))
                    }
                };
                try {
                    const upd = await api.updateCharacter(id, { dataJson: newData });
                    if (!upd.success) throw new Error('Save failed');
                    app.modules.ui?.hideModal();
                    this.refresh();
                    app.showMessage('Character sheet saved', 'success');
                } catch (err) { app.showMessage(err.message || 'Failed to save sheet', 'error'); }
            });
        } catch (e) { app.showMessage(e.message || 'Failed to open sheet', 'error'); }
    }

    escape(str) {
        return String(str).replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
    }

    handleResize() {}
    pauseRealtime() {}
    resumeRealtime() {}
    saveUnsavedChanges() {}
    hasUnsavedChanges() { return false; }
}

window.CharactersModule = CharactersModule;


