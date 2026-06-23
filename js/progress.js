/* ============================================
   ARSA — Progress Screen
   Exercise charts, PRs, body weight, achievements,
   stats overview, and workout history.
   ============================================ */

const Progress = {
  _tab: 'overview', // overview | exercise | achievements | history
  _selectedExerciseId: null,
  _historyDetailId: null,

  render() {
    if (this._historyDetailId) {
      this._renderHistoryDetail(this._historyDetailId);
      return;
    }

    const screen = document.getElementById('screen-progress');
    screen.innerHTML = `
      <h1 class="screen-title">Progress</h1>
      <div class="progress-tabs mt-4">
        <div class="progress-tab ${this._tab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</div>
        <div class="progress-tab ${this._tab === 'exercise' ? 'active' : ''}" data-tab="exercise">Exercise</div>
        <div class="progress-tab ${this._tab === 'achievements' ? 'active' : ''}" data-tab="achievements">Awards</div>
        <div class="progress-tab ${this._tab === 'history' ? 'active' : ''}" data-tab="history">History</div>
      </div>
      <div id="progress-content"></div>
    `;

    document.querySelectorAll('.progress-tab').forEach(el => {
      el.addEventListener('click', () => {
        this._tab = el.dataset.tab;
        this.render();
      });
    });

    this._renderTabContent();
  },

  _renderTabContent() {
    const container = document.getElementById('progress-content');
    if (this._tab === 'overview') container.innerHTML = this._renderOverview();
    else if (this._tab === 'exercise') container.innerHTML = this._renderExerciseTab();
    else if (this._tab === 'achievements') container.innerHTML = this._renderAchievements();
    else if (this._tab === 'history') container.innerHTML = this._renderHistory();

    this._bindTabEvents();
  },

  // ---------- OVERVIEW ----------
  _renderOverview() {
    const stats = Store.getStats();
    const weightLogs = Store.getWeightLogs();
    const latestWeight = weightLogs.length ? weightLogs[weightLogs.length - 1] : null;

    return `
      <div class="section-label mt-4">All-Time Stats</div>
      <div class="stats-total-grid">
        <div class="stat-total-card accent-blue"><div class="stat-total-value">${stats.totalWorkouts}</div><div class="stat-total-label">Total Workouts</div></div>
        <div class="stat-total-card"><div class="stat-total-value">${stats.totalExercises}</div><div class="stat-total-label">Total Exercises</div></div>
        <div class="stat-total-card"><div class="stat-total-value">${Fmt.number(stats.totalSets)}</div><div class="stat-total-label">Total Sets</div></div>
        <div class="stat-total-card"><div class="stat-total-value">${Fmt.number(stats.totalReps)}</div><div class="stat-total-label">Total Reps</div></div>
        <div class="stat-total-card accent-green"><div class="stat-total-value">${Fmt.number(stats.totalVolume)}</div><div class="stat-total-label">Total Volume (${Store.data.settings.units})</div></div>
        <div class="stat-total-card accent-purple"><div class="stat-total-value">${stats.trainingHours}h</div><div class="stat-total-label">Training Hours</div></div>
      </div>

      <div class="section-label mt-8" style="display:flex;justify-content:space-between;align-items:center;padding-right:20px;">
        <span>Body Weight</span>
        <button class="btn btn-sm btn-outline" id="btn-log-weight">+ Log Weight</button>
      </div>
      <div class="chart-wrap">
        <div class="chart-title">${latestWeight ? `Current: ${Fmt.weight(latestWeight.weight)}` : 'No entries yet'}</div>
        <div class="chart-canvas-wrap">
          ${weightLogs.length >= 2 ? `<canvas class="arsa-chart" id="weight-chart"></canvas>` : `<div class="chart-no-data">Log your weight at least twice to see a trend.</div>`}
        </div>
      </div>
      ${weightLogs.length ? `
        <div class="weight-log-list">
          ${weightLogs.slice().reverse().slice(0, 5).map(w => `
            <div class="weight-log-item">
              <span class="weight-log-date">${Fmt.date(w.date)}</span>
              <span class="weight-log-val">${Fmt.weight(w.weight)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  },

  _bindOverviewChart() {
    const canvas = document.getElementById('weight-chart');
    if (canvas) {
      const logs = Store.getWeightLogs();
      drawLineChart(canvas, logs.map(l => l.weight), logs.map(l => Fmt.date(l.date)), { color: '#22C55E' });
    }
    const btn = document.getElementById('btn-log-weight');
    if (btn) btn.addEventListener('click', () => this._openLogWeight());
  },

  _openLogWeight() {
    openModal(`
      <div class="modal-title">Log Body Weight</div>
      <div class="modal-body">
        <div class="input-group">
          <label class="input-label">Weight (${Store.data.settings.units})</label>
          <input type="number" inputmode="decimal" class="input" id="lw-weight" placeholder="e.g. 72.5">
        </div>
        <div class="input-group">
          <label class="input-label">Date</label>
          <input type="date" class="input" id="lw-date" value="${Store.todayStr()}">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="lw-cancel">Cancel</button>
        <button class="btn btn-primary" id="lw-save">Save</button>
      </div>
    `);
    document.getElementById('lw-cancel').addEventListener('click', closeModal);
    document.getElementById('lw-save').addEventListener('click', () => {
      const weight = Number(document.getElementById('lw-weight').value);
      const date = document.getElementById('lw-date').value;
      if (!weight || weight <= 0) { showToast('Enter a valid weight'); return; }
      Store.addWeightLog(weight, new Date(date).toISOString());
      closeModal();
      showToast('Weight logged');
      this.render();
    });
  },

  // ---------- EXERCISE TAB ----------
  _renderExerciseTab() {
    const exercisesWithHistory = this._getExercisesWithHistory();

    return `
      <div class="px-20 mt-4">
        <select class="input" id="prog-ex-select">
          <option value="">— Select an exercise —</option>
          ${exercisesWithHistory.map(e => `<option value="${e.id}" ${e.id === this._selectedExerciseId ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}
        </select>
      </div>
      <div id="exercise-progress-detail" class="mt-4">
        ${this._selectedExerciseId ? this._renderExerciseProgress(this._selectedExerciseId) : `
          <div class="empty-state"><div class="empty-state-icon">📈</div><h3>Pick an exercise</h3><p>See your weight, volume, and rep progress over time.</p></div>
        `}
      </div>
    `;
  },

  _getExercisesWithHistory() {
    const history = Store.getHistory();
    const seen = new Map();
    history.forEach(h => {
      (h.exercises || []).forEach(ex => {
        if (ex.exerciseId && !seen.has(ex.exerciseId)) {
          seen.set(ex.exerciseId, { id: ex.exerciseId, name: ex.name });
        }
      });
    });
    return Array.from(seen.values());
  },

  _renderExerciseProgress(exerciseId) {
    const history = Store.getHistory().slice().reverse(); // chronological
    const dataPoints = [];
    history.forEach(h => {
      const match = (h.exercises || []).find(e => e.exerciseId === exerciseId);
      if (match && match.sets.length) {
        const maxWeightSet = match.sets.reduce((a, b) => (b.weight > a.weight ? b : a), match.sets[0]);
        const volume = match.sets.reduce((s, set) => s + set.weight * set.reps, 0);
        dataPoints.push({ date: h.date, weight: maxWeightSet.weight, reps: maxWeightSet.reps, volume });
      }
    });

    const pr = Store.getPR(exerciseId);

    return `
      ${pr ? `
        <div class="px-20">
          <div class="card" style="background:var(--bg-2);border:none;border-left:var(--accent-border-width) solid var(--amber);">
            <div style="display:flex;justify-content:space-between;">
              <div><div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600;">Max Weight</div><div style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-top:2px;">${Fmt.weight(pr.maxWeight)}</div></div>
              <div><div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600;">Max Reps</div><div style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-top:2px;">${pr.maxReps}</div></div>
              <div><div style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600;">Max Volume</div><div style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-top:2px;">${Fmt.number(pr.maxVolume)}</div></div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="chart-wrap">
        <div class="chart-title">Weight Progress</div>
        <div class="chart-canvas-wrap">
          ${dataPoints.length >= 2 ? `<canvas class="arsa-chart" id="ex-weight-chart"></canvas>` : `<div class="chart-no-data">Log this exercise a few more times to see a trend.</div>`}
        </div>
      </div>

      <div class="chart-wrap">
        <div class="chart-title">Volume Progress</div>
        <div class="chart-canvas-wrap">
          ${dataPoints.length >= 2 ? `<canvas class="arsa-chart" id="ex-volume-chart"></canvas>` : `<div class="chart-no-data">Not enough data yet.</div>`}
        </div>
      </div>

      <div class="chart-wrap">
        <div class="chart-title">Rep Progress</div>
        <div class="chart-canvas-wrap">
          ${dataPoints.length >= 2 ? `<canvas class="arsa-chart" id="ex-reps-chart"></canvas>` : `<div class="chart-no-data">Not enough data yet.</div>`}
        </div>
      </div>
    `;
  },

  _bindExerciseCharts(exerciseId) {
    const history = Store.getHistory().slice().reverse();
    const dataPoints = [];
    history.forEach(h => {
      const match = (h.exercises || []).find(e => e.exerciseId === exerciseId);
      if (match && match.sets.length) {
        const maxWeightSet = match.sets.reduce((a, b) => (b.weight > a.weight ? b : a), match.sets[0]);
        const volume = match.sets.reduce((s, set) => s + set.weight * set.reps, 0);
        dataPoints.push({ date: h.date, weight: maxWeightSet.weight, reps: maxWeightSet.reps, volume });
      }
    });
    if (dataPoints.length < 2) return;
    const labels = dataPoints.map(d => Fmt.date(d.date));

    const wc = document.getElementById('ex-weight-chart');
    if (wc) drawLineChart(wc, dataPoints.map(d => d.weight), labels, { color: '#2563EB' });
    const vc = document.getElementById('ex-volume-chart');
    if (vc) drawLineChart(vc, dataPoints.map(d => d.volume), labels, { color: '#A855F7' });
    const rc = document.getElementById('ex-reps-chart');
    if (rc) drawLineChart(rc, dataPoints.map(d => d.reps), labels, { color: '#22C55E' });
  },

  // ---------- ACHIEVEMENTS ----------
  _renderAchievements() {
    return `
      <div class="achievement-grid mt-4">
        ${ACHIEVEMENTS.map(a => {
          const unlocked = Store.hasAchievement(a.id);
          return `
            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${a.icon}</div>
              <div class="achievement-name">${a.name}</div>
              <div class="achievement-desc">${a.desc}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ---------- HISTORY ----------
  _renderHistory() {
    const history = Store.getHistory();
    if (history.length === 0) {
      return `<div class="empty-state mt-4"><div class="empty-state-icon">📋</div><h3>No history yet</h3><p>Complete a workout to see it appear here.</p></div>`;
    }
    return `
      <div class="history-list mt-4">
        ${history.map(h => `
          <div class="history-item" data-history-id="${h.id}">
            <div class="history-item-header">
              <span class="history-item-name">${esc(h.workoutName)}</span>
              <span class="history-item-date">${Fmt.date(h.date)}</span>
            </div>
            <div class="history-item-stats">
              <span class="history-stat"><strong>${Fmt.duration(h.duration)}</strong></span>
              <span class="history-stat"><strong>${h.totalSets}</strong> sets</span>
              <span class="history-stat"><strong>${Fmt.number(h.totalVolume)}</strong> ${Store.data.settings.units}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showHistoryDetail(id) {
    this._historyDetailId = id;
    App.navigateTo('progress');
    this.render();
  },

  _renderHistoryDetail(id) {
    const h = Store.getHistory().find(x => x.id === id);
    const screen = document.getElementById('screen-progress');
    if (!h) { this._historyDetailId = null; this.render(); return; }

    screen.innerHTML = `
      <button class="back-btn" id="btn-hist-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Progress
      </button>
      <h1 class="screen-title" style="font-size:22px;padding-top:8px;">${esc(h.workoutName)}</h1>
      <div class="px-20" style="color:var(--text-2);font-size:14px;margin-bottom:16px;">${Fmt.dateLong(h.date)}</div>

      <div class="summary-grid">
        <div class="summary-stat"><div class="summary-stat-val">${Fmt.duration(h.duration)}</div><div class="summary-stat-label">Duration</div></div>
        <div class="summary-stat"><div class="summary-stat-val">${h.exercises.length}</div><div class="summary-stat-label">Exercises</div></div>
        <div class="summary-stat"><div class="summary-stat-val">${h.totalSets}</div><div class="summary-stat-label">Total Sets</div></div>
        <div class="summary-stat"><div class="summary-stat-val">${Fmt.number(h.totalVolume)}</div><div class="summary-stat-label">Volume</div></div>
      </div>

      <div class="section-label mt-8">Exercises</div>
      <div class="exercise-list-builder">
        ${h.exercises.map(ex => `
          <div class="exercise-builder-item" style="cursor:default;">
            <div class="exercise-builder-info" style="flex:1;">
              <div class="exercise-builder-name">${esc(ex.name)}</div>
              <div class="exercise-builder-sets">
                ${ex.sets.map(s => `${s.weight}${Store.data.settings.units}×${s.reps}`).join(', ') || 'No sets logged'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('btn-hist-back').addEventListener('click', () => {
      this._historyDetailId = null;
      this.render();
    });
  },

  _bindTabEvents() {
    if (this._tab === 'overview') {
      this._bindOverviewChart();
    } else if (this._tab === 'exercise') {
      const select = document.getElementById('prog-ex-select');
      if (select) {
        select.addEventListener('change', () => {
          this._selectedExerciseId = select.value || null;
          document.getElementById('exercise-progress-detail').innerHTML = this._selectedExerciseId
            ? this._renderExerciseProgress(this._selectedExerciseId)
            : `<div class="empty-state"><div class="empty-state-icon">📈</div><h3>Pick an exercise</h3><p>See your weight, volume, and rep progress over time.</p></div>`;
          if (this._selectedExerciseId) this._bindExerciseCharts(this._selectedExerciseId);
        });
      }
      if (this._selectedExerciseId) this._bindExerciseCharts(this._selectedExerciseId);
    } else if (this._tab === 'history') {
      document.querySelectorAll('[data-history-id]').forEach(el => {
        el.addEventListener('click', () => this.showHistoryDetail(el.dataset.historyId));
      });
    }
  }
};

// ---------- Minimal Canvas Line Chart (no external deps) ----------
function drawLineChart(canvas, values, labels, opts = {}) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.clearRect(0, 0, w, h);

  const points = values.map((v, i) => {
    const x = padding.left + (i / (values.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return { x, y };
  });

  // Gradient fill under line
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, (opts.color || '#2563EB') + '40');
  gradient.addColorStop(1, (opts.color || '#2563EB') + '00');

  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = opts.color || '#2563EB';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dots
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, i === points.length - 1 ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = opts.color || '#2563EB';
    ctx.fill();
  });

  // First & last label
  ctx.fillStyle = '#64748B';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(labels[0], padding.left, h - 6);
  ctx.textAlign = 'right';
  ctx.fillText(labels[labels.length - 1], w - padding.right, h - 6);
}
