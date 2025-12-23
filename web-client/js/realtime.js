// Realtime (Socket.io) client for web
(function(){
  if (!window.io) { console.warn('Socket.io not loaded'); return; }

  class RealtimeClient {
    constructor() {
      this.socket = null;
      this.currentCampaignId = null;
      this.username = null;
      this.bindUI();
      this.connect();
    }

    connect() {
      try {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        this.socket = io(CONFIG.API_BASE_URL, { auth: { token } });
        this.registerHandlers();
      } catch (e) { console.warn('Realtime connection failed', e); }
    }

    registerHandlers() {
      if (!this.socket) return;
      this.socket.on('connect', () => console.log('WS connected'));
      this.socket.on('disconnect', () => console.log('WS disconnected'));
      this.socket.on('chat_message', (msg) => this.appendChat(msg));
      this.socket.on('presence_update', (payload) => this.renderPresence(payload));
      const refreshCombat = () => { if (this.currentCampaignId) { try { window.Combat?.open?.(this.currentCampaignId); } catch(_) {} } };
      this.socket.on('combat_created', refreshCombat);
      this.socket.on('combat_deleted', refreshCombat);
      this.socket.on('combat_started', refreshCombat);
      this.socket.on('combat_ended', refreshCombat);
      this.socket.on('combat_turn_changed', refreshCombat);
      this.socket.on('combat_participant_added', ({ campaignId }) => { if (campaignId===this.currentCampaignId) refreshCombat(); });
      this.socket.on('combat_participant_updated', ({ campaignId }) => { if (campaignId===this.currentCampaignId) refreshCombat(); });
      this.socket.on('combat_participant_removed', ({ campaignId }) => { if (campaignId===this.currentCampaignId) refreshCombat(); });
      // Journal realtime
      this.socket.on('journal_entry_created', ({ campaignId, entry }) => {
        if (campaignId !== this.currentCampaignId) return;
        try { window.JournalInstance?.loadEntries?.(); } catch(e) { /* no-op */ }
      });
      this.socket.on('journal_entry_updated', ({ campaignId, entry }) => {
        if (campaignId !== this.currentCampaignId) return;
        try { window.JournalInstance?.loadEntries?.(); } catch(e) { /* no-op */ }
      });
      this.socket.on('journal_entry_deleted', ({ campaignId, entryId }) => {
        if (campaignId !== this.currentCampaignId) return;
        try { window.JournalInstance?.loadEntries?.(); } catch(e) { /* no-op */ }
      });
    }

    joinCampaign(campaignId) {
      if (!this.socket) return;
      if (this.currentCampaignId) this.socket.emit('leave_campaign', { campaignId: this.currentCampaignId });
      this.currentCampaignId = campaignId;
      const user = (window.auth && window.auth.currentUser) ? {
        userId: window.auth.currentUser.id,
        email: window.auth.currentUser.email,
        name: window.auth.currentUser.username || window.auth.currentUser.name,
      } : undefined;
      this.socket.emit('join_campaign', { campaignId, user });
      this.clearChat();
    }

    bindUI() {
      // Inject chat UI into campaigns section footer; handle late script load
      const ready = () => this.ensureChatUI();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
      } else {
        ready();
      }
    }

    ensureChatUI() {
      const container = document.getElementById('campaign-page-chat-container') || document.getElementById('campaigns-section');
      if (!container) return;
      let chat = document.getElementById('campaign-chat');
      if (!chat) {
        chat = document.createElement('div');
        chat.id = 'campaign-chat';
        chat.innerHTML = `
        <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fff">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb">
            <div style="font-weight:600">Campaign Chat</div>
            <div id="presence" style="font-size:12px;color:#666"></div>
          </div>
          <div id="chat-log" style="height:220px;overflow:auto;padding:10px"></div>
          <div style="display:flex;gap:8px;padding:8px;border-top:1px solid #e5e7eb">
            <input id="chat-input" type="text" placeholder="Type a message..." style="flex:1;padding:10px;border:1px solid #e1e5e9;border-radius:8px" />
            <button id="chat-send" class="btn">Send</button>
          </div>
        </div>
      `;
        container.appendChild(chat);
        document.getElementById('chat-send')?.addEventListener('click', ()=> this.sendChat());
        const input = document.getElementById('chat-input');
        input?.addEventListener('keydown', (e)=>{ if (e.key==='Enter') this.sendChat(); });
        input?.addEventListener('input', ()=> this.socket?.emit('typing', { campaignId: this.currentCampaignId }));
      } else if (chat.parentElement !== container) {
        // se esiste già ma non è dentro il container della pagina campagna, lo spostiamo
        container.appendChild(chat);
      }
    }

    sendChat() {
      const input = document.getElementById('chat-input');
      if (!input || !input.value.trim() || !this.socket || !this.currentCampaignId) return;
      const text = input.value.trim();
      this.socket.emit('chat_message', { campaignId: this.currentCampaignId, text });
      input.value='';
    }

    appendChat(msg) {
      const log = document.getElementById('chat-log');
      if (!log) return;
      const who = msg.user?.email || 'Someone';
      const time = new Date().toLocaleTimeString();
      const row = document.createElement('div');
      row.style.marginBottom = '6px';
      row.innerHTML = `<span style="color:#6b7280;font-size:12px">[${time}]</span> <strong>${who}:</strong> ${this.escape(msg.text||'')}`;
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
    }

    renderPresence(payload) {
      const el = document.getElementById('presence');
      if (!el) return;
      const list = Array.isArray(payload?.users) ? payload.users : [];
      el.textContent = list.length ? `${list.length} online` : '';
    }

    clearChat() { const log = document.getElementById('chat-log'); if (log) log.innerHTML=''; }
    escape(str){ return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
  }

  const realtime = new RealtimeClient();
  // Wire with campaigns setCurrent to join the room
  const origSetCurrent = CampaignsModule.prototype.setCurrent;
  CampaignsModule.prototype.setCurrent = function(id){
    origSetCurrent.call(this, id);
    realtime.joinCampaign(id);
  };

  window.realtime = realtime;
})();
