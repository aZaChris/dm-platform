(function(){
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  async function init() {
    const id = getQueryParam('campaignId');
    const root = document.getElementById('table-root');
    if (!root) return;
    if (!id) {
      root.innerHTML = '<p>No campaign selected.</p>';
      return;
    }

    try {
      const [cRes, mRes] = await Promise.all([
        api.getCampaign(id),
        api.listCampaignMembers(id),
      ]);
      const campaign = cRes.success ? cRes.data : null;
      const members = mRes.success ? mRes.data : [];
      const names = members.map(m => (m.user?.name || m.user?.email || m.userId)).join(', ');

      root.innerHTML = `
        <div class="campaign-detail__header">
          <button class="btn btn-outline" id="tbl-back">&larr; Back to campaigns</button>
          <div>
            <h2>${campaign?.name || 'Campaign table'}</h2>
            <div class="campaign-detail__meta">ID: ${id}</div>
            <div class="campaign-detail__meta">Players: ${members.length}</div>
          </div>
        </div>
        <div class="campaign-detail__body">
          <div>
            <div class="campaign-detail__section">
              <h3>Battle Grid</h3>
              <div class="campaign-battle-grid">
                ${Array.from({length: 25}).map((_,i)=>`<div class="grid-cell" data-cell="${i}"></div>`).join('')}
              </div>
            </div>
          </div>
          <div>
            <div class="campaign-detail__section">
              <h3>Participants</h3>
              <p>${names || 'No participants yet.'}</p>
            </div>
            <div class="campaign-detail__section">
              <h3>Dice Roller (frontend only)</h3>
              <div id="dice-roller" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
                ${[4,6,8,10,12,20].map(s => `<button class="btn btn-outline" data-die="d${s}">d${s}</button>`).join('')}
              </div>
              <div id="dice-result" style="font-size:14px;color:#111827;">Click a die to roll.</div>
            </div>
            <div class="campaign-detail__section">
              <h3>Campaign Chat</h3>
              <div id="campaign-page-chat-container">
                <div id="campaign-chat">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('tbl-back')?.addEventListener('click', () => {
        window.location.href = 'index.html';
      });

      const diceRoot = document.getElementById('dice-roller');
      const diceResult = document.getElementById('dice-result');
      if (diceRoot && diceResult) {
        diceRoot.querySelectorAll('[data-die]').forEach(btn => {
          btn.addEventListener('click', () => {
            const die = btn.getAttribute('data-die') || 'd20';
            const size = parseInt(die.replace('d',''), 10) || 20;
            const roll = 1 + Math.floor(Math.random() * size);
            diceResult.textContent = `You rolled ${die}: ${roll}`;
          });
        });
      }

      // Initialize chat and realtime
      const initChat = () => {
        if (!window.realtime) {
          setTimeout(initChat, 100);
          return;
        }
        // Wait for socket to be ready
        const waitForSocket = () => {
          if (!window.realtime.socket || !window.realtime.socket.connected) {
            setTimeout(waitForSocket, 100);
            return;
          }
          try {
            window.realtime.joinCampaign(id);
            // Wire chat UI manually since it's already in the HTML
            const chatSend = document.getElementById('chat-send');
            const chatInput = document.getElementById('chat-input');
            if (chatSend) {
              chatSend.addEventListener('click', () => {
                console.log('Send clicked, socket:', window.realtime.socket?.connected, 'campaignId:', window.realtime.currentCampaignId);
                window.realtime.sendChat();
              });
            }
            if (chatInput) {
              chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                  console.log('Enter pressed, socket:', window.realtime.socket?.connected, 'campaignId:', window.realtime.currentCampaignId);
                  window.realtime.sendChat();
                }
              });
              chatInput.addEventListener('input', () => {
                if (window.realtime.socket && window.realtime.currentCampaignId) {
                  window.realtime.socket.emit('typing', { campaignId: window.realtime.currentCampaignId });
                }
              });
            }
            console.log('Chat initialized for campaign:', id);
          } catch (e) {
            console.error('Realtime chat init failed', e);
          }
        };
        waitForSocket();
      };
      initChat();
    } catch (e) {
      root.innerHTML = '<p>Failed to load campaign.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


