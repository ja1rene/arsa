/* ============================================
   ARSA — Workout Session
   Live tracking screen: timer, per-set logging,
   auto-save, rest timer, completion summary.
   ============================================ */

const Session = {
  _workout: null,
  _startTime: null,
  _elapsedInterval: null,
  _elapsedSeconds: 0,
  _logs: {},       // { exerciseIdx: [{weight, reps, completed}] }
  _restInterval: null,
  _restSeconds: 0,

  start(workoutId) {
    const workout = Store.getWorkout(workoutId);
    if (!workout) { showToast('Workout not found'); return; }

    this._workout = workout;
    this._startTime = Date.now();
    this._elapsedSeconds = 0;
    this._logs = {};

    workout.exercises.forEach((ex, idx) => {
      const sets = Number(ex.sets) || 3;
      this._logs[idx] = Array.from({ length: sets }, () => ({ weight: '', reps: '', completed: false }));
    });

    document.getElementById('workout-session').classList.remove('hidden');
    this._render();
    this._elapsedInterval = setInterval(() => {
      this._elapsedSeconds = Math.floor((Date.now() - this._startTime) / 1000);
      this._updateTimerDisplay();
    }, 1000);
  },

  _getPrevSetData(exIdx, setIdx) {
    // Look at history for this exercise to show previous performance as a ghost value
    const name = this._workout.exercises[exIdx].name;
    const history = Store.getHistory();
    for (const h of history) {
      const match = (h.exercises || []).find(e => e.name === name);
      if (match && match.sets) {
        const found = match.sets.find(s => s.setIndex === setIdx && s.completed);
        if (found) return found;
      }
    }
    return null;
  },

  _render() {
    const overlay = document.getElementById('workout-session');
    const w = this._workout;
    const totalSets = Object.values(this._logs).reduce((s, arr) => s + arr.length, 0);
    const completedSets = Object.values(this._logs).reduce((s, arr) => s + arr.filter(x => x.completed).length, 0);
    const pct = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;

    overlay.innerHTML = `
      <div class="session-header">
        <div class="session-header-top">
          <div>
            <div class="session-workout-name">${w.icon} ${esc(w.name)}</div>
            <div class="session-progress-text" id="session-progress-text">${completedSets} / ${totalSets} sets complete</div>
          </div>
          <div style="text-align:right;">
            <div class="session-timer" id="session-timer">${Fmt.timer(this._elapsedSeconds)}</div>
            <button class="btn btn-ghost btn-sm" id="btn-cancel-session" style="padding:4px 0;color:var(--text-3);">Cancel</button>
          </div>
        </div>
        <div class="session-progress-bar"><div class="session-progress-fill" id="session-progress-fill" style="width:${pct}%"></div></div>
      </div>

      <div class="session-body" id="session-body">
        ${w.exercises.map((ex, idx) => this._renderExerciseCard(ex, idx)).join('')}
        <button class="btn btn-success btn-full mt-4" id="btn-finish-workout" style="margin-bottom: 20px;">Finish Workout</button>
      </div>

      <div class="rest-timer-overlay" id="rest-timer-overlay">
        <div>
          <div class="rest-timer-label">Rest</div>
          <div class="rest-timer-value" id="rest-timer-value">00:00</div>
        </div>
        <button class="btn btn-outline btn-sm" id="btn-skip-rest">Skip</button>
      </div>
    `;

    this._bindEvents();
  },

  _renderExerciseCard(ex, idx) {
    const sets = this._logs[idx];
    const allComplete = sets.every(s => s.completed);
    const anyComplete = sets.some(s => s.completed);
    let cls = 'session-exercise';
    if (allComplete) cls += ' completed';
    else if (anyComplete) cls += ' active';

    return `
      <div class="${cls}" data-ex-idx="${idx}">
        <div class="session-ex-header">
          <div>
            <div class="session-ex-name">${esc(ex.name)}</div>
            <div class="session-ex-meta">${ex.sets} sets &middot; ${esc(ex.repRange)} reps &middot; ${ex.restTime}s rest</div>
          </div>
          ${allComplete ? '<span class="badge badge-green">Done</span>' : ''}
        </div>
        <div class="set-headers">
          <div></div>
          <div class="set-header-label">Weight</div>
          <div class="set-header-label">Reps</div>
          <div></div>
        </div>
        <div class="set-list">
          ${sets.map((s, sIdx) => this._renderSetRow(idx, sIdx, s, ex)).join('')}
        </div>
      </div>
    `;
  },

  _renderSetRow(exIdx, setIdx, set, ex) {
    const prev = this._getPrevSetData(exIdx, setIdx);
    const weightPlaceholder = prev ? String(prev.weight) : '0';
    const repsPlaceholder = prev ? String(prev.reps) : '0';
    return `
      <div class="set-row" data-ex="${exIdx}" data-set="${setIdx}">
        <div class="set-num">${setIdx + 1}</div>
        <input type="number" inputmode="decimal" class="set-input" data-field="weight" data-ex="${exIdx}" data-set="${setIdx}"
          placeholder="${weightPlaceholder}" value="${set.weight}">
        <input type="number" inputmode="numeric" class="set-input" data-field="reps" data-ex="${exIdx}" data-set="${setIdx}"
          placeholder="${repsPlaceholder}" value="${set.reps}">
        <div class="set-check ${set.completed ? 'done' : ''}" data-ex="${exIdx}" data-set="${setIdx}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    document.getElementById('btn-cancel-session').addEventListener('click', () => this._confirmCancel());
    document.getElementById('btn-finish-workout').addEventListener('click', () => this._confirmFinish());
    document.getElementById('btn-skip-rest').addEventListener('click', () => this._stopRestTimer());

    this._bindSetRowEvents(document.getElementById('session-body'));
  },

  _bindSetRowEvents(container) {
    container.querySelectorAll('.set-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const exIdx = Number(e.target.dataset.ex);
        const setIdx = Number(e.target.dataset.set);
        const field = e.target.dataset.field;
        this._logs[exIdx][setIdx][field] = e.target.value;
      });
    });

    container.querySelectorAll('.set-check').forEach(check => {
      check.addEventListener('click', () => {
        const exIdx = Number(check.dataset.ex);
        const setIdx = Number(check.dataset.set);
        const log = this._logs[exIdx][setIdx];

        if (!log.completed) {
          if (log.weight === '') {
            const prev = this._getPrevSetData(exIdx, setIdx);
            log.weight = prev ? prev.weight : 0;
          }
          if (log.reps === '') {
            const prev = this._getPrevSetData(exIdx, setIdx);
            log.reps = prev ? prev.reps : 0;
          }
          log.completed = true;
          this._startRestTimer(this._workout.exercises[exIdx].restTime);
        } else {
          log.completed = false;
        }
        this._refreshProgress();
        this._refreshExerciseCard(exIdx);
      });
    });
  },

  _refreshExerciseCard(exIdx) {
    const body = document.getElementById('session-body');
    const oldCard = body.querySelector(`.session-exercise[data-ex-idx="${exIdx}"]`);
    if (!oldCard) return;
    const ex = this._workout.exercises[exIdx];
    oldCard.outerHTML = this._renderExerciseCard(ex, exIdx);
    const newCard = body.querySelector(`.session-exercise[data-ex-idx="${exIdx}"]`);
    this._bindSetRowEvents(newCard);
  },

  _refreshProgress() {
    const totalSets = Object.values(this._logs).reduce((s, arr) => s + arr.length, 0);
    const completedSets = Object.values(this._logs).reduce((s, arr) => s + arr.filter(x => x.completed).length, 0);
    const pct = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
    document.getElementById('session-progress-text').textContent = `${completedSets} / ${totalSets} sets complete`;
    document.getElementById('session-progress-fill').style.width = `${pct}%`;
  },

  _updateTimerDisplay() {
    const el = document.getElementById('session-timer');
    if (el) el.textContent = Fmt.timer(this._elapsedSeconds);
  },

  _startRestTimer(seconds) {
    if (!seconds || seconds <= 0) return;
    this._stopRestTimer();
    this._restSeconds = seconds;
    const overlay = document.getElementById('rest-timer-overlay');
    overlay.classList.add('visible');
    this._updateRestDisplay();
    this._restInterval = setInterval(() => {
      this._restSeconds--;
      if (this._restSeconds <= 0) {
        this._stopRestTimer();
        if (navigator.vibrate) navigator.vibrate(200);
        showToast('Rest complete — next set!');
        return;
      }
      this._updateRestDisplay();
    }, 1000);
  },

  _updateRestDisplay() {
    const el = document.getElementById('rest-timer-value');
    if (el) el.textContent = Fmt.timer(Math.max(0, this._restSeconds));
  },

  _stopRestTimer() {
    clearInterval(this._restInterval);
    this._restInterval = null;
    const overlay = document.getElementById('rest-timer-overlay');
    if (overlay) overlay.classList.remove('visible');
  },

  _confirmCancel() {
    openModal(`
      <div class="modal-title">Cancel Workout?</div>
      <div class="modal-body"><p style="color:var(--text-2);">Your progress for this session will not be saved.</p></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="cancel-no">Keep Going</button>
        <button class="btn btn-danger" id="cancel-yes">Cancel Workout</button>
      </div>
    `);
    document.getElementById('cancel-no').addEventListener('click', closeModal);
    document.getElementById('cancel-yes').addEventListener('click', () => {
      closeModal();
      this._end();
    });
  },

  _confirmFinish() {
    const totalSets = Object.values(this._logs).reduce((s, arr) => s + arr.length, 0);
    const completedSets = Object.values(this._logs).reduce((s, arr) => s + arr.filter(x => x.completed).length, 0);
    if (completedSets === 0) {
      openModal(`
        <div class="modal-title">No Sets Logged</div>
        <div class="modal-body"><p style="color:var(--text-2);">Log at least one set before finishing, or cancel the workout instead.</p></div>
        <div class="modal-actions"><button class="btn btn-primary btn-full" id="ok-modal">Got It</button></div>
      `);
      document.getElementById('ok-modal').addEventListener('click', closeModal);
      return;
    }
    if (completedSets < totalSets) {
      openModal(`
        <div class="modal-title">Finish Early?</div>
        <div class="modal-body"><p style="color:var(--text-2);">You've completed ${completedSets} of ${totalSets} sets. Finish anyway?</p></div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="finish-no">Keep Going</button>
          <button class="btn btn-success" id="finish-yes">Finish Workout</button>
        </div>
      `);
      document.getElementById('finish-no').addEventListener('click', closeModal);
      document.getElementById('finish-yes').addEventListener('click', () => {
        closeModal();
        this._finishWorkout();
      });
    } else {
      this._finishWorkout();
    }
  },

  _finishWorkout() {
    clearInterval(this._elapsedInterval);
    this._stopRestTimer();

    const w = this._workout;
    let totalSets = 0, totalVolume = 0;
    const newPRs = [];

    const exercisesLog = w.exercises.map((ex, idx) => {
      const sets = this._logs[idx]
        .map((s, setIdx) => ({ s, setIdx }))
        .filter(({ s }) => s.completed)
        .map(({ s, setIdx }) => ({
          setIndex: setIdx,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          completed: true
        }));
      totalSets += sets.length;
      sets.forEach(s => {
        totalVolume += s.weight * s.reps;
        if (ex.exerciseId && s.weight > 0) {
          const isPR = Store.checkAndUpdatePR(ex.exerciseId, ex.name, s.weight, s.reps);
          if (isPR) newPRs.push({ name: ex.name, weight: s.weight, reps: s.reps });
        }
      });
      return { exerciseId: ex.exerciseId, name: ex.name, sets };
    });

    const entry = {
      workoutId: w.id,
      workoutName: w.name,
      date: new Date().toISOString(),
      duration: this._elapsedSeconds,
      exercises: exercisesLog,
      totalSets,
      totalVolume
    };

    Store.addHistoryEntry(entry);
    const unlocked = checkAchievements();

    this._showSummary(entry, newPRs, unlocked);
  },

  _showSummary(entry, newPRs, unlocked) {
    const overlay = document.getElementById('workout-session');
    overlay.innerHTML = `
      <div class="session-body" style="padding-top: calc(var(--safe-top) + 40px);">
        <div class="completion-screen fade-in">
          <div class="completion-icon">🎉</div>
          <div class="completion-title">Workout Complete</div>
          <div class="completion-sub">${esc(entry.workoutName)} &middot; ${Fmt.dateLong(entry.date)}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-stat">
            <div class="summary-stat-val">${Fmt.duration(entry.duration)}</div>
            <div class="summary-stat-label">Duration</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-val">${entry.exercises.length}</div>
            <div class="summary-stat-label">Exercises</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-val">${entry.totalSets}</div>
            <div class="summary-stat-label">Total Sets</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-val">${Fmt.number(entry.totalVolume)}</div>
            <div class="summary-stat-label">Volume (${Store.data.settings.units})</div>
          </div>
        </div>

        ${newPRs.length ? `
          <div class="section-label mt-8">New Personal Records 🏆</div>
          <div class="pr-list">
            ${newPRs.map(pr => `
              <div class="pr-item">
                <div class="pr-exercise">${esc(pr.name)}</div>
                <div class="pr-value">${Fmt.weight(pr.weight)} × ${pr.reps}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${unlocked.length ? `
          <div class="section-label mt-8">Achievements Unlocked 🎖️</div>
          <div class="achievement-grid">
            ${unlocked.map(a => `
              <div class="achievement-card unlocked">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-name">${a.name}</div>
                <div class="achievement-desc">${a.desc}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="form-section mt-8" style="padding-bottom:30px;">
          <button class="btn btn-primary btn-full" id="btn-done-summary">Done</button>
        </div>
      </div>
    `;
    document.getElementById('btn-done-summary').addEventListener('click', () => this._end());
  },

  _end() {
    clearInterval(this._elapsedInterval);
    this._stopRestTimer();
    document.getElementById('workout-session').classList.add('hidden');
    this._workout = null;
    App.navigateTo('dashboard');
  }
};
