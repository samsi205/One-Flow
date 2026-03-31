/* ============================================
   One-Flow — Statistics Dashboard
   ============================================ */

let statsPeriod = 'all'; // 'today', 'week', 'all'

/**
 * Render the statistics view.
 * @param {Object} data
 */
function renderStats(data) {
  const container = document.getElementById('stats-view');



  // Filter sessions by period
  let sessions = data.sessions;
  const now = new Date();
  if (statsPeriod === 'today') {
    sessions = getSessionsInRange(data, startOfToday(), now);
  } else if (statsPeriod === 'week') {
    sessions = getSessionsInRange(data, startOfWeek(), now);
  }

  // Compute metrics
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = formatTimeShort(totalSeconds);
  const sessionCount = sessions.length;
  const avgSessionMins = sessionCount > 0 ? Math.round(totalSeconds / sessionCount / 60) : 0;

  // Streak (consecutive days with work)
  const streak = computeStreak(data.sessions);

  // Hours per project
  const projectHours = computeProjectHours(sessions, data.projects);

  // Missed goals deficit (Total remaining across all active projects)
  const activeProjects = data.projects.filter(p => !p.archived);
  const missedSeconds = activeProjects.reduce((acc, p) => acc + (p.remainingSeconds || 0), 0);
  const missedHours = formatTimeShort(missedSeconds);

  // Day of week breakdown
  const dayData = computeDayOfWeek(sessions);

  // Time of day heatmap
  const hourData = computeHourOfDay(sessions);

  // Best productive window
  const bestWindow = findBestWindow(hourData);

  // Weekly trend (last 4 weeks)
  const weeklyTrend = computeWeeklyTrend(data.sessions);

  // Activity Calendar (Current Month)
  const activityData = computeActivityCalendar(data.sessions);

  container.innerHTML = `
    <div class="stats-view">
      <div class="stats-view__header">
        <h2 class="stats-view__title">Statistics</h2>
        <p class="stats-view__subtitle">Your productivity insights</p>
      </div>

      <!-- Period tabs -->
      <div class="period-tabs">
        <button class="period-tab ${statsPeriod === 'today' ? 'active' : ''}" onclick="setStatsPeriod('today')">Today</button>
        <button class="period-tab ${statsPeriod === 'week' ? 'active' : ''}" onclick="setStatsPeriod('week')">This Week</button>
        <button class="period-tab ${statsPeriod === 'all' ? 'active' : ''}" onclick="setStatsPeriod('all')">All Time</button>
      </div>

      <!-- Bento grid summary -->
      <div class="stats-bento">
        <div class="stat-card stat-card--accent stat-card--wide">
          <div class="stat-card__label">Total Work</div>
          <div class="stat-card__value">${totalHours}</div>
        </div>
        <div class="stat-card stat-card--streak">
          <div class="stat-card__label">Day Streak</div>
          <div class="stat-card__value">${streak}<span class="stat-card__unit">days</span></div>
        </div>
        <div class="stat-card stat-card--danger">
          <div class="stat-card__label">Missed Goals</div>
          <div class="stat-card__value">${missedHours}</div>
          <div class="stat-card__detail">in active blocks</div>
        </div>
      </div>

      ${bestWindow ? `
      <!-- Insight -->
      <div class="insight-card" style="margin-bottom: var(--space-6);">
        <div class="insight-card__icon">💡</div>
        <div class="insight-card__text">
          You do your best work between <span class="insight-card__highlight">${String(bestWindow.start).padStart(2, '0')}:00 – ${String(bestWindow.end).padStart(2, '0')}:00</span>.
          That's when ${bestWindow.pct}% of your sessions happen.
        </div>
      </div>
      ` : ''}

      <!-- Project hours -->
      ${projectHours.length > 0 ? `
      <div class="stats-section">
        <div class="stats-section__title"><span class="stats-section__icon">📁</span> Time per Project</div>
        <div class="card" style="padding: var(--space-4);">
          <div class="bar-chart" id="project-bar-chart"></div>
        </div>
      </div>
      ` : ''}

      <!-- Activity Calendar Heatmap -->
      <div class="stats-section">
        <div class="stats-section__title"><span class="stats-section__icon">🗓️</span> Monthly Heatmap</div>
        <div class="card" style="padding: var(--space-4);">
          <div class="activity-calendar" id="activity-calendar"></div>
        </div>
      </div>

      <!-- Day of week -->
      <div class="stats-section">
        <div class="stats-section__title"><span class="stats-section__icon">📅</span> Day of Week</div>
        <div class="card" style="padding: var(--space-4);">
          <div class="day-chart" id="day-chart"></div>
        </div>
      </div>

      <!-- Time of day heatmap -->
      <div class="stats-section">
        <div class="stats-section__title"><span class="stats-section__icon">🕐</span> Time of Day</div>
        <div class="card" style="padding: var(--space-4);">
          <div class="heatmap" id="heatmap"></div>
          <div class="heatmap__labels" id="heatmap-labels"></div>
        </div>
      </div>

      <!-- Weekly trend -->
      ${weeklyTrend.length > 1 ? `
      <div class="stats-section">
        <div class="stats-section__title"><span class="stats-section__icon">📈</span> Weekly Trend</div>
        <div class="card" style="padding: var(--space-4);">
          <div class="weekly-trend" id="weekly-trend"></div>
          <div style="display:flex; justify-content:space-between; margin-top: var(--space-2);">
            ${weeklyTrend.map((w, i) => `<span style="font-size:10px; color:var(--text-muted);">${i === weeklyTrend.length - 1 ? 'This wk' : `${weeklyTrend.length - i - 1}w ago`}</span>`).join('')}
          </div>
        </div>
      </div>
      ` : ''}


      <!-- Recent Sessions (Up to 15) -->
      ${sessions.length > 0 ? `
      <div class="stats-section">
        <div class="stats-section__title"><span class="stats-section__icon">🕒</span> Recent Sessions</div>
        <div class="card" style="padding: 0; overflow: hidden;">
          <div id="recent-sessions-list"></div>
        </div>
      </div>
      ` : ''}
    </div>
  `;

  // Render charts after DOM is ready
  renderProjectBars(projectHours);
  renderDayChart(dayData);
  renderHeatmap(hourData);
  renderWeeklyTrend(weeklyTrend);
  renderActivityCalendar(activityData);
  renderRecentSessions(data, sessions);
}

