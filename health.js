/* ===== Feature 07: HealthVault
   Feature 08: Smart Medicine Reminder (never prescribes)
   Feature 10: AI Nutritional Planner (Indian food data)
   Feature 11: Fitness & Activity
   Feature 12: Doctor Visit Summary
   Feature 13: Personal Health Score
   Data keys: aura_vault, aura_meds, aura_meals, aura_activity   */

/* -------- Hub Tabs -------- */
function switchTab(tabId) {
  document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.hub-section').forEach(s => { s.classList.remove('visible'); s.style.display = 'none'; });
  const activeBtn = document.querySelector('[data-tab="' + tabId + '"]');
  const activeSection = document.getElementById('tab-' + tabId);
  if (activeBtn) activeBtn.classList.add('active');
  if (activeSection) { activeSection.classList.add('visible'); activeSection.style.display = 'block'; }
}

/* -------- Data helpers -------- */
const getVault    = () => JSON.parse(localStorage.getItem('aura_vault')    || '[]');
const getMeds     = () => JSON.parse(localStorage.getItem('aura_meds')     || '[]');
const getMeals    = () => JSON.parse(localStorage.getItem('aura_meals')    || '[]');
const getActivity = () => JSON.parse(localStorage.getItem('aura_activity') || '[]');
const getCycles   = () => JSON.parse(localStorage.getItem('aura_cycles')   || '[]');
// getMoods() already declared in app.js — do not redeclare
const getSymptoms = () => JSON.parse(localStorage.getItem('aura_symptoms') || '[]');

/* ================================================================
   Feature 13: Personal Health Score
   Weighted components (25 pts each):
     Mood       — avg of last 7 entries   (Great=5→25, Angry=1→5)
     Cycle      — logged + regular = 25   irregular = 15  none = 5
     Activity   — active days in last 7   (7d=25, 0d=0)
     Adherence  — meds taken today ratio  (no meds = full credit)
================================================================ */
function calcHealthScore() {
  let mood = 5, cycle = 5, activity = 0, adherence = 25;
  const moodScale = { Great: 5, Good: 4, Okay: 3, Low: 2, Sad: 1, Angry: 1 };

  // Mood component
  const moods = getMoods().slice(0, 7);
  if (moods.length) {
    const avg = moods.reduce((s, m) => s + (moodScale[m.label] || 3), 0) / moods.length;
    mood = Math.round((avg / 5) * 25);
  }

  // Cycle component
  const cycles = getCycles();
  if (cycles.length >= 2) {
    const lens = cycles.slice(0, 6).map(c => c.cycleLen);
    const max = Math.max(...lens), min = Math.min(...lens);
    cycle = (max - min) <= 7 ? 25 : 15;
  } else if (cycles.length === 1) {
    cycle = 12;
  }

  // Activity component
  const now = Date.now();
  const acts = getActivity().filter(a => now - new Date(a.date).getTime() < 7 * 86400000);
  activity = Math.round((Math.min(acts.length, 7) / 7) * 25);

  // Med adherence component (no meds = full credit; if meds exist, check taken today)
  const meds = getMeds();
  if (meds.length > 0) {
    const todayStr = new Date().toDateString();
    const takenToday = meds.filter(m => m.lastTaken && new Date(m.lastTaken).toDateString() === todayStr).length;
    adherence = Math.round((takenToday / meds.length) * 25);
  }

  return { total: mood + cycle + activity + adherence, mood, cycle, activity, adherence };
}

