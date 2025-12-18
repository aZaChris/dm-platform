// Campaigns Module
class CampaignsModule {
    constructor() {
        this.section = document.getElementById('campaigns-section');
        this.grid = document.getElementById('campaigns-grid');
        this.createBtn = document.getElementById('create-campaign-btn');
        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        if (this.createBtn) {
            this.createBtn.addEventListener('click', () => this.openCreateCampaignModal());
        }
    }

    async refresh() {
        if (!this.grid) return;
        this.grid.innerHTML = '<div class="loading">Loading campaigns...</div>';
        try {
            const res = await api.getCampaigns();
            const campaigns = res.success ? res.data : [];
            this.renderList(campaigns);
        } catch (e) {
            this.grid.innerHTML = '<div class="error">Failed to load campaigns</div>';
        }
    }

    renderList(campaigns) {
        if (!campaigns || campaigns.length === 0) {
            this.grid.innerHTML = '<div class="empty">No campaigns yet. Create one!</div>';
            return;
        }
        this.grid.innerHTML = campaigns.map(c => this.renderCard(c)).join('');
        // attach per-card actions
        this.grid.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id) return;
                if (!confirm('Delete this campaign?')) return;
                try {
                    await api.deleteCampaign(id);
                    this.refresh();
                    app.showMessage('Campaign deleted', 'success');
                } catch (err) {
                    app.showMessage(err.message || 'Failed to delete', 'error');
                }
            });
        });
        this.grid.querySelectorAll('[data-action="details"]').forEach(btn => btn.addEventListener('click', (e) => this.openDetails(e.currentTarget.getAttribute('data-id'))));
        this.grid.querySelectorAll('[data-action="set-current"]').forEach(btn => btn.addEventListener('click', (e) => this.setCurrent(e.currentTarget.getAttribute('data-id'))));
        this.grid.querySelectorAll('[data-action="combat"]').forEach(btn => btn.addEventListener('click', (e) => this.openCombat(e.currentTarget.getAttribute('data-id'))));
        this.grid.querySelectorAll('[data-action="invite"]').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            try {
                const p = await api.getCampaignPermissions(id);
                const perms = p.success ? p.data : { role: 'PLAYER' };
                const canInvite = perms.role === 'OWNER' || !!perms.canInvite;
                if (!canInvite) { app.showMessage('Non hai i permessi per gestire inviti in questa campagna','error'); return; }
                this.openInvitations(id);
            } catch (_) { app.showMessage('Impossibile verificare i permessi','error'); }
        }));
    }

    renderCard(c) {
        const createdAt = c.createdAt ? new Date(c.createdAt).toLocaleString() : '';
        return `
            <div class="campaign-card">
                <div class="campaign-card-header">
                    <h3>${this.escape(c.name)}</h3>
                    <div class="actions" style="display:flex;gap:6px">
                        <button class="btn btn-outline" data-action="details" data-id="${c.id}"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline" data-action="delete" data-id="${c.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="campaign-card-body">
                    <div class="meta">Created: ${createdAt}</div>
                    <div class="meta">ID: ${c.id}</div>
                    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn btn-primary" data-action="set-current" data-id="${c.id}">Set Current</button>
                        <button class="btn btn-outline" data-action="combat" data-id="${c.id}">Open Combat</button>
                        <button class="btn btn-outline" onclick="navigator.clipboard.writeText('${c.id}').then(()=>app.showMessage('ID copied','success'))">Copy ID</button>
                        <button class="btn btn-outline" data-action="invite" data-id="${c.id}">Invite Link</button>
                    </div>
                </div>
            </div>
        `;
    }

    openCreateCampaignModal() {
        const html = `
            <div style="position:relative;padding:20px;max-width:520px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <h3 style="margin:0">Create Campaign</h3>
                    <button class="btn btn-outline modal-close">Close</button>
                </div>
                <form id="create-campaign-form" style="display:grid;gap:10px">
                    <label style="display:grid;gap:6px">
                        <span>Name</span>
                        <input type="text" id="cc-name" placeholder="e.g. Curse of Strahd" required style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
                    </label>
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
                        <button type="button" class="btn btn-outline modal-close">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="cc-submit">Create</button>
                    </div>
                </form>
            </div>`;
        app.modules.ui?.showModal(html);
        const form = document.getElementById('create-campaign-form');
        const submitBtn = document.getElementById('cc-submit');
        form?.addEventListener('submit', async (e)=>{
            e.preventDefault();
            const nameEl = document.getElementById('cc-name');
            const name = nameEl && 'value' in nameEl ? nameEl.value.trim() : '';
            if (!name) { app.showMessage('Inserisci un nome campagna', 'error'); return; }
            try {
                if (submitBtn) { submitBtn.disabled = true; const prev = submitBtn.innerHTML; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating';
                    await api.createCampaign({ name });
                    app.modules.ui?.hideModal();
                    this.refresh();
                    app.showMessage('Campagna creata', 'success');
                    submitBtn.innerHTML = prev; submitBtn.disabled = false; }
                else {
                    await api.createCampaign({ name });
                    app.modules.ui?.hideModal();
                    this.refresh();
                    app.showMessage('Campagna creata', 'success');
                }
            } catch (err) { app.showMessage(err.message||'Errore creazione campagna', 'error'); if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Create'; } }
        });
    }

    openDetails(id) {
        const card = this.grid.querySelector(`[data-action="details"][data-id="${id}"]`)?.closest('.campaign-card');
        const name = card ? card.querySelector('h3')?.textContent : id;
        const created = card ? card.querySelector('.meta')?.textContent : '';
        const html = `
            <div style="position:relative;padding:24px;max-width:720px">
                <h3>Campaign Details</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div>
                        <div><strong>Name:</strong> ${this.escape(name || '')}</div>
                        <div><strong>ID:</strong> ${id}</div>
                        <div style="color:#666;margin:8px 0">${this.escape(created || '')}</div>
                        <div style="margin-top:16px">
                            <h4 style="margin:0 0 8px 0">Invitations</h4>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
                                <label>Role
                                    <select id="cd-inv-role" style="margin-left:6px;padding:6px;border:1px solid #e1e5e9;border-radius:8px">
                                        <option value="PLAYER">PLAYER</option>
                                        <option value="DM">DM</option>
                                    </select>
                                </label>
                                <label>Expires (hours)
                                    <input id="cd-inv-exp" type="number" min="1" max="720" placeholder="24" style="width:80px;margin-left:6px;padding:6px;border:1px solid #e1e5e9;border-radius:8px" />
                                </label>
                                <button class="btn btn-primary" id="cd-inv-create">Create</button>
                            </div>
                            <div id="cd-invites">Loading...</div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                            <h4 style="margin:0">Members</h4>
                            <div style="display:flex;gap:6px;align-items:center">
                                <input type="email" id="cd-add-email" placeholder="email" style="padding:8px;border:1px solid #e1e5e9;border-radius:8px" />
                                <select id="cd-add-role" style="padding:8px;border:1px solid #e1e5e9;border-radius:8px">
                                    <option value="PLAYER">PLAYER</option>
                                    <option value="DM">DM</option>
                                </select>
                                <button class="btn btn-outline" id="cd-add">Add</button>
                                <button class="btn btn-outline" id="cd-refresh">Refresh</button>
                            </div>
                        </div>
                        <div id="cd-members">Loading...</div>
                    </div>
                </div>
                <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn btn-outline modal-close">Close</button>
                    <button class="btn btn-primary" id="cd-set">Set Current</button>
                </div>
            </div>`;
        app.modules.ui?.showModal(html);
        let campaignInfo = null;
        let permissions = { role: 'PLAYER', canInvite: false, canManageJournal: false, canManageCombat: false, canManageCharacters: false, canManageMonsters: false };
        (async ()=>{
            try { const p = await api.getCampaignPermissions(id); if (p.success) permissions = p.data; } catch(_) {}
        })();
        const loadMembers = async () => {
            const box = document.getElementById('cd-members'); if (!box) return;
            box.innerHTML = 'Loading...';
            try {
                if (!campaignInfo) {
                    try { const c = await api.getCampaign(id); campaignInfo = c.success ? c.data : null; } catch (_) {}
                }
                const res = await api.listCampaignMembers(id);
                let list = res.success ? res.data : [];
                const ownerId = campaignInfo && campaignInfo.ownerId ? campaignInfo.ownerId : null;
                const currentUserId = window.auth && window.auth.currentUser ? window.auth.currentUser.id : null;
                const isOwner = permissions.role === 'OWNER';
                // sort: owner → DM → PLAYER, then by name/email
                const rank = (m) => (m.userId === ownerId ? 0 : (m.role === 'DM' ? 1 : 2));
                const label = (m) => (m.user?.name || m.user?.email || m.userId || '').toLowerCase();
                list = list.slice().sort((a,b)=> rank(a)-rank(b) || label(a).localeCompare(label(b)));
                box.innerHTML = list.length ? list.map(m => `
                    <div class=\"card\" style=\"padding:10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px\">
                        <div>
                            <div style=\"font-weight:600\">${this.escape(m.user?.name||m.user?.email||m.userId)}</div>
                            <div style=\"font-size:12px;color:#666\">${this.escape(m.user?.email||'')}</div>
                        </div>
                        <div style=\"display:flex;gap:6px;align-items:center\">
                            ${m.userId===ownerId ? '<span class=\\"chip\\" title=\\"Owner\\">Owner</span>' : ''}
                            ${isOwner && m.userId!==ownerId ? `
                                <select class=\\"member-role\\" data-user=\\"${m.userId}\\" style=\\"padding:6px;border:1px solid #e1e5e9;border-radius:8px\\">\n                                    <option value=\\"PLAYER\\" ${m.role==='PLAYER'?'selected':''}>PLAYER</option>\n                                    <option value=\\"DM\\" ${m.role==='DM'?'selected':''}>DM</option>\n                                </select>
                                ${permissions.role==='OWNER' ? `
                                <div class=\\"perm-grid\\" style=\\"display:grid;grid-template-columns:auto auto;gap:6px;margin-left:8px\\">
                                    <label style=\\"display:flex;gap:6px;align-items:center;font-size:12px\\"><input type=\\"checkbox\\" class=\\"perm\\" data-user=\\"${m.userId}\\" data-key=\\"canInvite\\" ${m.canInvite?'checked':''}/> Invite</label>
                                    <label style=\\"display:flex;gap:6px;align-items:center;font-size:12px\\"><input type=\\"checkbox\\" class=\\"perm\\" data-user=\\"${m.userId}\\" data-key=\\"canManageJournal\\" ${m.canManageJournal?'checked':''}/> Journal</label>
                                    <label style=\\"display:flex;gap:6px;align-items:center;font-size:12px\\"><input type=\\"checkbox\\" class=\\"perm\\" data-user=\\"${m.userId}\\" data-key=\\"canManageCombat\\" ${m.canManageCombat?'checked':''}/> Combat</label>
                                    <label style=\\"display:flex;gap:6px;align-items:center;font-size:12px\\"><input type=\\"checkbox\\" class=\\"perm\\" data-user=\\"${m.userId}\\" data-key=\\"canManageCharacters\\" ${m.canManageCharacters?'checked':''}/> Characters</label>
                                    <label style=\\"display:flex;gap:6px;align-items:center;font-size:12px\\"><input type=\\"checkbox\\" class=\\"perm\\" data-user=\\"${m.userId}\\" data-key=\\"canManageMonsters\\" ${m.canManageMonsters?'checked':''}/> Monsters</label>
                                    <button class=\\"btn btn-outline save-perms\\" data-user=\\"${m.userId}\\">Save</button>
                                </div>
                                ` : ''}
                                <button class=\\"btn btn-outline\\" data-remove=\\"${m.userId}\\">Remove</button>
                            ` : `<span class=\\"chip\\">${m.role}</span>`}
                        </div>
                    </div>
                `).join('') : '<div class=\"empty\">No members</div>';
                // role change via dedicated route
                box.querySelectorAll('.member-role')?.forEach(sel=>sel.addEventListener('change', async (e)=>{
                    const userId = e.currentTarget.getAttribute('data-user');
                    const role = e.currentTarget.value;
                    if (!confirm('Confermi il cambio ruolo?')) { e.preventDefault(); return; }
                    try {
                        e.currentTarget.disabled = true;
                        await api.updateCampaignMemberRole(id, userId, role);
                        app.showMessage('Role updated','success');
                        loadMembers();
                    } catch(err){ app.showMessage(err.message||'Failed to update role','error'); }
                    finally { e.currentTarget.disabled = false; }
                }));
                // save granular permissions (owner only)
                box.querySelectorAll('.save-perms')?.forEach(btn=>btn.addEventListener('click', async (e)=>{
                    const userId = e.currentTarget.getAttribute('data-user');
                    const get = (k) => {
                        const el = box.querySelector(`.perm[data-user="${userId}"][data-key="${k}"]`);
                        return el && 'checked' in el ? el.checked : undefined;
                    };
                    const perms = {
                        canInvite: get('canInvite'),
                        canManageJournal: get('canManageJournal'),
                        canManageCombat: get('canManageCombat'),
                        canManageCharacters: get('canManageCharacters'),
                        canManageMonsters: get('canManageMonsters'),
                    };
                    try {
                        e.currentTarget.disabled = true; const prev = e.currentTarget.innerHTML; e.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                        await api.updateCampaignMemberPermissions(id, userId, perms);
                        app.showMessage('Permissions updated','success');
                        await loadMembers();
                        e.currentTarget.innerHTML = prev; e.currentTarget.disabled = false;
                    } catch(err){ app.showMessage(err.message||'Failed to update permissions','error'); e.currentTarget.disabled = false; }
                }));
                box.querySelectorAll('[data-remove]')?.forEach(btn=>btn.addEventListener('click', async (e)=>{
                    const userId = e.currentTarget.getAttribute('data-remove');
                    if (!confirm('Remove this member?')) return;
                    try { 
                        const el = e.currentTarget; el.disabled = true; const prev = el.innerHTML; el.innerHTML = '<i class=\\"fas fa-spinner fa-spin\\"></i>';
                        await api.removeCampaignMember(id, userId); loadMembers(); app.showMessage('Member removed','success'); 
                        el.innerHTML = prev; el.disabled = false;
                    }
                    catch(err){ app.showMessage(err.message||'Failed to remove','error'); }
                }));
            } catch (err) { box.innerHTML = '<div class=\"error\">Failed to load members</div>'; }
        };
        const loadInvites = async () => {
            const box = document.getElementById('cd-invites'); if (!box) return;
            box.innerHTML = 'Loading...';
            try {
                const canInvite = permissions.role==='OWNER' || !!permissions.canInvite;
                if (!canInvite) { document.getElementById('cd-invites').innerHTML = '<div class="empty">No access</div>'; return; }
                const res = await api.listInvitations(id);
                const invites = res.success ? res.data : [];
                box.innerHTML = invites.length ? invites.map(inv => `
                    <div class=\"card\" style=\"padding:10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px\">
                        <div>
                            <div style=\"font-weight:600\">${this.escape(inv.role)}</div>
                            <div style=\"font-size:12px;color:#666\">${inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}${inv.expiresAt? ' • exp: '+new Date(inv.expiresAt).toLocaleString(): ''}</div>
                        </div>
                        <div style=\"display:flex;gap:6px\">
                            <button class=\"btn btn-outline\" data-copy=\"${inv.token}\">Copy</button>
                            <button class=\"btn btn-outline\" data-revoke=\"${inv.token}\">Revoke</button>
                        </div>
                    </div>
                `).join('') : '<div class=\"empty\">No invitations</div>';
                box.querySelectorAll('[data-copy]')?.forEach(btn=>btn.addEventListener('click', (e)=>{
                    const token = e.currentTarget.getAttribute('data-copy');
                    const url = `${location.origin}${location.pathname}#invite=${token}`;
                    navigator.clipboard.writeText(url).then(()=> app.showMessage('Invite link copied','success'));
                }));
                box.querySelectorAll('[data-revoke]')?.forEach(btn=>btn.addEventListener('click', async (e)=>{
                    const token = e.currentTarget.getAttribute('data-revoke');
                    if (!confirm('Revoke this invitation?')) return;
                    try { 
                        const el = e.currentTarget; el.disabled = true; const prev = el.innerHTML; el.innerHTML = '<i class=\\"fas fa-spinner fa-spin\\"></i>';
                        await api.revokeInvitation(id, token); loadInvites(); app.showMessage('Invitation revoked','success');
                        el.innerHTML = prev; el.disabled = false;
                    } catch (err) { app.showMessage(err.message||'Failed to revoke','error'); }
                }));
            } catch (err) { box.innerHTML = '<div class=\"error\">Failed to load invitations</div>'; }
        };
        loadMembers();
        loadInvites();
        document.getElementById('cd-set')?.addEventListener('click', () => { this.setCurrent(id); app.modules.ui?.hideModal(); });
        document.getElementById('cd-refresh')?.addEventListener('click', loadMembers);
        document.getElementById('cd-add')?.addEventListener('click', async ()=>{
            const emailEl = document.getElementById('cd-add-email');
            const roleEl = document.getElementById('cd-add-role');
            const email = emailEl && 'value' in emailEl ? emailEl.value.trim() : '';
            const role = roleEl && 'value' in roleEl ? roleEl.value : 'PLAYER';
            if (!email) return app.showMessage('Email richiesta', 'error');
            try { 
                const addBtn = document.getElementById('cd-add'); if (addBtn) { addBtn.disabled = true; const prev = addBtn.innerHTML; addBtn.innerHTML = '<i class=\\"fas fa-spinner fa-spin\\"></i>'; 
                    await api.addCampaignMember(id, email, role); loadMembers(); app.showMessage('Member added','success'); addBtn.innerHTML = prev; addBtn.disabled = false; }
                else { await api.addCampaignMember(id, email, role); loadMembers(); app.showMessage('Member added','success'); }
            }
            catch(err){ app.showMessage(err.message||'Failed to add','error'); }
        });
        document.getElementById('cd-inv-create')?.addEventListener('click', async ()=>{
            const roleSel = document.getElementById('cd-inv-role');
            const expEl = document.getElementById('cd-inv-exp');
            const role = roleSel && 'value' in roleSel ? roleSel.value : 'PLAYER';
            const hours = expEl && 'value' in expEl && expEl.value ? Number(expEl.value) : null;
            let expiresAt = null;
            if (hours && Number.isFinite(hours) && hours > 0) {
                const dt = new Date(Date.now() + hours*3600*1000);
                expiresAt = dt.toISOString();
            }
            try {
                const btn = document.getElementById('cd-inv-create'); if (btn) { btn.disabled = true; const prev = btn.innerHTML; btn.innerHTML = '<i class=\\"fas fa-spinner fa-spin\\"></i>';
                    await api.createInvitation(id, role, expiresAt); loadInvites(); app.showMessage('Invitation created','success'); btn.innerHTML = prev; btn.disabled = false; }
                else { await api.createInvitation(id, role, expiresAt); loadInvites(); app.showMessage('Invitation created','success'); }
            } catch (err) { app.showMessage(err.message||'Failed to create invitation','error'); }
        });
        // Realtime auto-refresh, if socket.io client exists
        let rtHandlersBound = false;
        const bindRealtime = () => {
            const sock = window.socket || window.ioSocket || (window.io && window.io());
            if (!sock || rtHandlersBound) return;
            try {
                if (typeof sock.emit === 'function') {
                    sock.emit('join_campaign', { campaignId: id });
                }
                const refreshAll = () => { loadMembers(); loadInvites(); };
                sock.on && sock.on('campaign_members_updated', refreshAll);
                sock.on && sock.on('campaign_member_role_updated', refreshAll);
                sock.on && sock.on('campaign_member_removed', refreshAll);
                sock.on && sock.on('campaign_invitation_created', refreshAll);
                sock.on && sock.on('campaign_invitation_updated', refreshAll);
                rtHandlersBound = true;
                document.querySelectorAll('.modal-close')?.forEach(btn => btn.addEventListener('click', ()=>{
                    try {
                        sock.off && sock.off('campaign_members_updated', refreshAll);
                        sock.off && sock.off('campaign_member_role_updated', refreshAll);
                        sock.off && sock.off('campaign_member_removed', refreshAll);
                        sock.off && sock.off('campaign_invitation_created', refreshAll);
                        sock.off && sock.off('campaign_invitation_updated', refreshAll);
                        if (typeof sock.emit === 'function') {
                            sock.emit('leave_campaign', { campaignId: id });
                        }
                    } catch (_) {}
                }, { once: true }));
            } catch (_) {}
        };
        setTimeout(bindRealtime, 0);
    }

    setCurrent(id) {
        if (app.modules.characters) { app.modules.characters.currentCampaignId = id; app.modules.characters.refresh(); }
        if (app.modules.journal) { app.modules.journal.currentCampaignId = id; app.modules.journal.refresh(); }
        app.showMessage('Current campaign set', 'success');
    }

    openCombat(id) {
        if (window.Combat && typeof window.Combat.open === 'function') {
            window.Combat.open(id);
        } else {
            app.showMessage('Combat module not loaded', 'error');
        }
    }

    async openInvitations(campaignId) {
        try {
            const res = await api.listInvitations(campaignId);
            const invites = res.success ? res.data : [];
            const listHtml = invites.length ? invites.map(inv => `
                <div class="card" style="padding:12px;display:flex;justify-content:space-between;align-items:center;gap:8px">
                    <div>
                        <div style="font-weight:600">${inv.role}</div>
                        <div style="font-size:12px;color:#666">${inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}${inv.expiresAt? ' • exp: '+new Date(inv.expiresAt).toLocaleString(): ''}</div>
                    </div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-outline" data-copy="${inv.token}">Copy Link</button>
                    </div>
                </div>
            `).join('') : '<div class="empty">No invitations yet</div>';

            const html = `
                <div style="position:relative;padding:20px;max-width:640px">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px">
                        <h3 style="margin:0">Invitations</h3>
                        <button class="btn btn-outline modal-close">Close</button>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
                        <label>Role
                            <select id="inv-role" style="margin-left:6px">
                                <option value="PLAYER">PLAYER</option>
                                <option value="DM">DM</option>
                            </select>
                        </label>
                        <label style="margin-left:12px">Expires (hours)
                            <input id="inv-exp" type="number" min="1" max="720" placeholder="24" style="width:80px;margin-left:6px" />
                        </label>
                        <button class="btn btn-primary" id="inv-create">Create Link</button>
                    </div>
                    <div id="inv-list">${listHtml}</div>
                </div>`;
            app.modules.ui?.showModal(html);

            document.querySelectorAll('[data-copy]')?.forEach(btn => btn.addEventListener('click', (e)=>{
                const token = e.currentTarget.getAttribute('data-copy');
                const url = `${location.origin}${location.pathname}#invite=${token}`;
                navigator.clipboard.writeText(url).then(()=> app.showMessage('Invite link copied','success'));
            }));

            document.getElementById('inv-create')?.addEventListener('click', async () => {
                const roleSel = document.getElementById('inv-role');
                const expEl = document.getElementById('inv-exp');
                const role = roleSel && 'value' in roleSel ? roleSel.value : 'PLAYER';
                const hours = expEl && 'value' in expEl && expEl.value ? Number(expEl.value) : null;
                let expiresAt = null;
                if (hours && Number.isFinite(hours) && hours > 0) {
                    const dt = new Date(Date.now() + hours*3600*1000);
                    expiresAt = dt.toISOString();
                }
                try {
                    const crt = await api.createInvitation(campaignId, role, expiresAt);
                    if (!crt.success) throw new Error('Create failed');
                    app.modules.ui?.hideModal();
                    this.openInvitations(campaignId);
                    app.showMessage('Invitation created','success');
                } catch (err) { app.showMessage(err.message||'Failed to create invitation','error'); }
            });
        } catch (e) { app.showMessage(e.message || 'Failed to load invitations', 'error'); }
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

window.CampaignsModule = CampaignsModule;


