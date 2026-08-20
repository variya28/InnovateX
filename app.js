/* ========= Mood Tracker ========= */
let selectedMood = null;
document.querySelectorAll('.mood-picker button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mood-picker button').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood={emoji:btn.dataset.mood,label:btn.dataset.label};
  });
});

function getMoods(){return JSON.parse(localStorage.getItem('aura_moods')||'[]');}
function saveMood(){
  if(!selectedMood){alert('Pick a mood first 💜');return;}
  const note=document.getElementById('moodNote').value;
  const moods=getMoods();
  moods.unshift({...selectedMood,note,date:new Date().toISOString()});
  localStorage.setItem('aura_moods',JSON.stringify(moods.slice(0,30)));
  document.getElementById('moodNote').value='';
  document.querySelectorAll('.mood-picker button').forEach(b=>b.classList.remove('selected'));
  selectedMood=null;
  renderHistory();renderChart();
}
function renderHistory(){
  const el=document.getElementById('history');if(!el)return;
  const moods=getMoods().slice(0,5);
  el.innerHTML=moods.length?moods.map(m=>`
    <li><span>${m.emoji} <strong>${m.label}</strong> ${m.note?'— '+m.note:''}</span>
    <span class="muted">${new Date(m.date).toLocaleDateString()}</span></li>`).join(''):
    '<li class="muted">No entries yet. Log your first mood above ✨</li>';
}
function renderChart(){
  const el=document.getElementById('chart');if(!el)return;
  const scale={'Great':5,'Good':4,'Okay':3,'Low':2,'Sad':1,'Angry':1};
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const moods=getMoods();
  const sample=[3,4,3,4,5,4,moods[0]?scale[moods[0].label]:3];
  el.innerHTML=days.map((d,i)=>`<div class="bar" style="height:${sample[i]*22}px"><span>${d}</span></div>`).join('');
}
renderHistory();renderChart();

/* ========= SOS ========= */
function showSOS(){document.getElementById('sosModal')?.classList.remove('hidden');}
function hideSOS(){document.getElementById('sosModal')?.classList.add('hidden');}

