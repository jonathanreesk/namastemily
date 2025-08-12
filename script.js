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
        <button class="listen-btn" data-original-text="${content.replace(/'/g, "\\'").replace(/"/g, '\\"')}" 
                onclick="speak('${content.replace(/'/g, "\\'").replace(/"/g, '\\"')}'); event.stopPropagation();" 
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
          <button class="listen-btn" data-original-text="${m.content.replace(/'/g, "\\'").replace(/"/g, '\\"')}"
                  ontouchstart="" style="cursor: pointer;">
            <span>🔊</span>
          </button>
        </div>
        <div class="msg-content">${m.content}</div>
      `;
      
      // Add click handler after creating the element
      const listenBtn = div.querySelector('.listen-btn');
      updateButtonToPlay(listenBtn, m.content);
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

async function speakWithAzure(text, button = null) {
  try {
    console.log('AZURE HINDI ONLY - Attempting TTS for:', text.substring(0, 50) + '...');
    toast("🔊 Loading Azure Hindi audio...");
    
    const resp = await fetch(`/api/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, slow: true, forceAzure: true })
    });
    
    console.log('AZURE API Response:', resp.status, resp.statusText);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('AZURE FAILED:', errorText);
      toast("❌ Azure Hindi voice not available - check credentials");
      if (button) {
        resetButton(button, text);
      }
      return; // NO FALLBACK - just stop here
    }
    
    const blob = await resp.blob();
    console.log('AZURE AUDIO received:', blob.size, 'bytes, type:', blob.type);
    
    if (blob.size === 0) {
      console.error('AZURE returned empty audio');
      toast("❌ Azure returned empty audio");
      if (button) {
        resetButton(button, text);
      }
      return; // NO FALLBACK
    }
    
    if (!blob.type.includes('audio')) {
      console.error('AZURE returned non-audio:', blob.type);
      toast("❌ Azure returned invalid audio format");
      if (button) {
        resetButton(button, text);
      }
      return; // NO FALLBACK
    }
    
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    console.log('AZURE AUDIO: Playing Hindi voice...');
    currentAudio = audio;
    
    // Mobile optimizations
    audio.playsInline = true;
    audio.preload = 'auto';
    audio.volume = 1.0;
    
    audio.onplay = () => {
      toast("🔊 Azure Hindi voice playing!");
    };
    
    audio.onended = () => {
      console.log('Audio ended naturally');
      URL.revokeObjectURL(url);
      currentAudio = null;
      if (button) {
        resetButton(button, text);
      }
      currentPlayingButton = null;
    };
    
    audio.onerror = () => {
      console.log('Audio error occurred');
      currentAudio = null;
      if (button) {
        resetButton(button, text);
      }
      currentPlayingButton = null;
      console.error('AZURE AUDIO playback failed');
      toast("❌ Azure audio playback failed");
    };
    
    // Try to play immediately
    try {
      await audio.play();
    } catch (playError) {
      console.error('AZURE AUDIO play failed:', playError.name);
      if (playError.name === 'NotAllowedError') {
        toast("🔊 Tap screen first to enable Azure Hindi audio");
      } else {
        toast("❌ Azure audio play failed: " + playError.name);
      }
      if (button) {
        resetButton(button, text);
      }
      currentPlayingButton = null;
    }
    
  } catch (e) {
    console.error('AZURE SPEECH FAILED:', e.message);
    toast("❌ Azure Hindi voice failed: " + e.message);
    if (button) {
      resetButton(button, text);
    }
    currentPlayingButton = null;
    // NO FALLBACK - Azure only!
  }
}

