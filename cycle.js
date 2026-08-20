/* ===== Feature 02: Smart Menstrual Cycle Tracker =====
   Feature 03: Symptom & Health Pattern Tracker
   Feature 05: Health Insights & Early-Warning
   Data keys: aura_cycles, aura_symptoms                    */

const CYCLE_PHASES = {
  menstrual: {
    name: 'Menstrual',
    emoji: '🔴',
    desc: 'Your body is shedding the uterine lining. Rest, stay warm, and eat iron-rich foods like spinach, lentils, and jaggery.',
    days: [1, 5]
  },
  follicular: {
    name: 'Follicular',
    emoji: '🌱',
    desc: 'Estrogen rises and energy returns. Great time for new projects, social plans, strength workouts, and creative work.',
    days: [6, 13]
  },
  ovulation: {
    name: 'Ovulatory',
    emoji: '✨',
    desc: 'Peak energy and confidence! You may feel more social and communicative. Your body is at its strongest this week.',
    days: [14, 16]
  },
  luteal: {
    name: 'Luteal',
    emoji: '🌙',
    desc: 'Progesterone peaks. You may crave comfort food or feel more inward. PMS symptoms may appear — self-care is key.',
    days: [17, 28]
  }
};

function getCycles() { return JSON.parse(localStorage.getItem('aura_cycles') || '[]'); }
function getSymptoms() { return JSON.parse(localStorage.getItem('aura_symptoms') || '[]'); }

function getCurrentCycleDay(lastPeriodDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = new Date(lastPeriodDate + 'T00:00:00'); last.setHours(0, 0, 0, 0);
  return Math.floor((today - last) / 86400000) + 1;
}

function getPhaseKey(cycleDay, cycleLen) {
  const d = ((cycleDay - 1) % cycleLen) + 1;
  if (d <= 5) return 'menstrual';
  if (d <= 13) return 'follicular';
  if (d <= 16) return 'ovulation';
  return 'luteal';
}

/* ---------- Log Period ---------- */
function logPeriod() {
  const dateVal = document.getElementById('periodDate').value;
  const lenVal = parseInt(document.getElementById('cycleLen').value) || 28;
  if (!dateVal) { alert('Please select a date 💜'); return; }
  const cycles = getCycles();
  if (cycles.find(c => c.date === dateVal)) { alert('Period already logged for this date.'); return; }
  cycles.unshift({ date: dateVal, cycleLen: Math.min(Math.max(lenVal, 20), 45) });
  cycles.sort((a, b) => new Date(b.date) - new Date(a.date));
  localStorage.setItem('aura_cycles', JSON.stringify(cycles.slice(0, 12)));
  document.getElementById('cycleLen').value = '';
  renderCycleData();
  renderInsights();
}

/* ---------- Render cycle stats & phase ---------- */
function renderCycleData() {
  const cycles = getCycles();

  // Period history list
  const histEl = document.getElementById('periodHistory');
  if (histEl) {
    histEl.innerHTML = cycles.slice(0, 4).map(c =>
      `<div class="period-entry">
         <span>🩸 ${new Date(c.date + 'T00:00:00').toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
         <span class="muted">${c.cycleLen}d cycle</span>
       </div>`
    ).join('') || '<p class="muted" style="margin-top:.5rem">No periods logged yet.</p>';
  }

  if (!cycles.length) return;

  const latest = cycles[0];
  const avgLen = Math.round(cycles.reduce((s, c) => s + c.cycleLen, 0) / cycles.length);
  const cycleDay = getCurrentCycleDay(latest.date);
  const daysToNext = Math.max(0, avgLen - cycleDay);
  const phaseKey = getPhaseKey(cycleDay, latest.cycleLen || avgLen);
  const phase = CYCLE_PHASES[phaseKey];

  // Stats
  const cdEl = document.getElementById('cycleDay');
  const dnEl = document.getElementById('daysToNext');
  const acEl = document.getElementById('avgCycle');
  const badge = document.getElementById('phaseBadge');
  if (cdEl) cdEl.textContent = cycleDay > avgLen + 7 ? `+${cycleDay - avgLen}d` : `Day ${cycleDay}`;
  if (dnEl) dnEl.textContent = daysToNext > 0 ? `${daysToNext}d` : 'Due now';
  if (acEl) acEl.textContent = `${avgLen}d`;
  if (badge) badge.textContent = `${phase.emoji} ${phase.name} Phase`;

  // Phase ring
  const pEmoji = document.getElementById('phaseEmoji');
  const pName = document.getElementById('phaseName');
  const pDesc = document.getElementById('phaseDesc');
  if (pEmoji) pEmoji.textContent = phase.emoji;
  if (pName) pName.textContent = phase.name;
  if (pDesc) pDesc.textContent = phase.desc;
}