/* ========= AI Chat (Women-tuned) ========= */
const responses={
  anxious:[
    "I hear you, sister 💜. Anxiety is exhausting. Let's try a 4-7-8 breath together — inhale 4s, hold 7s, exhale 8s. You're safe here.",
    "That sounds heavy. Can you tell me what's on your mind? Sometimes naming the fear takes away half its weight."
  ],
  burnout:[
    "You're carrying so much — work, home, relationships, invisible labor. That's real, and it's exhausting. What's one thing you can let go of this week?",
    "Burnout isn't weakness, it's a signal. Your body is asking for rest. What would 20 minutes just for YOU look like today?"
  ],
  lonely:[
    "Loneliness is one of the hardest feelings, and it doesn't mean anything is wrong with you 💜. Would you like to see stories from other women who feel the same in our Sisterhood community?",
    "You reached out — that's brave. Loneliness lies to us that we're the only one. You're not. Many women here feel exactly this."
  ],
  hormonal:[
    "Hormones are powerful, and their effect on mood is real — PMS, postpartum, perimenopause, menopause. You're not 'crazy' or 'too much'. Tracking your cycle here can help spot patterns.",
    "Your feelings are valid, and biology plays a real role. Be gentle with yourself today. Would a calming exercise help right now?"
  ],
  unsafe:[
    "Your safety matters most 💜. If you feel unsafe, please tap the 🚨 Crisis Help button — Women's Helpline 181 is free and available 24/7. I'm here with you.",
    "Thank you for trusting me with this. You deserve to feel safe. If you're in danger, please reach out to 181 or 1091 immediately. Would you like resources on staying safe?"
  ],
  motivation:[
    "You're stronger than you know 🌟. Look at everything you've already survived. What's one small kind thing you can do for yourself right now?",
    "Progress > perfection. Even opening this app is self-care. You don't have to be everything to everyone today.",
    "Being a woman in this world takes courage every single day. You're doing it. What's one thing that made you smile this week?"
  ],
  cycle:[
    "Your cycle is at the heart of so much. Tracking it helps you understand your moods, energy, and symptoms. Have you tried the 🌙 Cycle & Symptoms tracker? It gives you phase-aware insights.",
    "Irregular cycles are more common than you'd think — stress, diet, and hormones all play a role. The Cycle Tracker can help you spot patterns to share with your doctor.",
    "Cramps, mood shifts, fatigue — these are real and valid, not 'just in your head'. Tracking your cycle helps connect the dots 💜"
  ],
  pcos:[
    "PCOS affects 1 in 10 women and is very manageable with the right support. I can't diagnose, but I'd encourage you to try the PCOS Risk Assessment under 🌸 Life Stages — then share the results with your gynaecologist.",
    "Symptoms like irregular periods, acne, and weight changes can sometimes point to PCOS. Only a doctor can confirm it, but tracking your symptoms is the right first step 💜"
  ],
  pregnancy:[
    "Pregnancy is such a profound journey 🤰 Aura Care's Pregnancy Mode can track your week-by-week progress and appointment reminders. Find it under 🌸 Life Stages.",
    "Every pregnancy is different. If something doesn't feel right, trust your instincts and call your doctor. You know your body best 💜"
  ],
  menopause:[
    "Perimenopause and menopause bring real physical changes — hot flashes, mood shifts, sleep disruption — and they deserve proper care. Check out 🌸 Life Stages → Menopause Mode for symptom tracking and guidance.",
    "The transition to menopause is different for every woman. You're not alone in navigating this. Tracking symptoms can help you have a more productive conversation with your doctor 💜"
  ],
  default:[
    "Thank you for sharing that with me. Can you tell me a little more?",
    "I'm here. Take your time. How long have you been feeling this way?",
    "That takes courage to say. What would feel supportive right now — resources, an exercise, or just talking?"
  ]
};
function botReply(text){
  const t=text.toLowerCase();
  let key='default';
  if(/anx|nerv|panic|worry|scared/.test(t))key='anxious';
  else if(/burn|exhaust|tired|overwhelm|too much|drained/.test(t))key='burnout';
  else if(/lone|alone|isolat|nobody|no one/.test(t))key='lonely';
  else if(/pcos|polycyst/.test(t))key='pcos';
  else if(/pregnan|trimest|baby|foetus|fetus/.test(t))key='pregnancy';
  else if(/menopaus|perimenopaus|hot flash|hot flush/.test(t))key='menopause';
  else if(/hormon|pms|period|postpartum|cycle|menstruat|cramp/.test(t))key='cycle';
  else if(/unsafe|abuse|violence|hit|threat|scared of/.test(t))key='unsafe';
  else if(/motiv|inspir|lazy|give up|strength|worthless/.test(t))key='motivation';
  const pool=responses[key];
  return pool[Math.floor(Math.random()*pool.length)];
}
function addMsg(text,who){
  const box=document.getElementById('chatBox');
  const div=document.createElement('div');
  div.className='msg '+who;div.textContent=text;
  box.appendChild(div);box.scrollTop=box.scrollHeight;
}
function sendMsg(){
  const inp=document.getElementById('chatInput');
  const text=inp.value.trim();if(!text)return;
  addMsg(text,'user');inp.value='';
  setTimeout(()=>addMsg(botReply(text),'bot'),700);
}
function quickReply(t){document.getElementById('chatInput').value=t;sendMsg();}

/* ========= Resources tabs & breathing ========= */
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const cat=t.dataset.cat;
    document.querySelectorAll('.res-card').forEach(c=>{
      c.style.display=(cat==='all'||c.dataset.cat===cat)?'block':'none';
    });
  });
});
let breatheTimer;
function startBreathe(){
  const m=document.getElementById('breatheModal');m.classList.remove('hidden');
  const txt=document.getElementById('breatheText');
  const phases=['Breathe In 🌬️','Hold ✨','Breathe Out 💨','Hold ✨'];let i=0;
  txt.textContent=phases[0];
  breatheTimer=setInterval(()=>{i=(i+1)%4;txt.textContent=phases[i];},2000);
}
function stopBreathe(){clearInterval(breatheTimer);document.getElementById('breatheModal').classList.add('hidden');}

/* ========= Universal Resource Modal ========= */
function openResModal(html){
  const m=document.getElementById('resModal');
  const b=document.getElementById('resModalBody');
  if(!m||!b)return;
  b.innerHTML=html+`<div style="text-align:center;margin-top:1.2rem"><button class="btn-primary" onclick="closeResModal()">Close</button></div>`;
  m.classList.remove('hidden');
}
function closeResModal(){stopSound();document.getElementById('resModal')?.classList.add('hidden');}