function resetButton(button, text) {
  button.innerHTML = '<span>🔊</span>';
  button.onclick = (e) => {
    e.stopPropagation();
    handleAudioClick(button, text);
  };
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
    const resp = await fetch(`/.netlify/functions/roleplay`, {
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
    addMsg("assistant", "I need an OpenAI API key to chat with you! 🔧\n\nTo fix this:\n1. Go to your Netlify site dashboard\n2. Click 'Site settings' → 'Environment variables'\n3. Add OPENAI_API_KEY with your OpenAI API key\n4. Redeploy the site\n\nThe speech features still work with your browser's voice! Try clicking the 🔊 buttons.");
  } finally {
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
  }
}

async function sendPhraseToAI(phraseText) {
  try {
    // Add loading state
    sendBtn.classList.add('loading');
    sendBtn.disabled = true;
    
    // Add phrase to history for AI context
    history.push({ role: "user", content: phraseText });
    
    const resp = await fetch(`/.netlify/functions/roleplay`, {
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
    console.error('Send phrase error:', e);
    addMsg("assistant", "I need an OpenAI API key to chat with you! 🔧\n\nTo fix this:\n1. Go to your Netlify site dashboard\n2. Click 'Site settings' → 'Environment variables'\n3. Add OPENAI_API_KEY with your OpenAI API key\n4. Redeploy the site\n\nThe speech features still work with your browser's voice! Try clicking the 🔊 buttons.");
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
let currentAudio = null;
let currentPlayingButton = null;

function stopCurrentAudio() {
  console.log('Stopping current audio...');
  
  if (currentAudio) {
    console.log('Pausing and resetting audio');
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  // Reset all listen buttons to play state
  document.querySelectorAll('.listen-btn').forEach(btn => {
    const text = btn.getAttribute('data-original-text');
    if (text) {
      updateButtonToPlay(btn, text);
    }
  });
  
  currentPlayingButton = null;
  console.log('Audio stopped and buttons reset');
}

function updateButtonToPlay(button, text) {
  button.innerHTML = '<span>🔊</span>';
  button.onclick = (e) => {
    e.stopPropagation();
    handleAudioClick(button, text);
  };
}

function handleAudioClick(button, text) {
  console.log('Audio button clicked:', text.substring(0, 30) + '...');
  
  // If this button is currently playing, stop it
  if (currentPlayingButton === button) {
    console.log('Stopping current audio from same button');
    stopCurrentAudio();
    return;
  }
  
  // Stop any other playing audio first
  if (currentAudio || currentPlayingButton) {
    console.log('Stopping previous audio before starting new one');
    stopCurrentAudio();
  }
  
  webSpeechDictation();
}

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
    micBtn.textContent = "🎤";
  };
  
  recog.start();
}

// ===== PHRASES SYSTEM =====
const phrasesBar = document.getElementById("phrasesBar");

// Static phrase packs - loaded from phrases.json
let phrasePacks = {};

// Default fallback phrases
const defaultPhrases = {
  market: [
    { hi: "यह कितने का है?", tr: "Yah kitne ka hai?", en: "How much is this?" },
    { hi: "बहुत महंगा है", tr: "Bahut mahanga hai", en: "It's very expensive" },
    { hi: "कम कर दो", tr: "Kam kar do", en: "Please reduce the price" },
    { hi: "ठीक है", tr: "Theek hai", en: "Okay/Alright" },
    { hi: "धन्यवाद", tr: "Dhanyavaad", en: "Thank you" }
  ],
  taxi: [
    { hi: "मुझे जाना है", tr: "Mujhe jaana hai", en: "I need to go" },
    { hi: "कितना पैसा लगेगा?", tr: "Kitna paisa lagega?", en: "How much will it cost?" },
    { hi: "जल्दी चलिए", tr: "Jaldi chaliye", en: "Please go quickly" },
    { hi: "यहाँ रुकिए", tr: "Yahan rukiye", en: "Please stop here" },
    { hi: "बहुत धन्यवाद", tr: "Bahut dhanyavaad", en: "Thank you very much" }
  ],
  rickshaw: [
    { hi: "रिक्शा मिलेगा?", tr: "Ricksha milega?", en: "Can I get a rickshaw?" },
    { hi: "कितना लोगे?", tr: "Kitna loge?", en: "How much will you take?" },
    { hi: "बहुत ज्यादा है", tr: "Bahut zyada hai", en: "It's too much" },
    { hi: "आधा करो", tr: "Aadha karo", en: "Make it half" },
    { hi: "चलो ठीक है", tr: "Chalo theek hai", en: "Okay, let's go" }
  ],
  neighbor: [
    { hi: "नमस्ते", tr: "Namaste", en: "Hello/Greetings" },
    { hi: "आप कैसे हैं?", tr: "Aap kaise hain?", en: "How are you?" },
    { hi: "मैं ठीक हूँ", tr: "Main theek hun", en: "I am fine" },
    { hi: "आपका नाम क्या है?", tr: "Aapka naam kya hai?", en: "What is your name?" },
    { hi: "मिलकर खुशी हुई", tr: "Milkar khushi hui", en: "Nice to meet you" }
  ],
  introductions: [
    { hi: "मेरा नाम एमिली है", tr: "Mera naam Emily hai", en: "My name is Emily" },
    { hi: "यह मेरे पति जोनाथन हैं", tr: "Yah mere pati Jonathan hain", en: "This is my husband Jonathan" },
    { hi: "यह मेरी बेटी सोफिया है", tr: "Yah meri beti Sophia hai", en: "This is my daughter Sophia" },
    { hi: "हम अमेरिका से हैं", tr: "Hum America se hain", en: "We are from America" },
    { hi: "हम यहाँ नए हैं", tr: "Hum yahan naye hain", en: "We are new here" }
  ],
  church: [
    { hi: "नमस्कार", tr: "Namaskar", en: "Respectful greeting" },
    { hi: "प्रार्थना कब है?", tr: "Prarthana kab hai?", en: "When is the prayer?" },
    { hi: "धन्यवाद", tr: "Dhanyavaad", en: "Thank you" },
    { hi: "आशीर्वाद दीजिए", tr: "Aashirvaad dijiye", en: "Please give your blessings" },
    { hi: "जय हो", tr: "Jai ho", en: "Victory/Praise be" }
  ]
}

let aiPhrasesLoaded = {};

async function loadStaticPhrases() {
  try {
    console.log('Loading static phrases from phrases.json');
    const resp = await fetch("/phrases.json");
    if (resp.ok) {
      const staticPhrases = await resp.json();
      console.log('Static phrases loaded from file:', Object.keys(staticPhrases));
      
      // Convert phrases.json format to our internal format
      Object.keys(staticPhrases).forEach(scene => {
        phrasePacks[scene] = staticPhrases[scene].map(p => ({
          hi: p.hindiPhrase,
          tr: p.pronunciation,
          en: p.englishMeaning,
          intro: p.englishIntro
        }));
      });
    } else {
      console.warn('Could not load phrases.json, using defaults');
      phrasePacks = { ...defaultPhrases };
    }
  } catch (e) {
    console.warn('Error loading phrases.json:', e);
    phrasePacks = { ...defaultPhrases };
  }
  console.log('Final phrase packs:', Object.keys(phrasePacks));
}

async function loadMorePhrases(scene) {
  if (aiPhrasesLoaded[scene]) {
    console.log(`AI phrases already loaded for ${scene}`);
    renderPhrases();
    return;
  }
  
  try {
    toast("🤖 Loading personalized phrases...");
    
    const resp = await fetch(`/.netlify/functions/missions`, {
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
    
    renderPhrases();
    toast("✨ Personalized phrases loaded!");
    
  } catch (e) {
    console.error('Load phrases error:', e);
    toast("❌ Could not load AI phrases. Using static phrases.");
  }
}

async function loadPhrases() {
  console.log('Loading phrases...');
  await loadStaticPhrases();
  renderPhrases();
}

function renderPhrases() {
  const scene = sceneSel.value;
  const staticPack = phrasePacks[scene] || [];
  const aiPack = aiPhrasesLoaded[scene] || [];
  
  console.log(`Rendering phrases for ${scene}:`, {
    staticCount: staticPack.length,
    aiCount: aiPack.length
  });
  
  // Use AI phrases if available, otherwise static
  const pack = aiPack.length > 0 ? aiPack : staticPack;
  
  phrasesBar.innerHTML = "";
  
  if (pack.length === 0) {
    phrasesBar.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Loading phrases... 📝</p>';
    return;
  }
  
  console.log('Rendering', pack.length, 'phrases for', scene);
  
  pack.forEach(p => {
    const b = document.createElement("button");
    b.className = "phrase-btn";
    
    // Display transliteration for readability
    const displayText = p.tr || p.en || 'Unknown phrase';
    const tooltip = p.intro || p.en || 'Hindi phrase';
    
    b.textContent = displayText;
    b.title = tooltip;
    
    b.addEventListener("click", () => {
      // Add the phrase directly to chat and send it
      const phraseText = `I want to practice: "${p.en || p.tr}" (${p.hi})`;
      addMsg("user", phraseText);
      input.value = "";
      
      // Send to AI for response
      sendPhraseToAI(phraseText);
      
      // Speak the Hindi phrase
      if (p.hi) {
        speak(p.hi);
      }
      
      GAMIFY.awardXP(2);
      GAMIFY.tapPhrase();
      toast("Phrase added to chat! 🗣️");
    });
    
    phrasesBar.appendChild(b);
  });
  
  // Add "More Phrases" button if AI phrases aren't loaded yet
  if (aiPack.length === 0 && staticPack.length > 0) {
    const moreBtn = document.createElement("button");
    moreBtn.className = "more-phrases-btn";
    moreBtn.innerHTML = '<span>🤖</span><span>More Phrases</span>';
    moreBtn.onclick = () => {
      moreBtn.innerHTML = '<span>⏳</span><span>Loading AI...</span>';
      moreBtn.disabled = true;
      loadMorePhrases(scene).finally(() => {
        moreBtn.disabled = false;
      });
    };
    phrasesBar.appendChild(moreBtn);
  }
  
  // Show AI indicator if AI phrases are loaded
  if (aiPack.length > 0) {
    const indicator = document.createElement("div");
    indicator.className = "ai-indicator";
    indicator.innerHTML = '<span>🤖</span><span>AI Personalized</span>';
    phrasesBar.appendChild(indicator);
  }
}

sceneSel.addEventListener("change", () => {
  console.log('Scene changed to:', sceneSel.value);
  renderPhrases();
  
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

// Review Lesson Button
reviewBtn.addEventListener("click", async () => {
  const scene = sceneSel.value;
  const level = levelSel.value;
  const xp = GAMIFY.state?.xp || 0;
  const phrasesUsed = GAMIFY.state?.phrasesTapped || 0;
  
  const reviewPrompt = `Please review today's Hindi lesson for the ${scene} scene at ${level} level. I've earned ${xp} XP and practiced ${phrasesUsed} phrases. Give me:

1. Key phrases I learned today
2. Grammar points covered
3. Cultural tips for this situation
4. What I should practice next
5. Confidence boosters - what I'm doing well!

Make it encouraging and specific to my progress in the ${scene} scenario.`;

  input.value = reviewPrompt;
  send();
});

// Test Me Button  
testBtn.addEventListener("click", async () => {
  const scene = sceneSel.value;
  const level = levelSel.value;
  const conversationCount = history.length;
  
  const testPrompt = `Test me on everything I've learned! Create a fun quiz based on our conversation and the ${scene} scene at ${level} level. 

Please give me:
1. 3-5 Hindi phrases to translate to English
2. 2-3 English situations where I need to respond in Hindi
3. 1-2 cultural etiquette questions
4. A role-play scenario to practice

Make it challenging but encouraging. We've had ${conversationCount} messages in our conversation, so base the test on what we've actually covered. Give me one question at a time and wait for my answer before the next one!`;

  input.value = testPrompt;
  send();
});

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
  loadPhrases();
  
  // Welcome message
  setTimeout(() => {
    toast("Welcome to your Hindi learning journey, Emily! 🌟");
  }, 1000);
});