function setStatsPeriod(period) {
  statsPeriod = period;
  renderStats(loadData());
}

/* ---- Computation Functions ---- */

function computeProjectHours(sessions, projects) {
  const map = {};
  sessions.forEach((s) => {
    map[s.projectId] = (map[s.projectId] || 0) + s.durationSeconds;
  });
  return Object.entries(map)
    .map(([id, seconds]) => {
      const project = projects.find((p) => p.id === id);
      return {
        id,
        name: project ? project.name : 'Deleted',
        color: project ? project.color : '#64748b',
        seconds,
        hours: formatTimeShort(seconds),
      };
    })
    .sort((a, b) => b.seconds - a.seconds);
}

function computeDayOfWeek(sessions) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = days.map(() => 0);
  sessions.forEach((s) => {
    const d = new Date(s.startTime);
    let dayIdx = d.getDay() - 1; // Mon=0
    if (dayIdx < 0) dayIdx = 6;  // Sun=6
    data[dayIdx] += s.durationSeconds;
  });
  return days.map((name, i) => ({ name, seconds: data[i], hours: formatTimeShort(data[i]) }));
}

function computeHourOfDay(sessions) {
  const hours = Array(24).fill(0);
  sessions.forEach((s) => {
    const h = getHour(s.startTime);
    hours[h] += s.durationSeconds;
  });
  return hours;
}

function findBestWindow(hourData) {
  let maxSum = 0;
  let bestStart = 0;
  const total = hourData.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  // 3-hour sliding window
  for (let i = 0; i < 24; i++) {
    const sum = hourData[i] + (hourData[(i + 1) % 24] || 0) + (hourData[(i + 2) % 24] || 0);
    if (sum > maxSum) {
      maxSum = sum;
      bestStart = i;
    }
  }
  const pct = Math.round((maxSum / total) * 100);
  return { start: bestStart, end: (bestStart + 3) % 24, pct };
}