/* ========= Body Scan Meditation ========= */
function startMeditation(){
  let step=0;
  const steps=[
    "🧘 Sit comfortably. Close your eyes. Take 3 slow breaths.",
    "👣 Focus on your feet. Notice any tension… let it soften.",
    "🦵 Move attention to your legs. Feel them heavy, relaxed.",
    "🫁 Shift to your belly and chest. Breathe deeply here.",
    "💪 Notice your shoulders. Let them drop away from your ears.",
    "😌 Feel your face soften — jaw, eyes, forehead.",
    "✨ Take one final breath. Open your eyes gently. You did it 💜"
  ];
  const render=()=>openResModal(`
    <h2>Body Scan Meditation</h2>
    <p class="muted">Step ${step+1} of ${steps.length}</p>
    <div style="background:var(--card2);padding:1.5rem;border-radius:12px;margin:1rem 0;font-size:1.1rem;line-height:1.6">${steps[step]}</div>
    <div style="display:flex;gap:.6rem;justify-content:center">
      ${step>0?'<button class="btn-ghost" onclick="medStep(-1)">← Back</button>':''}
      ${step<steps.length-1?'<button class="btn-primary" onclick="medStep(1)">Next →</button>':''}
    </div>
  `);
  window.medStep=(d)=>{step+=d;render();};
  render();
}

/* ========= Self-Love Journal ========= */
function openJournal(){
  const saved=JSON.parse(localStorage.getItem('aura_journal')||'[]');
  openResModal(`
    <h2>📔 Self-Love Journal</h2>
    <p class="muted">List 3 things you love about yourself today.</p>
    <input id="g1" placeholder="1. I love that I..." style="width:100%;background:var(--card2);border:1px solid rgba(167,139,250,.2);color:var(--text);padding:.8rem;border-radius:10px;margin:.4rem 0"/>
    <input id="g2" placeholder="2. I love that I..." style="width:100%;background:var(--card2);border:1px solid rgba(167,139,250,.2);color:var(--text);padding:.8rem;border-radius:10px;margin:.4rem 0"/>
    <input id="g3" placeholder="3. I love that I..." style="width:100%;background:var(--card2);border:1px solid rgba(167,139,250,.2);color:var(--text);padding:.8rem;border-radius:10px;margin:.4rem 0"/>
    <button class="btn-primary" style="margin-top:.6rem" onclick="saveJournal()">Save Entry</button>
    ${saved.length?`<p class="muted" style="margin-top:1rem">📚 ${saved.length} past entries saved</p>`:''}
  `);
}
function saveJournal(){
  const entries=[document.getElementById('g1').value,document.getElementById('g2').value,document.getElementById('g3').value].filter(Boolean);
  if(!entries.length){alert('Write at least one thing 💜');return;}
  const all=JSON.parse(localStorage.getItem('aura_journal')||'[]');
  all.unshift({entries,date:new Date().toISOString()});
  localStorage.setItem('aura_journal',JSON.stringify(all));
  openResModal(`<h2>🌟 Saved!</h2><p>Self-love is a practice, not a destination. Come back tomorrow 💜</p>`);
}

/* ========= Article: Women & Anxiety ========= */
function openArticle(){
  openResModal(`
    <h2>🎓 Women & Anxiety</h2>
    <p style="margin:.8rem 0"><strong>Why women?</strong> Women are nearly twice as likely as men to experience anxiety — driven by hormones, social expectations, caregiving load, safety concerns, and often unpaid emotional labor.</p>
    <p style="margin:.8rem 0"><strong>Common triggers across life stages:</strong></p>
    <ul style="margin-left:1.2rem;line-height:1.9">
      <li><strong>Teens:</strong> Body image, academic pressure, social media comparison</li>
      <li><strong>20s–30s:</strong> Career, relationships, fertility, marriage pressure</li>
      <li><strong>Mothers:</strong> Postpartum blues, invisible labor, guilt</li>
      <li><strong>40s–50s:</strong> Perimenopause, aging parents, empty nest</li>
      <li><strong>60s+:</strong> Loneliness, health, loss of loved ones</li>
    </ul>
    <p style="margin:.8rem 0"><strong>3 tools that help:</strong></p>
    <ul style="margin-left:1.2rem;line-height:1.9">
      <li><strong>Grounding (5-4-3-2-1):</strong> Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.</li>
      <li><strong>Box breathing:</strong> Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4x.</li>
      <li><strong>Move your body:</strong> A 10-min walk lowers cortisol significantly.</li>
    </ul>
    <p class="muted" style="margin-top:1rem">If anxiety disrupts daily life for 2+ weeks, please talk to a professional. Use the 🚨 Crisis Help button anytime.</p>
  `);
}

