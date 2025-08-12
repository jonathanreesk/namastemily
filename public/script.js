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

// Normalize common Hinglish to Devanagari
function normalizeHinglishToDev(text) {
  return text
    .replace(/\bmain\b/gi, 'मैं')
    .replace(/\bmein\b/gi, 'में')
    .replace(/\bnahi\b/gi, 'नहीं')
    .replace(/\byahan\b/gi, 'यहाँ')
    .replace(/\bwahan\b/gi, 'वहाँ')
    .replace(/\bthoda\b/gi, 'थोड़ा')
    .replace(/\bzyada\b/gi, 'ज़्यादा')
    .replace(/\bkripya\b/gi, 'कृपया')
    .replace(/\bdhanyavaad\b/gi, 'धन्यवाद')
    .replace(/\bchahiye\b/gi, 'चाहिए')
    .replace(/\bkiraya\b/gi, 'किराया');
}

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const sceneSel = document.getElementById("scene");
const levelSel = document.getElementById("level");

// Audio management - GLOBAL VARIABLES
let currentAudio = null;
let currentPlayingButton = null;

let history = [
  { role: "assistant", content: "Hi Emily! I'm Aasha Aunty, your friendly Hindi teacher. I speak in English to help you learn Hindi step by step. Let's start with something simple - which situation would you like to practice first? Market shopping, taking a taxi, or meeting your neighbors?" }
];

// Initialize chat
render();

function addMsg(role, content) {
  history.push({ role, content });
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  
  const prefix = role === "assistant" ? "Asha Aunty: " : "You: ";
  
  if (role === "assistant") {
    div.innerHTML = `
      <div class="msg-header">
        <strong>${prefix.split(':')[0]}:</strong>
        <div class="audio-controls">
          <button class="listen-btn play-btn" data-text="${content.replace(/'/g, "\\'").replace(/"/g, '\\"')}" 
                  style="cursor: pointer;">
            <span>🔊</span>
          </button>
          <button class="listen-btn stop-btn" style="cursor: pointer; display: none;">
            <span>⏹️</span>
          </button>
        </div>
      </div>
      <div class="msg-content">${content}</div>
    `;
    
    // Add event listeners after creating the element
    const playBtn = div.querySelector('.play-btn');
    const stopBtn = div.querySelector('.stop-btn');
    
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlePlayClick(playBtn, stopBtn, content);
    });
    
    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleStopClick(playBtn, stopBtn);
    });
    
  } else {
    div.innerHTML = `<strong>${prefix.split(':')[0]}:</strong> ${content}`;
  }
  
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function handlePlayClick(playBtn, stopBtn, text) {
  console.log('Play button clicked for:', text.substring(0, 30) + '...');
  
  // CRITICAL: Stop ALL audio before starting new one
  stopAllAudio();
  
  // Show stop button, hide play button
  playBtn.style.display = 'none';
  stopBtn.style.display = 'inline-flex';
  
  // Track current buttons
  currentPlayingButton = { playBtn, stopBtn };
  
  // Start playing audio
  speakWithAzure(text);
}

function handleStopClick(playBtn, stopBtn) {
  console.log('Stop button clicked');
  stopAllAudio();
}

function stopAllAudio() {
  console.log('Stopping all audio...');
  
  // FORCE stop current audio
  if (currentAudio) {
    console.log('Forcefully stopping current audio');
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.src = ''; // Clear source to fully stop
    currentAudio = null;
  }
  
  // Reset ALL buttons to play state (not just current)
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.style.display = 'inline-flex';
  });
  document.querySelectorAll('.stop-btn').forEach(btn => {
    btn.style.display = 'none';
  });
  
  currentPlayingButton = null;
  console.log('All audio stopped and buttons reset');
}

function render() {
  chat.innerHTML = "";
  history.forEach(m => {
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    
    if (m.role === "assistant") {
      div.innerHTML = `
        <div class="msg-header">
          <strong>Asha Aunty:</strong>
          <div class="audio-controls">
            <button class="listen-btn play-btn" data-text="${m.content.replace(/'/g, "\\'").replace(/"/g, '\\"')}" 
                    style="cursor: pointer;">
              <span>🔊</span>
            </button>
            <button class="listen-btn stop-btn" style="cursor: pointer; display: none;">
              <span>⏹️</span>
            </button>
          </div>
        </div>
        <div class="msg-content">${m.content}</div>
      `;
      
      // Add event listeners after creating the element
      const playBtn = div.querySelector('.play-btn');
      const stopBtn = div.querySelector('.stop-btn');
      
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePlayClick(playBtn, stopBtn, m.content);
      });
      
      stopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleStopClick(playBtn, stopBtn);
      });
      
    } else {
      div.innerHTML = `<strong>You:</strong> ${m.content}`;
    }
    
    chat.appendChild(div);
  });
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  speakWithAzure(text);
}