/* ---------- Symptom toggle with live feedback ---------- */
let selectedSymptoms = new Set();

function updateSymCounter() {
  const counter = document.getElementById('symCounter');
  const countText = document.getElementById('symCountText');
  const symList = document.getElementById('symList');
  const saveBtn = document.getElementById('saveSymBtn');
  const count = selectedSymptoms.size;
  if (!counter) return;
  if (count === 0) {
    counter.style.display = 'none';
    if (saveBtn) saveBtn.textContent = '💾 Save Symptoms';
  } else {
    counter.style.display = 'block';
    countText.textContent = count + ' symptom' + (count > 1 ? 's' : '') + ' selected';
    symList.textContent = '· ' + [...selectedSymptoms].map(s => s.replace('-', ' ')).join(', ');
    if (saveBtn) saveBtn.textContent = '💾 Save ' + count + ' Symptom' + (count > 1 ? 's' : '');
  }
}

document.querySelectorAll('.symptom-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sym = btn.dataset.sym;
    if (selectedSymptoms.has(sym)) {
      selectedSymptoms.delete(sym);
      btn.classList.remove('active');
    } else {
      selectedSymptoms.add(sym);
      btn.classList.add('active');
    }
    updateSymCounter();
  });
});

/* ---------- Save symptoms ---------- */
function saveSymptoms() {
  const notes = document.getElementById('symNotes').value.trim();
  const symptoms = [...selectedSymptoms];
  if (!symptoms.length && !notes) { alert('Select at least one symptom or add notes 💜'); return; }
  const cycles = getCycles();
  const cycleDay = cycles.length ? getCurrentCycleDay(cycles[0].date) : null;
  const all = getSymptoms();
  all.unshift({ date: new Date().toISOString(), symptoms, notes, cycleDay });
  localStorage.setItem('aura_symptoms', JSON.stringify(all.slice(0, 90)));
  document.getElementById('symNotes').value = '';
  selectedSymptoms.clear();
  document.querySelectorAll('.symptom-btn').forEach(b => b.classList.remove('active'));
  updateSymCounter();
  renderSymHistory();
  renderInsights();
  alert('Symptoms saved 💜 Keep tracking to unlock pattern insights!');
}

/* ---------- Render symptom history ---------- */
function renderSymHistory() {
  const el = document.getElementById('symHistory');
  if (!el) return;
  const syms = getSymptoms().slice(0, 8);
  el.innerHTML = syms.length ? syms.map(s => {
    const shown = s.symptoms.slice(0, 3).join(', ');
    const extra = s.symptoms.length > 3 ? ` +${s.symptoms.length - 3}` : '';
    return `<li>
      <span>${shown}${extra}${s.notes ? ' — ' + s.notes.slice(0, 60) : ''}</span>
      <span class="muted">Day ${s.cycleDay || '?'} · ${new Date(s.date).toLocaleDateString()}</span>
    </li>`;
  }).join('') : '<li class="muted">No symptoms logged yet. Start tracking above ✨</li>';
}

