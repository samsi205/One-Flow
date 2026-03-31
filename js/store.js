/* ============================================
   One-Flow — Data Store (localStorage)
   ============================================ */

const STORAGE_KEY = 'oneflow_data';
const DATA_VERSION = 1;

/**
 * Default empty state.
 */
function getDefaultData() {
  return {
    version: DATA_VERSION,
    projects: [],
    sessions: [],
    settings: {
      theme: 'dark',
      notifyOnComplete: true,
      tickSound: false,
      silentMode: false,
      activeProjectId: null,
    },
  };
}

/**
 * Load data from localStorage.
 * Returns a full data object, initializing defaults if none found.
 * @returns {Object}
 */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const data = JSON.parse(raw);
    return migrateData(data);
  } catch (e) {
    console.error('[One-Flow] Failed to load data:', e);
    return getDefaultData();
  }
}

/**
 * Save data to localStorage.
 * @param {Object} data
 */
function saveData(data) {
  try {
    data.version = DATA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[One-Flow] Failed to save data:', e);
  }
}

/**
 * Export all data as a downloadable JSON file.
 */
function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oneflow-backup-${toDateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Data migration for version upgrades.
 * @param {Object} data
 * @returns {Object}
 */
function migrateData(data) {
  if (!data.version) data.version = 1;
  if (!data.projects) data.projects = [];
  if (!data.sessions) data.sessions = [];
  if (!data.settings) data.settings = getDefaultData().settings;
  if (!data.settings.activeProjectId) data.settings.activeProjectId = null;
  if (data.settings.silentMode === undefined) data.settings.silentMode = false;
  // Ensure all projects have a type
  data.projects.forEach((p) => {
    if (!p.type) p.type = 'one-shot';
  });
  return data;
}

/* ---- Project CRUD ---- */

/**
 * Create a new project.
 * @param {Object} data - App data
 * @param {string} name
 * @param {number} targetSeconds
 * @param {string} color
 * @param {string} type - "one-shot" | "refillable"
 * @returns {Object} The created project
 */
function createProject(data, name, targetSeconds, color, type) {
  const project = {
    id: generateId(),
    name: name.trim(),
    color: color || '#7c5cfc',
    type: type || 'one-shot',
    targetSeconds,
    remainingSeconds: targetSeconds,
    createdAt: nowISO(),
    archived: false,
  };
  data.projects.push(project);
  saveData(data);
  return project;
}

/**
 * Refill a refillable project back to its target time.
 * @param {Object} data
 * @param {string} projectId
 * @returns {Object|null}
 */
function refillProject(data, projectId) {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project || project.type !== 'refillable') return null;
  project.remainingSeconds = project.targetSeconds;
  saveData(data);
  return project;
}

/**
 * Update a project's properties.
 * @param {Object} data
 * @param {string} projectId
 * @param {Object} updates
 * @returns {Object|null}
 */
function updateProject(data, projectId, updates) {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return null;
  Object.assign(project, updates);
  saveData(data);
  return project;
}

/**
 * Archive a project (soft delete).
 * @param {Object} data
 * @param {string} projectId
 */
function archiveProject(data, projectId) {
  return updateProject(data, projectId, { archived: true });
}

/**
 * Delete a project permanently and its sessions.
 * @param {Object} data
 * @param {string} projectId
 */
function deleteProject(data, projectId) {
  data.projects = data.projects.filter((p) => p.id !== projectId);
  data.sessions = data.sessions.filter((s) => s.projectId !== projectId);
  if (data.settings.activeProjectId === projectId) {
    data.settings.activeProjectId = null;
  }
  saveData(data);
}

/**
 * Get active (non-archived) projects.
 * @param {Object} data
 * @returns {Array}
 */
function getActiveProjects(data) {
  return data.projects.filter((p) => !p.archived);
}

/**
 * Find project by ID.
 * @param {Object} data
 * @param {string} id
 * @returns {Object|null}
 */
function findProject(data, id) {
  return data.projects.find((p) => p.id === id) || null;
}

/* ---- Session Logging ---- */

/**
 * Log a work session.
 * @param {Object} data
 * @param {string} projectId
 * @param {string} startTime - ISO string
 * @param {string} endTime - ISO string
 * @param {number} durationSeconds
 * @returns {Object}
 */
function logSession(data, projectId, startTime, endTime, durationSeconds) {
  const session = {
    id: generateId(),
    projectId,
    startTime,
    endTime,
    durationSeconds,
  };
  data.sessions.push(session);
  saveData(data);
  return session;
}

/**
 * Get sessions for a specific project.
 * @param {Object} data
 * @param {string} projectId
 * @returns {Array}
 */
function getProjectSessions(data, projectId) {
  return data.sessions.filter((s) => s.projectId === projectId);
}

/**
 * Get all sessions within a date range.
 * @param {Object} data
 * @param {Date} from
 * @param {Date} to
 * @returns {Array}
 */
function getSessionsInRange(data, from, to) {
  return data.sessions.filter((s) => {
    const d = new Date(s.startTime);
    return d >= from && d <= to;
  });
}

/**
 * Delete a session permanently.
 * @param {Object} data
 * @param {string} sessionId
 */
function deleteSession(data, sessionId) {
  data.sessions = data.sessions.filter((s) => s.id !== sessionId);
  saveData(data);
}

/**
 * Update a session's project.
 * @param {Object} data
 * @param {string} sessionId
 * @param {string} newProjectId
 */
function updateSessionProject(data, sessionId, newProjectId) {
  const session = data.sessions.find((s) => s.id === sessionId);
  if (session) {
    session.projectId = newProjectId;
    saveData(data);
  }
}
