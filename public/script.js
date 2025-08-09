const API = location.origin.replace(/\/$/, "");

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const sceneSel = document.getElementById("scene");
const levelSel = document.getElementById("level");
const useServerSTT = document.getElementById("useServerSTT");

let history = [
  { role: "assistant", content: "Namaste Emily ji! Main Asha Aunty hoon. Aaj hum chhota sa jeet lenge—market, rickshaw ya church? (Hello Emily! I’m Asha Aunty. Shall we aim for one small win—market, rickshaw or church?)" }
];
render();

function addMsg(role, content) {
  history.push({ role, content });
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = (role === "assistant" ? "Asha Aunty: " : "You: ") + content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function render() {
  chat.innerHTML = "";
  history.forEach(m => addMsg(m.role, m.content));
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "hi-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

async function send() {
  const text = input.value.trim();
  if (!text) return;
  addMsg("user", text);
  input.value = "";

  try {
    const resp = await fetch(`${API}/api/roleplay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history,
        scene: sceneSel.value,
        level: levelSel.value
      })
    });
    const data = await resp.json();
    addMsg("assistant", data.reply);
    speak(data.reply);
  } catch (e) {
    addMsg("assistant", "Network error — please try again.");
  }
}

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
    e.preventDefault();
    send();
  }
});

// Mic handling
let rec;
let chunks = [];
let recognizing = false;
micBtn.addEventListener("click", async () => {
  if (useServerSTT.checked) {
    await recordAndSendToServer();
  } else {
    webSpeechDictation();
  }
});

function webSpeechDictation() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Browser STT not supported. Toggle 'Use Server STT' to use Whisper.");
    return;
  }
  const recog = new SpeechRecognition();
  recog.lang = "hi-IN";
  recog.interimResults = false;
  recog.maxAlternatives = 1;
  recog.onresult = (e) => {
    const text = e.results[0][0].transcript;
    input.value = text;
  };
  recog.onerror = (e) => console.log("stt error", e);
  recog.start();
}

// Whisper server recording
async function recordAndSendToServer() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Microphone not available.");
    return;
  }
  if (!recognizing) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    rec = mediaRecorder;
    chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "audio.webm");
      try {
        const resp = await fetch(`${API}/api/stt`, { method: "POST", body: fd });
        const data = await resp.json();
        input.value = data.text || "";
      } catch (e) {
        alert("STT failed, please try again.");
      }
    };
    mediaRecorder.start();
    recognizing = true;
    micBtn.textContent = "⏹ Stop";
  } else {
    rec.stop();
    recognizing = false;
    micBtn.textContent = "🎤 Speak";
  }
}


// --- Phrase packs ---
const phrasesBar = document.getElementById("phrasesBar");
let phrasePacks = {};

async function loadPhrases() {
  try {
    const resp = await fetch("phrases.json");
    phrasePacks = await resp.json();
    renderPhrases();
  } catch (e) {
    console.warn("No phrases.json found", e);
  }
}

function renderPhrases() {
  const scene = sceneSel.value;
  const pack = phrasePacks[scene] || [];
  phrasesBar.innerHTML = "";
  pack.forEach(p => {
    const b = document.createElement("button");
    b.textContent = `${p.hi}`;
    b.title = `${p.en} (${p.tr})`;
    b.addEventListener("click", () => {
      input.value = p.tr; // fill transliteration to make speaking easier
    });
    phrasesBar.appendChild(b);
  });
}

sceneSel.addEventListener("change", renderPhrases);
window.addEventListener("load", loadPhrases);


sceneSel.addEventListener("change", () => {
  if (history.length <= 1) {
    const s = sceneSel.value;
    let open = "Namaste! Kaise madad karun? (Hello! How can I help?)";
    if (s === "market") open = "Namaste! Aaj kaun si sabzi chahiye? (Hello! Which vegetables would you like today?)";
    if (s === "taxi") open = "Namaste! Kahan chalna hai? (Hello! Where to?)";
    if (s === "rickshaw") open = "Namaste! Kahan le chalun? (Hello! Where should I take you?)";
    if (s === "neighbor") open = "Namaste beti, kaise ho? (Hello dear, how are you?)";
    if (s === "introductions") open = "Namaste! Aapka parichay dijiyega? (Hello! Please introduce yourself.)";
    if (s === "church") open = "Prabhu ka shukr hai! Aap kaise hain? (Thanks be to the Lord! How are you?)";
    history = [{ role: "assistant", content: open }];
    render();
  }
});


// ===== Gamification =====
const streakEl = document.getElementById("streak");
const xpEl = document.getElementById("xp");
const chaiEl = document.getElementById("chai");
const badgesBar = document.getElementById("badgesBar");
const missionText = document.getElementById("missionText");
const missionDoneBtn = document.getElementById("missionDone");

const GAMIFY = {
  key: "namaste_emily_progress",
  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; }
  },
  save(state) { localStorage.setItem(this.key, JSON.stringify(state)); },
  init() {
    const s = this.load();
    const today = new Date().toISOString().slice(0,10);

    // Streak logic
    if (!s.lastDay) {
      s.lastDay = today; s.streak = 1;
    } else if (s.lastDay !== today) {
      const d1 = new Date(s.lastDay), d2 = new Date(today);
      const diff = (d2 - d1) / (1000*3600*24);
      s.streak = (diff === 1) ? (s.streak||0)+1 : 1;
      s.lastDay = today;
    }

    // Defaults
    s.xp = s.xp || 0;
    s.chai = s.chai || 0;
    s.badges = s.badges || {};
    s.scenes = s.scenes || {};
    s.phrasesTapped = s.phrasesTapped || 0;
    this.state = s;
    this.updateHUD();
    this.renderBadges();
    MISSIONS.render();
    this.save(s);
  },
  awardXP(n){ this.state.xp += n; this.updateHUD(); this.save(this.state); },
  awardChai(n){ this.state.chai += n; this.updateHUD(); this.save(this.state); },
  touchScene(scene){ this.state.scenes[scene]=(this.state.scenes[scene]||0)+1; this.checkBadges(); this.save(this.state); },
  tapPhrase(){ this.state.phrasesTapped += 1; this.checkBadges(); this.save(this.state); },
  checkBadges(){
    const b = this.state.badges;
    const push = (id, label, emo) => { if (!b[id]) { b[id] = {label, emo, date: new Date().toISOString() }; toast(`${emo} ${label}!`); confetti(); } };
    // First message badge
    if ((history?.length||0) >= 2) push("first_talk","First Conversation","🎉");
    // Phrase lover
    if (this.state.phrasesTapped >= 5) push("phrase_5","Tapped 5 phrases","🗣️");
    // Explorer: 3 scenes
    const sceneCount = Object.keys(this.state.scenes).length;
    if (sceneCount >= 3) push("explorer","Tried 3 scenes","🧭");
    // 3-day streak
    if ((this.state.streak||0) >= 3) push("streak_3","3-day streak","🔥");
    // Church greeter: if church scene used at least once
    if ((this.state.scenes["church"]||0) >= 1) push("church_hello","Church greeting","⛪");
    this.state.badges = b;
    this.renderBadges();
  },
  renderBadges(){
    badgesBar.innerHTML = "";
    const b = this.state.badges || {};
    Object.entries(b).forEach(([id, v]) => {
      const el = document.createElement("div");
      el.className = "badge";
      el.innerHTML = `<span class="emo">${v.emo}</span><span>${v.label}</span>`;
      badgesBar.appendChild(el);
    });
  },
  updateHUD(){
    streakEl.textContent = this.state.streak || 0;
    xpEl.textContent = this.state.xp || 0;
    chaiEl.textContent = this.state.chai || 0;
  }
};

// Missions of the day
const MISSIONS = {
  pool: [
    {scene:"market", text:"Buy 2 veggies and say the price politely."},
    {scene:"rickshaw", text:"Ask for a short ride and bargain kindly."},
    {scene:"introductions", text:"Introduce Jonathan and Sophia to a neighbor."},
    {scene:"church", text:"Greet an elder respectfully and say thanks."},
    {scene:"neighbor", text:"Ask a neighbor how long they’ve lived here."},
    {scene:"taxi", text:"Ask for fare and request slow driving."}
  ],
  pick(){
    const day = new Date().getDate();
    return this.pool[day % this.pool.length];
  },
  render(){
    const m = this.pick();
    missionText.textContent = `${m.text} (Scene: ${m.scene})`;
    // Preselect scene for convenience
    sceneSel.value = m.scene;
    renderPhrases && renderPhrases();
  },
  complete(){
    GAMIFY.awardXP(20);
    GAMIFY.awardChai(1);
    toast("Mission complete! +20 XP, +1 chai ☕");
    confetti();
  }
};

missionDoneBtn?.addEventListener("click", () => MISSIONS.complete());

// Simple toast + confetti
let toastTimer;
function toast(msg){
  const t = document.createElement("div");
  t.style.position="fixed"; t.style.bottom="20px"; t.style.left="50%"; t.style.transform="translateX(-50%)";
  t.style.background="#275d38"; t.style.color="#fff"; t.style.padding="10px 14px"; t.style.borderRadius="10px"; t.style.zIndex=1000;
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.remove(), 1800);
}
function confetti(){
  const c = document.createElement("div"); c.className="confetti"; document.body.appendChild(c);
  const emojis = ["🎉","✨","🎊","🌟","💫","🍬","🍭","☕"];
  const n = 16;
  for (let i=0;i<n;i++){
    const s = document.createElement("span");
    s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    s.style.left = Math.random()*100 + "vw";
    s.style.fontSize = (16+Math.random()*14) + "px";
    s.style.transform = `translateY(-20px) rotate(${Math.random()*360}deg)`;
    c.appendChild(s);
  }
  setTimeout(()=>c.remove(), 1600);
}

// Hook into existing actions to award XP/Chai
const _sendOrig = send;
async function send(){
  await _sendOrig();
  GAMIFY.awardXP(5);
  GAMIFY.touchScene(sceneSel.value);
}

if (typeof recordAndSendToServer === "function") {
  const _recOrig = recordAndSendToServer;
  recordAndSendToServer = async function(){
    await _recOrig();
    GAMIFY.awardXP(3);
  }
}

if (typeof renderPhrases === "function") {
  const _renderPhrases = renderPhrases;
  renderPhrases = function(){
    _renderPhrases();
    // add listeners to phrase buttons to award XP on click
    document.querySelectorAll("#phrasesBar button").forEach(b => {
      if (!b._gamifyBound) {
        b.addEventListener("click", ()=>{ GAMIFY.awardXP(2); GAMIFY.tapPhrase(); });
        b._gamifyBound = true;
      }
    });
  }
}

// Initialize gamification after load
window.addEventListener("load", () => {
  GAMIFY.init();
  GAMIFY.checkBadges();
});
