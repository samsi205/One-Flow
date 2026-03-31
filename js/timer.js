/* ============================================
   One-Flow — Timer Engine
   ============================================ */

// Timer runtime state (not persisted — lives in memory)
const timerState = {
  running: false,
  intervalId: null,
  sessionStartTime: null,   // ISO string of when current session started
  lastTickTime: null,        // Date.now() of last tick — for accurate delta
  accumulatedSeconds: 0      // Exactly how much time has ticked down in this session (prevents calendar drift/multiplication)
};

/**
 * Handle interrupted sessions (reloads, tab closing)
 */
window.addEventListener('beforeunload', () => {
  if (timerState.running) {
    pauseTimer(); // safely flush remaining session data to localStorage
  }
});

/**
 * Render the timer view.
 * @param {Object} data
 */
function renderTimerView(data) {
  const container = document.getElementById('timer-view');
  const activeProjects = getActiveProjects(data);
  const activeId = data.settings.activeProjectId;
  const project = activeId ? findProject(data, activeId) : null;

  // If no projects exist at all
  if (activeProjects.length === 0) {
    container.innerHTML = `
      <div class="timer-view">
        <div class="empty-state">
          <div class="empty-state__icon">⏱️</div>
          <div class="empty-state__title">No projects yet</div>
          <div class="empty-state__text">Create a project to start your timer.</div>
          <button class="btn btn-primary" style="margin-top: var(--space-4);" onclick="navigateTo('projects'); handleNewProject();">
            + Create Project
          </button>
        </div>
      </div>
    `;
    return;
  }

  // If no project is selected, select the first one
  if (!project || project.archived) {
    data.settings.activeProjectId = activeProjects[0].id;
    saveData(data);
    renderTimerView(data);
    return;
  }

  const isComplete = project.remainingSeconds <= 0;
  const worked = project.targetSeconds - project.remainingSeconds;
  const progressPct = percentage(worked, project.targetSeconds);
  const circumference = 2 * Math.PI * 126; // radius = 126
  const dashOffset = circumference - (progressPct / 100) * circumference;

  // Current date and time display
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Total worked on this project today
  const todaySessions = getSessionsInRange(data, startOfToday(), new Date())
    .filter((s) => s.projectId === project.id);
  const todayWorked = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  const statusClass = timerState.running ? 'running' : (isComplete ? 'completed' : (timerState.sessionStartTime ? 'paused' : ''));

  container.innerHTML = `
    <div class="timer-view">
      <!-- Date & Time -->
      <div style="text-align: center; margin-bottom: var(--space-4);">
        <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: var(--tracking-wide);">${dateStr}</div>
        <div style="font-size: var(--text-sm); color: var(--text-secondary); font-variant-numeric: tabular-nums;" id="live-clock">${timeStr}</div>
      </div>

      <!-- Project Selector -->
      <div class="timer-project-selector-wrapper">
        <button class="timer-project-selector" id="project-selector-btn" onclick="toggleProjectDropdown()">
          <span class="timer-project-selector__dot" style="background: ${project.color}"></span>
          <span class="timer-project-selector__name truncate">${project.name}</span>
          <span class="timer-project-selector__arrow">▾</span>
        </button>
        <div class="timer-project-dropdown" id="project-dropdown" style="display: none;"></div>
      </div>

      <!-- Timer Ring -->
      <div class="timer-ring-container ${statusClass}" id="timer-ring-container"
           style="--timer-color: ${project.color}40;">
        <svg class="timer-ring-svg" viewBox="0 0 264 264">
          <circle class="timer-ring-bg" cx="132" cy="132" r="126" />
          <circle class="timer-ring-progress" cx="132" cy="132" r="126"
                  stroke="${project.color}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${dashOffset}"
                  id="timer-ring-progress" />
        </svg>
        <div class="timer-display">
          <div class="timer-display__time" id="timer-time">${formatTime(project.remainingSeconds)}</div>
          <div class="timer-display__label" id="timer-label">
            ${isComplete ? 'Complete!' : (timerState.running ? 'Working...' : 'Remaining')}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        <button class="timer-btn-reset" id="btn-edit-timer" title="Edit Timer" onclick="handleEditTimer()">
          <span style="font-size: 1.2rem;">✎</span>
        </button>
        ${isComplete ? `
          ${project.type === 'refillable' ? `
            <button class="timer-btn-main start" id="btn-start-pause" title="Refill" onclick="handleRefillAndRestart()">
              🔄
            </button>
          ` : `
            <button class="timer-btn-main start" id="btn-start-pause" title="Complete!" disabled style="opacity:0.5; cursor:default;">
              ✓
            </button>
          `}
        ` : `
          <button class="timer-btn-main ${timerState.running ? 'pause' : 'start'}" 
                  id="btn-start-pause" 
                  title="${timerState.running ? 'Pause' : 'Start'}" 
                  onclick="toggleTimer()">
            ${timerState.running ? '⏸' : '▶'}
          </button>
        `}
        <button class="timer-btn-reset" id="btn-reset" title="Reset timer" onclick="handleResetTimer()">
          ↺
        </button>
      </div>

      <!-- Session info -->
      <div class="timer-session-info">
        <span>Today: </span>
        <span class="timer-session-info__worked" id="today-worked">${formatTimeShort(todayWorked + (timerState.running ? 0 : 0))}</span>
        <span> on this project</span>
      </div>
    </div>
  `;

  // Start live clock updater
  startClockUpdater();
}

