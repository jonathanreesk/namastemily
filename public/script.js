const API = location.origin.replace(/\/$/, "");

// Hindi to Latin transliteration mapping
const TRANSLITERATION_MAP = {
  // Vowels
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ii', 'उ': 'u', 'ऊ': 'uu',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  
  // Consonants
  'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga',
  'च': 'cha', 'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya',
  'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha', 'ण': 'na',
  'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
  'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
  'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va',
  'श': 'sha', 'ष': 'sha', 'स': 'sa', 'ह': 'ha',
  
  // Vowel marks
  'ा': 'aa', 'ि': 'i', 'ी': 'ii', 'ु': 'u', 'ू': 'uu',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  
  // Special characters
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': '', 'ऽ': "'",
  
  // Numbers
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

function transliterateHindi(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Check if text contains Hindi characters
  if (!/[\u0900-\u097F]/.test(text)) return text;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // If it's a Hindi character, transliterate it
    if (TRANSLITERATION_MAP[char]) {
      result += TRANSLITERATION_MAP[char];
    } else if (char >= '\u0900' && char <= '\u097F') {
      // Unknown Devanagari character, keep as is
      result += char;
    } else {
      // Non-Hindi character (space, punctuation, English), keep as is
      result += char;
    }
  }
  
  return result;
}

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const sceneSel = document.getElementById("scene");
const levelSel = document.getElementById("level");
const useServerSTT = document.getElementById("useServerSTT");

let history = [
  { role: "assistant", content: "Namaste Emily ji! Main Asha Aunty hoon. Aaj hum chhota sa jeet lenge—market, rickshaw ya church? (Hello Emily! I'm Asha Aunty. Shall we aim for one small win—market, rickshaw or church?)" }
];

// Initialize chat
render();

function addMsg(role, content) {
  history.push({ role, content });
  
  // Store original Hindi for TTS, create transliterated version for display
  const originalContent = content;
  const displayContent = transliterateHindi(content);
  
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  
  const prefix = role === "assistant" ? "Asha Aunty: " : "You: ";
  
  if (role === "assistant") {
    div.innerHTML = `
      <div class="msg-header">
        <span class="speaker">${prefix.split(':')[0]}:</span>
        <button class="listen-btn" onclick="speak('${originalContent.replace(/'/g, "\\'").replace(/"/g, '\\"')}'); event.stopPropagation();" 
      </div>
      <div class="msg-content">${displayContent}</div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-header">
        <span class="speaker">You:</span>
      </div>
      <div class="msg-content">${content}</div>
    div.innerHTML = `
      <div class="msg-header">
        <span class="speaker">${prefix.split(':')[0]}:</span>
      </div>
      <div class="msg-content">${displayContent}</div>
    `;
  }

  chat.appendChild(div);
  render();
}

async function speakWithAzure(text) {
  try {
    toast("🔊 Generating authentic Delhi Hindi with phoneme corrections...");
    
    const resp = await fetch(`${API}/api/tts-azure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, slow: true })
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Azure TTS error:', errorText);
      throw new Error(`Azure TTS failed: ${errorText}`);
    }
    
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onplay = () => {
      toast("🔊 Aasha Aunty speaking with proper मैं/में pronunciation!");
    };
    
    audio.onended = () => {
      URL.revokeObjectURL(url); // Clean up memory
    };
    
    audio.onerror = () => {
      throw new Error("Audio playback failed");
    };
    
    await audio.play();
    
  } catch (e) {
    console.error('Azure TTS failed, falling back to browser TTS:', e);
    toast("Azure TTS failed, using browser voice...");
    
    // Fallback to browser TTS if Azure TTS fails
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "hi-IN";
      u.rate = 0.6;
      u.pitch = 1.0;
      u.volume = 0.9;
      
      // Try to find the best Hindi voice available
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(voice => 
        voice.lang.includes('hi') || 
        voice.name.toLowerCase().includes('hindi') ||
        voice.name.toLowerCase().includes('india')
      );
      
      if (hindiVoice) {
        u.voice = hindiVoice;
      }
      
      u.onerror = () => {
        toast("Audio not available on this device 📱");
      };
      
      window.speechSynthesis.speak(u);
    } else {
      toast("Audio not available on this device 📱");
    }
  }
}