function renderHealthScore() {
  let { total, mood, cycle, activity, adherence } = calcHealthScore();
  const scoreValEl = document.getElementById('scoreVal');
  const scoreRingEl = document.getElementById('scoreRing');
  const breakdownEl = document.getElementById('scoreBreakdown');
  if (!scoreValEl) return;

  // Demo mode: show sample score when no data logged
  const hasAnyData = getMoods().length || getCycles().length || getActivity().length;
  const isDemo = !hasAnyData;
  if (isDemo) { total = 72; mood = 20; cycle = 15; activity = 18; adherence = 19; }

  scoreValEl.textContent = total;
  if (scoreRingEl) {
    const deg = Math.round((total / 100) * 360);
    scoreRingEl.style.background = `conic-gradient(var(--pri) ${deg}deg, var(--card2) ${deg}deg)`;
  }

  const label = total >= 80 ? '🌟 Excellent' : total >= 60 ? '💜 Good' : total >= 40 ? '🌱 Building' : '🌸 Keep going';
  if (breakdownEl) {
    breakdownEl.innerHTML = `
      <div>${label}${isDemo ? ' <span style="font-size:.75rem;color:var(--muted);background:var(--card2);padding:.1rem .5rem;border-radius:8px;margin-left:.4rem">sample</span>' : ''}</div>
      <div style="color:var(--muted)">😊 Mood: <strong>${mood}/25</strong> &nbsp; 🌙 Cycle: <strong>${cycle}/25</strong> &nbsp; 🏃 Activity: <strong>${activity}/25</strong> &nbsp; 💊 Adherence: <strong>${adherence}/25</strong></div>
    `;
  }
}

/* ================================================================
   Feature 07: HealthVault
================================================================ */
function addVaultRecord() {
  const name  = document.getElementById('vaultName').value.trim();
  const type  = document.getElementById('vaultType').value;
  const date  = document.getElementById('vaultDate').value;
  const doc   = document.getElementById('vaultDoctor').value.trim();
  const notes = document.getElementById('vaultNotes').value.trim();
  if (!name) { alert('Please enter a document name 💜'); return; }
  const vault = getVault();
  vault.unshift({ id: Date.now(), name, type, date: date || new Date().toISOString().split('T')[0], doctor: doc, notes });
  localStorage.setItem('aura_vault', JSON.stringify(vault));
  ['vaultName','vaultDate','vaultDoctor','vaultNotes'].forEach(id => { document.getElementById(id).value = ''; });
  renderVault();
  renderHealthScore();
  alert('Record saved to HealthVault 🔒 Data stays on your device.');
}

function deleteVaultRecord(id) {
  const vault = getVault().filter(r => r.id !== id);
  localStorage.setItem('aura_vault', JSON.stringify(vault));
  renderVault();
}

const SAMPLE_VAULT = [
  { id: 0, name: 'Complete Blood Count', type: 'Lab Report', date: '2026-07-15', doctor: 'Apollo Diagnostics', notes: 'Hb: 11.2 g/dL · WBC: 7,200 · Platelets: 245,000' },
  { id: 0, name: 'Dr. Anjali Sharma — Gynaecology', type: 'Prescription', date: '2026-07-15', doctor: 'Apollo Hospital', notes: 'Iron supplement, Folic acid, Vitamin D3 — 3-month course' },
  { id: 0, name: 'Pelvic Ultrasound', type: 'Scan/Imaging', date: '2026-06-10', doctor: 'Cloudnine Radiology', notes: 'Uterus normal. Ovaries: small follicles noted bilaterally.' },
  { id: 0, name: 'COVID-19 Booster', type: 'Vaccination', date: '2026-04-01', doctor: 'PHC Koramangala', notes: '' }
];

function renderVault() {
  const el = document.getElementById('vaultList');
  if (!el) return;
  const vault = getVault();
  const isDemo = !vault.length;
  const data = isDemo ? SAMPLE_VAULT : vault;
  if (!data.length) { el.innerHTML = '<p class="muted">No records saved yet. Add your first health document above.</p>'; return; }
  if (isDemo) el.innerHTML = '<p style="font-size:.78rem;color:var(--muted);margin-bottom:.8rem;padding:.4rem .8rem;background:var(--card2);border-radius:8px">📋 Sample records — add your own above to replace these</p>';
  else el.innerHTML = '';
  el.innerHTML += data.map(r => `
    <div class="vault-card">
      <div class="doc-meta">
        <span style="font-size:1.4rem">${vaultEmoji(r.type)}</span>
        <div>
          <div style="font-weight:600">${r.name}</div>
          <div style="font-size:.82rem;color:var(--muted)">${r.type}${r.doctor ? ' · ' + r.doctor : ''} · ${fmtDate(r.date)}</div>
          ${r.notes ? `<div style="font-size:.8rem;color:var(--muted);margin-top:.2rem">${r.notes.slice(0,80)}</div>` : ''}
        </div>
      </div>
      ${isDemo ? '' : `<button class="del-btn" onclick="deleteVaultRecord(${r.id})" title="Delete">🗑️</button>`}
    </div>`
  ).join('');
}