async function speakWithAzure(text) {
  try {
    console.log('Starting Azure TTS for:', text.substring(0, 50) + '...');
    
    // DOUBLE CHECK: Make sure no audio is playing
    if (currentAudio) {
      console.log('WARNING: Found existing audio, stopping it first');
      stopAllAudio();
    }
    
    toast("🔊 Loading audio...");
    
    const resp = await fetch(`/api/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, slow: true })
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const blob = await resp.blob();
    if (blob.size === 0) {
      throw new Error("Empty audio response");
    }
    
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    // CRITICAL: Set as current audio BEFORE playing
    currentAudio = audio;
    console.log('Set new audio as current, about to play');
    
    audio.onplay = () => {
      toast("🔊 Playing audio!");
    };
    
    audio.onended = () => {
      console.log('Audio ended naturally');
      URL.revokeObjectURL(url);
      currentAudio = null;
      
      // Reset buttons to play state
      if (currentPlayingButton) {
        currentPlayingButton.playBtn.style.display = 'inline-flex';
        currentPlayingButton.stopBtn.style.display = 'none';
        currentPlayingButton = null;
      }
    };
    
    audio.onerror = () => {
      console.error('Audio playback failed');
      currentAudio = null;
      
      // Reset buttons on error
      if (currentPlayingButton) {
        currentPlayingButton.playBtn.style.display = 'inline-flex';
        currentPlayingButton.stopBtn.style.display = 'none';
        currentPlayingButton = null;
      }
      
      toast("Audio playback failed");
    };
    
    console.log('About to play new audio...');
    await audio.play();
    console.log('New audio started playing');
    
  } catch (e) {
    console.error('Speech failed:', e);
    toast("Speech failed: " + e.message);
    
    // Reset buttons on error
    if (currentPlayingButton) {
      currentPlayingButton.playBtn.style.display = 'inline-flex';
      currentPlayingButton.stopBtn.style.display = 'none';
      currentPlayingButton = null;
    }
    currentAudio = null;
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
    const resp = await fetch(`/api/roleplay`, {
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
micBtn.addEventListener("click", async () => {
  webSpeechDictation();
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

// ===== PHRASES SYSTEM - STATIC ONLY =====
const phrasesBar = document.getElementById("phrasesBar");
const aiPhrasesBar = document.getElementById("aiPhrasesBar");
let phrasePacks = {};
let aiPhrasesLoaded = {};

// Load phrases from phrases.json - NO AI
async function loadPhrases() {
  try {
    console.log('Loading static phrases from phrases.json');
    const resp = await fetch("phrases.json");
    if (resp.ok) {
      const staticPhrases = await resp.json();
      console.log('Static phrases loaded:', Object.keys(staticPhrases));
      
      // Convert phrases.json format to our internal format
      Object.keys(staticPhrases).forEach(scene => {
        phrasePacks[scene] = staticPhrases[scene].map(p => ({
          hi: p.hindiPhrase,
          tr: p.pronunciation,
          en: p.englishMeaning,
          intro: p.englishIntro
        }));
      });
      
      console.log('Phrase packs ready:', Object.keys(phrasePacks));
      renderPhrases();
    } else {
      console.warn('Could not load phrases.json');
      toast("Could not load phrases");
    }
  } catch (e) {
    console.error('Error loading phrases:', e);
    toast("Error loading phrases");
  }
}

function renderPhrases() {
  const scene = sceneSel.value;
  const pack = phrasePacks[scene] || [];
  
  console.log(`Rendering ${pack.length} phrases for scene: ${scene}`);
  
  phrasesBar.innerHTML = "";
  
  if (pack.length === 0) {
    phrasesBar.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">No phrases available for this scene</p>';
    return;
  }
  
  pack.forEach(p => {
    const b = document.createElement("button");
    b.className = "phrase-btn";
    
    // Display clean English meaning without "This means"
    let displayText = p.en || p.tr || 'Unknown phrase';
    // Remove "This means" prefix if it exists
    displayText = displayText.replace(/^This means\s*/i, '');
    
    const tooltip = p.intro || `Hindi: ${p.hi}` || 'Hindi phrase';
    
    b.textContent = displayText;
    b.title = tooltip;
    
    b.addEventListener("click", () => {
      // Put English phrase in input for practice
      input.value = p.en || p.tr;
      
      // Speak the Hindi phrase
      if (p.hi) {
        speak(p.hi);
      }
      
      GAMIFY.awardXP(2);
      GAMIFY.tapPhrase();
      toast(`Added: "${p.en}" - Listen to Hindi pronunciation! 🗣️`);
    });
    
    phrasesBar.appendChild(b);
  });
}

// AI Phrases System
async function loadAIPhrases(scene) {
  if (aiPhrasesLoaded[scene]) {
    console.log(`AI phrases already loaded for ${scene}`);
    renderAIPhrases();
    return;
  }
  
  try {
    // Show loading state
    aiPhrasesBar.innerHTML = '<div class="ai-loading">🤖 Loading personalized phrases...</div>';
    
    const resp = await fetch(`/api/missions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: 'suggestions', 
        userProgress: {
          scene: scene,
          level: levelSel.value,
          xp: GAMIFY.state?.xp || 0
        }
      })
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const data = await resp.json();
    console.log('AI phrases received:', data);
    
    // Convert AI response to our format
    if (Array.isArray(data)) {
      aiPhrasesLoaded[scene] = data.map(p => ({
        hi: p.hindiPhrase,
        tr: p.pronunciation || p.displayText,
        en: p.englishMeaning,
        intro: p.englishIntro
      }));
    } else {
      aiPhrasesLoaded[scene] = [];
    }
    
    renderAIPhrases();
    toast("✨ AI phrases loaded!");
    
  } catch (e) {
    console.error('Load AI phrases error:', e);
    aiPhrasesBar.innerHTML = '<div class="ai-error">❌ Could not load AI phrases. API key may be missing.</div>';
  }
}