async function send() {
  const text = input.value.trim();
  if (!text) return;
  
  // Add loading state
  sendBtn.classList.add('loading');
  sendBtn.disabled = true;
  
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
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const data = await resp.json();
    addMsg("assistant", data.reply);
    
    // Auto-speak the response
    setTimeout(() => speak(data.reply), 500);
    
    // Award XP and update gamification
    GAMIFY.awardXP(5);
    GAMIFY.touchScene(sceneSel.value);
    
  } catch (e) {
    console.error('Send error:', e);
    addMsg("assistant", "Sorry, I'm having trouble connecting right now. Please check that your API key is set up correctly and try again. 🔧");
  } finally {
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey || (!e.shiftKey && window.innerWidth > 768))) {
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
    toast("Browser speech recognition not supported. Try enabling 'Server STT' for better Hindi recognition! 🎤");
    return;
  }
  
  const recog = new SpeechRecognition();
  recog.lang = "hi-IN";
  recog.interimResults = false;
  recog.maxAlternatives = 1;
  
  micBtn.classList.add('loading');
  micBtn.textContent = "🎙️ Listening...";
  
  recog.onresult = (e) => {
    const text = e.results[0][0].transcript;
    input.value = text;
    GAMIFY.awardXP(3);
    toast("Great! I heard: " + text + " 🎉");
  };
  
  recog.onerror = (e) => {
    console.log("Speech recognition error:", e);
    toast("Couldn't catch that. Try speaking a bit louder! 🔊");
  };
  
  recog.onend = () => {
    micBtn.classList.remove('loading');
    micBtn.innerHTML = '<span>🎤</span><span>Speak</span>';
  };
  
  recog.start();
}

async function recordAndSendToServer() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("Microphone access not available 🎤");
    return;
  }
  
  if (!recognizing) {
    try {
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
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          
          const data = await resp.json();
          input.value = data.text || "";
          if (data.text) {
            GAMIFY.awardXP(3);
            toast("Perfect! Whisper heard: " + data.text + " ✨");
          }
        } catch (e) {
          console.error('STT error:', e);
          toast("Speech recognition failed. Please try again! 🔄");
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      recognizing = true;
      micBtn.innerHTML = '<span>⏹️</span><span>Stop</span>';
      micBtn.classList.add('loading');
      
    } catch (e) {
      console.error('Microphone error:', e);
      toast("Couldn't access microphone. Please allow microphone permissions! 🎤");
    }
  } else {
    rec.stop();
    recognizing = false;
    micBtn.innerHTML = '<span>🎤</span><span>Speak</span>';
    micBtn.classList.remove('loading');
  }
}

// Phrase packs
const phrasesBar = document.getElementById("phrasesBar");
let phrasePacks = {};

async function loadPhrases() {
  try {
    const resp = await fetch("phrases.json");
    phrasePacks = await resp.json();
    renderPhrases();
  } catch (e) {
    console.warn("Could not load phrases:", e);
  }
}

function renderPhrases() {
  const scene = sceneSel.value;
  const pack = phrasePacks[scene] || [];
  phrasesBar.innerHTML = "";
  
  if (pack.length === 0) {
    phrasesBar.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No phrases available for this scene yet 📝</p>';
    return;
  }
  
  pack.forEach(p => {
    const b = document.createElement("button");
    b.textContent = p.hi;
    b.title = `${p.en} (${p.tr})`;
    b.style.cursor = "pointer";
    b.setAttribute("ontouchstart", ""); // Enable :active on iOS
    b.addEventListener("click", () => {
      input.value = p.tr;
      speak(p.hi); // Speak the Hindi phrase when clicked
      GAMIFY.awardXP(2);
      GAMIFY.tapPhrase();
      toast("Phrase added! Try saying it out loud 🗣️");
    });
    // Add touch event for better mobile response
    b.addEventListener("touchstart", (e) => {
      e.preventDefault();
      b.style.transform = "scale(0.95)";
    });
    b.addEventListener("touchend", (e) => {
      e.preventDefault();
      b.style.transform = "scale(1)";
    });
    phrasesBar.appendChild(b);
  });
}

sceneSel.addEventListener("change", () => {
  renderPhrases();
  
  // Update greeting based on scene
  if (history.length <= 1) {
    const s = sceneSel.value;
    let open = "Namaste! Kaise madad karun? (Hello! How can I help?)";
    
    const greetings = {
      market: "Namaste! Aaj kaun si sabzi chahiye? (Hello! Which vegetables would you like today?) 🥕",
      taxi: "Namaste! Kahan chalna hai? (Hello! Where to?) 🚕",
      rickshaw: "Namaste! Kahan le chalun? (Hello! Where should I take you?) 🛺",
      neighbor: "Namaste beti, kaise ho? (Hello dear, how are you?) 👋",
      introductions: "Namaste! Aapka parichay dijiyega? (Hello! Please introduce yourself.) 🤝",
      church: "Prabhu ka shukr hai! Aap kaise hain? (Thanks be to the Lord! How are you?) ⛪"
    };
    
    open = greetings[s] || open;
    history = [{ role: "assistant", content: open }];
    render();
  }
});