function vaultEmoji(type) {
  const m = {'Lab Report':'🧪','Prescription':'💊','Scan/Imaging':'🔬','Vaccination':'💉','Discharge Summary':'🏥'};
  return m[type] || '📄';
}

/* ================================================================
   Feature 08: Smart Medicine Reminder (never prescribes)
================================================================ */
function addMed() {
  const name = document.getElementById('medName').value.trim();
  const dose = document.getElementById('medDose').value;
  const time = document.getElementById('medTime').value;
  const freq = document.getElementById('medFreq').value;
  const note = document.getElementById('medNote').value.trim();
  if (!name) { alert('Please enter a medicine name 💜'); return; }
  const meds = getMeds();
  meds.push({ id: Date.now(), name, dose: dose ? dose + 'mg' : '', time, freq, note, lastTaken: null });
  localStorage.setItem('aura_meds', JSON.stringify(meds));
  ['medName','medDose','medTime','medNote'].forEach(id => { document.getElementById(id).value = ''; });
  renderMeds();
  renderHealthScore();
}

function markTaken(id) {
  const meds = getMeds().map(m => m.id === id ? { ...m, lastTaken: new Date().toISOString() } : m);
  localStorage.setItem('aura_meds', JSON.stringify(meds));
  renderMeds();
  renderHealthScore();
}

function deleteMed(id) {
  const meds = getMeds().filter(m => m.id !== id);
  localStorage.setItem('aura_meds', JSON.stringify(meds));
  renderMeds();
  renderHealthScore();
}

const SAMPLE_MEDS = [
  { id: 0, name: 'Iron Supplement', dose: '65mg', time: '08:00', freq: 'Once daily', note: 'After breakfast', lastTaken: new Date().toISOString() },
  { id: 0, name: 'Folic Acid', dose: '5mg', time: '08:00', freq: 'Once daily', note: 'With breakfast', lastTaken: new Date().toISOString() },
  { id: 0, name: 'Vitamin D3', dose: '60000IU', time: '', freq: 'Weekly', note: 'Sunday morning', lastTaken: null },
  { id: 0, name: 'Evening Primrose Oil', dose: '500mg', time: '21:00', freq: 'Once daily', note: 'For PMS support', lastTaken: null }
];

function renderMeds() {
  const el = document.getElementById('medList');
  if (!el) return;
  const meds = getMeds();
  const isDemo = !meds.length;
  const data = isDemo ? SAMPLE_MEDS : meds;
  const todayStr = new Date().toDateString();

  let html = isDemo ? '<p style="font-size:.78rem;color:var(--muted);margin-bottom:.8rem;padding:.4rem .8rem;background:var(--card2);border-radius:8px">💊 Sample schedule — add your own medicines above to replace these</p>' : '';

  html += data.map(m => {
    const takenToday = m.lastTaken && new Date(m.lastTaken).toDateString() === todayStr;
    return `<div class="med-card">
      <div>
        <div style="font-weight:600">💊 ${m.name} ${m.dose ? '— ' + m.dose : ''}</div>
        <div style="font-size:.83rem;color:var(--muted)">${m.freq}${m.time ? ' · ' + m.time : ''}${m.note ? ' · ' + m.note : ''}</div>
        ${takenToday ? '<div style="color:var(--acc);font-size:.82rem;margin-top:.2rem">✅ Taken today</div>' : '<div style="font-size:.82rem;color:var(--muted);margin-top:.2rem">⏰ Pending</div>'}
      </div>
      ${isDemo ? '' : `<div style="display:flex;gap:.5rem;align-items:center">
        ${!takenToday ? `<button class="taken-btn" onclick="markTaken(${m.id})">✓ Taken</button>` : ''}
        <button class="del-btn" onclick="deleteMed(${m.id})" title="Delete">🗑️</button>
      </div>`}
    </div>`;
  }).join('');
  el.innerHTML = html;

  // Adherence bar
  const takenCount = data.filter(m => m.lastTaken && new Date(m.lastTaken).toDateString() === todayStr).length;
  const pct = Math.round((takenCount / data.length) * 100);
  const adEl = document.getElementById('adherenceBar');
  if (adEl) {
    adEl.innerHTML = `<p style="font-size:.85rem;color:var(--muted);margin-bottom:.4rem">Today's adherence: <strong style="color:var(--text)">${pct}%</strong> (${takenCount}/${data.length})</p>
      <div style="height:8px;background:var(--card2);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--grad);transition:width .4s;border-radius:4px"></div>
      </div>`;
  }
}

