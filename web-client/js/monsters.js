// Monsters Module
class MonstersModule {
    constructor() {
        this.section = document.getElementById('monsters-section');
        this.grid = document.getElementById('monsters-grid');
        this.searchInput = document.getElementById('monster-search');
        this.createBtn = document.getElementById('create-monster-btn');
        this.currentCampaignId = null;
        this.perms = { role: 'PLAYER' };
        this.bindEvents();
        this.refresh();
    }

    async ensurePerms(campaignId) {
        try { const p = await api.getCampaignPermissions(campaignId); if (p.success) this.perms = p.data; } catch(_) { this.perms = { role: 'PLAYER' }; }
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => this.refresh(), 300));
        }
        if (this.createBtn) {
            this.createBtn.addEventListener('click', async () => {
                const campId = (document.getElementById('current-campaign-id')||{}).value || this.currentCampaignId || '';
                if (campId) { await this.ensurePerms(campId); }
                const canManage = (this.perms.role==='OWNER' || this.perms.role==='DM' || !!this.perms.canManageMonsters);
                if (!canManage) { app.showMessage('Non hai i permessi per creare mostri per questa campagna','error'); return; }
                this.openCreate();
            });
        }
    }

    async refresh() {
        if (!this.grid) return;
        this.grid.innerHTML = '<div class="loading">Loading monsters...</div>';
        try {
            const query = (this.searchInput?.value || '').trim();
            const params = query ? { q: query } : {};
            const res = await api.getMonsters(params);
            const list = res.success ? res.data : [];
            this.renderList(list);
        } catch (e) {
            this.grid.innerHTML = '<div class="error">Failed to load monsters</div>';
        }
    }

    renderList(list) {
        if (!list || list.length === 0) {
            this.grid.innerHTML = '<div class="empty">No monsters found</div>';
            return;
        }
        this.grid.innerHTML = list.map(m => this.renderCard(m)).join('');
        this.grid.querySelectorAll('[data-action="details"]').forEach(btn => btn.addEventListener('click', (e) => this.openDetails(e.currentTarget.getAttribute('data-id'))));
        this.grid.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const m = list.find(x=>String(x.id)===String(id));
            const campId = m?.campaignId || this.currentCampaignId;
            if (campId) { await this.ensurePerms(campId); }
            const canManage = (this.perms.role==='OWNER' || this.perms.role==='DM' || !!this.perms.canManageMonsters);
            if (!canManage) { app.showMessage('Non hai i permessi per modificare questo mostro','error'); return; }
            this.openEdit(e.currentTarget.getAttribute('data-id'))
        }));
        this.grid.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const m = list.find(x=>String(x.id)===String(id));
            const campId = m?.campaignId || this.currentCampaignId;
            if (campId) { await this.ensurePerms(campId); }
            const canManage = (this.perms.role==='OWNER' || this.perms.role==='DM' || !!this.perms.canManageMonsters);
            if (!canManage) { app.showMessage('Non hai i permessi per eliminare questo mostro','error'); return; }
            if (!id) return;
            if (!confirm('Delete this monster?')) return;
            try {
                const res = await api.deleteMonster(id);
                if (!res.success) throw new Error('Delete failed');
                this.refresh();
                app.showMessage('Monster deleted', 'success');
            } catch (err) { app.showMessage(err.message || 'Failed to delete monster', 'error'); }
        }));
    }

    renderCard(m) {
        const createdAt = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';
        return `
            <div class="monster-card">
                <div class="monster-card-header">
                    <h3>${this.escape(m.name)}</h3>
                    <div class="actions">
                        <button class="btn btn-outline" data-action="details" data-id="${m.id}"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline" data-action="edit" data-id="${m.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline" data-action="delete" data-id="${m.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="monster-card-body">
                    <div class="meta">Created: ${createdAt}</div>
                    <div class="meta">ID: ${m.id}</div>
                </div>
            </div>
        `;
    }

    async openDetails(id) {
        try {
            const res = await api.getMonster(id);
            if (!res.success) throw new Error('Fetch failed');
            const m = res.data;
            const html = `
                <div style="position:relative;padding:24px;max-width:520px">
                    <h3>Monster Details</h3>
                    <div><strong>Name:</strong> ${this.escape(m.name)}</div>
                    <div><strong>ID:</strong> ${m.id}</div>
                    <pre style="background:#f7f7f9;padding:12px;border-radius:8px;overflow:auto">${this.escape(JSON.stringify(m.dataJson || {}, null, 2))}</pre>
                    <div style="margin-top:16px;text-align:right">
                        <button class="btn btn-outline modal-close">Close</button>
                    </div>
                </div>`;
            app.modules.ui?.showModal(html);
        } catch (e) { app.showMessage(e.message || 'Failed to load details', 'error'); }
    }

    async openEdit(id) {
        try {
            const res = await api.getMonster(id);
            if (!res.success) throw new Error('Fetch failed');
            const m = res.data;
            const html = `
                <div style="position:relative;padding:24px;max-width:520px">
                    <h3>Edit Monster</h3>
                    <label>Name</label>
                    <input id="edit-name" type="text" value="${this.escape(m.name)}" style="width:100%;margin:8px 0" />
                    <label>Data JSON</label>
                    <textarea id="edit-json" rows="10" style="width:100%;margin:8px 0">${this.escape(JSON.stringify(m.dataJson || {}, null, 2))}</textarea>
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
                    const upd = await api.updateMonster(id, { name, dataJson });
                    if (!upd.success) throw new Error('Update failed');
                    app.modules.ui?.hideModal();
                    this.refresh();
                    app.showMessage('Monster updated', 'success');
                } catch (err) { app.showMessage(err.message || 'Failed to update', 'error'); }
            });
        } catch (e) { app.showMessage(e.message || 'Failed to open editor', 'error'); }
    }

    openCreate() {
        const html = `
            <div style="position:relative;padding:24px;max-width:520px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <h3 style="margin:0">New Monster</h3>
                    <button class="btn btn-outline modal-close">Close</button>
                </div>
                <form id="create-monster-form" style="display:grid;gap:10px">
                    <label style="display:grid;gap:6px">
                        <span>Name</span>
                        <input type="text" id="m-name" placeholder="e.g. Goblin" required style="padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
                    </label>
                    <label style="display:grid;gap:6px">
                        <span>Data JSON (optional)</span>
                        <textarea id="m-json" rows="8" placeholder="{ }" style="padding:10px;border:1px solid #e1e5e9;border-radius:10px"></textarea>
                    </label>
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
                        <button type="button" class="btn btn-outline modal-close">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="m-submit">Create</button>
                    </div>
                </form>
            </div>`;
        app.modules.ui?.showModal(html);
        const form = document.getElementById('create-monster-form');
        const submitBtn = document.getElementById('m-submit');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameEl = document.getElementById('m-name');
            const jsonEl = document.getElementById('m-json');
            const name = nameEl && 'value' in nameEl ? String(nameEl.value).trim() : '';
            const jsonText = jsonEl && 'value' in jsonEl ? String(jsonEl.value).trim() : '';
            if (!name) { app.showMessage('Name is required', 'error'); return; }
            let dataJson = undefined;
            if (jsonText) {
                try { dataJson = JSON.parse(jsonText); } catch { return app.showMessage('Invalid JSON', 'error'); }
            }
            try {
                if (submitBtn) { submitBtn.disabled = true; const prev = submitBtn.innerHTML; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating'; }
                const res = await api.createMonster({ name, dataJson });
                if (!res.success) throw new Error(res.error || 'Create failed');
                app.modules.ui?.hideModal();
                this.refresh();
                app.showMessage('Monster created', 'success');
            } catch (err) { app.showMessage(err.message || 'Failed to create monster', 'error'); }
            finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Create'; } }
        });
    }

    debounce(func, wait) {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => func.apply(this, args), wait); };
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

window.MonstersModule = MonstersModule;


