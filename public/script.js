const API = "";

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

let history = [
  { role: "assistant", content: "Hi Emily! I'm Aasha Aunty, your friendly Hindi teacher. I speak in English to help you learn Hindi step by step. Let's start with something simple - which situation would you like to practice first? Market shopping, taking a taxi, or meeting your neighbors?" }
];

// Initialize chat
render();

function addMsg(role, content) {
  console.log('Adding message:', role, content.substring(0, 50) + '...');
  history.push({ role, content });
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  
  const prefix = role === "assistant" ? "Asha Aunty: " : "You: ";
  
  if (role === "assistant") {
    div.innerHTML = `
      <div class="msg-header">
        <strong>${prefix.split(':')[0]}:</strong>
        <button class="listen-btn" onclick="speak('${content.replace(/'/g, "\\'").replace(/"/g, '\\"')}'); event.stopPropagation();" 
                ontouchstart="" style="cursor: pointer;">
          <span>🔊</span>
        </button>
      </div>
      <div class="msg-content">${content}</div>
    `;
  } else {
    div.innerHTML = `<strong>${prefix.split(':')[0]}:</strong> ${content}`;
  }
  
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  console.log('Message added to chat, total messages:', history.length);
}

async function speakWithAzure(text) {
  try {
    console.log('Attempting Azure TTS for:', text.substring(0, 50) + '...');
    toast("🔊 Playing audio...");
    
    const resp = await fetch(`${API}/api/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, slow: true })
    });
    
    if (!resp.ok) {
      let errorText;
      try {
        errorText = await resp.text();
      } catch (e) {
        errorText = `HTTP ${resp.status}`;
      }
      console.error('Speech API error:', resp.status, errorText);
      throw new Error(`Speech API failed: ${resp.status} - ${errorText}`);
    }
    
    const blob = await resp.blob();
    if (blob.size === 0) {
      throw new Error("Empty audio response");
    }
    
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onplay = () => {
      toast("🔊 Playing Hindi audio!");
    };
    
    audio.onended = () => {
      URL.revokeObjectURL(url); // Clean up memory
    };
    
    audio.onerror = () => {
      throw new Error("Audio playback failed");
    };
    
    await audio.play();
    
  } catch (e) {
    console.error('Speech API failed, falling back to browser TTS:', e);
    toast(`Azure TTS failed (${e.message}), using browser voice...`);
    
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
    
    // Handle both successful responses and error responses with reply field
    const reply = data.reply || data.error || "Sorry, something went wrong!";
    addMsg("assistant", reply);
    
    // Auto-speak the response
    setTimeout(() => speak(reply), 500);
    
    // Award XP and update gamification
    GAMIFY.awardXP(5);
    GAMIFY.touchScene(sceneSel.value);
    
  } catch (e) {
    console.error('Send error:', e);
    addMsg("assistant", "Sorry Emily! I'm having trouble connecting to my AI brain right now. Please make sure your OPENAI_API_KEY is configured in Netlify's environment variables under Site settings → Environment variables. 🔧");
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

// Phrase packs
const phrasesBar = document.getElementById("phrasesBar");
let phrasePacks = {};

async function loadPhrases() {
  try {
    // Try to load AI-generated phrases first
    await loadAIPhrases();
    
    // Fallback to static phrases if AI fails
    if (Object.keys(phrasePacks).length === 0) {
      await loadStaticPhrases();
    }
    renderPhrases();
  } catch (e) {
    console.warn("Could not load phrases:", e);
  }
}

async function loadStaticPhrases() {
  try {
    console.log('Loading static phrases as fallback');
    const resp = await fetch("phrases.json");
    const staticPhrases = await resp.json();
    console.log('Static phrases loaded:', Object.keys(staticPhrases));
    // Merge with existing phrases
    Object.keys(staticPhrases).forEach(scene => {
      if (!phrasePacks[scene] || phrasePacks[scene].length === 0) {
        phrasePacks[scene] = staticPhrases[scene];
        console.log('Added static phrases for scene:', scene);
      }
    });
  } catch (e) {
    console.error("Could not load static phrases:", e);
  }
}

async function loadAIPhrases() {
  try {
    console.log('Loading AI phrases for scene:', sceneSel?.value);
    const currentScene = sceneSel?.value || 'market';
    const currentLevel = levelSel?.value || 'beginner';
    
    const userProgress = {
      scene: currentScene,
      level: currentLevel,
      xp: GAMIFY.state?.xp || 0,
      scenes: GAMIFY.state?.scenes || {},
      phrasesTapped: GAMIFY.state?.phrasesTapped || 0
    };
    
    console.log(`Generating AI phrases for ${currentScene} scene at ${currentLevel} level`);
    const resp = await fetch(`${API}/api/missions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'suggestions', userProgress })
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('AI phrase generation failed:', resp.status, errorText);
      throw new Error('Failed to generate suggestions');
    }
    
    const suggestions = await resp.json();
    console.log('AI suggestions received:', JSON.stringify(suggestions, null, 2));
    
    // Convert AI suggestions to phrase pack format
    const scene = currentScene;
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      phrasePacks[scene] = suggestions;
      console.log(`Successfully stored ${suggestions.length} AI phrases for ${scene} scene`);
    } else {
      console.error('Invalid AI suggestions format - not an array or empty:', suggestions);
      throw new Error('Invalid suggestions format');
    }
    
  } catch (e) {
    console.error('AI phrase generation failed with error:', e);
    // Force fallback to static phrases
    await loadStaticPhrases();
  }
}
function renderPhrases() {
  const scene = sceneSel.value;
  const pack = phrasePacks[scene] || [];
  console.log('Rendering phrases for scene:', scene, 'Pack length:', pack.length);
  console.log('Available phrase packs:', Object.keys(phrasePacks));
  phrasesBar.innerHTML = "";
  
  // Add header with More Phrases button
  const headerDiv = document.createElement("div");
  headerDiv.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--gray-200);
  `;
  
  const titleSpan = document.createElement("span");
  titleSpan.textContent = `${scene.charAt(0).toUpperCase() + scene.slice(1)} Phrases`;
  titleSpan.style.cssText = `
    font-weight: 600;
    color: var(--gray-800);
    font-size: var(--text-lg);
  `;
  
  const moreBtn = document.createElement("button");
  moreBtn.innerHTML = `
    <span class="btn-icon">✨</span>
    <span class="btn-text">Get New Phrases</span>
  `;
  moreBtn.className = "more-phrases-btn";
  moreBtn.style.cssText = `
    background: var(--primary-500);
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    padding: var(--space-3) var(--space-6);
    font-weight: 600;
    font-size: var(--text-base);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-height: 48px;
  `;
  
  moreBtn.addEventListener("click", async () => {
    console.log('More phrases button clicked');
    moreBtn.disabled = true;
    moreBtn.innerHTML = `
      <span class="btn-icon loading-spinner">⏳</span>
      <span class="btn-text">Loading...</span>
    `;
    moreBtn.style.opacity = "0.7";
    
    try {
      // Clear current phrases to force fresh generation
      delete phrasePacks[scene];
      console.log('Cleared phrases for scene:', scene);
      await loadAIPhrases();
      renderPhrases();
      toast("🎉 Fresh phrases loaded for " + scene + "!");
      GAMIFY.awardXP(3);
    } catch (e) {
      console.error('Failed to load more phrases:', e);
      toast("Couldn't load new phrases. Try again! 🔄");
    } finally {
      moreBtn.disabled = false;
      moreBtn.innerHTML = `
        <span class="btn-icon">✨</span>
        <span class="btn-text">Get New Phrases</span>
      `;
      moreBtn.style.opacity = "1";
    }
  });
  
  // Add mobile touch support for More Phrases button
  moreBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    console.log('Mobile tap on More Phrases button');
    if (!moreBtn.disabled) {
      moreBtn.click();
    }
  });
  
  moreBtn.addEventListener("mouseenter", () => {
    if (!moreBtn.disabled) {
      moreBtn.style.background = "var(--primary-600)";
      moreBtn.style.transform = "translateY(-2px)";
      moreBtn.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
    }
  });
  
  moreBtn.addEventListener("mouseleave", () => {
    moreBtn.style.background = "var(--primary-500)";
    moreBtn.style.transform = "translateY(0)";
    moreBtn.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
  });
  
  headerDiv.appendChild(titleSpan);
  headerDiv.appendChild(moreBtn);
  phrasesBar.appendChild(headerDiv);
  
  if (pack.length === 0) {
    console.log('No phrases found, attempting to load AI phrases');
    const loadingDiv = document.createElement("div");
    loadingDiv.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Loading personalized phrases... 🤖</p>';
    phrasesBar.appendChild(loadingDiv);
    // Try to load AI phrases for this scene
    setTimeout(async () => {
      await loadAIPhrases();
      if (phrasePacks[scene]?.length > 0) {
        console.log('AI phrases loaded successfully, re-rendering');
        renderPhrases(); // Re-render with new phrases
      } else {
        console.log('AI phrases failed, loading static phrases');
        // Fallback to static phrases if AI fails
        await loadStaticPhrases();
        renderPhrases();
      }
    }, 100);
    return;
  }
  
  // Create phrases container
  const phrasesContainer = document.createElement("div");
  phrasesContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  `;
  
  console.log('Rendering', pack.length, 'phrases');
  pack.forEach(p => {
    const b = document.createElement("button");
    b.className = "phrase-btn";
    // Handle both AI format and static format
    const displayText = p.englishIntro || p.en || p.hindiPhrase || p.hi;
    const tooltip = p.englishMeaning || p.en || p.englishIntro;
    
    b.textContent = displayText;
    b.title = tooltip;
    b.style.cursor = "pointer";
    b.setAttribute("ontouchstart", ""); // Enable :active on iOS
    b.addEventListener("click", () => {
      // Create a lesson format: English intro + Hindi phrase
      const englishIntro = p.englishIntro || `Let me teach you: "${p.en || p.englishMeaning}"`;
      const hindiPhrase = p.hindiPhrase || p.hi;
      const pronunciation = p.pronunciation || p.tr;
      
      console.log('Phrase button clicked:', p);
      
      try {
        // Add the phrase lesson to chat
        const lessonMessage = `${englishIntro} The Hindi is: ${hindiPhrase}${pronunciation ? ` (${pronunciation})` : ''}`;
        const userMessage = `Teach me: "${p.englishMeaning || p.en || p.englishIntro}"`;
        
        console.log('Adding user message:', userMessage);
        addMsg("user", userMessage);
        
        // Auto-respond from Asha with the lesson
        setTimeout(() => {
          console.log('Adding assistant message:', lessonMessage);
          addMsg("assistant", lessonMessage);
          setTimeout(() => speak(lessonMessage), 300);
        }, 500);
        
        // Also put the pronunciation in the input for practice
        setTimeout(() => {
          input.value = pronunciation || hindiPhrase;
          console.log('Added to input:', pronunciation || hindiPhrase);
        }, 1000);
        
        toast("Phrase added to conversation! Practice saying it 🗣️");
      } catch (error) {
        console.error('Error handling phrase click:', error);
        toast("Something went wrong with the phrase. Try again! 🔄");
      }
      
      GAMIFY.awardXP(2);
      GAMIFY.tapPhrase();
    });
    
    // Add proper mobile touch events
    b.addEventListener("touchstart", (e) => {
      console.log('Touch start on phrase button');
      b.style.transform = "scale(0.95)";
    }, { passive: true });
    
    b.addEventListener("touchend", (e) => {
      console.log('Touch end on phrase button');
      b.style.transform = "scale(1)";
    }, { passive: true });
    
    // Ensure mobile tap works
    b.addEventListener("touchend", (e) => {
      e.preventDefault();
      console.log('Mobile tap detected, triggering click');
      b.click();
    });
    
    phrasesContainer.appendChild(b);
  });
  
  phrasesBar.appendChild(phrasesContainer);
}