function computeStreak(sessions) {
  if (sessions.length === 0) return 0;
  const sessionDates = new Set(sessions.map((s) => toDateKey(s.startTime)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    if (sessionDates.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeWeeklyTrend(sessions) {
  const weeks = [];
  const now = new Date();
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now);
    // Treat Monday as 1, Sunday as 7 for mathematical alignment
    const dayOfWeek = weekStart.getDay() === 0 ? 7 : weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek + 1 - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.startTime);
      return d >= weekStart && d < weekEnd;
    });
    const total = weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    weeks.push({ seconds: total, hours: formatTimeShort(total) });
  }
  return weeks;
}

/* ---- Chart Renderers ---- */

function renderProjectBars(projectHours) {
  const container = document.getElementById('project-bar-chart');
  if (!container || projectHours.length === 0) return;

  const maxSeconds = Math.max(...projectHours.map((p) => p.seconds));

  projectHours.forEach((p) => {
    const pct = percentage(p.seconds, maxSeconds);
    const item = document.createElement('div');
    item.className = 'bar-chart__item';
    item.innerHTML = `
      <div class="bar-chart__header">
        <span class="bar-chart__label">
          <span class="bar-chart__label-dot" style="background:${p.color}"></span>
          ${p.name}
        </span>
        <span class="bar-chart__value">${p.hours}</span>
      </div>
      <div class="bar-chart__bar">
        <div class="bar-chart__fill" style="width:${pct}%; background:${p.color};"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderDayChart(dayData) {
  const container = document.getElementById('day-chart');
  if (!container) return;

  const maxSeconds = Math.max(...dayData.map((d) => d.seconds), 1);

  dayData.forEach((d, i) => {
    const heightPct = percentage(d.seconds, maxSeconds);
    const col = document.createElement('div');
    col.className = 'day-chart__col';

    const isToday = new Date().getDay() === (i + 1) % 7;
    const color = isToday ? 'var(--accent)' : 'rgba(124, 92, 252, 0.4)';

    col.innerHTML = `
      <div class="day-chart__value">${d.hours}</div>
      <div class="day-chart__bar" style="height:${Math.max(heightPct, 3)}%; background:${color};"></div>
      <div class="day-chart__label" style="${isToday ? 'color:var(--accent); font-weight:600;' : ''}">${d.name}</div>
    `;
    container.appendChild(col);
  });
}

function renderHeatmap(hourData) {
  const heatmap = document.getElementById('heatmap');
  const labels = document.getElementById('heatmap-labels');
  if (!heatmap) return;

  const maxVal = Math.max(...hourData, 1);

  // Show hours 6-23 and 0-5 (grouped by 2 = 12 cells)
  for (let i = 0; i < 24; i += 2) {
    const combined = hourData[i] + (hourData[i + 1] || 0);
    const intensity = Math.ceil((combined / maxVal) * 5);
    const cell = document.createElement('div');
    cell.className = 'heatmap__cell';
    cell.setAttribute('data-intensity', combined > 0 ? intensity : 0);
    cell.innerHTML = `<div class="heatmap__tooltip">${String(i).padStart(2, '0')}:00–${String(i + 2).padStart(2, '0')}:00 · ${formatTimeShort(combined)}</div>`;
    heatmap.appendChild(cell);
  }

  // Labels
  for (let i = 0; i < 24; i += 2) {
    const label = document.createElement('div');
    label.className = 'heatmap__label';
    label.textContent = `${i}`;
    labels.appendChild(label);
  }
}

function renderWeeklyTrend(weeklyTrend) {
  const container = document.getElementById('weekly-trend');
  if (!container || weeklyTrend.length === 0) return;

  const maxSeconds = Math.max(...weeklyTrend.map((w) => w.seconds), 1);

  weeklyTrend.forEach((w, i) => {
    const heightPct = percentage(w.seconds, maxSeconds);
    const bar = document.createElement('div');
    bar.className = `weekly-trend__bar ${i === weeklyTrend.length - 1 ? 'current' : ''}`;
    bar.style.height = `${Math.max(heightPct, 5)}%`;
    bar.title = `${w.hours}`;
    container.appendChild(bar);
  });
}

function computeActivityCalendar(sessions) {
  const sessionMap = {};
  sessions.forEach(s => {
    const key = toDateKey(s.startTime);
    sessionMap[key] = (sessionMap[key] || 0) + s.durationSeconds;
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Get first day of actual month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0, Sun=6

  const calendar = [];
  
  // Empty padding for alignment
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendar.push({ empty: true });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const current = new Date(year, month, d);
    const key = toDateKey(current);
    calendar.push({
      empty: false,
      date: key,
      dayNumber: d,
      seconds: sessionMap[key] || 0,
      isToday: d === now.getDate()
    });
  }

  return {
    monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    days: calendar
  };
}

function renderActivityCalendar(calendarData) {
  const container = document.getElementById('activity-calendar');
  if (!container) return;

  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  let html = `<div style="text-align:center; font-weight:var(--weight-semibold); margin-bottom:var(--space-3); color:var(--text-secondary);">${calendarData.monthName}</div>`;
  html += `<div class="month-calendar">`;
  html += `<div class="month-calendar__headers">` + weekdayNames.map(d => `<div>${d}</div>`).join('') + `</div>`;
  html += `<div class="month-calendar__grid">`;

  calendarData.days.forEach(d => {
    if (d.empty) {
      html += `<div class="month-calendar__cell empty"></div>`;
    } else {
      let intensity = 0;
      if (d.seconds > 0) {
        const hours = d.seconds / 3600;
        if (hours <= 1.5) intensity = 1;
        else if (hours <= 3) intensity = 2;
        else if (hours <= 5) intensity = 3;
        else intensity = 4;
      }
      const text = d.seconds === 0 ? 'Rest day' : formatTimeShort(d.seconds);
      html += `
        <div class="month-calendar__cell ${d.isToday ? 'today' : ''}" data-intensity="${intensity}">
          <span class="month-calendar__date">${d.dayNumber}</span>
          <div class="heatmap__tooltip">${d.date}: ${text}</div>
        </div>
      `;
    }
  });

  html += "</div></div>"; // close grid & calendar
  container.innerHTML = html;
}

function renderRecentSessions(data, sessions) {
  const container = document.getElementById('recent-sessions-list');
  if (!container) return;

  const recent = [...sessions].sort((a,b) => b.startTime - a.startTime).slice(0, 15);

  container.innerHTML = '';
  recent.forEach(session => {
    const p = data.projects.find(x => x.id === session.projectId) || { name: 'Deleted Project', color: '#64748b' };
    const timeStr = formatTimeShort(session.durationSeconds);
    const dateStr = new Date(session.startTime).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const el = document.createElement('div');
    el.className = 'setting-row card-clickable';
    el.style.padding = 'var(--space-3) var(--space-4)';
    el.innerHTML = `
      <div style="display:flex; align-items:center; gap:var(--space-3);">
        <div style="width:12px; height:12px; border-radius:var(--radius-circle); background:${p.color}"></div>
        <div>
          <div style="font-size:var(--text-sm); font-weight:var(--weight-medium);">${p.name}</div>
          <div style="font-size:var(--text-xs); color:var(--text-muted);">${dateStr}</div>
        </div>
      </div>
      <div style="font-variant-numeric: tabular-nums; font-weight:var(--weight-semibold); display:flex; gap:var(--space-3); align-items:center;">
        ${timeStr}
        <span style="font-size:var(--text-xs); color:var(--text-muted);">✎</span>
      </div>
    `;

    el.onclick = () => {
      openSessionEditModal(session, data, 
        (newProjectId) => {
          updateSessionProject(data, session.id, newProjectId);
          renderStats(loadData());
        },
        () => {
          deleteSession(data, session.id);
          renderStats(loadData());
        }
      );
    };

    container.appendChild(el);
  });
}