function renderAIPhrases() {
  const scene = sceneSel.value;
  const aiPack = aiPhrasesLoaded[scene] || [];
  
  console.log(`Rendering ${aiPack.length} AI phrases for scene: ${scene}`);
  
  if (aiPack.length === 0) {
    aiPhrasesBar.innerHTML = `
      <div class="ai-section-header">
        <h3>🤖 AI Personalized Phrases</h3>
        <button class="load-ai-btn" onclick="loadAIPhrases('${scene}')">
          <span>🤖</span>
          <span>Load AI Phrases</span>
        </button>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="ai-section-header">
      <h3>🤖 AI Personalized Phrases</h3>
      <div class="ai-indicator">
        <span>✨</span>
        <span>Personalized for you</span>
      </div>
    </div>
    <div class="ai-phrases-grid">
  `;
  
  aiPack.forEach(p => {
    const displayText = p.intro || p.en || 'AI phrase';
    const tooltip = `Hindi: ${p.hi}`;
    
    html += `
      <button class="ai-phrase-btn" title="${tooltip}" onclick="useAIPhrase('${p.en?.replace(/'/g, "\\'")}', '${p.hi?.replace(/'/g, "\\'")}')">
        ${displayText}
      </button>
    `;
  });
  
  html += '</div>';
  aiPhrasesBar.innerHTML = html;
}

function useAIPhrase(english, hindi) {
  input.value = english;
  if (hindi) {
    speak(hindi);
  }
  GAMIFY.awardXP(3);
  GAMIFY.tapPhrase();
  toast(`AI phrase added: "${english}" 🤖`);
}

sceneSel.addEventListener("change", () => {
  console.log('Scene changed to:', sceneSel.value);
  renderPhrases();
  renderAIPhrases(); // Also update AI phrases section
  
  // Update greeting based on scene
  if (history.length <= 1) {
    const s = sceneSel.value;
    let open = "Namaste! Kaise madad karun? (Hello! How can I help?)";
    
    const greetings = {
      market: "Great choice! Let's learn essential market phrases. I'll teach you in English first, then we'll practice the Hindi. You'll be buying vegetables like a pro! 🥕",
      taxi: "Perfect! Taxi phrases are super useful. I'll explain each phrase in English, then teach you the Hindi pronunciation. Let's learn how to get around safely! 🚕", 
      rickshaw: "Excellent! Rickshaw rides are fun. I'll teach you the English meaning first, then the Hindi phrases for negotiating politely. 🛺",
      neighbor: "Wonderful! Meeting neighbors is so important. I'll explain what to say in English, then teach you the Hindi greetings and introductions. 👋",
      introductions: "Perfect choice! I'll help you learn how to introduce yourself and your family. English explanations first, then Hindi practice! 🤝",
      church: "Great! I'll teach you respectful phrases for church interactions. English context first, then meaningful Hindi phrases! ⛪"
    };
    
    open = greetings[s] || open;
    history = [{ role: "assistant", content: open }];
    render();
  }
});

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
  }, 300);
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
  // Initialize audio context on first user interaction for mobile
  const initAudioContext = async () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        console.log('Initializing audio context...');
        await audioContext.resume();
        console.log('Audio context initialized successfully');
      }
    } catch (e) {
      console.warn('Audio context initialization failed:', e);
    }
  };
  
  // Add one-time click listener to initialize audio on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    const initAudio = () => {
      initAudioContext();
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });
  }
  
  // Load voices for better Hindi TTS
  if ('speechSynthesis' in window) {
    // Function to load and display available voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang}) ${v.localService ? '[Local]' : '[Remote]'}`));
      
      // Find and log the best Hindi voices
      const hindiVoices = voices.filter(v => 
        v.lang.includes('hi') || 
        v.lang === 'en-IN' ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('india')
      );
      
      if (hindiVoices.length > 0) {
        console.log('Hindi/Indian voices found:', hindiVoices.map(v => `${v.name} (${v.lang})`));
      } else {
        console.log('No Hindi voices detected. Speech will use default voice.');
      }
    };
    
    // Load voices immediately and on change
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  
  GAMIFY.init();
  MISSIONS.render();
  GAMIFY.checkBadges();
  loadPhrases(); // Load static phrases only
  renderAIPhrases(); // Initialize AI phrases section
  
  // Welcome message
  setTimeout(() => {
    toast("Welcome to your Hindi learning journey, Emily! 🌟");
  }, 1000);
});