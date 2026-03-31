/* ============================================
   One-Flow — Reusable UI Components
   ============================================ */

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'warning'|'info'} type
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'info' ? `toast--${type}` : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Open a modal with given content.
 * @param {string} title
 * @param {string|HTMLElement} content - HTML string or element
 * @param {Function} [onClose]
 * @returns {HTMLElement} The modal overlay element
 */
function openModal(title, content, onClose) {
  // Remove existing modals
  closeAllModals();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal__header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'modal__title';
  titleEl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal__close';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = () => {
    closeAllModals();
    if (onClose) onClose();
  };

  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  if (typeof content === 'string') {
    const body = document.createElement('div');
    body.innerHTML = content;
    modal.appendChild(body);
  } else {
    modal.appendChild(content);
  }

  overlay.appendChild(modal);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeAllModals();
      if (onClose) onClose();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Close all open modals.
 */
function closeAllModals() {
  const existing = document.getElementById('active-modal');
  if (existing) existing.remove();
}

/**
 * Build a confirmation dialog.
 * @param {string} title
 * @param {string} message
 * @param {Function} onConfirm
 * @param {string} confirmText
 * @param {string} confirmClass
 */
function showConfirm(title, message, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-danger') {
  const content = document.createElement('div');
  
  const msg = document.createElement('p');
  msg.textContent = message;
  msg.style.color = 'var(--text-secondary)';
  msg.style.fontSize = 'var(--text-sm)';
  content.appendChild(msg);

  const actions = document.createElement('div');
  actions.className = 'confirm-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = closeAllModals;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = `btn ${confirmClass}`;
  confirmBtn.textContent = confirmText;
  confirmBtn.onclick = () => {
    closeAllModals();
    onConfirm();
  };

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  content.appendChild(actions);

  openModal(title, content);
}

/**
 * Create a project creation/edit modal.
 * @param {Object|null} existingProject - null for new project
 * @param {Function} onSave - callback(name, targetSeconds, color, type)
 */
function openProjectModal(existingProject, onSave) {
  const isEdit = !!existingProject;
  const content = document.createElement('div');

  // Name input
  const nameGroup = document.createElement('div');
  nameGroup.className = 'form-group';
  nameGroup.innerHTML = `
    <label class="form-label" for="project-name-input">Project Name</label>
    <input type="text" id="project-name-input" class="form-input" 
           placeholder="e.g. DORA MVP" maxlength="50"
           value="${isEdit ? existingProject.name : ''}">
  `;
  content.appendChild(nameGroup);

  // Project type
  const typeGroup = document.createElement('div');
  typeGroup.className = 'form-group';
  const currentType = isEdit ? existingProject.type : 'one-shot';
  typeGroup.innerHTML = `
    <label class="form-label">Project Type</label>
    <div style="display:flex; gap: var(--space-2);">
      <button type="button" class="btn btn-secondary type-option ${currentType === 'one-shot' ? 'selected' : ''}" 
              data-type="one-shot" style="flex:1; font-size: var(--text-xs);">
        🎯 One-Time Task
      </button>
      <button type="button" class="btn btn-secondary type-option ${currentType === 'refillable' ? 'selected' : ''}" 
              data-type="refillable" style="flex:1; font-size: var(--text-xs);">
        🔄 Ongoing Project
      </button>
    </div>
    <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-2);" id="type-description">
      ${currentType === 'one-shot' ? 'A single task. Auto-archives once you finish your timer.' : 'A continuous habit. Stays active so you can set a timer every day.'}
    </div>
  `;
  content.appendChild(typeGroup);

  // Color picker
  const colorGroup = document.createElement('div');
  colorGroup.className = 'form-group';
  const colors = ['#7c5cfc', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
  const currentColor = isEdit ? existingProject.color : colors[0];
  let selectedColor = currentColor;
  let selectedType = currentType;

  colorGroup.innerHTML = `
    <label class="form-label">Color</label>
    <div class="color-picker" id="color-picker"></div>
  `;
  content.appendChild(colorGroup);

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-lg';
  saveBtn.style.width = '100%';
  saveBtn.style.marginTop = 'var(--space-4)';
  saveBtn.textContent = isEdit ? 'Update Project' : 'Create Project';
  content.appendChild(saveBtn);

  const modal = openModal(isEdit ? 'Edit Project' : 'New Project', content);

  // Render color swatches
  const pickerEl = document.getElementById('color-picker');
  colors.forEach((c) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = `color-picker__swatch ${c === selectedColor ? 'selected' : ''}`;
    swatch.style.background = c;
    swatch.onclick = () => {
      selectedColor = c;
      pickerEl.querySelectorAll('.color-picker__swatch').forEach((s) => s.classList.remove('selected'));
      swatch.classList.add('selected');
    };
    pickerEl.appendChild(swatch);
  });

  // Type toggle
  content.querySelectorAll('.type-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedType = btn.dataset.type;
      content.querySelectorAll('.type-option').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('type-description').textContent =
        selectedType === 'one-shot' ? 'A single task. Auto-archives once you finish your timer.' : 'A continuous habit. Stays active so you can set a timer every day.';
    });
  });

  // Style selected type buttons
  const styleTypeButtons = () => {
    content.querySelectorAll('.type-option').forEach((btn) => {
      if (btn.classList.contains('selected')) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'var(--accent-glow)';
      } else {
        btn.style.borderColor = '';
        btn.style.background = '';
      }
    });
  };
  styleTypeButtons();
  content.querySelectorAll('.type-option').forEach((btn) => {
    btn.addEventListener('click', styleTypeButtons);
  });

  // Save handler
  saveBtn.onclick = () => {
    const name = document.getElementById('project-name-input').value.trim();
    // Default 0 for targetSeconds at runtime creation
    const totalSeconds = 0;

    if (!name) {
      showToast('Please enter a project name', 'warning');
      return;
    }

    closeAllModals();
    onSave(name, totalSeconds, selectedColor, selectedType);
  };

  // Auto-focus name input
  setTimeout(() => {
    const nameInput = document.getElementById('project-name-input');
    if (nameInput) nameInput.focus();
  }, 100);
}