/* ---------- Feature 05: Health Insights & Early-Warning ---------- */
function renderInsights() {
  const el = document.getElementById('insightsContainer');
  if (!el) return;
  const cycles = getCycles();
  const syms = getSymptoms();
  let html = '';

  // Cycle regularity insight (needs ≥2 cycles)
  if (cycles.length >= 2) {
    const lens = cycles.slice(0, 6).map(c => c.cycleLen);
    const avg = Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
    const max = Math.max(...lens), min = Math.min(...lens);
    const variation = max - min;
    html += `<div class="insight-card">
      <strong>📊 Cycle Pattern (last ${cycles.length} cycles)</strong>
      <p class="muted" style="margin-top:.4rem">
        Average: <strong>${avg} days</strong> · Range: ${min}–${max}d
        ${variation > 7
          ? `<br>⚠️ <strong>Variation of ${variation} days</strong> detected — cycles varying by more than 7 days may indicate stress, thyroid issues, or hormonal changes. Consider discussing with your doctor if this continues.`
          : '<br>✅ Your cycles are fairly regular.'}
      </p>
    </div>`;

    // Cycle delay alert
    const cycleDay = getCurrentCycleDay(cycles[0].date);
    if (cycleDay > avg + 7) {
      html += `<div class="warning-card">
        <strong>⚠️ Cycle Delay Alert</strong>
        <p class="muted" style="margin-top:.4rem">
          Your period appears to be <strong>${cycleDay - avg} days late</strong>. Stress, sudden weight changes, illness, and hormonal shifts can affect timing. If you're sexually active, consider a pregnancy test. Consult your doctor if this persists beyond 2 weeks.
        </p>
      </div>`;
    }
  }

  // Symptom frequency insight (needs ≥5 entries)
  if (syms.length >= 5) {
    const freq = {};
    syms.forEach(s => s.symptoms.forEach(sym => { freq[sym] = (freq[sym] || 0) + 1; }));
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (top.length) {
      html += `<div class="insight-card">
        <strong>🔍 Your Most Frequent Symptoms</strong>
        <p class="muted" style="margin-top:.4rem">
          ${top.map(([s, c]) => `<strong>${s.replace('-', ' ')}</strong> (${c}×)`).join(' · ')}
          <br>Discuss persistent or severe symptoms with your doctor. Not a diagnosis.
        </p>
      </div>`;
    }

    // PCOS early-warning pattern
    const pcosMarkers = ['acne', 'fatigue', 'mood-swings', 'insomnia'];
    const pcosHits = pcosMarkers.filter(s => (freq[s] || 0) >= 4).length;
    const hasLongCycles = cycles.some(c => c.cycleLen > 35);
    if (pcosHits >= 2 && hasLongCycles) {
      html += `<div class="warning-card">
        <strong>⚠️ Early-Warning: Possible Hormonal Imbalance Pattern</strong>
        <p class="muted" style="margin-top:.4rem">
          You've logged long cycles alongside frequent acne, fatigue, and mood swings. This combination sometimes appears with PCOS or thyroid conditions.
          <a href="lifestage.html" style="color:var(--pri);font-weight:600"> → Take the PCOS Risk Assessment</a>
          <br><span style="font-size:.8rem">This is <em>not</em> a diagnosis — consult a gynaecologist for evaluation.</span>
        </p>
      </div>`;
    }

    // Phase-symptom correlation
    const phaseSym = {};
    syms.forEach(s => {
      if (s.cycleDay) {
        const key = getPhaseKey(s.cycleDay, 28);
        if (!phaseSym[key]) phaseSym[key] = [];
        phaseSym[key].push(...s.symptoms);
      }
    });
    const topPhase = Object.entries(phaseSym)
      .map(([k, v]) => ({ phase: k, count: v.length }))
      .sort((a, b) => b.count - a.count)[0];
    if (topPhase) {
      const p = CYCLE_PHASES[topPhase.phase];
      html += `<div class="insight-card">
        <strong>🔗 Phase Correlation</strong>
        <p class="muted" style="margin-top:.4rem">You log the most symptoms during your <strong>${p.name} phase</strong> ${p.emoji}. This is common and helps predict when you may need extra self-care.</p>
      </div>`;
    }
  }

  // Default prompt
  if (!html) {
    html = `<div class="insight-card">
      <strong>🌟 Building your insights</strong>
      <p class="muted" style="margin-top:.4rem">Log your period dates and daily symptoms regularly. After 2 cycles and 5+ symptom entries, personalised patterns, phase guidance, and early-warning alerts will appear here.</p>
    </div>`;
  }

  el.innerHTML = html;
}

/* ---------- Init ---------- */
(function init() {
  // Set today's date as default
  const pd = document.getElementById('periodDate');
  if (pd) pd.valueAsDate = new Date();
  renderCycleData();
  renderSymHistory();
  renderInsights();
})();
