/* ============================================
   ARSA — Settings Screen
   ============================================ */

const Settings = {
  render() {
    const screen = document.getElementById('screen-settings');
    const s = Store.data.settings;

    screen.innerHTML = `
      <h1 class="screen-title">Settings</h1>

      <div class="section-label mt-8">Profile</div>
      <div class="px-20">
        <div class="input-group">
          <input type="text" class="input" id="set-name" placeholder="Your name" value="${esc(s.name || '')}">
        </div>
      </div>

      <div class="section-label mt-8">Appearance</div>
      <div class="settings-list card">
        <div class="settings-item" data-action="theme">
          <div class="settings-item-left">
            <div class="settings-item-icon" style="background:rgba(37,99,235,0.15);">🎨</div>
            <div><div class="settings-item-label">Theme</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="settings-item-value">${this._themeLabel(s.theme)}</span>
            <span class="settings-arrow">›</span>
          </div>
        </div>
      </div>

      <div class="section-label mt-8">Units</div>
      <div class="settings-list card">
        <div class="settings-item" data-action="units">
          <div class="settings-item-left">
            <div class="settings-item-icon" style="background:rgba(34,197,94,0.15);">⚖️</div>
            <div><div class="settings-item-label">Weight Units</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="settings-item-value">${s.units}</span>
            <span class="settings-arrow">›</span>
          </div>
        </div>
      </div>

      <div class="section-label mt-8">Notifications</div>
      <div class="settings-list card">
        <div class="settings-item">
          <div class="settings-item-left">
            <div class="settings-item-icon" style="background:rgba(100,116,139,0.15);">🔔</div>
            <div>
              <div class="settings-item-label">Workout Reminders</div>
              <div class="settings-item-sub">Coming soon</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-label mt-8">Backup &amp; Restore</div>
      <div class="settings-list card">
        <div class="settings-item" id="btn-export">
          <div class="settings-item-left">
            <div class="settings-item-icon" style="background:rgba(168,85,247,0.15);">📤</div>
            <div>
              <div class="settings-item-label">Export Data</div>
              <div class="settings-item-sub">Save a backup file</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        <div class="settings-item" id="btn-import">
          <div class="settings-item-left">
            <div class="settings-item-icon" style="background:rgba(6,182,212,0.15);">📥</div>
            <div>
              <div class="settings-item-label">Import Data</div>
              <div class="settings-item-sub">Restore from a backup file</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        <input type="file" id="import-file-input" accept="application/json" style="display:none;">
      </div>

      <div class="section-label mt-8">Danger Zone</div>
      <div class="px-20" style="padding-bottom: 30px;">
        <button class="btn btn-danger btn-full" id="btn-reset-all">Reset All Data</button>
      </div>

      <div class="px-20" style="text-align:center;color:var(--text-3);font-size:12px;padding-bottom:20px;">
        Arsa — Lift. Built for offline-first training.
      </div>
    `;

    this._bindEvents();
  },

  _themeLabel(t) {
    return { light: 'Light', dark: 'Dark', system: 'System' }[t] || 'Dark';
  },

  _bindEvents() {
    document.getElementById('set-name').addEventListener('change', (e) => {
      Store.data.settings.name = e.target.value.trim() || 'Lifter';
      Store.save();
    });

    document.querySelector('[data-action="theme"]').addEventListener('click', () => this._openThemePicker());
    document.querySelector('[data-action="units"]').addEventListener('click', () => this._openUnitsPicker());

    document.getElementById('btn-export').addEventListener('click', () => this._exportData());
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', (e) => this._importData(e));

    document.getElementById('btn-reset-all').addEventListener('click', () => this._confirmReset());
  },

  _openThemePicker() {
    const current = Store.data.settings.theme;
    openModal(`
      <div class="modal-title">Theme</div>
      <div class="modal-body">
        ${['dark', 'light', 'system'].map(t => `
          <div class="settings-item" data-theme-opt="${t}" style="cursor:pointer;">
            <div class="settings-item-label">${this._themeLabel(t)}</div>
            ${t === current ? '<span style="color:var(--blue-light);">✓</span>' : ''}
          </div>
        `).join('')}
      </div>
    `);
    document.querySelectorAll('[data-theme-opt]').forEach(el => {
      el.addEventListener('click', () => {
        Store.data.settings.theme = el.dataset.themeOpt;
        Store.save();
        closeModal();
        this.render();
        showToast('Theme updated — Arsa is dark-mode native; light mode coming soon.');
      });
    });
  },

  _openUnitsPicker() {
    const current = Store.data.settings.units;
    openModal(`
      <div class="modal-title">Weight Units</div>
      <div class="modal-body">
        ${['kg', 'lbs'].map(u => `
          <div class="settings-item" data-unit-opt="${u}" style="cursor:pointer;">
            <div class="settings-item-label">${u}</div>
            ${u === current ? '<span style="color:var(--blue-light);">✓</span>' : ''}
          </div>
        `).join('')}
      </div>
    `);
    document.querySelectorAll('[data-unit-opt]').forEach(el => {
      el.addEventListener('click', () => {
        Store.data.settings.units = el.dataset.unitOpt;
        Store.save();
        closeModal();
        this.render();
        showToast(`Units set to ${el.dataset.unitOpt}`);
      });
    });
  },

  _exportData() {
    const json = Store.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = Store.todayStr();
    a.href = url;
    a.download = `arsa-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  },

  _importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      openModal(`
        <div class="modal-title">Import Data?</div>
        <div class="modal-body"><p style="color:var(--text-2);">This will replace your current workouts, history, and settings with the contents of this backup. This cannot be undone.</p></div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="import-cancel">Cancel</button>
          <button class="btn btn-primary" id="import-confirm">Import</button>
        </div>
      `);
      document.getElementById('import-cancel').addEventListener('click', closeModal);
      document.getElementById('import-confirm').addEventListener('click', () => {
        const success = Store.importData(evt.target.result);
        closeModal();
        if (success) {
          showToast('Data imported successfully');
          App.navigateTo('dashboard');
          App.renderCurrentScreen();
        } else {
          showToast('Import failed — invalid file');
        }
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  _confirmReset() {
    openModal(`
      <div class="modal-title">Reset All Data?</div>
      <div class="modal-body"><p style="color:var(--text-2);">This permanently deletes all workouts, history, PRs, and settings. Consider exporting a backup first.</p></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="reset-cancel">Cancel</button>
        <button class="btn btn-danger" id="reset-confirm">Reset Everything</button>
      </div>
    `);
    document.getElementById('reset-cancel').addEventListener('click', closeModal);
    document.getElementById('reset-confirm').addEventListener('click', () => {
      Store.resetAll();
      closeModal();
      showToast('All data reset');
      App.navigateTo('dashboard');
      App.renderCurrentScreen();
    });
  }
};
