/* ============================================
   ARSA — Dashboard Screen
   ============================================ */

const Dashboard = {
  render() {
    const screen = document.getElementById('screen-dashboard');
    const stats = Store.getStats();
    const settings = Store.data.settings;

    screen.innerHTML = `
      <div class="dashboard-header fade-in">
        <div class="dashboard-greeting">${Fmt.greeting()}</div>
        <div class="dashboard-name">Ready to train${settings.name && settings.name !== 'Lifter' ? ', ' + settings.name : ''}?</div>
      </div>

      <div class="streak-ring-wrap fade-in">
        ${this._renderStreakRing(stats.currentStreak)}
      </div>

      ${this._renderTodayWorkout()}

      <div class="section-label mt-8">This Month</div>
      <div class="stats-grid">
        <div class="stat-card accent-green">
          <div class="stat-card-value">${stats.currentStreak}</div>
          <div class="stat-card-label">Current Streak</div>
        </div>
        <div class="stat-card accent-blue">
          <div class="stat-card-value">${stats.longestStreak}</div>
          <div class="stat-card-label">Longest Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.workoutsThisMonth}</div>
          <div class="stat-card-label">Workouts This Month</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.totalWorkouts}</div>
          <div class="stat-card-label">Total Workouts</div>
        </div>
      </div>

      <div class="section-label mt-8">Recent Personal Records</div>
      ${this._renderRecentPRs()}

      <div class="section-label mt-8">This Month</div>
      ${this._renderMiniCalendar()}
    `;

    this._bindEvents();
  },

  _renderStreakRing(streak) {
    const maxDisplay = 30;
    const pct = Math.min(streak / maxDisplay, 1);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - pct);

    return `
      <div class="streak-ring-container">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#60A5FA"/>
              <stop offset="100%" stop-color="#4ADE80"/>
            </linearGradient>
          </defs>
          <circle class="streak-ring-bg" cx="70" cy="70" r="${radius}"/>
          <circle class="streak-ring-fill" cx="70" cy="70" r="${radius}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${streak === 0 ? circumference : offset}"/>
        </svg>
        <div class="streak-ring-inner">
          <div class="streak-ring-number">${streak}</div>
          <div class="streak-ring-label">Day Streak</div>
        </div>
      </div>
    `;
  },

  _renderTodayWorkout() {
    const today = new Date().getDay(); // 0=Sun
    const workouts = Store.getWorkouts();
    const scheduled = workouts.find(w => (w.scheduledDays || []).includes(today));

    if (scheduled) {
      const estTime = scheduled.exercises.reduce((sum, ex) => {
        const sets = Number(ex.sets) || 3;
        return sum + sets * 3; // rough estimate: 3 min per set incl rest
      }, 0);
      return `
        <div class="today-workout-card fade-in">
          <div class="today-workout-tag">Today's Workout</div>
          <div class="today-workout-name">${scheduled.icon} ${esc(scheduled.name)}</div>
          <div class="today-workout-meta">${scheduled.exercises.length} Exercises &middot; Estimated Time: ${estTime} min</div>
          <button class="btn btn-on-blue btn-full" id="btn-start-today" data-id="${scheduled.id}">Start Workout</button>
        </div>
      `;
    }

    return `
      <div class="no-workout-card fade-in">
        <div class="no-workout-icon">🌙</div>
        <div class="no-workout-text">No workout scheduled today.</div>
        <button class="btn btn-outline mt-4" id="btn-pick-workout">Pick a Workout</button>
      </div>
    `;
  },

  _renderRecentPRs() {
    const prs = Store.getAllPRs()
      .sort((a, b) => new Date(b.maxWeightDate) - new Date(a.maxWeightDate))
      .slice(0, 3);

    if (prs.length === 0) {
      return `<div class="px-20"><div class="card" style="text-align:center; color: var(--text-3); font-size: 14px;">No records yet — complete a workout to set your first PR.</div></div>`;
    }

    return `
      <div class="pr-list">
        ${prs.map(pr => `
          <div class="pr-item">
            <div>
              <div class="pr-exercise">${esc(pr.name)}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${Fmt.date(pr.maxWeightDate)}</div>
            </div>
            <div style="text-align:right;">
              <div class="pr-value">${Fmt.weight(pr.maxWeight)} × ${pr.maxWeightReps}</div>
              <span class="pr-new-badge mt-4" style="margin-top:4px;">New PR</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  _renderMiniCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = now.getDate();
    const calendar = Store.data.calendar;
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let cells = dayLabels.map(d => `<div class="cal-day header">${d}</div>`).join('');

    for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let cls = 'cal-day';
      if (day === todayDate) cls += ' today';
      else if (calendar[dateKey] && calendar[dateKey].completed) cls += ' completed';
      else if (day > todayDate) cls += ' future';
      else cls += ' missed';
      cells += `<div class="${cls}" data-date="${dateKey}">${day}</div>`;
    }

    return `
      <div class="mini-cal">
        <div class="mini-cal-header"><span>${monthName}</span></div>
        <div class="mini-cal-grid">${cells}</div>
      </div>
    `;
  },

  _bindEvents() {
    const startBtn = document.getElementById('btn-start-today');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        Session.start(startBtn.dataset.id);
      });
    }
    const pickBtn = document.getElementById('btn-pick-workout');
    if (pickBtn) {
      pickBtn.addEventListener('click', () => {
        App.navigateTo('workouts');
      });
    }
    document.querySelectorAll('.cal-day[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        const date = el.dataset.date;
        const entry = Store.data.calendar[date];
        if (entry && entry.historyId) {
          Progress.showHistoryDetail(entry.historyId);
        }
      });
    });
  }
};

// Simple HTML escape utility used across modules
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
