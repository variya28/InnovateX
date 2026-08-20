/* ===== Feature 04: PCOS Risk Assessment (indication only — not diagnosis)
   Feature 06: Pregnancy Mode
   Feature 14: Skin & Hair Progress
   Feature 15: Menopause Mode
   Feature 16: Teen / First Period Mode
   Data keys: aura_pcos_answers, aura_appointments, aura_menopause_log, aura_skin   */

/* -------- Stage Selector -------- */
function setStage(stage) {
  document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.stage-content').forEach(c => c.classList.remove('visible'));
  const card = document.querySelector(`.stage-card[data-stage="${stage}"]`);
  const content = document.getElementById('stage-' + stage);
  if (card) card.classList.add('active');
  if (content) content.classList.add('visible');
  // Save preference
  localStorage.setItem('aura_lifestage', stage);
}

// Restore last selected stage
(function restoreStage() {
  const saved = localStorage.getItem('aura_lifestage') || 'teen';
  setStage(saved);
})();

/* ================================================================
   Feature 04: PCOS Risk Assessment
   Scoring: 0-3 = Lower, 4-6 = Moderate, 7+ = Higher indication
   Disclaimer: not a diagnosis — clinician evaluation required
================================================================ */
const PCOS_QUESTIONS = [
  {
    id: 'q1', question: 'How would you describe your menstrual cycles?',
    options: [
      { label: 'Regular (25–35 days)', score: 0 },
      { label: 'Slightly irregular (sometimes skip)', score: 1 },
      { label: 'Very irregular or rare (>35 days)', score: 2 }
    ]
  },
  {
    id: 'q2', question: 'Do you experience acne beyond teenage years?',
    options: [
      { label: 'No / minimal', score: 0 },
      { label: 'Moderate, especially jaw/chin/back', score: 1 },
      { label: 'Severe, persistent', score: 2 }
    ]
  },
  {
    id: 'q3', question: 'Do you have excess hair growth (face, chest, stomach)?',
    options: [
      { label: 'No', score: 0 },
      { label: 'Some, mild', score: 1 },
      { label: 'Noticeable, concerns me', score: 2 }
    ]
  },
  {
    id: 'q4', question: 'Have you noticed hair thinning or loss from the scalp?',
    options: [
      { label: 'No', score: 0 },
      { label: 'Mild thinning', score: 1 },
      { label: 'Significant thinning', score: 2 }
    ]
  },
  {
    id: 'q5', question: 'How would you describe your weight?',
    options: [
      { label: 'Healthy / stable', score: 0 },
      { label: 'Difficulty losing weight despite effort', score: 1 },
      { label: 'Significant unexplained weight gain', score: 2 }
    ]
  },
  {
    id: 'q6', question: 'Do you experience significant fatigue or energy crashes?',
    options: [
      { label: 'Rarely', score: 0 },
      { label: 'Sometimes, especially after meals', score: 1 },
      { label: 'Frequently', score: 2 }
    ]
  },
  {
    id: 'q7', question: 'Family history of PCOS, diabetes, or thyroid issues?',
    options: [
      { label: 'No known history', score: 0 },
      { label: 'Possible / unsure', score: 1 },
      { label: 'Yes, confirmed in close family', score: 2 }
    ]
  }
];

let pcosAnswers = {};

function renderPCOSQuiz() {
  const el = document.getElementById('pcosQuiz');
  if (!el) return;
  el.innerHTML = PCOS_QUESTIONS.map(q => `
    <div class="quiz-q">
      <h3>${q.question}</h3>
      <div class="quiz-opts">
        ${q.options.map((opt, i) => `
          <button class="quiz-opt ${pcosAnswers[q.id] === i ? 'selected' : ''}"
            onclick="selectPCOSOption('${q.id}', ${i}, ${opt.score}, this)">
            ${opt.label}
          </button>`
        ).join('')}
      </div>
    </div>`
  ).join('');
}

