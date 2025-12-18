// UI and Navigation Module
class UIModule {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = document.querySelectorAll('.content-section');
        this.current = 'campaigns';
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalContainer = this.modalOverlay?.querySelector('.modal-content');
        this.bindNav();
        this.updateBreadcrumb('Campaigns');
    }

    bindNav() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }

    switchSection(section) {
        if (!section) return;
        this.sections.forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(`${section}-section`);
        if (target) target.classList.add('active');
        document.querySelectorAll('.app-nav .nav-item, .top-nav .nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll(`.nav-item[data-section="${section}"]`).forEach(n => n.classList.add('active'));
        this.current = section;
        this.updateBreadcrumb(section.charAt(0).toUpperCase() + section.slice(1));
        // refresh module if available
        if (window.app && window.app.getModule) {
            const mod = window.app.getModule(section);
            if (mod && typeof mod.refresh === 'function') mod.refresh();
        }
    }

    updateBreadcrumb(text) {
        const el = document.getElementById('current-section');
        if (el) el.textContent = text;
    }

    handleResize() {}

    // Modal helpers
    showModal(html) {
        if (!this.modalOverlay || !this.modalContainer) return;
        const closeBtn = `<button class="modal-close" aria-label="Close" style="position:absolute;top:12px;right:12px" >&times;</button>`;
        this.modalContainer.style.minHeight = '160px';
        this.modalContainer.innerHTML = closeBtn + `<div class="skeleton" id="modal-skel" style="display:none;margin-bottom:12px">
            <div style="height:16px;background:#e5e7eb;border-radius:6px;margin:6px 0"></div>
            <div style="height:16px;background:#e5e7eb;border-radius:6px;margin:6px 0"></div>
            <div style="height:16px;background:#e5e7eb;border-radius:6px;margin:6px 0"></div>
        </div>` + html;
        this.modalOverlay.classList.remove('hidden');
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hideModal();
        }, { once: true });
        // Delegate close to any .modal-close inside modal
        this._modalClickHandler = (e) => {
            const btn = e.target && typeof e.target.closest === 'function' ? e.target.closest('.modal-close') : null;
            if (btn) this.hideModal();
        };
        this.modalContainer.addEventListener('click', this._modalClickHandler);
        // ESC key closes modal
        this._modalKeyHandler = (e) => {
            if (e.key === 'Escape') this.hideModal();
        };
        document.addEventListener('keydown', this._modalKeyHandler);
        // Small fade-in
        this.modalContainer.style.opacity = '0';
        requestAnimationFrame(()=>{
            this.modalContainer.style.transition = 'opacity .15s ease';
            this.modalContainer.style.opacity = '1';
        });
    }

    hideModal() {
        if (!this.modalOverlay) return;
        this.modalOverlay.classList.add('hidden');
        if (this.modalContainer) {
            if (this._modalClickHandler) {
                this.modalContainer.removeEventListener('click', this._modalClickHandler);
                this._modalClickHandler = null;
            }
            this.modalContainer.innerHTML = '';
        }
        if (this._modalKeyHandler) {
            document.removeEventListener('keydown', this._modalKeyHandler);
            this._modalKeyHandler = null;
        }
    }
}

window.UIModule = UIModule;


