/* ============================================
   ARSA — App Controller
   Bootstraps the app, handles bottom nav routing,
   and registers the service worker.
   ============================================ */

const App = {
  currentScreen: 'dashboard',

  init() {
    Store.load();
    Store.checkStreakBroken();
    checkAchievements();

    this._bindNav();
    this.renderCurrentScreen();
    this._registerServiceWorker();
  },

  _bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateTo(btn.dataset.screen);
      });
    });
  },

  navigateTo(screenName) {
    this.currentScreen = screenName;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenName}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-screen="${screenName}"]`).classList.add('active');

    this.renderCurrentScreen();
  },

  renderCurrentScreen() {
    switch (this.currentScreen) {
      case 'dashboard': Dashboard.render(); break;
      case 'workouts': Workouts.render(); break;
      case 'library': Library.render(); break;
      case 'progress': Progress.render(); break;
      case 'settings': Settings.render(); break;
    }
  },

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(err => {
          console.warn('Arsa: service worker registration failed', err);
        });
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