function selectPCOSOption(qId, optIdx, score, btn) {
  pcosAnswers[qId] = optIdx;
  pcosAnswers[qId + '_score'] = score;
  // Update UI for this question
  const allBtns = btn.closest('.quiz-opts').querySelectorAll('.quiz-opt');
  allBtns.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function calcPCOS() {
  const answered = PCOS_QUESTIONS.filter(q => pcosAnswers[q.id] !== undefined).length;
  if (answered < PCOS_QUESTIONS.length) {
    alert(`Please answer all ${PCOS_QUESTIONS.length} questions to get your assessment 💜`);
    return;
  }
  const total = PCOS_QUESTIONS.reduce((s, q) => s + (pcosAnswers[q.id + '_score'] || 0), 0);
  const max = PCOS_QUESTIONS.length * 2;
  const pct = Math.round((total / max) * 100);

  let cls, label, desc, action;
  if (total <= 3) {
    cls = 'result-low';
    label = '✅ Lower Indication';
    desc = `Your responses suggest a <strong>lower likelihood</strong> of PCOS based on common risk factors. Continue monitoring your cycle health and maintain a balanced lifestyle.`;
    action = 'Regular yearly check-ups with your gynaecologist are recommended for all women.';
  } else if (total <= 6) {
    cls = 'result-mod';
    label = '⚠️ Moderate Indication';
    desc = `Your responses suggest a <strong>moderate indication</strong> of hormonal factors associated with PCOS. This does not mean you have PCOS.`;
    action = 'Schedule an appointment with a gynaecologist. They may recommend an ultrasound and blood tests (LH, FSH, testosterone, insulin) to evaluate further.';
  } else {
    cls = 'result-high';
    label = '🔴 Higher Indication';
    desc = `Your responses suggest several factors commonly associated with PCOS. <strong>This is not a diagnosis</strong> — only a clinician can confirm PCOS.`;
    action = 'Please consult a gynaecologist soon. PCOS is very manageable with the right support, lifestyle changes, and medical guidance. You are not alone — PCOS affects 1 in 10 women.';
  }

  localStorage.setItem('aura_pcos_result', JSON.stringify({ total, max, pct, label, date: new Date().toISOString() }));

  document.getElementById('pcosResult').innerHTML = `
    <div class="${cls}">
      <h3 style="margin-bottom:.7rem">${label}</h3>
      <p style="margin-bottom:.7rem;line-height:1.6">${desc}</p>
      <div style="background:rgba(0,0,0,.15);border-radius:10px;padding:1rem;margin-bottom:.8rem">
        <div style="font-size:.85rem;color:var(--muted);margin-bottom:.4rem">Risk score: ${total}/${max}</div>
        <div style="height:8px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--grad2);border-radius:4px"></div>
        </div>
      </div>
      <p style="line-height:1.6;font-size:.9rem"><strong>Recommended action:</strong> ${action}</p>
      <p style="margin-top:.8rem;font-size:.78rem;color:var(--muted)">⚕️ This assessment is informational only. Only a qualified healthcare professional can diagnose PCOS through clinical evaluation, ultrasound, and blood tests.</p>
    </div>`;
}

function resetPCOS() {
  pcosAnswers = {};
  document.getElementById('pcosResult').innerHTML = '';
  renderPCOSQuiz();
}

/* ================================================================
   Feature 06: Pregnancy Mode
================================================================ */
const PREGNANCY_WEEKS = {
  4:  { size: 'a poppy seed 🌱', dev: 'The blastocyst implants. Neural tube begins forming.', sym: 'Possible tender breasts, fatigue, missed period.' },
  6:  { size: 'a pea 🫛', dev: 'Heart starts beating. Brain and spinal cord developing.', sym: 'Morning sickness, frequent urination, sore breasts.' },
  8:  { size: 'a raspberry 🫐', dev: 'Major organs forming. Tiny fingers and toes appear.', sym: 'Nausea peaks. Fatigue. Food aversions common.' },
  10: { size: 'a strawberry 🍓', dev: 'Now officially a foetus. Organs functional.', sym: 'Bloating, mood swings, round ligament pain.' },
  12: { size: 'a lime 🍋', dev: 'First trimester complete. Reflexes developing.', sym: 'Nausea eases for many. Energy may return.' },
  16: { size: 'an avocado 🥑', dev: 'Can make facial expressions. Hearing develops.', sym: 'Baby movements may begin. Skin glows.' },
  20: { size: 'a banana 🍌', dev: 'Halfway! Detailed anatomy scan recommended.', sym: 'Kicks felt more strongly. Lower back ache.' },
  24: { size: 'a corn cob 🌽', dev: 'Lungs developing. Baby responds to sound.', sym: 'Braxton Hicks. Heartburn. Swollen feet.' },
  28: { size: 'an aubergine 🍆', dev: 'Third trimester begins. Eyes open. Fat deposits form.', sym: 'Shortness of breath. More frequent kicks.' },
  32: { size: 'a squash 🎃', dev: 'Brain rapidly developing. Practising breathing movements.', sym: 'Pelvic pressure. Colostrum may leak.' },
  36: { size: 'a coconut 🥥', dev: 'Full-term approaching. Baby drops into pelvis.', sym: 'Lightening — easier breathing. Pelvic discomfort.' },
  40: { size: 'a watermelon 🍉', dev: 'Ready to meet the world! 💜', sym: 'Labour signs: contractions, water breaking, bloody show.' }
};

function calcPregnancyWeek() {
  const lmp = document.getElementById('lmpDate').value;
  if (!lmp) { alert('Please enter your LMP date 💜'); return; }
  const lmpDate = new Date(lmp + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.floor((today - lmpDate) / 86400000);
  const weeks = Math.floor(days / 7);
  const daysLeft = days % 7;
  const dueDate = new Date(lmpDate); dueDate.setDate(dueDate.getDate() + 280);

  if (weeks < 1 || weeks > 42) {
    document.getElementById('pregnancyResult').innerHTML = '<p class="muted">Please check the date — ensure it is your last menstrual period date.</p>';
    return;
  }

  // Find nearest week milestone
  const milestoneWeek = Object.keys(PREGNANCY_WEEKS).map(Number).reduce((prev, curr) => Math.abs(curr - weeks) < Math.abs(prev - weeks) ? curr : prev);
  const milestone = PREGNANCY_WEEKS[milestoneWeek];

  document.getElementById('pregnancyResult').innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(240,171,252,.15),rgba(167,139,250,.1));border:1px solid rgba(240,171,252,.3);border-radius:16px;padding:1.5rem;margin-bottom:1.2rem">
      <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-size:3rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent">${weeks}</div>
          <div style="color:var(--muted);font-size:.85rem">weeks${daysLeft > 0 ? ' + ' + daysLeft + 'd' : ''}</div>
        </div>
        <div style="flex:1">
          <h3>Your baby is the size of ${milestone.size}</h3>
          <p class="muted" style="margin:.4rem 0">🗓️ Due date: <strong>${dueDate.toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</strong></p>
          <p class="muted" style="font-size:.85rem">Trimester: ${weeks <= 12 ? 'First' : weeks <= 26 ? 'Second' : 'Third'}</p>
        </div>
      </div>
    </div>
    <div class="grid-2">
      <div style="background:var(--card2);border-radius:12px;padding:1.1rem">
        <strong>👶 Development (Week ${milestoneWeek})</strong>
        <p class="muted" style="margin-top:.4rem;font-size:.9rem;line-height:1.6">${milestone.dev}</p>
      </div>
      <div style="background:var(--card2);border-radius:12px;padding:1.1rem">
        <strong>💊 Common Symptoms</strong>
        <p class="muted" style="margin-top:.4rem;font-size:.9rem;line-height:1.6">${milestone.sym}</p>
      </div>
    </div>
    <p class="muted" style="font-size:.78rem;margin-top:1rem">⚕️ Weeks calculated from LMP — your doctor may adjust based on ultrasound measurements. Always follow your healthcare provider's guidance.</p>
  `;
}

function addAppointment() {
  const name = document.getElementById('apptName').value.trim();
  const date = document.getElementById('apptDate').value;
  if (!name || !date) { alert('Please enter appointment name and date 💜'); return; }
  const appts = JSON.parse(localStorage.getItem('aura_appointments') || '[]');
  appts.push({ id: Date.now(), name, date });
  appts.sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem('aura_appointments', JSON.stringify(appts));
  document.getElementById('apptName').value = '';
  document.getElementById('apptDate').value = '';
  renderAppointments();
}

function deleteAppt(id) {
  const appts = JSON.parse(localStorage.getItem('aura_appointments') || '[]').filter(a => a.id !== id);
  localStorage.setItem('aura_appointments', JSON.stringify(appts));
  renderAppointments();
}

function renderAppointments() {
  const el = document.getElementById('apptList');
  if (!el) return;
  const appts = JSON.parse(localStorage.getItem('aura_appointments') || '[]');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  el.innerHTML = appts.length ? appts.map(a => {
    const apptDate = new Date(a.date + 'T00:00:00');
    const isPast = apptDate < today;
    return `<div class="week-card" style="opacity:${isPast ? '.6' : '1'}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="font-weight:600">${isPast ? '✅' : '📅'} ${a.name}</span>
          ${isPast ? '<span class="tag-badge">Past</span>' : ''}
          <div class="muted" style="font-size:.85rem;margin-top:.2rem">${apptDate.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</div>
        </div>
        <button onclick="deleteAppt(${a.id})" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:1rem">🗑️</button>
      </div>
    </div>`;
  }).join('') : '<p class="muted">No appointments logged yet.</p>';
}

/* ================================================================
   Feature 15: Menopause Mode
================================================================ */
let selectedMenSyms = new Set();

function toggleMenSym(btn) {
  const sym = btn.dataset.msym;
  if (selectedMenSyms.has(sym)) {
    selectedMenSyms.delete(sym);
    btn.classList.remove('active');
  } else {
    selectedMenSyms.add(sym);
    btn.classList.add('active');
  }
}

function saveMenopauseLog() {
  const syms = [...selectedMenSyms];
  if (!syms.length) { alert('Select at least one symptom 💜'); return; }
  const log = JSON.parse(localStorage.getItem('aura_menopause_log') || '[]');
  log.unshift({ date: new Date().toISOString(), symptoms: syms });
  localStorage.setItem('aura_menopause_log', JSON.stringify(log.slice(0, 60)));
  selectedMenSyms.clear();
  document.querySelectorAll('[data-msym]').forEach(b => b.classList.remove('active'));
  renderMenopauseHistory();
  alert('Logged 💜 Share this history with your doctor to get better care.');
}

function renderMenopauseHistory() {
  const el = document.getElementById('menopauseHistory');
  if (!el) return;
  const log = JSON.parse(localStorage.getItem('aura_menopause_log') || '[]').slice(0, 5);
  el.innerHTML = log.length ? log.map(l =>
    `<div style="display:flex;justify-content:space-between;padding:.7rem .9rem;background:var(--card2);border-radius:10px;margin-bottom:.4rem;font-size:.88rem">
       <span>${l.symptoms.map(s => s.replace('-', ' ')).join(', ')}</span>
       <span class="muted">${new Date(l.date).toLocaleDateString()}</span>
     </div>`
  ).join('') : '';
}

/* ================================================================
   Feature 14: Skin & Hair Progress (progress comparison, not diagnosis)
================================================================ */
let currentSkinRating = 0;

function setRating(r) {
  currentSkinRating = r;
  const emojis = ['', '😞', '😔', '😐', '🙂', '😊'];
  document.querySelectorAll('#skinRating button').forEach((btn, i) => {
    btn.style.transform = (i + 1) <= r ? 'scale(1.3)' : 'scale(1)';
    btn.style.opacity = (i + 1) <= r ? '1' : '.4';
  });
}

function addSkinEntry() {
  const note = document.getElementById('skinNote').value.trim();
  const cat = document.getElementById('skinCategory').value;
  if (!note) { alert('Please describe what you noticed 💜'); return; }
  const entries = JSON.parse(localStorage.getItem('aura_skin') || '[]');
  const emojis = { skin: '🧴', hair: '💇', nails: '💅' };
  entries.unshift({ id: Date.now(), cat, note, rating: currentSkinRating, emoji: emojis[cat] || '✨', date: new Date().toISOString() });
  localStorage.setItem('aura_skin', JSON.stringify(entries.slice(0, 60)));
  document.getElementById('skinNote').value = '';
  currentSkinRating = 0;
  document.querySelectorAll('#skinRating button').forEach(b => { b.style.transform = 'scale(1)'; b.style.opacity = '.4'; });
  renderSkinTimeline();
}

function deleteSkinEntry(id) {
  const entries = JSON.parse(localStorage.getItem('aura_skin') || '[]').filter(e => e.id !== id);
  localStorage.setItem('aura_skin', JSON.stringify(entries));
  renderSkinTimeline();
}

function renderSkinTimeline() {
  const el = document.getElementById('skinTimeline');
  if (!el) return;
  const entries = JSON.parse(localStorage.getItem('aura_skin') || '[]');
  const ratingEmojis = ['', '😞', '😔', '😐', '🙂', '😊'];
  el.innerHTML = entries.length ? entries.map(e =>
    `<div class="progress-entry">
       <div class="progress-head">
         <span style="font-weight:600">${e.emoji} ${e.cat.charAt(0).toUpperCase() + e.cat.slice(1)} ${e.rating ? '— ' + ratingEmojis[e.rating] : ''}</span>
         <div style="display:flex;gap:.5rem;align-items:center">
           <span class="muted" style="font-size:.8rem">${new Date(e.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
           <button onclick="deleteSkinEntry(${e.id})" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:.9rem">🗑️</button>
         </div>
       </div>
       <p style="font-size:.88rem;color:var(--muted);line-height:1.5">${e.note}</p>
     </div>`
  ).join('') : '<p class="muted">No entries yet. Start your progress timeline above.</p>';
}

/* -------- Init -------- */
(function init() {
  renderPCOSQuiz();
  renderAppointments();
  renderMenopauseHistory();
  renderSkinTimeline();
  // Set today's date defaults
  const apptDateEl = document.getElementById('apptDate');
  if (apptDateEl) apptDateEl.valueAsDate = new Date();
  const lmpEl = document.getElementById('lmpDate');
  if (lmpEl) lmpEl.valueAsDate = new Date();
  // Init rating dots opacity
  document.querySelectorAll('#skinRating button').forEach(b => { b.style.opacity = '.4'; });
})();
