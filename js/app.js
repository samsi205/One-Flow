/* ============================================
   One-Flow — App Entry Point
   ============================================ */

let currentView = 'timer';

/**
 * Initialize the app on page load.
 */
function initApp() {
  const data = loadData();
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Auto-select first project if none active
  const activeProjects = getActiveProjects(data);
  if (!data.settings.activeProjectId && activeProjects.length > 0) {
    data.settings.activeProjectId = activeProjects[0].id;
    saveData(data);
  }

  // Render initial view
  navigateTo('timer');

  // Removed visibilitychange listener - The interval delta naturally handles background throttling accurately now.

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Space = toggle timer (only on timer view)
    if (e.code === 'Space' && currentView === 'timer' && !document.querySelector('.modal-overlay')) {
      e.preventDefault();
      const data = loadData();
      const project = findProject(data, data.settings.activeProjectId);
      if (project && project.remainingSeconds > 0) {
        toggleTimer();
      }
    }
  });

  console.log('[One-Flow] App initialized ✓');
}

/**
 * Navigate to a view.
 * @param {'timer'|'projects'|'stats'} view
 */
function navigateTo(view) {
  currentView = view;
  const data = loadData();

  // Hide all views
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));

  // Show target view
  const target = document.getElementById(`${view}-view`);
  if (target) target.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Render view content
  switch (view) {
    case 'timer':
      renderTimerView(data);
      break;
    case 'projects':
      renderProjects(data);
      break;
    case 'stats':
      renderStats(data);
      break;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