window.addEventListener("load", loadPhrases);

// ===== GAMIFICATION SYSTEM =====
const streakEl = document.getElementById("streak");
const xpEl = document.getElementById("xp");
const chaiEl = document.getElementById("chai");
const badgesBar = document.getElementById("badgesBar");
const missionText = document.getElementById("missionText");
const missionDoneBtn = document.getElementById("missionDone");

const GAMIFY = {
  key: "namaste_emily_progress",
  
  load() {
    try { 
      return JSON.parse(localStorage.getItem(this.key)) || {}; 
    } catch { 
      return {}; 
    }
  },
  
  save(state) { 
    localStorage.setItem(this.key, JSON.stringify(state)); 
  },
  
  init() {
    const s = this.load();
    const today = new Date().toISOString().slice(0,10);

    // Streak logic
    if (!s.lastDay) {
      s.lastDay = today; 
      s.streak = 1;
    } else if (s.lastDay !== today) {
      const d1 = new Date(s.lastDay);
      const d2 = new Date(today);
      const diff = (d2 - d1) / (1000*3600*24);
      s.streak = (diff === 1) ? (s.streak||0)+1 : 1;
      s.lastDay = today;
    }

    // Initialize defaults
    s.xp = s.xp || 0;
    s.chai = s.chai || 0;
    s.badges = s.badges || {};
    s.scenes = s.scenes || {};
    s.phrasesTapped = s.phrasesTapped || 0;
    
    this.state = s;
    this.updateHUD();
    this.renderBadges();
    this.save(s);
  },
  
  awardXP(n) { 
    this.state.xp += n; 
    this.updateHUD(); 
    this.save(this.state); 
  },
  
  awardChai(n) { 
    this.state.chai += n; 
    this.updateHUD(); 
    this.save(this.state); 
  },
  
  touchScene(scene) { 
    this.state.scenes[scene] = (this.state.scenes[scene]||0) + 1; 
    this.checkBadges(); 
    this.save(this.state); 
  },
  
  tapPhrase() { 
    this.state.phrasesTapped += 1; 
    this.checkBadges(); 
    this.save(this.state); 
  },
  
  checkBadges() {
    const b = this.state.badges;
    const push = (id, label, emo) => { 
      if (!b[id]) { 
        b[id] = {label, emo, date: new Date().toISOString()}; 
        toast(`${emo} Achievement unlocked: ${label}!`); 
        confetti(); 
      } 
    };
    
    // Achievement conditions
    if ((history?.length||0) >= 2) push("first_talk","First Conversation","🎉");
    if (this.state.phrasesTapped >= 5) push("phrase_5","Phrase Explorer","🗣️");
    if (Object.keys(this.state.scenes).length >= 3) push("explorer","Scene Explorer","🧭");
    if ((this.state.streak||0) >= 3) push("streak_3","3-Day Streak","🔥");
    if ((this.state.scenes["church"]||0) >= 1) push("church_hello","Church Greeter","⛪");
    if (this.state.xp >= 100) push("xp_100","Century Club","💯");
    if (this.state.chai >= 5) push("chai_5","Chai Master","☕");
    
    this.state.badges = b;
    this.renderBadges();
  },
  
  renderBadges() {
    badgesBar.innerHTML = "";
    const b = this.state.badges || {};
    
    if (Object.keys(b).length === 0) {
      badgesBar.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Start chatting to unlock achievements! 🏆</p>';
      return;
    }
    
    Object.entries(b).forEach(([id, v]) => {
      const el = document.createElement("div");
      el.className = "badge";
      el.innerHTML = `<span class="emo">${v.emo}</span><span>${v.label}</span>`;
      badgesBar.appendChild(el);
    });
  },
  
  updateHUD() {
    streakEl.textContent = this.state.streak || 0;
    xpEl.textContent = this.state.xp || 0;
    chaiEl.textContent = this.state.chai || 0;
  }
};