sceneSel.addEventListener("change", () => {
  console.log(`Scene changed to: ${sceneSel.value}`);
  
  // Clear existing phrases to force reload for new scene
  const currentScene = sceneSel.value;
  if (phrasePacks[currentScene]) {
    console.log(`Using cached phrases for ${currentScene}`);
  } else {
    console.log(`Loading new phrases for ${currentScene}`);
    phrasePacks[currentScene] = []; // Clear to force reload
  }
  
  renderPhrases();
  
  // Also regenerate mission for new scene
  MISSIONS.render();
  
  // Update greeting based on scene
  if (history.length <= 1) {
    const s = sceneSel.value;
    
    // Generate contextual greeting through AI
    addMsg("user", `I want to practice the ${s} scene. Can you help me?`);
    setTimeout(async () => {
      try {
        const resp = await fetch(`${API}/api/roleplay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history: [...history, { role: "user", content: `I want to practice the ${s} scene. Can you help me?` }],
            scene: s,
            level: levelSel.value
          })
        });
        
        if (resp.ok) {
          const data = await resp.json();
          const reply = data.reply || "Let me help you practice that scene!";
          addMsg("assistant", reply);
          setTimeout(() => speak(reply), 500);
        }
      } catch (e) {
        console.error('Scene change greeting failed:', e);
        const fallbackReply = `Great choice! Let's practice the ${s} scene. I'll help you learn the essential phrases step by step.`;
        addMsg("assistant", fallbackReply);
        setTimeout(() => speak(fallbackReply), 500);
      }
    }, 1000);
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
        toast(emo + " Achievement unlocked: " + label + "!"); 
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
  currentMission: null,
  
  async generateDaily() {
    try {
      const currentScene = sceneSel?.value || 'market';
      const currentLevel = levelSel?.value || 'beginner';
      
      const userProgress = {
        scene: currentScene,
        level: currentLevel,
        xp: GAMIFY.state?.xp || 0,
        scenes: GAMIFY.state?.scenes || {},
        streak: GAMIFY.state?.streak || 0,
        completedToday: GAMIFY.state?.missionCompletedToday || false,
        phrasesTapped: GAMIFY.state?.phrasesTapped || 0
      };
      
      console.log(`Generating daily mission for ${currentScene} scene at ${currentLevel} level`);
      const resp = await fetch(`${API}/api/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'mission', userProgress })
      });
      
      if (!resp.ok) {
        console.warn('Mission API failed, using fallback mission');
        return this.getFallbackMission();
      }
      
      try {
        const mission = await resp.json();
        if (mission.error) {
          console.warn('Mission API returned error, using fallback mission');
          return this.getFallbackMission();
        }
        state.dailyMission = mission;
        state.lastMissionDate = today;
        saveState();
        return mission;
      } catch (parseError) {
        console.warn('Failed to parse mission response, using fallback mission');
        return this.getFallbackMission();
      }
    } catch (error) {
      console.warn('Mission generation failed, using fallback mission:', error);
      return this.getFallbackMission();
    }
  },
  
  getFallbackMission() {
    const fallbackMissions = [
      {
        scene: "market",
        title: "Buy Fresh Vegetables",
        description: "Visit the local sabzi mandi and practice asking for seasonal vegetables in Hindi",
        specificGoals: ["Ask for 2 vegetables", "Negotiate price politely", "Ask if items are fresh"],
        culturalTip: "In Indian markets, gentle bargaining is expected and shows engagement"
      },
      {
        scene: "taxi",
        title: "Navigate to Temple",
        description: "Take a taxi to the local temple and practice giving directions in Hindi",
        specificGoals: ["Tell driver destination", "Ask about fare", "Say thank you"],
        culturalTip: "Always confirm the fare before starting your journey"
      },
      {
        scene: "neighbor",
        title: "Meet Your Neighbor",
        description: "Introduce yourself to a new neighbor and practice basic conversation",
        specificGoals: ["Share your name", "Ask about their family", "Exchange pleasantries"],
        culturalTip: "Indians appreciate when foreigners make an effort to speak Hindi"
      }
    ];
    
    const mission = fallbackMissions[Math.floor(Math.random() * fallbackMissions.length)];
    GAMIFY.state.dailyMission = mission;
    GAMIFY.state.lastMissionDate = new Date().toDateString();
    GAMIFY.save(GAMIFY.state);
    return mission;
  },
  
  async render() {
    const m = this.currentMission || await this.generateDaily();
    missionText.innerHTML = `
      <strong>${m.title}</strong><br>
      ${m.description}
      ${m.culturalTip ? `<br><em>💡 ${m.culturalTip}</em>` : ''}
    `;
    if (m.scene && sceneSel) {
      sceneSel.value = m.scene;
    }
    renderPhrases();
  },
  
  complete() {
    GAMIFY.state.missionCompletedToday = true;
    GAMIFY.awardXP(20);
    GAMIFY.awardChai(1);
    GAMIFY.save(GAMIFY.state);
    toast("🎯 Mission completed! +20 XP, +1 chai cup!");
    confetti();
    
    // Add mission completion to chat
    const mission = this.currentMission;
    if (mission) {
      addMsg("user", `I completed today's mission: ${mission.title}! 🎯`);
      // Auto-respond from Asha
      setTimeout(() => {
        addMsg("assistant", `Wonderful, Emily! You completed "${mission.title}" - that's exactly the kind of practice that will help you feel confident in India. Keep up the great work! 🌟`);
      }, 1000);
    }
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
  MISSIONS.render(); // This will now generate AI missions
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
    
    if (m.role === "assistant") {
      div.innerHTML = `
        <div class="msg-header">
          <strong>Asha Aunty:</strong>
          <button class="listen-btn" onclick="speak('${m.content.replace(/'/g, "\\'").replace(/"/g, '\\"')}'); event.stopPropagation();" 
                  ontouchstart="" style="cursor: pointer;">
            <span>🔊</span>
          </button>
        </div>
        <div class="msg-content">${m.content}</div>
      `;
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