/**
 * Open a simplified modal specifically to set the timer for a recurring block.
 * @param {Object} project
 * @param {Function} onSave - callback(targetSeconds)
 */
function openSetTimerModal(project, onSave) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="margin-bottom: var(--space-4); color: var(--text-secondary); font-size: var(--text-sm);">
      How much time do you want to devote to <strong>${project.name}</strong> today?
    </div>
  `;

  // Time input
  const timeGroup = document.createElement('div');
  timeGroup.className = 'form-group';
  
  // Suggest the previous target time as default (if exists), otherwise 1 hour default
  let existingH = project.targetSeconds > 0 ? Math.floor(project.targetSeconds / 3600) : 1;
  let existingM = project.targetSeconds > 0 ? Math.floor((project.targetSeconds % 3600) / 60) : 0;

  timeGroup.innerHTML = `
    <div class="time-input-row" style="margin-top: var(--space-2);">
      <div>
        <input type="number" id="block-hours-input" class="form-input" 
               min="0" max="999" value="${existingH}" placeholder="0" style="font-size: var(--text-lg); padding: var(--space-3);">
        <div class="time-input-row__label" style="text-align:center; margin-top:4px;">hours</div>
      </div>
      <span class="time-input-row__separator" style="font-size: var(--text-xl);">:</span>
      <div>
        <input type="number" id="block-mins-input" class="form-input" 
               min="0" max="59" value="${existingM}" placeholder="00" style="font-size: var(--text-lg); padding: var(--space-3);">
        <div class="time-input-row__label" style="text-align:center; margin-top:4px;">minutes</div>
      </div>
    </div>
  `;
  content.appendChild(timeGroup);

  // Start button
  const startBtn = document.createElement('button');
  startBtn.className = 'btn btn-primary btn-lg';
  startBtn.style.width = '100%';
  startBtn.style.marginTop = 'var(--space-6)';
  startBtn.style.background = project.color;
  startBtn.style.border = 'none';
  startBtn.textContent = 'Start Block';
  
  startBtn.onclick = () => {
    const hours = parseInt(document.getElementById('block-hours-input').value) || 0;
    const mins = parseInt(document.getElementById('block-mins-input').value) || 0;
    const totalSeconds = hours * 3600 + mins * 60;

    if (totalSeconds <= 0) {
      showToast('Please set a valid duration', 'warning');
      return;
    }

    closeAllModals();
    onSave(totalSeconds);
  };
  content.appendChild(startBtn);

  openModal(`Set Goal`, content);
}

/**
 * Open a modal to edit an ongoing timer clock
 * @param {Object} project
 * @param {Function} onSave - callback(targetSeconds)
 */
function openEditTimerModal(project, onSave) {
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="margin-bottom: var(--space-4); color: var(--text-secondary); font-size: var(--text-sm);">
      Edit the remaining time for <strong>${project.name}</strong>
    </div>
  `;

  // Time input
  const timeGroup = document.createElement('div');
  timeGroup.className = 'form-group';
  
  // Suggest the current remaining time as default
  let existingH = project.remainingSeconds > 0 ? Math.floor(project.remainingSeconds / 3600) : 0;
  let existingM = project.remainingSeconds > 0 ? Math.floor((project.remainingSeconds % 3600) / 60) : 0;

  timeGroup.innerHTML = `
    <div class="time-input-row" style="margin-top: var(--space-2);">
      <div>
        <input type="number" id="edit-hours-input" class="form-input" 
               min="0" max="999" value="${existingH}" placeholder="0" style="font-size: var(--text-lg); padding: var(--space-3);">
        <div class="time-input-row__label" style="text-align:center; margin-top:4px;">hours</div>
      </div>
      <span class="time-input-row__separator" style="font-size: var(--text-xl);">:</span>
      <div>
        <input type="number" id="edit-mins-input" class="form-input" 
               min="0" max="59" value="${existingM}" placeholder="00" style="font-size: var(--text-lg); padding: var(--space-3);">
        <div class="time-input-row__label" style="text-align:center; margin-top:4px;">minutes</div>
      </div>
    </div>
  `;
  content.appendChild(timeGroup);

  // Quick Action Buttons
  const quickActions = document.createElement('div');
  quickActions.style.display = 'flex';
  quickActions.style.gap = 'var(--space-2)';
  quickActions.style.marginTop = 'var(--space-4)';
  quickActions.style.marginBottom = 'var(--space-4)';

  const createQuickBtn = (label, additionalMinutes) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.flex = '1';
    btn.style.padding = 'var(--space-2)';
    btn.style.fontSize = 'var(--text-md)';
    btn.textContent = label;
    btn.onclick = () => {
      const totalNow = (parseInt(document.getElementById('edit-hours-input').value) || 0) * 3600 + (parseInt(document.getElementById('edit-mins-input').value) || 0) * 60;
      const newTotal = Math.max(0, totalNow + additionalMinutes * 60);
      document.getElementById('edit-hours-input').value = Math.floor(newTotal / 3600);
      document.getElementById('edit-mins-input').value = Math.floor((newTotal % 3600) / 60);
    };
    return btn;
  };

  quickActions.appendChild(createQuickBtn('-15m', -15));
  quickActions.appendChild(createQuickBtn('+5m', 5));
  quickActions.appendChild(createQuickBtn('+15m', 15));
  content.appendChild(quickActions);

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-lg';
  saveBtn.style.width = '100%';
  saveBtn.style.marginTop = 'var(--space-2)';
  saveBtn.style.background = project.color;
  saveBtn.style.border = 'none';
  saveBtn.textContent = 'Update Timer';
  
  saveBtn.onclick = () => {
    const hours = parseInt(document.getElementById('edit-hours-input').value) || 0;
    const mins = parseInt(document.getElementById('edit-mins-input').value) || 0;
    const totalSeconds = hours * 3600 + mins * 60;

    if (totalSeconds < 0) {
      showToast('Please set a valid duration', 'warning');
      return;
    }

    closeAllModals();
    onSave(totalSeconds);
  };
  content.appendChild(saveBtn);
  openModal('Edit Timer', content);
}

