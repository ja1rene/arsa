/* ============================================
   ARSA — Exercise Library Screen
   ============================================ */

const Library = {
  _searchTerm: '',
  _activeFilter: 'All',
  _detailId: null,

  render() {
    if (this._detailId) {
      this._renderDetail(this._detailId);
      return;
    }

    const screen = document.getElementById('screen-library');
    const filters = ['All', ...MUSCLE_GROUPS];

    screen.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">Library</h1>
        <button class="btn btn-primary btn-icon" id="btn-add-custom-ex">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <div class="library-search-wrap mt-4">
        <div class="search-input-wrap">
          <span class="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </span>
          <input type="text" class="input search-input" id="lib-search" placeholder="Search exercises..." value="${esc(this._searchTerm)}">
        </div>
      </div>

      <div class="muscle-filters">
        ${filters.map(f => `<div class="filter-chip ${f === this._activeFilter ? 'active' : ''}" data-filter="${f}">${f}</div>`).join('')}
      </div>

      <div class="exercise-grid" id="lib-grid">
        ${this._renderGrid()}
      </div>
    `;

    this._bindEvents();
  },

  _renderGrid() {
    let list = Store.getAllExercises();
    if (this._activeFilter !== 'All') {
      list = list.filter(e => e.muscle === this._activeFilter);
    }
    if (this._searchTerm) {
      const t = this._searchTerm.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(t));
    }
    if (list.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>No exercises found</h3><p>Try a different search or filter.</p></div>`;
    }
    return list.map(e => `
      <div class="exercise-row" data-id="${e.id}">
        <div class="exercise-row-muscle">${e.icon || '🏋️'}</div>
        <div class="exercise-row-info">
          <div class="exercise-row-name">${esc(e.name)}</div>
          <div class="exercise-row-tag">${e.muscle}${e.custom ? ' &middot; Custom' : ''}</div>
        </div>
        <div class="exercise-row-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    `).join('');
  },

  _bindEvents() {
    document.getElementById('lib-search').addEventListener('input', (e) => {
      this._searchTerm = e.target.value;
      document.getElementById('lib-grid').innerHTML = this._renderGrid();
      this._bindGridEvents();
    });

    document.querySelectorAll('.filter-chip').forEach(el => {
      el.addEventListener('click', () => {
        this._activeFilter = el.dataset.filter;
        this.render();
      });
    });

    document.getElementById('btn-add-custom-ex').addEventListener('click', () => this._openCustomExerciseForm());

    this._bindGridEvents();
  },

  _bindGridEvents() {
    document.querySelectorAll('.exercise-row').forEach(el => {
      el.addEventListener('click', () => {
        this._detailId = el.dataset.id;
        this.render();
      });
    });
  },

  _renderDetail(id) {
    const ex = Store.getExerciseById(id);
    const screen = document.getElementById('screen-library');
    if (!ex) { this._detailId = null; this.render(); return; }

    const pr = Store.getPR(id);

    screen.innerHTML = `
      <button class="back-btn" id="btn-detail-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Library
      </button>

      <div class="exercise-detail mt-4 fade-in">
        <h1 class="screen-title" style="padding:0 0 16px;font-size:24px;">${esc(ex.name)}</h1>

        <div class="exercise-detail-animation">
          ${ex.animationUrl
            ? (ex.animationUrl.match(/\.(mp4|webm)$/i)
                ? `<video src="${esc(ex.animationUrl)}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg);"></video>`
                : `<img src="${esc(ex.animationUrl)}" alt="${esc(ex.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg);">`)
            : (ex.icon || '🏋️')}
        </div>

        ${pr ? `
          <div class="card mt-4" style="margin-bottom:20px;background:var(--bg-2);border:none;border-left:var(--accent-border-width) solid var(--amber);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Your Personal Record</div>
                <div style="font-family:var(--font-display);font-size:20px;font-weight:700;margin-top:4px;">${Fmt.weight(pr.maxWeight)} × ${pr.maxWeightReps}</div>
              </div>
              <span style="font-size:28px;">🏆</span>
            </div>
          </div>
        ` : ''}

        ${ex.instructions ? `
          <div class="detail-section">
            <div class="detail-section-title">How To Perform</div>
            <p style="font-size:14px;line-height:1.6;color:var(--text-2);">${esc(ex.instructions)}</p>
          </div>
        ` : ''}

        ${ex.formTips && ex.formTips.length ? `
          <div class="detail-section">
            <div class="detail-section-title">Proper Form</div>
            <div class="form-tips">
              ${ex.formTips.map(t => `<div class="form-tip"><span class="tip-bullet">✓</span><span>${esc(t)}</span></div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${ex.mistakes && ex.mistakes.length ? `
          <div class="detail-section">
            <div class="detail-section-title">Common Mistakes</div>
            <div class="form-tips">
              ${ex.mistakes.map(t => `<div class="form-tip"><span class="tip-bullet" style="color:var(--red);">✕</span><span>${esc(t)}</span></div>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="detail-section">
          <div class="detail-section-title">Muscles Worked</div>
          <div class="muscles-wrap">
            <div class="muscle-row">
              <span class="muscle-name">${esc(ex.muscle)}</span>
              <span class="badge badge-blue">Primary</span>
            </div>
            ${(ex.secondaryMuscles || []).map(m => `
              <div class="muscle-row">
                <span class="muscle-name">${esc(m)}</span>
                <span class="badge badge-green">Secondary</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${ex.tips ? `
          <div class="detail-section">
            <div class="detail-section-title">Tips</div>
            <p style="font-size:14px;line-height:1.6;color:var(--text-2);">${esc(ex.tips)}</p>
          </div>
        ` : ''}

        ${ex.notes ? `
          <div class="detail-section">
            <div class="detail-section-title">Your Notes</div>
            <p style="font-size:14px;line-height:1.6;color:var(--text-2);">${esc(ex.notes)}</p>
          </div>
        ` : ''}

        ${ex.custom ? `
          <button class="btn btn-danger btn-full mt-8" id="btn-delete-custom-ex">Delete Custom Exercise</button>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-detail-back').addEventListener('click', () => {
      this._detailId = null;
      this.render();
    });

    const delBtn = document.getElementById('btn-delete-custom-ex');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        Store.deleteCustomExercise(ex.id);
        this._detailId = null;
        this.render();
        showToast('Exercise deleted');
      });
    }
  },

  _openCustomExerciseForm() {
    openModal(`
      <div class="modal-title">Create Custom Exercise</div>
      <div class="modal-body">
        <div class="input-group">
          <label class="input-label">Name</label>
          <input type="text" class="input" id="ce-name" placeholder="e.g. Landmine Press">
        </div>
        <div class="input-group">
          <label class="input-label">Target Muscle</label>
          <select class="input" id="ce-muscle">
            ${MUSCLE_GROUPS.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Instructions</label>
          <textarea class="input" id="ce-instructions" placeholder="How to perform this exercise" rows="3"></textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Notes</label>
          <textarea class="input" id="ce-notes" placeholder="Optional personal notes" rows="2"></textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Custom Animation URL</label>
          <input type="text" class="input" id="ce-animation" placeholder="https://... (GIF or MP4)">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="ce-cancel">Cancel</button>
        <button class="btn btn-primary" id="ce-save">Create</button>
      </div>
    `);

    document.getElementById('ce-cancel').addEventListener('click', closeModal);
    document.getElementById('ce-save').addEventListener('click', () => {
      const name = document.getElementById('ce-name').value.trim();
      if (!name) { showToast('Please enter a name'); return; }
      Store.addCustomExercise({
        name,
        muscle: document.getElementById('ce-muscle').value,
        instructions: document.getElementById('ce-instructions').value.trim(),
        notes: document.getElementById('ce-notes').value.trim(),
        animationUrl: document.getElementById('ce-animation').value.trim()
      });
      closeModal();
      showToast('Exercise added to library');
      this.render();
    });
  }
};