/* ================================================================
   Feature 10: AI Nutritional Planner (Indian food, cycle-aware)
================================================================ */
const NUTRITION_PHASES = {
  menstrual: {
    headline: '🔴 Menstrual Phase — Replenish & Restore',
    desc: 'Iron and magnesium are depleted during menstruation. Focus on warming, easy-to-digest Indian foods.',
    foods: ['🍃 Palak Dal (iron)', '🫘 Rajma / Lentils', '🍫 Dark Chocolate (Mg)', '🌰 Dates + Nuts', '🍚 Khichdi (easy digest)', '🫖 Ginger-Turmeric Tea'],
    avoid: 'Limit caffeine, cold foods, and processed snacks — they can worsen cramps.',
    tip: 'Add a pinch of ajwain to meals to ease bloating and cramps.'
  },
  follicular: {
    headline: '🌱 Follicular Phase — Energise & Build',
    desc: 'Estrogen rises and metabolism is active. Your body can process complex carbs and proteins well.',
    foods: ['🥗 Sprouts Salad', '🥣 Oats Poha', '🍗 Grilled Chicken / Paneer', '🥑 Avocado Toast', '🫐 Seasonal Fruits', '🥒 Cucumber Raita'],
    avoid: 'Avoid heavy, oily foods — your system is efficient now, not sluggish.',
    tip: 'Great time to try intermittent fasting if appropriate for you — consult your doctor first.'
  },
  ovulation: {
    headline: '✨ Ovulatory Phase — Peak Performance',
    desc: 'Highest energy window. Your body handles all macronutrients well. Focus on anti-inflammatory foods.',
    foods: ['🐟 Fish Curry (Omega-3)', '🥦 Stir-fried Vegetables', '🫘 Moong Dal Chilla', '🍋 Lemon Rice', '🌿 Coriander Chutney', '🍓 Berries + Yoghurt'],
    avoid: 'Keep alcohol minimal — liver is processing hormones at peak levels.',
    tip: 'Flaxseeds (alsi) support estrogen balance — add a tbsp to smoothies or dahi.'
  },
  luteal: {
    headline: '🌙 Luteal Phase — Comfort & Support',
    desc: 'Progesterone peaks. Cravings for carbs and sweets are normal — choose healthy versions.',
    foods: ['🍠 Sweet Potato Sabzi', '🍌 Banana Lassi (B6)', '🫚 Ghee Roti (healthy fat)', '🥜 Peanut Chikki', '🍵 Ashwagandha Milk', '🌾 Brown Rice Kheer'],
    avoid: 'Reduce salt to minimise bloating; limit refined sugar to avoid PMS mood swings.',
    tip: 'Magnesium (dark chocolate, pumpkin seeds) reduces PMS symptoms significantly.'
  },
  unknown: {
    headline: '🌸 General Women\'s Nutrition — Indian Plate',
    desc: 'Log your cycle on the Cycle & Symptoms page to get phase-specific nutrition advice.',
    foods: ['🫘 Legumes (protein)', '🥗 Leafy Greens (iron)', '🥛 Dahi (probiotics)', '🌾 Whole Grains', '🫖 Tulsi / Green Tea', '🌰 Mixed Nuts'],
    avoid: 'Limit ultra-processed food, excess salt, and sugary drinks.',
    tip: 'Indian cuisine is naturally cycle-friendly — focus on seasonal, home-cooked meals.'
  }
};