/* ---- Live Clock ---- */
let clockInterval = null;

function startClockUpdater() {
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    const el = document.getElementById('live-clock');
    if (el) {
      el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }, 10000);
}

/* ---- Project Dropdown ---- */

function toggleProjectDropdown() {
  const dropdown = document.getElementById('project-dropdown');
  if (!dropdown) return;
  const visible = dropdown.style.display !== 'none';
  if (visible) {
    dropdown.style.display = 'none';
    return;
  }

  const data = loadData();
  const activeProjects = getActiveProjects(data);
  const currentId = data.settings.activeProjectId;

  dropdown.innerHTML = '';
  activeProjects.forEach((p) => {
    const item = document.createElement('button');
    item.className = `timer-project-dropdown__item ${p.id === currentId ? 'active' : ''}`;
    item.innerHTML = `
      <span class="timer-project-dropdown__dot" style="background: ${p.color}"></span>
      <span class="truncate">${p.name}</span>
      <span class="timer-project-dropdown__remaining">${formatTimeShort(p.remainingSeconds)}</span>
    `;
    item.onclick = () => {
      // Pause current timer if running
      if (timerState.running) pauseTimer();
      
      const selectedId = p.id;
      const dataNow = loadData();
      const projectNow = findProject(dataNow, selectedId);

      if (projectNow && projectNow.remainingSeconds <= 0) {
        openSetTimerModal(projectNow, (newTargetSeconds) => {
          projectNow.targetSeconds = newTargetSeconds;
          projectNow.remainingSeconds = newTargetSeconds;
          dataNow.settings.activeProjectId = selectedId;
          saveData(dataNow);
          dropdown.style.display = 'none';
          renderTimerView(dataNow);
        });
        dropdown.style.display = 'none';
        return;
      }

      dataNow.settings.activeProjectId = selectedId;
      saveData(dataNow);
      dropdown.style.display = 'none';
      renderTimerView(dataNow);
    };
    dropdown.appendChild(item);
  });

  dropdown.style.display = 'block';

  // Close on outside click
  const closeHandler = (e) => {
    if (!dropdown.contains(e.target) && e.target.id !== 'project-selector-btn') {
      dropdown.style.display = 'none';
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 0);
}

/* ---- Timer Controls ---- */

function toggleTimer() {
  // Unlock audio playback on user interaction
  const sound = document.getElementById('finish-sound');
  if (sound && !sound.hasRunInit) {
    sound.volume = 0;
    sound.play().then(() => {
      sound.pause();
      sound.volume = 1;
      sound.currentTime = 0;
    }).catch(e => console.log('Audio init prevented', e));
    sound.hasRunInit = true;
  }

  if (timerState.running) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  const data = loadData();
  const project = findProject(data, data.settings.activeProjectId);
  if (!project || project.remainingSeconds <= 0) return;

  timerState.running = true;
  timerState.sessionStartTime = timerState.sessionStartTime || nowISO();
  timerState.lastTickTime = Date.now();

  // Update UI immediately
  updateTimerUI(project);

  // Tick every 100ms for smooth countdown
  timerState.intervalId = setInterval(() => {
    const now = Date.now();
    const delta = (now - timerState.lastTickTime) / 1000;
    timerState.lastTickTime = now;

    const currentData = loadData();
    const currentProject = findProject(currentData, currentData.settings.activeProjectId);
    if (!currentProject) {
      pauseTimer();
      return;
    }

    // Accumulate exact worked time for statistics log
    const actualDelta = Math.min(currentProject.remainingSeconds, delta);
    timerState.accumulatedSeconds += actualDelta;

    currentProject.remainingSeconds = Math.max(0, currentProject.remainingSeconds - delta);
    saveData(currentData); // Persists exact remaining time incrementally

    updateTimerUI(currentProject);

    // Check completion
    if (currentProject.remainingSeconds <= 0) {
      pauseTimer();
      handleTimerComplete(currentProject);
    }
  }, 100);
}

function pauseTimer() {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }

  const wasRunning = timerState.running;
  timerState.running = false;

  // Log the active session instantly based exactly on computed deltas
  if (wasRunning && timerState.sessionStartTime) {
    const durationSeconds = Math.round(timerState.accumulatedSeconds);

    if (durationSeconds >= 1) { // Only log if at least 1 second passed
      const data = loadData();
      logSession(data, data.settings.activeProjectId, timerState.sessionStartTime, nowISO(), durationSeconds);
    }
  }

  // Reset memory states
  timerState.sessionStartTime = null;
  timerState.lastTickTime = null;
  timerState.accumulatedSeconds = 0;

  // Re-render
  const data = loadData();
  renderTimerView(data);
}

