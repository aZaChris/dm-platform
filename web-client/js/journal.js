// Journal Module (frontend-only, aligns to backend /journal endpoints)
class JournalModule {
  constructor() {
    this.section = document.getElementById('journal-section');
    this.container = document.getElementById('journalEntries');
    this.newBtn = document.getElementById('newEntryBtn');
    this.searchInput = document.getElementById('journalSearch');
    this.sortSelect = document.getElementById('journalSort');
    this.currentCampaignId = null;
    this.perms = { role: 'PLAYER', canManageJournal: false };
    this.bindEvents();
    this.refresh();
  }

  bindEvents() {
    if (this.newBtn) this.newBtn.addEventListener('click', () => this.openCreate());
    if (this.searchInput) this.searchInput.addEventListener('input', this.debounce(() => this.refresh(), 300));
    if (this.sortSelect) this.sortSelect.addEventListener('change', () => this.refresh());
  }

  async refresh() {
    if (!this.container) return;
    this.container.innerHTML = '<div class="loading">Loading entries...</div>';
    try {
      if (this.currentCampaignId) {
        try { const p = await api.getCampaignPermissions(this.currentCampaignId); if (p.success) this.perms = p.data; } catch(_) {}
        if (this.newBtn) this.newBtn.style.display = (this.perms.role==='OWNER' || this.perms.role==='DM' || this.perms.canManageJournal) ? '' : 'none';
      }
      const res = await api.getJournalEntries(this.currentCampaignId || undefined);
      const list = res.success ? res.data : [];
      const query = (this.searchInput?.value || '').toLowerCase();
      const sortBy = this.sortSelect?.value || 'date';
      const filtered = query
        ? list.filter(e => (e.title || '').toLowerCase().includes(query) || (e.content || '').toLowerCase().includes(query))
        : list;
      const sorted = [...filtered].sort((a,b) => {
        if (sortBy === 'title') return (a.title||'').localeCompare(b.title||'');
        if (sortBy === 'category') return (a.category||'').localeCompare(b.category||'');
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      this.renderList(sorted);
    } catch (e) {
      this.container.innerHTML = '<div class="error">Failed to load journal</div>';
    }
  }

  renderList(list) {
    if (!list || list.length === 0) {
      this.container.innerHTML = '<div class="empty">No entries yet. Create one!</div>';
      return;
    }
    this.container.innerHTML = list.map(x => this.renderCard(x)).join('');
    const canEditAll = (this.perms.role==='OWNER' || this.perms.role==='DM' || this.perms.canManageJournal);
    if (!canEditAll) {
      this.container.querySelectorAll('[data-action="edit"], [data-action="delete"]').forEach(el=> el.remove());
    }
    this.container.querySelectorAll('[data-action="view"]').forEach(btn => btn.addEventListener('click', (e) => this.openView(e.currentTarget.getAttribute('data-id'))));
    if (canEditAll) {
      this.container.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', (e) => this.openEdit(e.currentTarget.getAttribute('data-id'))));
      this.container.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (!id) return;
        if (!confirm('Delete this entry?')) return;
        try {
          const res = await api.deleteJournalEntry(id);
          if (!res.success) throw new Error('Delete failed');
          this.refresh();
          app.showMessage('Entry deleted', 'success');
        } catch (err) { app.showMessage(err.message || 'Failed to delete', 'error'); }
      }));
    }
  }

  renderCard(e) {
    const createdAt = e.createdAt ? new Date(e.createdAt).toLocaleString() : '';
    const tags = Array.isArray(e.tags) ? e.tags : [];
    return `
      <div class="journal-entry-card">
        <div class="entry-header">
          <div class="entry-meta">
            <h3 class="entry-title">${this.escape(e.title || '')}</h3>
            <div class="entry-subtitle"><span class="entry-date">${createdAt}</span></div>
          </div>
          <div class="entry-actions">
            <button class="btn btn-outline btn-sm" data-action="view" data-id="${e.id}">👁️ View</button>
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${e.id}">✏️ Edit</button>
            <button class="btn btn-outline btn-sm btn-danger" data-action="delete" data-id="${e.id}">🗑️ Delete</button>
          </div>
        </div>
        <div class="entry-content">
          <p class="entry-excerpt">${this.escape((e.content || '').slice(0, 200))}${(e.content||'').length>200?'...':''}</p>
        </div>
        ${tags.length ? `<div class="entry-tags">${tags.map(t => `<span class="tag">${this.escape(t)}</span>`).join('')}</div>` : ''}
      </div>`;
  }

  async openView(id) {
    try {
      const res = await api.getJournalEntry(id);
      if (!res.success) throw new Error('Fetch failed');
      const e = res.data;
      const html = `
        <div style="position:relative;padding:24px;max-width:640px">
          <h3>${this.escape(e.title || '')}</h3>
          <div style="color:#666;margin-bottom:12px">${e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}</div>
          <div style="white-space:pre-wrap">${this.escape(e.content || '')}</div>
          ${Array.isArray(e.tags) && e.tags.length ? `<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">${e.tags.map(t => `<span class="tag">${this.escape(t)}</span>`).join('')}</div>` : ''}
          <div style="margin-top:16px;text-align:right"><button class="btn btn-outline modal-close">Close</button></div>
        </div>`;
      app.modules.ui?.showModal(html);
    } catch (err) { app.showMessage(err.message || 'Failed to open entry', 'error'); }
  }

  openCreate() {
    if (this.currentCampaignId && !(this.perms.role==='OWNER' || this.perms.role==='DM' || this.perms.canManageJournal)) {
      app.showMessage('Non hai i permessi per creare note in questa campagna','error');
      return;
    }
    const html = this.renderEditForm({ title: '', content: '', tags: [] }, (data) => this.create(data));
    app.modules.ui?.showModal(html);
    this.bindEditForm(null);
  }

  async openEdit(id) {
    try {
      const res = await api.getJournalEntry(id);
      if (!res.success) throw new Error('Fetch failed');
      const html = this.renderEditForm(res.data, (data) => this.update(id, data));
      app.modules.ui?.showModal(html);
      this.bindEditForm(id, res.data);
    } catch (err) { app.showMessage(err.message || 'Failed to open editor', 'error'); }
  }

  renderEditForm(entry, onSubmit) {
    const tagsStr = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
    return `
      <div style="position:relative;padding:24px;max-width:640px">
        <h3>${entry.id ? 'Edit Entry' : 'New Entry'}</h3>
        <label>Title</label>
        <input id="j-title" type="text" value="${this.escape(entry.title || '')}" style="width:100%;margin:8px 0" />
        <label>Content</label>
        <div id="j-toolbar" style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">
          <button type="button" class="btn btn-outline" data-format="bold"><b>B</b></button>
          <button type="button" class="btn btn-outline" data-format="italic"><i>I</i></button>
          <button type="button" class="btn btn-outline" data-format="ul">• List</button>
          <button type="button" class="btn btn-outline" data-format="ol">1. List</button>
          <button type="button" class="btn btn-outline" data-format="h1">H1</button>
          <button type="button" class="btn btn-outline" data-format="h2">H2</button>
          <button type="button" class="btn btn-outline" data-format="link">Link</button>
          <button type="button" class="btn btn-outline" data-format="image">Image</button>
        </div>
        <textarea id="j-content" rows="10" style="width:100%;margin:8px 0">${this.escape(entry.content || '')}</textarea>
        <div id="j-preview" style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:12px;min-height:80px"></div>
        <div style="margin-top:10px">
          <label>Upload images (max 2MB each, JPG/PNG/GIF)</label>
          <div class="file-upload">
            <input type="file" id="j-images" accept="image/png,image/jpeg,image/gif" multiple />
            <div class="file-upload-info">
              <p>Supported: JPG, PNG, GIF • Max 2MB per image</p>
            </div>
          </div>
          <div id="j-images-preview" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"></div>
        </div>
        <label>Tags (comma separated)</label>
        <input id="j-tags" type="text" value="${this.escape(tagsStr)}" style="width:100%;margin:8px 0" />
        <label>Campaign ID (optional)</label>
        <input id="j-campaign" type="text" value="${this.escape(this.currentCampaignId || '')}" style="width:100%;margin:8px 0" />
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline modal-close">Cancel</button>
          <button id="j-save" class="btn btn-primary">Save</button>
        </div>
      </div>`;
  }

  bindEditForm(id, initial = {}) {
    const imagesData = [];

    // Editor elements needed for preview/drag-drop and save
    const textarea = document.getElementById('j-content');
    const preview = document.getElementById('j-preview');

    const imagesInput = document.getElementById('j-images');
    const imagesPreview = document.getElementById('j-images-preview');
    const addPreviewItem = (src, idx) => {
      if (!imagesPreview) return;
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.width = '100px';
      wrap.style.height = '100px';
      wrap.style.border = '1px solid #e5e7eb';
      wrap.style.borderRadius = '8px';
      wrap.style.overflow = 'hidden';
      wrap.style.background = '#fff';
      wrap.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover"/>\n<button type="button" data-remove="${idx}" style="position:absolute;top:4px;right:4px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:2px 6px;cursor:pointer">✕</button>`;
      imagesPreview.appendChild(wrap);
      wrap.querySelector('[data-remove]')?.addEventListener('click', (e)=>{
        const i = Number(e.currentTarget.getAttribute('data-remove'));
        if (!Number.isNaN(i)) {
          imagesData.splice(i,1);
          imagesPreview.innerHTML = '';
          imagesData.forEach((url, j)=> addPreviewItem(url, j));
        }
      });
    };

    imagesInput?.addEventListener('change', (e)=>{
      const files = Array.from(e.currentTarget.files || []);
      if (!files.length) return;
      files.forEach(file => {
        const validType = /^(image\/png|image\/jpeg|image\/gif)$/.test(file.type);
        const validSize = file.size <= 2*1024*1024;
        if (!validType || !validSize) {
          app.showMessage(`Invalid image: ${file.name}`, 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result||'');
          imagesData.push(dataUrl);
          addPreviewItem(dataUrl, imagesData.length-1);
        };
        reader.readAsDataURL(file);
      });
      // reset input to allow re-select same files
      e.currentTarget.value = '';
    });

    // Drag & Drop on preview
    const handleFiles = (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      files.forEach(file => {
        const validType = /^(image\/png|image\/jpeg|image\/gif)$/.test(file.type);
        const validSize = file.size <= 2*1024*1024;
        if (!validType || !validSize) {
          app.showMessage(`Invalid image: ${file.name}`, 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result||'');
          imagesData.push(dataUrl);
          addPreviewItem(dataUrl, imagesData.length-1);
        };
        reader.readAsDataURL(file);
      });
    };

    preview?.addEventListener('dragover', (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; preview.style.outline = '2px dashed #667eea'; });
    preview?.addEventListener('dragleave', ()=>{ preview.style.outline = 'none'; });
    preview?.addEventListener('drop', (e)=>{
      e.preventDefault(); preview.style.outline = 'none';
      if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });

    document.getElementById('j-save')?.addEventListener('click', async () => {
      const titleEl = document.getElementById('j-title');
      const contentEl = textarea;
      const tagsEl = document.getElementById('j-tags');
      const campEl = document.getElementById('j-campaign');
      const title = titleEl && 'value' in titleEl ? String(titleEl.value).trim() : '';
      let content = contentEl && 'value' in contentEl ? String(contentEl.value) : '';
      const tagsRaw = tagsEl && 'value' in tagsEl ? String(tagsEl.value) : '';
      const campaignId = campEl && 'value' in campEl ? String(campEl.value).trim() : '';
      const tags = tagsRaw ? tagsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (!title) { app.showMessage('Title is required', 'error'); return; }
      if (imagesData.length) {
        content += '\n\n' + imagesData.map(url => `![image](${url})`).join('\n');
      }
      const payload = { title, content, tags };
      if (campaignId) payload.campaignId = campaignId;
      try {
        if (id) await this.update(id, payload); else await this.create(payload);
        app.modules.ui?.hideModal();
        this.refresh();
      } catch (err) { app.showMessage(err.message || 'Save failed', 'error'); }
    });

    // Toolbar formatting helpers
    const applyFormat = (type) => {
      if (!textarea) return;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const value = textarea.value;
      const selected = value.slice(start, end) || '';
      let before = value.slice(0, start);
      let after = value.slice(end);
      let insert = selected;
      if (type === 'bold') insert = `**${selected||'bold'}**`;
      else if (type === 'italic') insert = `*${selected||'italic'}*`;
      else if (type === 'ul') insert = selected.split(/\n/).map(l=> l? `- ${l}` : '').join('\n') || '- item';
      else if (type === 'ol') insert = selected.split(/\n/).map((l,i)=> l? `${i+1}. ${l}` : '').join('\n') || '1. item';
      else if (type === 'h1') insert = `# ${selected||'Heading 1'}`;
      else if (type === 'h2') insert = `## ${selected||'Heading 2'}`;
      else if (type === 'link' || type === 'image') {
        const isImage = type === 'image';
        const modalHtml = `
          <div style="position:relative;padding:20px;max-width:480px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h3 style="margin:0">${isImage ? 'Insert Image' : 'Insert Link'}</h3>
              <button class="btn btn-outline modal-close">Close</button>
            </div>
            <form id="j-ins-form" style="display:grid;gap:10px">
              ${isImage ? '<label>Alt text<input type="text" id="j-ins-alt" placeholder="image" style="padding:8px;border:1px solid #e1e5e9;border-radius:8px" /></label>' : '<label>Label<input type="text" id="j-ins-label" placeholder="link" style="padding:8px;border:1px solid #e1e5e9;border-radius:8px" /></label>'}
              <label>URL<input type="url" id="j-ins-url" placeholder="https://..." required style="padding:8px;border:1px solid #e1e5e9;border-radius:8px" /></label>
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button type="button" class="btn btn-outline modal-close">Cancel</button>
                <button type="submit" class="btn btn-primary">Insert</button>
              </div>
            </form>
          </div>`;
        app.modules.ui?.showModal(modalHtml);
        const form = document.getElementById('j-ins-form');
        form?.addEventListener('submit', (ev)=>{
          ev.preventDefault();
          const urlEl = document.getElementById('j-ins-url');
          const labelEl = document.getElementById(isImage ? 'j-ins-alt' : 'j-ins-label');
          const url = urlEl && 'value' in urlEl ? String(urlEl.value).trim() : '';
          const label = labelEl && 'value' in labelEl ? String(labelEl.value).trim() : '';
          if (!url) { app.showMessage('URL required', 'error'); return; }
          const toInsert = isImage ? `![${label||'image'}](${url})` : `[${label||selected||'link'}](${url})`;
          app.modules.ui?.hideModal();
          textarea.value = before + toInsert + after;
          const pos2 = before.length + toInsert.length;
          textarea.setSelectionRange(pos2, pos2);
          textarea.dispatchEvent(new Event('input'));
          textarea.focus();
        });
        return;
      }
      textarea.value = before + insert + after;
      // restore selection roughly after insert
      const pos = before.length + insert.length;
      textarea.setSelectionRange(pos, pos);
      textarea.dispatchEvent(new Event('input'));
      textarea.focus();
    };

    document.querySelectorAll('#j-toolbar [data-format]')?.forEach(btn => btn.addEventListener('click', (e)=>{
      const type = e.currentTarget.getAttribute('data-format');
      applyFormat(type);
    }));

    const renderPreview = () => {
      if (!preview || !textarea) return;
      const md = String(textarea.value||'');
      let html = md
        .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
        .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
        .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" style="max-width:100%;border-radius:8px" />')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      // lists
      html = html
        .replace(/(^|\n)- (.*)(?=\n|$)/g, '$1<ul><li>$2</li></ul>')
        .replace(/(^|\n)\d+\. (.*)(?=\n|$)/g, '$1<ol><li>$2</li></ol>');
      // paragraphs
      html = html.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
      preview.innerHTML = html;
    };

    textarea?.addEventListener('input', renderPreview);
    renderPreview();
  }

  async create(data) {
    const res = await api.createJournalEntry(data);
    if (!res.success) throw new Error(res.error || 'Create failed');
    app.showMessage('Entry created', 'success');
  }

  async update(id, data) {
    const res = await api.updateJournalEntry(id, data);
    if (!res.success) throw new Error(res.error || 'Update failed');
    app.showMessage('Entry updated', 'success');
  }

  debounce(func, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => func.apply(this, a), wait); }; }
  escape(str) { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
  handleResize() {}
  pauseRealtime() {}
  resumeRealtime() {}
  saveUnsavedChanges() {}
  hasUnsavedChanges() { return false; }
  // Compatibility aliases for external callers
  loadEntries() { return this.refresh(); }
  showNewEntryForm() { return this.openCreate(); }
}