// Daily Missions
const MISSIONS = {
  pool: [
    {scene:"market", text:"Buy 2 vegetables and ask about the price politely"},
    {scene:"rickshaw", text:"Ask for a ride and practice friendly bargaining"},
    {scene:"introductions", text:"Introduce Jonathan and Sophia to a neighbor"},
    {scene:"church", text:"Greet an elder respectfully and say thank you"},
    {scene:"neighbor", text:"Ask a neighbor how long they've lived there"},
    {scene:"taxi", text:"Ask about fare and request careful driving"}
  ],
  
  pick() {
    const day = new Date().getDate();
    return this.pool[day % this.pool.length];
  },
  
  render() {
    const m = this.pick();
    missionText.textContent = `${m.text} (Scene: ${m.scene})`;
    sceneSel.value = m.scene;
    renderPhrases();
  },
  
  complete() {
    GAMIFY.awardXP(20);
    GAMIFY.awardChai(1);
    toast("🎯 Mission completed! +20 XP, +1 chai cup!");
    confetti();
  }
};

missionDoneBtn?.addEventListener("click", () => MISSIONS.complete());

// Toast notifications
let toastTimer;
function toast(msg) {
  clearTimeout(toastTimer);
  
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  
  toastTimer = setTimeout(() => {
    t.style.animation = 'toastSlide 0.3s ease-out reverse';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// Confetti animation
function confetti() {
  const c = document.createElement("div"); 
  c.className = "confetti"; 
  document.body.appendChild(c);
  
  const emojis = ["🎉","✨","🎊","🌟","💫","🍬","🍭","☕","🏆","⭐"];
  const colors = ["#ff6b35", "#4ecdc4", "#ffd23f", "#06d6a0", "#ef476f"];
  
  for (let i = 0; i < 20; i++) {
    const s = document.createElement("span");
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = Math.random() * 100 + "vw";
    s.style.color = colors[Math.floor(Math.random() * colors.length)];
    s.style.fontSize = (16 + Math.random() * 12) + "px";
    s.style.animationDelay = Math.random() * 0.5 + "s";
    s.style.animationDuration = (1.5 + Math.random() * 1) + "s";
    c.appendChild(s);
  }
  
  setTimeout(() => c.remove(), 3000);
}

// Initialize everything
window.addEventListener("load", () => {
  // Load voices for better Hindi TTS
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
      console.log('Available voices:', speechSynthesis.getVoices().map(v => v.name + ' (' + v.lang + ')'));
    };
    
    // Force voice loading on mobile
    setTimeout(() => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Trigger voice loading on mobile
        const utterance = new SpeechSynthesisUtterance('');
        speechSynthesis.speak(utterance);
        speechSynthesis.cancel();
      }
    }, 100);
  }
  
  GAMIFY.init();
  MISSIONS.render();
  GAMIFY.checkBadges();
  
  // Welcome message
  setTimeout(() => {
    toast("Welcome to your Hindi learning journey, Emily! 🌟");
  }, 1000);
});

function render() {
  chat.innerHTML = "";
  history.forEach(m => {
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    
    // Store original for TTS, transliterate for display
    const originalContent = m.content;
    const displayContent = transliterateHindi(m.content);
    
    if (m.role === "assistant") {
      div.innerHTML = `
        <div class="msg-header">
          <span class="speaker">Asha Aunty:</span>
          <button class="listen-btn" onclick="speak('${originalContent.replace(/'/g, "\\'").replace(/"/g, '\\"')}'); event.stopPropagation();" 
                  ontouchstart="" style="cursor: pointer;">
            <span>🔊</span>
          </button>
        </div>
        <div class="msg-content">${displayContent}</div>
      `;
    } else {
      div.innerHTML = `
        <div class="msg-header">
          <span class="speaker">You:</span>
        </div>
        <div class="msg-content">${displayContent}</div>
      `;
    }
    
    chat.appendChild(div);
  });
  
  chat.scrollTop = chat.scrollHeight;
    const div = document.createElement("div");
    div.className = `msg ${msg.role}`;
    
    if (msg.role === "assistant") {
      div.innerHTML = `
        <div class="msg-header">
          <span class="speaker">Asha Aunty:</span>
          <button class="speak-btn" onclick="speak('${msg.content.replace(/'/g, "\\'")}')">🔊</button>
        </div>
        <div class="msg-content">${msg.content}</div>
      `;
    } else {
      div.innerHTML = `
        <div class="msg-header">
          <span class="speaker">You:</span>
        </div>
        <div class="msg-content">${msg.content}</div>
      `;
    }
    
    chat.appendChild(div);
  });
  
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  speakWithAzure(text);
}