/**
 * Update just the timer display elements (no full re-render).
 */
function updateTimerUI(project) {
  const worked = project.targetSeconds - project.remainingSeconds;
  const pct = percentage(worked, project.targetSeconds);

  // Live update project card in Projects tab if it exists
  const fillEl = document.getElementById(`project-fill-${project.id}`);
  const pctEl = document.getElementById(`project-pct-${project.id}`);
  const remEl = document.getElementById(`project-rem-${project.id}`);
  if (fillEl && pctEl && remEl) {
    fillEl.style.width = `${pct}%`;
    pctEl.textContent = `${Math.round(pct)}%`;
    
    // For live feedback under 1 hour, maybe show more granularity?
    // Using formatTimeShort which drops seconds above a minute, let's keep formatTimeShort but if you want live visual it will update.
    const remStr = formatTimeShort(project.remainingSeconds);
    remEl.textContent = project.remainingSeconds <= 0 ? 'Done' : remStr + ' left';
  }

  const timeEl = document.getElementById('timer-time');
  const labelEl = document.getElementById('timer-label');
  const ringEl = document.getElementById('timer-ring-progress');
  const containerEl = document.getElementById('timer-ring-container');

  if (!timeEl) return;

  timeEl.textContent = formatTime(project.remainingSeconds);
  if (labelEl) labelEl.textContent = timerState.running ? 'Working...' : 'Remaining';

  // Update ring
  if (ringEl) {
    const circumference = 2 * Math.PI * 126;
    const dashOffset = circumference - (pct / 100) * circumference;
    ringEl.setAttribute('stroke-dashoffset', dashOffset);
  }

  // Update container state
  if (containerEl) {
    containerEl.className = `timer-ring-container ${timerState.running ? 'running' : ''}`;
  }
}

