/* ============================================
   ARSA — Workouts Screen (List + Builder)
   ============================================ */

const WORKOUT_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#06B6D4', '#EC4899', '#64748B'];
const WORKOUT_ICONS = ['💪', '🏋️', '🦵', '🔥', '⚡', '🎯', '🧘', '🤸', '🏃', '⚙️'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Workouts = {
  _draft: null, // in-progress workout being built

  render() {
    const screen = document.getElementById('screen-workouts');
    const workouts = Store.getWorkouts();

    screen.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">Workouts</h1>
        <button class="btn btn-primary btn-icon" id="btn-new-workout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      ${workouts.length === 0 ? `
        <div class="empty-state fade-in">
          <div class="empty-state-icon">🗂️</div>
          <h3>No workouts yet</h3>
          <p>Build your own routine — Upper Day, Push, Legs, or anything you want. Arsa never forces a structure on you.</p>
          <button class="btn btn-primary mt-8" id="btn-new-workout-2">Create Your First Workout</button>
        </div>
      ` : `
        <div class="workout-list fade-in">
          ${workouts.map(w => this._renderWorkoutItem(w)).join('')}
        </div>
      `}
    `;

    document.getElementById('btn-new-workout').addEventListener('click', () => this.openBuilder());
    const btn2 = document.getElementById('btn-new-workout-2');
    if (btn2) btn2.addEventListener('click', () => this.openBuilder());

    document.querySelectorAll('.workout-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-start]')) return;
        this.openBuilder(el.dataset.id);
      });
    });
  },

  _renderWorkoutItem(w) {
    const scheduleStr = (w.scheduledDays && w.scheduledDays.length)
      ? w.scheduledDays.map(d => WEEKDAYS[d]).join(', ')
      : 'Not scheduled';
    return `
      <div class="workout-item" data-id="${w.id}" style="--workout-color:${w.color}">
        <div class="workout-color-tag" style="background:${w.color}"></div>
        <div class="workout-icon">${w.icon}</div>
        <div class="workout-info">
          <div class="workout-item-name">${esc(w.name)}</div>
          <div class="workout-item-meta">${w.exercises.length} exercises &middot; ${scheduleStr}</div>
        </div>
        <button class="btn btn-success btn-sm" data-start="${w.id}">Start</button>
      </div>
    `;
  },

  // ---- BUILDER ----
  openBuilder(workoutId = null) {
    if (workoutId) {
      const existing = Store.getWorkout(workoutId);
      this._draft = JSON.parse(JSON.stringify(existing));
    } else {
      this._draft = {
        id: null,
        name: '',
        description: '',
        color: WORKOUT_COLORS[0],
        icon: WORKOUT_ICONS[0],
        exercises: [],
        scheduledDays: []
      };
    }
    this._renderBuilder();
  },

  _renderBuilder() {
    const screen = document.getElementById('screen-workouts');
    const d = this._draft;
    const isEdit = !!d.id;

    screen.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" style="padding:0;" id="btn-builder-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          Workouts
        </button>
      </div>
      <h1 class="screen-title" style="font-size:22px;">${isEdit ? 'Edit Workout' : 'New Workout'}</h1>

      <div class="form-section mt-4">
        <div class="input-group">
          <label class="input-label">Workout Name</label>
          <input type="text" class="input" id="wb-name" placeholder="e.g. Upper Day" value="${esc(d.name)}">
        </div>
        <div class="input-group">
          <label class="input-label">Description</label>
          <textarea class="input" id="wb-desc" placeholder="Optional notes about this workout" rows="2">${esc(d.description)}</textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Color Tag</label>
          <div class="color-picker" id="wb-colors">
            ${WORKOUT_COLORS.map(c => `<div class="color-dot ${c === d.color ? 'selected' : ''}" style="background:${c}" data-color="${c}"></div>`).join('')}
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Icon</label>
          <div class="icon-picker" id="wb-icons">
            ${WORKOUT_ICONS.map(i => `<div class="icon-opt ${i === d.icon ? 'selected' : ''}" data-icon="${i}">${i}</div>`).join('')}
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Schedule Days (optional)</label>
          <div class="color-picker" id="wb-days">
            ${WEEKDAYS.map((day, idx) => `
              <div class="icon-opt ${d.scheduledDays.includes(idx) ? 'selected' : ''}" style="width:auto;padding:0 12px;font-size:13px;font-weight:600;" data-day="${idx}">${day}</div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="section-label mt-8" style="display:flex;align-items:center;justify-content:space-between;padding-right:20px;">
        <span>Exercises (${d.exercises.length})</span>
        <button class="btn btn-sm btn-outline" id="btn-add-exercise">+ Add</button>
      </div>

      <div class="exercise-list-builder" id="wb-exercise-list">
        ${d.exercises.length === 0 ? `
          <div class="empty-state" style="padding:30px 20px;">
            <div class="empty-state-icon" style="font-size:32px;">🏋️</div>
            <p>Add exercises from the library or create your own.</p>
          </div>
        ` : d.exercises.map((ex, idx) => this._renderExerciseBuilderItem(ex, idx)).join('')}
      </div>

      <div class="form-section mt-8" style="padding-bottom: 12px;">
        <button class="btn btn-primary btn-full" id="btn-save-workout">${isEdit ? 'Save Changes' : 'Create Workout'}</button>
        ${isEdit ? `<button class="btn btn-danger btn-full" id="btn-delete-workout">Delete Workout</button>` : ''}
      </div>
    `;

    this._bindBuilderEvents();
  },

  _renderExerciseBuilderItem(ex, idx) {
    return `
      <div class="exercise-builder-item" draggable="true" data-idx="${idx}">
        <div class="exercise-builder-drag drag-handle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
        </div>
        <div class="exercise-builder-info">
          <div class="exercise-builder-name">${esc(ex.name)}</div>
          <div class="exercise-builder-sets">${ex.sets} sets &middot; ${esc(ex.repRange)} reps &middot; ${ex.restTime}s rest</div>
        </div>
        <div class="exercise-builder-actions">
          <button class="btn btn-icon btn-ghost btn-sm" data-dup="${idx}" title="Duplicate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="btn btn-icon btn-ghost btn-sm" data-edit="${idx}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-icon btn-ghost btn-sm" data-remove="${idx}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  },

  _bindBuilderEvents() {
    const d = this._draft;

    document.getElementById('btn-builder-back').addEventListener('click', () => {
      this._draft = null;
      this.render();
    });

    document.getElementById('wb-name').addEventListener('input', e => d.name = e.target.value);
    document.getElementById('wb-desc').addEventListener('input', e => d.description = e.target.value);

    document.querySelectorAll('#wb-colors .color-dot').forEach(el => {
      el.addEventListener('click', () => {
        d.color = el.dataset.color;
        document.querySelectorAll('#wb-colors .color-dot').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    document.querySelectorAll('#wb-icons .icon-opt').forEach(el => {
      el.addEventListener('click', () => {
        d.icon = el.dataset.icon;
        document.querySelectorAll('#wb-icons .icon-opt').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    document.querySelectorAll('#wb-days .icon-opt').forEach(el => {
      el.addEventListener('click', () => {
        const day = Number(el.dataset.day);
        const idx = d.scheduledDays.indexOf(day);
        if (idx > -1) {
          d.scheduledDays.splice(idx, 1);
          el.classList.remove('selected');
        } else {
          d.scheduledDays.push(day);
          el.classList.add('selected');
        }
      });
    });

    document.getElementById('btn-add-exercise').addEventListener('click', () => this._openAddExercise());

    document.querySelectorAll('[data-edit]').forEach(el => {
      el.addEventListener('click', () => this._openAddExercise(Number(el.dataset.edit)));
    });
    document.querySelectorAll('[data-dup]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.dup);
        const copy = JSON.parse(JSON.stringify(d.exercises[idx]));
        copy.id = Store.uid();
        d.exercises.splice(idx + 1, 0, copy);
        this._renderBuilder();
      });
    });
    document.querySelectorAll('[data-remove]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.remove);
        d.exercises.splice(idx, 1);
        this._renderBuilder();
      });
    });

    this._bindDragReorder();

    document.getElementById('btn-save-workout').addEventListener('click', () => this._saveDraft());

    const delBtn = document.getElementById('btn-delete-workout');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        openModal(`
          <div class="modal-title">Delete Workout?</div>
          <div class="modal-body"><p style="color:var(--text-2);">This will permanently delete "${esc(d.name)}". This cannot be undone.</p></div>
          <div class="modal-actions">
            <button class="btn btn-outline" id="cancel-del">Cancel</button>
            <button class="btn btn-danger" id="confirm-del">Delete</button>
          </div>
        `);
        document.getElementById('cancel-del').addEventListener('click', closeModal);
        document.getElementById('confirm-del').addEventListener('click', () => {
          Store.deleteWorkout(d.id);
          closeModal();
          this._draft = null;
          this.render();
          showToast('Workout deleted');
        });
      });
    }
  },

  _bindDragReorder() {
    const list = document.getElementById('wb-exercise-list');
    if (!list) return;
    let dragIdx = null;

    list.querySelectorAll('.exercise-builder-item').forEach(item => {
      item.addEventListener('dragstart', () => {
        dragIdx = Number(item.dataset.idx);
        item.style.opacity = '0.4';
      });
      item.addEventListener('dragend', () => { item.style.opacity = '1'; });
      item.addEventListener('dragover', (e) => e.preventDefault());
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIdx = Number(item.dataset.idx);
        if (dragIdx === null || dragIdx === targetIdx) return;
        const d = this._draft;
        const [moved] = d.exercises.splice(dragIdx, 1);
        d.exercises.splice(targetIdx, 0, moved);
        this._renderBuilder();
      });
    });
  },

  _openAddExercise(editIdx = null) {
    const d = this._draft;
    const editingExisting = editIdx !== null;
    const ex = editingExisting ? d.exercises[editIdx] : null;

    openModal(`
      <div class="modal-title">${editingExisting ? 'Edit Exercise' : 'Add Exercise'}</div>
      <div class="modal-body">
        ${!editingExisting ? `
          <div class="input-group">
            <label class="input-label">Choose from Library</label>
            <select class="input" id="ae-select">
              <option value="">— Select an exercise —</option>
              ${Store.getAllExercises().map(e => `<option value="${e.id}">${esc(e.name)} (${e.muscle})</option>`).join('')}
            </select>
          </div>
          <div class="divider"></div>
          <label class="input-label">Or enter custom details below</label>
        ` : ''}
        <div class="input-group">
          <label class="input-label">Exercise Name</label>
          <input type="text" class="input" id="ae-name" placeholder="e.g. Machine Chest Press" value="${ex ? esc(ex.name) : ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Sets</label>
          <input type="number" class="input" id="ae-sets" placeholder="4" min="1" value="${ex ? ex.sets : 3}">
        </div>
        <div class="input-group">
          <label class="input-label">Rep Range</label>
          <input type="text" class="input" id="ae-reps" placeholder="8-12" value="${ex ? esc(ex.repRange) : '8-12'}">
        </div>
        <div class="input-group">
          <label class="input-label">Rest Time (seconds)</label>
          <input type="number" class="input" id="ae-rest" placeholder="90" min="0" value="${ex ? ex.restTime : 90}">
        </div>
        <div class="input-group">
          <label class="input-label">Notes</label>
          <textarea class="input" id="ae-notes" placeholder="Optional" rows="2">${ex ? esc(ex.notes || '') : ''}</textarea>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="ae-cancel">Cancel</button>
        <button class="btn btn-primary" id="ae-save">${editingExisting ? 'Save' : 'Add'}</button>
      </div>
    `);

    const selectEl = document.getElementById('ae-select');
    if (selectEl) {
      selectEl.addEventListener('change', () => {
        const lib = Store.getExerciseById(selectEl.value);
        if (lib) document.getElementById('ae-name').value = lib.name;
      });
    }

    document.getElementById('ae-cancel').addEventListener('click', closeModal);
    document.getElementById('ae-save').addEventListener('click', () => {
      const name = document.getElementById('ae-name').value.trim();
      if (!name) { showToast('Please enter an exercise name'); return; }
      const sets = Number(document.getElementById('ae-sets').value) || 3;
      const repRange = document.getElementById('ae-reps').value.trim() || '8-12';
      const restTime = Number(document.getElementById('ae-rest').value) || 90;
      const notes = document.getElementById('ae-notes').value.trim();
      const libId = selectEl ? selectEl.value : (ex ? ex.exerciseId : '');

      if (editingExisting) {
        Object.assign(ex, { name, sets, repRange, restTime, notes });
      } else {
        d.exercises.push({
          id: Store.uid(),
          exerciseId: libId || null,
          name, sets, repRange, restTime, notes
        });
      }
      closeModal();
      this._renderBuilder();
    });
  },

  _saveDraft() {
    const d = this._draft;
    if (!d.name.trim()) { showToast('Please name your workout'); return; }
    if (d.exercises.length === 0) { showToast('Add at least one exercise'); return; }

    if (d.id) {
      Store.updateWorkout(d.id, d);
      showToast('Workout updated');
    } else {
      Store.createWorkout(d);
      showToast('Workout created');
    }
    this._draft = null;
    this.render();
  }
};

document.addEventListener('click', (e) => {
  const startBtn = e.target.closest('[data-start]');
  if (startBtn) {
    e.stopPropagation();
    Session.start(startBtn.dataset.start);
  }
});