function getCurrentPhaseKey() {
  const cycles = getCycles();
  if (!cycles.length) return 'unknown';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = new Date(cycles[0].date + 'T00:00:00'); last.setHours(0, 0, 0, 0);
  const day = Math.floor((today - last) / 86400000) + 1;
  const len = cycles[0].cycleLen || 28;
  const d = ((day - 1) % len) + 1;
  if (d <= 5) return 'menstrual';
  if (d <= 13) return 'follicular';
  if (d <= 16) return 'ovulation';
  return 'luteal';
}

function renderNutrition() {
  const phaseKey = getCurrentPhaseKey();
  const phase = NUTRITION_PHASES[phaseKey];
  const pcEl = document.getElementById('nutritionPhaseCard');
  const ncEl = document.getElementById('nutritionContent');
  if (!pcEl || !ncEl) return;
  pcEl.innerHTML = `<strong>${phase.headline}</strong><p class="muted" style="margin-top:.4rem">${phase.desc}</p>`;
  ncEl.innerHTML = `
    <div class="grid-2" style="margin-top:1rem">
      <section class="panel">
        <h2>✅ Recommended Foods</h2>
        <div class="food-grid">${phase.foods.map(f => `<div class="food-chip">${f}</div>`).join('')}</div>
      </section>
      <section class="panel">
        <h2>💡 Phase Tips</h2>
        <div style="background:var(--card2);border-radius:10px;padding:1rem;margin-bottom:.8rem;line-height:1.6;font-size:.9rem">🌿 <strong>Tip:</strong> ${phase.tip}</div>
        <div style="background:rgba(255,107,138,.08);border:1px solid rgba(255,107,138,.2);border-radius:10px;padding:1rem;font-size:.9rem;line-height:1.5">⚠️ ${phase.avoid}</div>
      </section>
    </div>
    <div style="margin-top:1rem"><p class="muted" style="font-size:.8rem">💜 Nutritional guidance only — not a substitute for professional dietary advice. Consult a nutritionist for personalised plans.</p></div>
  `;
}

function logMeal() {
  const name = document.getElementById('mealName').value.trim();
  if (!name) { alert('Please enter what you ate 💜'); return; }
  const meals = getMeals();
  meals.unshift({
    id: Date.now(),
    name,
    cat: document.getElementById('mealCat').value,
    cal: parseInt(document.getElementById('mealCal').value) || null,
    note: document.getElementById('mealNote').value.trim(),
    date: new Date().toISOString()
  });
  localStorage.setItem('aura_meals', JSON.stringify(meals.slice(0, 60)));
  ['mealName','mealCal','mealNote'].forEach(id => { document.getElementById(id).value = ''; });
  renderMealHistory();
}

const SAMPLE_MEALS = [
  { cat: '🌅 Breakfast', name: 'Oats Poha with veggies', cal: 320, date: new Date().toISOString() },
  { cat: '☀️ Lunch', name: 'Dal Chawal + Salad', cal: 480, date: new Date().toISOString() },
  { cat: '🍎 Snack', name: 'Banana + Peanut Butter', cal: 210, date: new Date(Date.now() - 86400000).toISOString() },
  { cat: '🌙 Dinner', name: 'Palak Paneer + Roti', cal: 420, date: new Date(Date.now() - 86400000).toISOString() }
];