function handleTimerComplete(project) {
  // Play completion sound
  const data = loadData();
  const sound = document.getElementById('finish-sound');
  if (sound && !data.settings.silentMode) {
    sound.currentTime = 0;
    sound.play().catch(e => console.log('Audio play prevented', e));
  }

  // Show completion overlay
  const overlay = document.createElement('div');
  overlay.className = 'timer-complete-overlay';
  overlay.id = 'timer-complete-overlay';
  overlay.innerHTML = `
    <div class="timer-complete__emoji">🎉</div>
    <div class="timer-complete__title">Time's Up!</div>
    <div class="timer-complete__text">${project.name} — target reached!</div>
    <button class="btn btn-primary btn-lg" onclick="dismissCompletion()">Continue</button>
  `;
  document.body.appendChild(overlay);

  // Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('One-Flow', {
      body: `${project.name} — target time reached! 🎉`,
      icon: 'assets/favicon.svg',
    });
  }

  showToast(`${project.name} completed!`, 'success');
  
  // Auto-archive one-time projects
  const currentProject = findProject(data, project.id);
  if (currentProject && currentProject.type === 'one-shot') {
    currentProject.archived = true;
    saveData(data);
    showToast(`${project.name} has been completed and archived.`, 'info');
  }
}

function dismissCompletion() {
  const overlay = document.getElementById('timer-complete-overlay');
  if (overlay) overlay.remove();
  const data = loadData();
  renderTimerView(data);
}

function handleEditTimer() {
  const data = loadData();
  const project = findProject(data, data.settings.activeProjectId);
  if (!project) return;
  
  openEditTimerModal(project, (newRemaining) => {
    const dataNow = loadData();
    const projNow = findProject(dataNow, project.id);
    if (!projNow) return;

    const diff = newRemaining - projNow.remainingSeconds;
    projNow.remainingSeconds = newRemaining;
    projNow.targetSeconds += diff;

    // Reset completion status if we added time to a completed refillable project
    if (newRemaining > 0 && projNow.type === 'refillable' && projNow.remainingSeconds > 0) {
      document.body.classList.remove('pulse-green');
    }

    saveData(dataNow);
    showToast('Timer updated', 'success');
    renderTimerView(dataNow);
  });
}

function handleResetTimer() {
  showConfirm('Reset Timer?', 'This will reset the countdown back to the full target time. Session history is kept.', () => {
    if (timerState.running) pauseTimer();
    const data = loadData();
    const project = findProject(data, data.settings.activeProjectId);
    if (!project) return;
    project.remainingSeconds = project.targetSeconds;
    saveData(data);
    showToast('Timer reset', 'success');
    renderTimerView(data);
  }, 'Reset', 'btn-secondary');
}

/**
 * Handle user project dropdown selection
 */
window.handleTimerProjectChange = function(selectEl) {
  const projectId = selectEl.value;
  if (!projectId) return;

  const data = loadData();
  const project = findProject(data, projectId);

  if (project && project.type === 'refillable' && project.remainingSeconds <= 0) {
    openSetTimerModal(project, (newTargetSeconds) => {
      project.targetSeconds = newTargetSeconds;
      project.remainingSeconds = newTargetSeconds;
      data.settings.activeProjectId = projectId;
      saveData(data);
      renderTimerView(data);
    });
    // Setting back to the active project while they decide in modal
    selectEl.value = data.settings.activeProjectId;
    return;
  }

  data.settings.activeProjectId = projectId;
  saveData(data);
  renderTimerView(data);
};

/**
 * Handle when timer is done and user clicks "Refill" (for refillable projects)
 */
window.handleRefillAndRestart = function() {
  const data = loadData();
  const project = findProject(data, data.settings.activeProjectId);
  if (!project) return;
  
  openSetTimerModal(project, (newTargetSeconds) => {
    project.targetSeconds = newTargetSeconds;
    project.remainingSeconds = newTargetSeconds;
    saveData(data);
    showToast(`${project.name} block set!`, 'success');
    renderTimerView(data);
  });
};