window.Journal = JournalModule;
// Journal Module (simplified, aligned with backend /journal endpoints)
class JournalModule {
  constructor() {
    this.section = document.getElementById('journal-section');
    this.container = document.getElementById('journalEntries');
    this.newBtn = document.getElementById('newEntryBtn');
    this.searchInput = document.getElementById('journalSearch');
    this.sortSelect = document.getElementById('journalSort');
    this.currentCampaignId = null; // optionally set when viewing a campaign
    this.bindEvents();
    this.refresh();
  }

  bindEvents() {
    if (this.newBtn) {
      this.newBtn.addEventListener('click', () => this.openCreate());
    }
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.debounce(() => this.refresh(), 300));
    }
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', () => this.refresh());
    }
  }

  async refresh() {
    if (!this.container) return;
    this.container.innerHTML = '<div class="loading">Loading entries...</div>';
    try {
      const params = {};
      if (this.currentCampaignId) params.campaignId = this.currentCampaignId;
      const res = await api.getJournalEntries(this.currentCampaignId || undefined);
      const list = res.success ? res.data : [];
      const query = (this.searchInput?.value || '').toLowerCase();
      const sortBy = this.sortSelect?.value || 'date';
      const filtered = query
        ? list.filter(e => (e.title || '').toLowerCase().includes(query) || (e.content || '').toLowerCase().includes(query))
        : list;
      const sorted = [...filtered].sort((a,b) => {
        if (sortBy === 'title') return (a.title||'').localeCompare(b.title||'');
        if (sortBy === 'category') return (a.category||'').localeCompare(b.category||'');
        // default: date desc
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      this.renderList(sorted);
    } catch (e) {
      this.container.innerHTML = '<div class="error">Failed to load journal</div>';
    }
  }

  renderList(list) {
    if (!list || list.length === 0) {
      this.container.innerHTML = '<div class="empty">No entries yet. Create one!</div>';
      return;
    }
    this.container.innerHTML = list.map(x => this.renderCard(x)).join('');
    this.container.querySelectorAll('[data-action="view"]').forEach(btn => btn.addEventListener('click', (e) => this.openView(e.currentTarget.getAttribute('data-id'))));
    this.container.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', (e) => this.openEdit(e.currentTarget.getAttribute('data-id'))));
    this.container.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!id) return;
      if (!confirm('Delete this entry?')) return;
      try {
        const res = await api.deleteJournalEntry(id);
        if (!res.success) throw new Error('Delete failed');
        this.refresh();
        app.showMessage('Entry deleted', 'success');
      } catch (err) { app.showMessage(err.message || 'Failed to delete', 'error'); }
    }));
  }

  renderCard(e) {
    const createdAt = e.createdAt ? new Date(e.createdAt).toLocaleString() : '';
    const tags = Array.isArray(e.tags) ? e.tags : [];
    return `
      <div class="journal-entry-card">
        <div class="entry-header">
          <div class="entry-meta">
            <h3 class="entry-title">${this.escape(e.title || '')}</h3>
            <div class="entry-subtitle">
              <span class="entry-date">${createdAt}</span>
            </div>
          </div>
          <div class="entry-actions">
            <button class="btn btn-outline btn-sm" data-action="view" data-id="${e.id}">👁️ View</button>
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${e.id}">✏️ Edit</button>
            <button class="btn btn-outline btn-sm btn-danger" data-action="delete" data-id="${e.id}">🗑️ Delete</button>
          </div>
        </div>
        <div class="entry-content">
          <p class="entry-excerpt">${this.escape((e.content || '').slice(0, 200))}${(e.content||'').length>200?'...':''}</p>
        </div>
        ${tags.length ? `<div class="entry-tags">${tags.map(t => `<span class="tag">${this.escape(t)}</span>`).join('')}</div>` : ''}
      </div>
    `;
  }

  async openView(id) {
    try {
      const res = await api.getJournalEntry(id);
      if (!res.success) throw new Error('Fetch failed');
      const e = res.data;
      const html = `
        <div style="position:relative;padding:24px;max-width:640px">
          <h3>${this.escape(e.title || '')}</h3>
          <div style="color:#666;margin-bottom:12px">${e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}</div>
          <div style="white-space:pre-wrap">${this.escape(e.content || '')}</div>
          ${Array.isArray(e.tags) && e.tags.length ? `<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">${e.tags.map(t => `<span class="tag">${this.escape(t)}</span>`).join('')}</div>` : ''}
          <div style="margin-top:16px;text-align:right"><button class="btn btn-outline modal-close">Close</button></div>
        </div>`;
      app.modules.ui?.showModal(html);
    } catch (err) { app.showMessage(err.message || 'Failed to open entry', 'error'); }
  }

  openCreate() {
    const html = this.renderEditForm({ title: '', content: '', tags: [] }, (data) => this.create(data));
    app.modules.ui?.showModal(html);
    this.bindEditForm(null);
  }

  async openEdit(id) {
    try {
      const res = await api.getJournalEntry(id);
      if (!res.success) throw new Error('Fetch failed');
      const html = this.renderEditForm(res.data, (data) => this.update(id, data));
      app.modules.ui?.showModal(html);
      this.bindEditForm(id, res.data);
    } catch (err) { app.showMessage(err.message || 'Failed to open editor', 'error'); }
  }

  renderEditForm(entry, onSubmit) {
    const tagsStr = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
    return `
      <div style="position:relative;padding:24px;max-width:640px">
        <h3>${entry.id ? 'Edit Entry' : 'New Entry'}</h3>
        <label>Title</label>
        <input id="j-title" type="text" value="${this.escape(entry.title || '')}" style="width:100%;margin:8px 0" />
        <label>Content</label>
        <textarea id="j-content" rows="10" style="width:100%;margin:8px 0">${this.escape(entry.content || '')}</textarea>
        <label>Tags (comma separated)</label>
        <input id="j-tags" type="text" value="${this.escape(tagsStr)}" style="width:100%;margin:8px 0" />
        <label>Campaign ID (optional)</label>
        <input id="j-campaign" type="text" value="${this.escape(this.currentCampaignId || '')}" style="width:100%;margin:8px 0" />
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline modal-close">Cancel</button>
          <button id="j-save" class="btn btn-primary">Save</button>
        </div>
      </div>
    `;
  }

  bindEditForm(id, initial = {}) {
    document.getElementById('j-save')?.addEventListener('click', async () => {
      const title = (document.getElementById('j-title')).value.trim();
      const content = (document.getElementById('j-content')).value;
      const tagsRaw = (document.getElementById('j-tags')).value;
      const campaignId = (document.getElementById('j-campaign')).value.trim() || undefined;
      const tags = tagsRaw ? tagsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (!title) { app.showMessage('Title is required', 'error'); return; }
      const payload = { title, content, tags };
      if (campaignId) payload.campaignId = campaignId;
      try {
        if (id) await this.update(id, payload); else await this.create(payload);
        app.modules.ui?.hideModal();
        this.refresh();
      } catch (err) { app.showMessage(err.message || 'Save failed', 'error'); }
    });
  }

  async create(data) {
    const res = await api.createJournalEntry(data);
    if (!res.success) throw new Error(res.error || 'Create failed');
    app.showMessage('Entry created', 'success');
  }

  async update(id, data) {
    const res = await api.updateJournalEntry(id, data);
    if (!res.success) throw new Error(res.error || 'Update failed');
    app.showMessage('Entry updated', 'success');
  }

  debounce(func, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => func.apply(this, a), wait); }; }
  escape(str) { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
  handleResize() {}
  pauseRealtime() {}
  resumeRealtime() {}
  saveUnsavedChanges() {}
  hasUnsavedChanges() { return false; }
}

window.Journal = JournalModule;
/**
 * Advanced Journal Module
 * Handles journal entries with tags, attachments, search, and organization
 */
class Journal {
  constructor() {
    this.entries = [];
    this.categories = [];
    this.tags = [];
    this.currentEntry = null;
    this.isEditing = false;
    this.searchQuery = '';
    this.activeFilters = {
      category: null,
      tags: [],
      dateRange: null,
      author: null
    };
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.page = 1;
    this.perPage = 20;
    this.totalEntries = 0;
    
    this.init();
  }

  async init() {
    await this.loadCategories();
    await this.loadTags();
    await this.loadEntries();
    this.bindEvents();
    this.setupSearch();
    this.setupFilters();
  }

  async loadCategories() {
    try {
      const response = await API.get('/journal/categories');
      if (response.success) {
        this.categories = response.data;
        this.renderCategoryFilter();
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async loadTags() {
    try {
      const response = await API.get('/journal/tags');
      if (response.success) {
        this.tags = response.data;
        this.renderTagFilter();
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  async loadEntries() {
    try {
      const params = this.buildQueryParams();
      const response = await API.get('/journal/entries', params);
      
      if (response.success) {
        this.entries = response.data.entries;
        this.totalEntries = response.data.total;
        this.renderEntries();
        this.renderPagination();
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      App.showMessage('Failed to load journal entries', 'error');
    }
  }

  buildQueryParams() {
    const params = {
      page: this.page,
      perPage: this.perPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.searchQuery
    };

    if (this.activeFilters.category) {
      params.category = this.activeFilters.category;
    }
    if (this.activeFilters.tags.length > 0) {
      params.tags = this.activeFilters.tags.join(',');
    }
    if (this.activeFilters.dateRange) {
      params.startDate = this.activeFilters.dateRange.start;
      params.endDate = this.activeFilters.dateRange.end;
    }
    if (this.activeFilters.author) {
      params.author = this.activeFilters.author;
    }

    return params;
  }

  bindEvents() {
    // New entry button
    const newEntryBtn = document.getElementById('newEntryBtn');
    if (newEntryBtn) {
      newEntryBtn.addEventListener('click', () => this.showNewEntryForm());
    }

    // Search input
    const searchInput = document.getElementById('journalSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.debouncedSearch();
      });
    }

    // Sort controls
    const sortSelect = document.getElementById('journalSort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.loadEntries();
      });
    }

    // Filter controls
    this.bindFilterEvents();
  }

  bindFilterEvents() {
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.activeFilters.category = e.target.value || null;
        this.loadEntries();
      });
    }

    // Tag filters
    const tagFilters = document.querySelectorAll('.tag-filter');
    tagFilters.forEach(tag => {
      tag.addEventListener('change', (e) => {
        const tagValue = e.target.value;
        if (e.target.checked) {
          if (!this.activeFilters.tags.includes(tagValue)) {
            this.activeFilters.tags.push(tagValue);
          }
        } else {
          this.activeFilters.tags = this.activeFilters.tags.filter(t => t !== tagValue);
        }
        this.loadEntries();
      });
    });

    // Date range filter
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', (e) => {
        const dates = e.target.value.split(' to ');
        if (dates.length === 2) {
          this.activeFilters.dateRange = {
            start: dates[0],
            end: dates[1]
          };
        } else {
          this.activeFilters.dateRange = null;
        }
        this.loadEntries();
      });
    }
  }

  setupSearch() {
    // Debounced search
    this.debouncedSearch = App.debounce(() => {
      this.page = 1;
      this.loadEntries();
    }, 300);
  }

  setupFilters() {
    this.renderCategoryFilter();
    this.renderTagFilter();
    this.renderDateFilter();
  }

  renderCategoryFilter() {
    const container = document.getElementById('categoryFilter');
    if (!container) return;

    container.innerHTML = `
      <option value="">All Categories</option>
      ${this.categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
      ).join('')}
    `;
  }

  renderTagFilter() {
    const container = document.getElementById('tagFilters');
    if (!container) return;

    container.innerHTML = `
      <div class="tag-filters">
        ${this.tags.map(tag => `
          <label class="tag-filter-item">
            <input type="checkbox" class="tag-filter" value="${tag.id}">
            <span class="tag-label">${tag.name}</span>
          </label>
        `).join('')}
      </div>
    `;

    // Re-bind events after rendering
    this.bindFilterEvents();
  }

  renderDateFilter() {
    const container = document.getElementById('dateRangeFilter');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    container.innerHTML = `
      <option value="">All Dates</option>
      <option value="${lastMonth} to ${today}">Last 30 Days</option>
      <option value="${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${today}">Last 7 Days</option>
      <option value="${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${today}">Last 24 Hours</option>
    `;
  }

  renderEntries() {
    const container = document.getElementById('journalEntries');
    if (!container) return;

    if (this.entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📖</div>
          <h3>No journal entries found</h3>
          <p>Create your first entry or adjust your search criteria</p>
          <button class="btn btn-primary" onclick="Journal.showNewEntryForm()">
            Create Entry
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.entries.map(entry => this.renderEntryCard(entry)).join('');
  }

  renderEntryCard(entry) {
    const tags = entry.tags || [];
    const category = this.categories.find(c => c.id === entry.categoryId);
    const date = new Date(entry.createdAt).toLocaleDateString();
    const time = new Date(entry.createdAt).toLocaleTimeString();

    return `
      <div class="journal-entry-card" data-entry-id="${entry.id}">
        <div class="entry-header">
          <div class="entry-meta">
            <h3 class="entry-title">${this.escapeHtml(entry.title)}</h3>
            <div class="entry-subtitle">
              <span class="entry-category">${category ? category.name : 'Uncategorized'}</span>
              <span class="entry-date">${date} at ${time}</span>
              <span class="entry-author">by ${entry.authorName || 'Unknown'}</span>
            </div>
          </div>
          <div class="entry-actions">
            <button class="btn btn-outline btn-sm" onclick="Journal.editEntry('${entry.id}')">
              ✏️ Edit
            </button>
            <button class="btn btn-outline btn-sm" onclick="Journal.viewEntry('${entry.id}')">
              👁️ View
            </button>
            <button class="btn btn-outline btn-sm btn-danger" onclick="Journal.deleteEntry('${entry.id}')">
              🗑️ Delete
            </button>
          </div>
        </div>
        
        <div class="entry-content">
          <p class="entry-excerpt">${this.escapeHtml(entry.content.substring(0, 200))}${entry.content.length > 200 ? '...' : ''}</p>
        </div>

        ${tags.length > 0 ? `
          <div class="entry-tags">
            ${tags.map(tag => `
              <span class="tag" style="background-color: ${tag.color || '#007bff'}">
                ${this.escapeHtml(tag.name)}
              </span>
            `).join('')}
          </div>
        ` : ''}

        ${entry.attachments && entry.attachments.length > 0 ? `
          <div class="entry-attachments">
            <span class="attachment-count">📎 ${entry.attachments.length} attachment(s)</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderPagination() {
    const container = document.getElementById('journalPagination');
    if (!container) return;

    const totalPages = Math.ceil(this.totalEntries / this.perPage);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="pagination">
        <button class="btn btn-outline" 
                ${this.page === 1 ? 'disabled' : ''} 
                onclick="Journal.goToPage(${this.page - 1})">
          ← Previous
        </button>
        
        <div class="page-numbers">
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.page - 2 && i <= this.page + 2)) {
        paginationHTML += `
          <button class="btn ${i === this.page ? 'btn-primary' : 'btn-outline'}" 
                  onclick="Journal.goToPage(${i})">
            ${i}
          </button>
        `;
      } else if (i === this.page - 3 || i === this.page + 3) {
        paginationHTML += '<span class="pagination-ellipsis">...</span>';
      }
    }

    paginationHTML += `
        </div>
        
        <button class="btn btn-outline" 
                ${this.page === totalPages ? 'disabled' : ''} 
                onclick="Journal.goToPage(${this.page + 1})">
          Next →
        </button>
      </div>
    `;

    container.innerHTML = paginationHTML;
  }

  goToPage(page) {
    this.page = page;
    this.loadEntries();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showNewEntryForm() {
    this.currentEntry = null;
    this.isEditing = false;
    this.showEntryModal();
  }

  async editEntry(entryId) {
    try {
      const response = await API.get(`/journal/entries/${entryId}`);
      if (response.success) {
        this.currentEntry = response.data;
        this.isEditing = true;
        this.showEntryModal();
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
      App.showMessage('Failed to load entry for editing', 'error');
    }
  }

  async viewEntry(entryId) {
    try {
      const response = await API.get(`/journal/entries/${entryId}`);
      if (response.success) {
        this.currentEntry = response.data;
        this.showEntryViewModal();
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
      App.showMessage('Failed to load entry', 'error');
    }
  }

  async deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await API.delete(`/journal/entries/${entryId}`);
      if (response.success) {
        App.showMessage('Entry deleted successfully', 'success');
        this.loadEntries();
      } else {
        App.showMessage(response.error || 'Failed to delete entry', 'error');
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      App.showMessage('Failed to delete entry', 'error');
    }
  }

  showEntryModal() {
    const modal = document.getElementById('entryModal');
    if (!modal) return;

    const title = this.isEditing ? 'Edit Journal Entry' : 'New Journal Entry';
    const entry = this.currentEntry || {};

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" onclick="Journal.hideEntryModal()">&times;</button>
        </div>
        
        <form id="entryForm" class="entry-form">
          <div class="form-group">
            <label for="entryTitle">Title *</label>
            <input type="text" id="entryTitle" name="title" required 
                   value="${this.escapeHtml(entry.title || '')}" 
                   placeholder="Enter entry title">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="entryCategory">Category</label>
              <select id="entryCategory" name="categoryId">
                <option value="">Select Category</option>
                ${this.categories.map(cat => 
                  `<option value="${cat.id}" ${entry.categoryId === cat.id ? 'selected' : ''}>
                    ${this.escapeHtml(cat.name)}
                  </option>`
                ).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="entryTags">Tags</label>
              <div class="tag-selector">
                ${this.tags.map(tag => `
                  <label class="tag-option">
                    <input type="checkbox" name="tags" value="${tag.id}" 
                           ${(entry.tags || []).some(t => t.id === tag.id) ? 'checked' : ''}>
                    <span class="tag-label" style="background-color: ${tag.color || '#007bff'}">
                      ${this.escapeHtml(tag.name)}
                    </span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="entryContent">Content *</label>
            <textarea id="entryContent" name="content" required rows="10" 
                      placeholder="Write your journal entry content here...">${this.escapeHtml(entry.content || '')}</textarea>
          </div>

          <div class="form-group">
            <label for="entryAttachments">Attachments</label>
            <div class="file-upload">
              <input type="file" id="entryAttachments" name="attachments" multiple 
                     accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif">
              <div class="file-upload-info">
                <p>Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF</p>
                <p>Max file size: 10MB per file</p>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" onclick="Journal.hideEntryModal()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              ${this.isEditing ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    `;

    // Bind form submission
    const form = document.getElementById('entryForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleEntrySubmit(e));
    }

    modal.classList.add('show');
  }

  showEntryViewModal() {
    const modal = document.getElementById('entryModal');
    if (!modal) return;

    const entry = this.currentEntry;
    const category = this.categories.find(c => c.id === entry.categoryId);
    const date = new Date(entry.createdAt).toLocaleDateString();
    const time = new Date(entry.createdAt).toLocaleTimeString();

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${this.escapeHtml(entry.title)}</h2>
          <button class="modal-close" onclick="Journal.hideEntryModal()">&times;</button>
        </div>
        
        <div class="entry-view">
          <div class="entry-meta">
            <span class="entry-category">${category ? category.name : 'Uncategorized'}</span>
            <span class="entry-date">${date} at ${time}</span>
            <span class="entry-author">by ${entry.authorName || 'Unknown'}</span>
          </div>

          ${entry.tags && entry.tags.length > 0 ? `
            <div class="entry-tags">
              ${entry.tags.map(tag => `
                <span class="tag" style="background-color: ${tag.color || '#007bff'}">
                  ${this.escapeHtml(tag.name)}
                </span>
              `).join('')}
            </div>
          ` : ''}

          <div class="entry-content">
            ${this.formatContent(entry.content)}
          </div>

          ${entry.attachments && entry.attachments.length > 0 ? `
            <div class="entry-attachments">
              <h4>Attachments</h4>
              <div class="attachment-list">
                ${entry.attachments.map(attachment => `
                  <div class="attachment-item">
                    <span class="attachment-icon">📎</span>
                    <a href="${attachment.url}" target="_blank" class="attachment-link">
                      ${this.escapeHtml(attachment.name)}
                    </a>
                    <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="entry-actions">
            <button class="btn btn-outline" onclick="Journal.editEntry('${entry.id}')">
              ✏️ Edit Entry
            </button>
            <button class="btn btn-outline" onclick="Journal.hideEntryModal()">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('show');
  }

  hideEntryModal() {
    const modal = document.getElementById('entryModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  async handleEntrySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const entryData = {
      title: formData.get('title'),
      content: formData.get('content'),
      categoryId: formData.get('categoryId') || null,
      tags: Array.from(formData.getAll('tags')).map(id => ({ id }))
    };

    try {
      let response;
      if (this.isEditing) {
        response = await API.put(`/journal/entries/${this.currentEntry.id}`, entryData);
      } else {
        response = await API.post('/journal/entries', entryData);
      }

      if (response.success) {
        App.showMessage(
          this.isEditing ? 'Entry updated successfully' : 'Entry created successfully', 
          'success'
        );
        this.hideEntryModal();
        this.loadEntries();
      } else {
        App.showMessage(response.error || 'Failed to save entry', 'error');
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      App.showMessage('Failed to save entry', 'error');
    }
  }

  formatContent(content) {
    // Simple content formatting - in a real app, you might use a rich text editor
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public methods for external access
  static showNewEntryForm() {
    if (window.JournalInstance) {
      window.JournalInstance.showNewEntryForm();
    }
  }

  static editEntry(entryId) {
    if (window.JournalInstance) {
      window.JournalInstance.editEntry(entryId);
    }
  }

  static viewEntry(entryId) {
    if (window.JournalInstance) {
      window.JournalInstance.viewEntry(entryId);
    }
  }

  static deleteEntry(entryId) {
    if (window.JournalInstance) {
      window.JournalInstance.deleteEntry(entryId);
    }
  }

  static goToPage(page) {
    if (window.JournalInstance) {
      window.JournalInstance.goToPage(page);
    }
  }

  static hideEntryModal() {
    if (window.JournalInstance) {
      window.JournalInstance.hideEntryModal();
    }
  }
}

// Initialize and export
window.JournalInstance = new JournalModule();
window.Journal = JournalModule;