function renderMealHistory() {
  const el = document.getElementById('mealHistory');
  if (!el) return;
  const meals = getMeals().slice(0, 5);
  const isDemo = !meals.length;
  const data = isDemo ? SAMPLE_MEALS : meals;
  el.innerHTML = (isDemo ? '<p style="font-size:.78rem;color:var(--muted);margin-bottom:.6rem;padding:.4rem .8rem;background:var(--card2);border-radius:8px">🥗 Sample meals — log your own above</p>' : '') +
    data.map(m =>
      `<div style="display:flex;justify-content:space-between;padding:.6rem .8rem;background:var(--card2);border-radius:8px;margin-bottom:.4rem;font-size:.9rem">
         <span>${m.cat} · ${m.name}</span>
         <span class="muted">${m.cal ? m.cal + ' kcal · ' : ''}${new Date(m.date).toLocaleDateString()}</span>
       </div>`
    ).join('');
}

/* ================================================================
   Feature 11: Fitness & Activity
================================================================ */
function logActivity() {
  const type = document.getElementById('actType').value;
  const dur  = parseInt(document.getElementById('actDuration').value);
  const steps = parseInt(document.getElementById('actSteps').value) || null;
  const dateVal = document.getElementById('actDate').value;
  if (!dur) { alert('Please enter duration 💜'); return; }
  const cals = Math.round(dur * (type.includes('Run') ? 9 : type.includes('Yoga') ? 3 : type.includes('Cycling') ? 6 : 4));
  const acts = getActivity();
  acts.unshift({ id: Date.now(), type, duration: dur, steps, cals, date: dateVal ? dateVal + 'T12:00:00' : new Date().toISOString() });
  localStorage.setItem('aura_activity', JSON.stringify(acts.slice(0, 120)));
  ['actDuration','actSteps','actDate'].forEach(id => { document.getElementById(id).value = ''; });
  renderActivity();
  renderHealthScore();
}