/* ========= Calm Sounds (Web Audio API) ========= */
let audioCtx,oscNodes=[];
function openSounds(){
  openResModal(`
    <h2>🎵 Calm Sounds</h2>
    <p class="muted">Pick a soundscape. Tap Close to stop.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem;margin-top:1rem">
      <button class="btn-ghost" onclick="playSound('rain')">🌧️<br/>Rain</button>
      <button class="btn-ghost" onclick="playSound('ocean')">🌊<br/>Ocean</button>
      <button class="btn-ghost" onclick="playSound('forest')">🌲<br/>Forest</button>
    </div>
    <p class="muted" style="margin-top:1rem;text-align:center" id="soundStatus">No sound playing</p>
  `);
}
function playSound(type){
  stopSound();
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const bufferSize=2*audioCtx.sampleRate;
    const noiseBuffer=audioCtx.createBuffer(1,bufferSize,audioCtx.sampleRate);
    const output=noiseBuffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++)output[i]=Math.random()*2-1;
    const noise=audioCtx.createBufferSource();
    noise.buffer=noiseBuffer;noise.loop=true;
    const filter=audioCtx.createBiquadFilter();
    const gain=audioCtx.createGain();gain.gain.value=0.15;
    if(type==='rain'){filter.type='highpass';filter.frequency.value=1000;}
    else if(type==='ocean'){filter.type='lowpass';filter.frequency.value=400;gain.gain.value=0.25;}
    else{filter.type='bandpass';filter.frequency.value=800;}
    noise.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);
    noise.start();oscNodes=[noise,gain];
    document.getElementById('soundStatus').textContent=`▶ Playing: ${type}`;
  }catch(e){alert('Audio not supported in this browser.');}
}
function stopSound(){
  oscNodes.forEach(n=>{try{n.stop&&n.stop();n.disconnect();}catch(e){}});
  oscNodes=[];
  const s=document.getElementById('soundStatus');if(s)s.textContent='No sound playing';
}

/* ========= Thought Reframing (CBT) ========= */
function openReframe(){
  openResModal(`
    <h2>✍️ Thought Reframing</h2>
    <p class="muted">Challenge a guilt, self-doubt, or inner-critic thought using CBT.</p>
    <label style="display:block;margin-top:1rem"><strong>1. The negative thought:</strong></label>
    <textarea id="cbt1" placeholder="e.g. I'm a bad mom / I'm not enough..." style="width:100%;background:var(--card2);border:1px solid rgba(167,139,250,.2);color:var(--text);padding:.8rem;border-radius:10px;margin-top:.4rem;min-height:60px"></textarea>
    <label style="display:block;margin-top:1rem"><strong>2. Evidence against it:</strong></label>
    <textarea id="cbt2" placeholder="e.g. My family is loved and cared for, I show up every day..." style="width:100%;background:var(--card2);border:1px solid rgba(167,139,250,.2);color:var(--text);padding:.8rem;border-radius:10px;margin-top:.4rem;min-height:60px"></textarea>
    <label style="display:block;margin-top:1rem"><strong>3. A balanced thought:</strong></label>
    <textarea id="cbt3" placeholder="e.g. I'm doing my best, and that's enough." style="width:100%;background:var(--card2);border:1px solid rgba(167,139,250,.2);color:var(--text);padding:.8rem;border-radius:10px;margin-top:.4rem;min-height:60px"></textarea>
    <button class="btn-primary" style="margin-top:.8rem" onclick="alert('Great work reframing! 💜 Come back whenever the inner critic shows up.')">Done</button>
  `);
}

/* ========= Community (Sisterhood) ========= */
function addPost(){
  const txt=document.getElementById('postText').value.trim();
  const tag=document.getElementById('postTag').value;
  if(!txt)return;
  const feed=document.getElementById('feed');
  const post=document.createElement('div');
  post.className='post';
  post.innerHTML=`<div class="post-head"><strong>Anon_Lotus</strong> <span class="tag">${tag}</span> <span class="muted">just now</span></div>
    <p>${txt.replace(/</g,'&lt;')}</p>
    <div class="post-actions-row"><button>💜 0</button><button>💬 Reply</button></div>`;
  feed.prepend(post);
  document.getElementById('postText').value='';
}
