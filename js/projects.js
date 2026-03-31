/* ============================================
   One-Flow — Project Management View
   ============================================ */

/**
 * Render the projects list view.
 * @param {Object} data
 */
function renderProjects(data) {
  const container = document.getElementById('projects-view');
  const activeProjects = getActiveProjects(data);

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-header__title">Projects</h2>
      <div style="display: flex; gap: var(--space-2);">
        <button class="btn btn-ghost btn-icon" title="Settings" onclick="openSettingsModal(loadData(), () => renderProjects(loadData()))">
          ⚙️
        </button>
        <button class="btn btn-primary" id="btn-new-project" onclick="handleNewProject()">
          + New
        </button>
      </div>
    </div>
    <div class="project-list" id="project-list"></div>
  `;

  const listEl = document.getElementById('project-list');

  if (activeProjects.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📋</div>
        <div class="empty-state__title">No projects yet</div>
        <div class="empty-state__text">Create your first project to start tracking your work time.</div>
        <button class="btn btn-primary" style="margin-top: var(--space-4);" onclick="handleNewProject()">
          + Create Project
        </button>
      </div>
    `;
    return;
  }

  activeProjects.forEach((project, index) => {
    const worked = project.targetSeconds - project.remainingSeconds;
    const pct = percentage(worked, project.targetSeconds);
    const isComplete = project.remainingSeconds <= 0;

    const card = document.createElement('div');
    card.className = 'card card-clickable project-card stagger-item';
    card.onclick = (e) => {
      // Don't navigate if clicking action buttons
      if (e.target.closest('.project-card__actions')) return;
      selectProjectForTimer(project.id);
    };

    card.innerHTML = `
      <div class="project-card__color" style="background: ${project.color}"></div>
      <div class="project-card__info">
        <div class="project-card__name truncate">${project.name}</div>
        <div class="project-card__meta">
          <span>${project.type === 'refillable' ? '🔄' : '🎯'} ${formatTimeShort(project.targetSeconds)} target</span>
          ${isComplete ? '<span style="color: var(--success);">✓ Complete</span>' : ''}
        </div>
        <div class="progress-bar">
          <div class="progress-bar__fill" id="project-fill-${project.id}" style="width: ${pct}%; background: ${project.color};"></div>
        </div>
      </div>
      <div class="project-card__progress">
        <div class="project-card__percentage" id="project-pct-${project.id}">${Math.round(pct)}%</div>
        <div class="project-card__remaining" id="project-rem-${project.id}">${isComplete ? 'Done' : formatTimeShort(project.remainingSeconds) + ' left'}</div>
      </div>
      <div class="project-card__actions">
        ${project.type === 'refillable' && isComplete ? `
          <button class="btn btn-ghost btn-icon" title="Refill" onclick="handleRefillProject('${project.id}')">🔄</button>
        ` : ''}
        <button class="btn btn-ghost btn-icon" title="Edit" onclick="handleEditProject('${project.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon" title="Archive" onclick="handleArchiveProject('${project.id}')">📦</button>
      </div>
    `;

    listEl.appendChild(card);
  });

  // Archived section
  const archivedProjects = data.projects.filter((p) => p.archived);
  if (archivedProjects.length > 0) {
    const archiveSection = document.createElement('div');
    archiveSection.style.marginTop = 'var(--space-8)';
    archiveSection.innerHTML = `
      <div class="section-header" style="margin-bottom: var(--space-3);">
        <h3 class="section-header__title" style="font-size: var(--text-sm); color: var(--text-muted);">
          Archived (${archivedProjects.length})
        </h3>
        <button class="btn btn-ghost" id="toggle-archived" style="font-size: var(--text-xs);">Show</button>
      </div>
      <div id="archived-list" class="project-list" style="display: none;"></div>
    `;
    listEl.appendChild(archiveSection);

    const toggleBtn = archiveSection.querySelector('#toggle-archived');
    const archivedList = archiveSection.querySelector('#archived-list');
    toggleBtn.onclick = () => {
      const visible = archivedList.style.display !== 'none';
      archivedList.style.display = visible ? 'none' : 'flex';
      toggleBtn.textContent = visible ? 'Show' : 'Hide';
    };

    archivedProjects.forEach((project) => {
      const card = document.createElement('div');
      card.className = 'card project-card';
      card.style.opacity = '0.5';
      card.innerHTML = `
        <div class="project-card__color" style="background: ${project.color}"></div>
        <div class="project-card__info">
          <div class="project-card__name truncate">${project.name}</div>
          <div class="project-card__meta">
            <span>Archived</span>
          </div>
        </div>
        <div class="project-card__actions">
          <button class="btn btn-ghost btn-icon" title="Restore" onclick="handleRestoreProject('${project.id}')">↩️</button>
          <button class="btn btn-ghost btn-icon" title="Delete" onclick="handleDeleteProject('${project.id}')">🗑️</button>
        </div>
      `;
      archivedList.appendChild(card);
    });
  }

  // Export button at bottom
  const exportSection = document.createElement('div');
  exportSection.style.cssText = 'margin-top: var(--space-8); text-align: center;';
  exportSection.innerHTML = `
    <button class="btn btn-ghost" onclick="exportData()" style="font-size: var(--text-xs);">
      💾 Export Backup (JSON)
    </button>
  `;
  container.appendChild(exportSection);
}