const SAMPLE_ACTS = [
  { type: '🧘 Yoga', duration: 30, steps: null, cals: 90, date: new Date().toISOString() },
  { type: '🚶 Walk', duration: 45, steps: 5200, cals: 180, date: new Date(Date.now() - 86400000).toISOString() },
  { type: '🏃 Run', duration: 25, steps: 3800, cals: 225, date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { type: '💃 Dance', duration: 40, steps: null, cals: 200, date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { type: '🧘 Yoga', duration: 30, steps: null, cals: 90, date: new Date(Date.now() - 4 * 86400000).toISOString() },
  { type: '🚴 Cycling', duration: 35, steps: null, cals: 210, date: new Date(Date.now() - 5 * 86400000).toISOString() }
];

function renderActivity() {
  const el = document.getElementById('actHistory');
  if (!el) return;
  const acts = getActivity().slice(0, 7);
  const isDemo = !acts.length;
  const data = isDemo ? SAMPLE_ACTS : acts;

  el.innerHTML = (isDemo ? '<p style="font-size:.78rem;color:var(--muted);margin-bottom:.6rem;padding:.4rem .8rem;background:var(--card2);border-radius:8px">🏃 Sample activity log — add your own above</p>' : '') +
    data.map(a =>
      `<div class="activity-card">
         <div style="display:flex;align-items:center">
           <span class="activity-type">${a.type.split(' ')[0]}</span>
           <div>
             <div style="font-weight:600;font-size:.9rem">${a.type.replace(/^[^ ]+ /, '')}</div>
             <div style="font-size:.8rem;color:var(--muted)">${a.duration} min${a.steps ? ' · ' + a.steps.toLocaleString() + ' steps' : ''} · ~${a.cals} kcal</div>
           </div>
         </div>
         <span class="muted" style="font-size:.8rem">${new Date(a.date).toLocaleDateString()}</span>
       </div>`
    ).join('');

  // Weekly metrics (use demo data if no real data)
  const now = Date.now();
  const week = isDemo ? SAMPLE_ACTS : getActivity().filter(a => now - new Date(a.date).getTime() < 7 * 86400000);
  const wsEl = document.getElementById('weekSteps');
  const waEl = document.getElementById('weekActive');
  const wmEl = document.getElementById('weekMinutes');
  const wcEl = document.getElementById('weekCals');
  if (wsEl) wsEl.textContent = week.length ? Math.round(week.filter(a => a.steps).reduce((s, a) => s + (a.steps || 0), 0) / Math.max(week.filter(a => a.steps).length, 1)).toLocaleString() : '—';
  if (waEl) waEl.textContent = week.length ? new Set(week.map(a => new Date(a.date).toDateString())).size : '0';
  if (wmEl) wmEl.textContent = week.length ? Math.round(week.reduce((s, a) => s + a.duration, 0) / week.length) : '—';
  if (wcEl) wcEl.textContent = week.length ? Math.round(week.reduce((s, a) => s + a.cals, 0) / week.length) : '—';

  // Cycle-correlated tip
  const tipEl = document.getElementById('cycleActivityTip');
  if (tipEl) {
    const phaseKey = getCurrentPhaseKey();
    const tips = {
      menstrual: '🔴 During your period: gentle yoga, walking, or stretching are ideal. Avoid intense training if cramping.',
      follicular: '🌱 Follicular phase: your strength and endurance are rising — great time for cardio and strength training.',
      ovulation: '✨ Ovulatory phase: peak performance window — push yourself with HIIT, running, or dance.',
      luteal: '🌙 Luteal phase: your body needs more recovery — pilates, yoga, and easy walks work well.',
      unknown: '🌸 Log your cycle to get phase-correlated workout tips.'
    };
    tipEl.innerHTML = `<div style="background:var(--card2);border-radius:10px;padding:.8rem 1rem;font-size:.85rem;line-height:1.5">${tips[phaseKey]}</div>`;
  }
}

/* ================================================================
   Feature 12: Doctor Visit Summary
================================================================ */
function generateSummary() {
  const months = parseInt(document.getElementById('summaryRange').value);
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months);

  const moods    = getMoods().filter(m => new Date(m.date) >= cutoff);
  const cycles   = getCycles().filter(c => new Date(c.date + 'T00:00:00') >= cutoff);
  const syms     = getSymptoms().filter(s => new Date(s.date) >= cutoff);
  const acts     = getActivity().filter(a => new Date(a.date) >= cutoff);
  const meds     = getMeds();
  const vault    = getVault().filter(v => new Date(v.date + 'T00:00:00') >= cutoff);

  // Show a realistic demo summary when no real data has been logged yet
  const hasData = moods.length || cycles.length || syms.length || acts.length || meds.length || vault.length;
  if (!hasData) {
    document.getElementById('summaryBox').textContent = `AURA CARE — PATIENT HEALTH SUMMARY  [SAMPLE]
Generated: 20 August 2026
Period: Last ${months} month${months > 1 ? 's' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENSTRUAL CYCLE
• Cycles logged: 3
• Average cycle length: 29 days
• Period dates: 2026-07-22, 2026-06-23, 2026-05-25
• Cycle regularity: Regular

MOOD & MENTAL WELLNESS
• Mood entries: 24
• Average mood score: 3.8 / 5
• Recent moods: 🙂 Good, 😊 Great, 😐 Okay, 🙂 Good, 😊 Great

SYMPTOMS
• Symptom entries: 18
• Most frequent: cramps (6×), bloating (5×), fatigue (4×), mood swings (3×), headache (2×)

PHYSICAL ACTIVITY
• Activity sessions logged: 14
• Types: Yoga, Walk, Run, Cycling

MEDICATIONS
• Iron supplement 65mg — Once daily (After meals)
• Folic acid 5mg — Once daily (Morning)
• Vitamin D3 60000IU — Weekly

HEALTH RECORDS (HealthVault)
• Lab Report: Complete Blood Count — 2026-07-15
• Prescription: Dr. Anjali Sharma, Apollo — 2026-07-15
• Scan/Imaging: Pelvic Ultrasound — 2026-06-10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by Aura Care — AI Women's Wellness App
This summary is informational only and does not constitute medical advice.
Please discuss all findings with your healthcare provider.

─────────────────────────────────────────
 ↑ This is a SAMPLE preview. Start logging your data across Aura Care
   and click "Generate Summary" to create your personalised report.
─────────────────────────────────────────`;
    return;
  }

  const moodScale = { Great: 5, Good: 4, Okay: 3, Low: 2, Sad: 1, Angry: 1 };
  const avgMood = moods.length ? (moods.reduce((s, m) => s + (moodScale[m.label] || 3), 0) / moods.length).toFixed(1) : 'N/A';
  const avgCycleLen = cycles.length ? Math.round(cycles.reduce((s, c) => s + c.cycleLen, 0) / cycles.length) : 'N/A';

  const symFreq = {};
  syms.forEach(s => s.symptoms.forEach(sym => { symFreq[sym] = (symFreq[sym] || 0) + 1; }));
  const topSyms = Object.entries(symFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const summary = `AURA CARE — PATIENT HEALTH SUMMARY
Generated: ${today}
Period: Last ${months} month${months > 1 ? 's' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENSTRUAL CYCLE
• Cycles logged: ${cycles.length}
• Average cycle length: ${avgCycleLen} days
${cycles.length ? '• Period dates: ' + cycles.slice(0, 4).map(c => c.date).join(', ') : '• No cycle data logged'}
${cycles.length >= 2 ? '• Cycle regularity: ' + (Math.max(...cycles.map(c=>c.cycleLen)) - Math.min(...cycles.map(c=>c.cycleLen)) <= 7 ? 'Regular' : 'Irregular — variation noted') : ''}

MOOD & MENTAL WELLNESS
• Mood entries: ${moods.length}
• Average mood score: ${avgMood} / 5
${moods.length ? '• Recent moods: ' + moods.slice(0, 5).map(m => m.emoji + ' ' + m.label).join(', ') : '• No mood data logged'}

SYMPTOMS
• Symptom entries: ${syms.length}
${topSyms.length ? '• Most frequent: ' + topSyms.map(([s, c]) => s.replace('-', ' ') + ' (' + c + 'x)').join(', ') : '• No symptom data logged'}

PHYSICAL ACTIVITY
• Activity sessions logged: ${acts.length}
${acts.length ? '• Types: ' + [...new Set(acts.map(a => a.type.replace(/^[^ ]+ /, '')))].slice(0, 4).join(', ') : '• No activity data logged'}

MEDICATIONS
${meds.length ? meds.map(m => '• ' + m.name + (m.dose ? ' ' + m.dose : '') + ' — ' + m.freq + (m.note ? ' (' + m.note + ')' : '')).join('\n') : '• No medications tracked'}

HEALTH RECORDS (HealthVault)
${vault.length ? vault.slice(0, 5).map(v => '• ' + v.type + ': ' + v.name + ' — ' + v.date).join('\n') : '• No records in HealthVault'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by Aura Care — AI Women's Wellness App
This summary is informational only and does not constitute medical advice.
Please discuss all findings with your healthcare provider.`;

  document.getElementById('summaryBox').textContent = summary;
}

function copySummary() {
  const text = document.getElementById('summaryBox').textContent;
  if (text.includes('Generate Summary')) { alert('Please generate the summary first 💜'); return; }
  navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard! Share with your doctor 💜'));
}

/* ================================================================
   Init
================================================================ */
function fmtDate(d) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

(function init() {
  try {
    const actDateEl = document.getElementById('actDate');
    if (actDateEl) actDateEl.valueAsDate = new Date();
    const vaultDateEl = document.getElementById('vaultDate');
    if (vaultDateEl) vaultDateEl.valueAsDate = new Date();
    renderHealthScore();
    renderVault();
    renderMeds();
    renderNutrition();
    renderMealHistory();
    renderActivity();
    generateSummary();          // pre-populate Doctor Summary on load
    switchTab('vault');          // start on HealthVault tab
  } catch(e) { console.error('Aura Health init error:', e); }
})();