/**
 * Open the Settings modal.
 * @param {Object} data 
 * @param {Function} onSave - Called when settings change
 */
function openSettingsModal(data, onSave) {
  const content = document.createElement('div');
  
  const isSilent = data.settings.silentMode;

  content.innerHTML = `
    <div class="setting-row">
      <div class="setting-label">
        <span class="setting-title">Silent Mode</span>
        <span class="setting-desc">Mute completion sounds (especially for public spaces)</span>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="setting-silent-mode" ${isSilent ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;

  // Apply change immediately when toggled
  content.querySelector('#setting-silent-mode').addEventListener('change', (e) => {
    const newVal = e.target.checked;
    data.settings.silentMode = newVal;
    saveData(data); // Immediate save
    if (onSave) onSave(data);
  });

  openModal('Settings', content);
}

/**
 * Open the Session Edit modal.
 * @param {Object} session - The session object
 * @param {Object} data - App data to list available projects
 * @param {Function} onSave - callback(newProjectId)
 * @param {Function} onDelete - callback()
 */
function openSessionEditModal(session, data, onSave, onDelete) {
  const content = document.createElement('div');
  
  // Format duration
  const timeStr = formatTimeShort(session.durationSeconds);

  // Date str
  const d = new Date(session.startTime);
  const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get active projects
  const availableProjects = data.projects.filter(p => !p.archived || p.id === session.projectId);

  let optionsHTML = availableProjects.map(p => {
    return `<option value="${p.id}" ${p.id === session.projectId ? 'selected' : ''}>${p.name}</option>`;
  }).join('');

  content.innerHTML = `
    <div style="margin-bottom: var(--space-4); color: var(--text-secondary); font-size: var(--text-sm);">
      <strong>Session:</strong> ${timeStr}<br/>
      <strong>Recorded:</strong> ${dateStr}
    </div>

    <div class="form-group">
      <label class="form-label" for="session-project-select">Attributed Project</label>
      <select id="session-project-select" class="form-input" style="appearance: auto; cursor: pointer;">
        ${optionsHTML}
      </select>
    </div>

    <div style="display: flex; gap: var(--space-3); margin-top: var(--space-6);">
      <button id="btn-session-delete" class="btn btn-danger" style="flex: 1;">🗑 Delete</button>
      <button id="btn-session-save" class="btn btn-primary" style="flex: 2;">Save</button>
    </div>
  `;
  content.querySelector('#btn-session-delete').onclick = () => {
    showConfirm(
      'Delete Session',
      'Are you sure you want to delete this work session? This cannot be undone and will impact your statistics.',
      () => {
        closeAllModals();
        onDelete();
      },
      'Delete',
      'btn-danger'
    );
  };

  content.querySelector('#btn-session-save').onclick = () => {
    const newProjectId = document.getElementById('session-project-select').value;
    closeAllModals();
    if (newProjectId !== session.projectId) {
      onSave(newProjectId);
    }
  };

  openModal('Edit Session', content);
}