/* ---- Handlers ---- */

function handleNewProject() {
  openProjectModal(null, (name, targetSeconds, color, type) => {
    const data = loadData();
    createProject(data, name, targetSeconds, color, type);
    showToast('Project created!', 'success');
    renderProjects(data);
    renderTimerView(data);
  });
}

function handleEditProject(projectId) {
  const data = loadData();
  const project = findProject(data, projectId);
  if (!project) return;

  openProjectModal(project, (name, targetSeconds, color, type) => {
    const timeDiff = targetSeconds - project.targetSeconds;
    updateProject(data, projectId, {
      name,
      targetSeconds,
      remainingSeconds: Math.max(0, project.remainingSeconds + timeDiff),
      color,
      type,
    });
    showToast('Project updated!', 'success');
    renderProjects(data);
    renderTimerView(data);
  });
}

function handleArchiveProject(projectId) {
  showConfirm('Archive Project', 'This will hide the project from your active list. You can restore it later.', () => {
    const data = loadData();
    archiveProject(data, projectId);
    // If it was the active timer project, clear it
    if (data.settings.activeProjectId === projectId) {
      if (timerState.running) pauseTimer();
      data.settings.activeProjectId = null;
      saveData(data);
    }
    showToast('Project archived', 'success');
    renderProjects(data);
    renderTimerView(data);
  }, 'Archive', 'btn-secondary');
}

function handleRestoreProject(projectId) {
  const data = loadData();
  updateProject(data, projectId, { archived: false });
  showToast('Project restored!', 'success');
  renderProjects(data);
}

function handleDeleteProject(projectId) {
  showConfirm('Delete Forever?', 'This will permanently delete the project and all its session history. This cannot be undone.', () => {
    const data = loadData();
    deleteProject(data, projectId);
    showToast('Project deleted', 'warning');
    renderProjects(data);
    renderTimerView(data);
  });
}

function handleRefillProject(projectId) {
  const data = loadData();
  const project = findProject(data, projectId);
  if (!project) return;

  openSetTimerModal(project, (newTargetSeconds) => {
    project.targetSeconds = newTargetSeconds;
    project.remainingSeconds = newTargetSeconds;
    saveData(data);
    showToast(`${project.name} block set!`, 'success');
    renderProjects(data);
    if (data.settings.activeProjectId === projectId) renderTimerView(data);
  });
}

/**
 * Select a project and switch to timer view.
 */
function selectProjectForTimer(projectId) {
  const data = loadData();
  const project = findProject(data, projectId);

  if (project && project.type === 'refillable' && project.remainingSeconds <= 0) {
    openSetTimerModal(project, (newTargetSeconds) => {
      project.targetSeconds = newTargetSeconds;
      project.remainingSeconds = newTargetSeconds;
      data.settings.activeProjectId = projectId;
      saveData(data);
      navigateTo('timer');
    });
    return;
  }

  data.settings.activeProjectId = projectId;
  saveData(data);
  navigateTo('timer');
}
