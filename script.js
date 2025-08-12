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
                  onclick="speak('${m.content.replace(/'/g, "\\'").replace(/"/g, '\\"')}'); event.stopPropagation();" 
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

async function speakWithAzure(text) {
  try {
    // Stop any currently playing audio first
    stopCurrentAudio();
    
    // Check if we're on mobile and need user interaction
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isMobileChrome = isMobile && /Chrome/i.test(navigator.userAgent);
    
    const hindiChars = text.match(/[\u0900-\u097F]/g);
    const isHindiPhrase = !!hindiChars;
    console.log('Attempting Azure TTS for:', text.substring(0, 50) + '...');
    console.log('Text contains Hindi characters:', isHindiPhrase);
    console.log('Hindi characters found:', hindiChars || 'none');
    console.log('Hindi character count:', hindiChars ? hindiChars.length : 0);
    console.log('Mobile Chrome detected:', isMobileChrome);
    toast("🔊 Playing audio...");
    
    const resp = await fetch(`/api/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, slow: true })
    });
    
    console.log('Azure API response status:', resp.status);
    console.log('Azure API response headers:', Object.fromEntries(resp.headers.entries()));
    
    if (!resp.ok) {
      let errorText;
      try {
        errorText = await resp.text();
        console.error('Azure TTS error response:', errorText);
        
        // Try to parse as JSON for better error details
        try {
          const errorData = JSON.parse(errorText);
          console.error('Parsed error data:', errorData);
          errorText = errorData.error || errorData.details || errorText;
        } catch (parseError) {
          console.log('Error response is not JSON, using raw text');
        }
      } catch (e) {
        errorText = `HTTP ${resp.status}`;
      }
      console.error('AZURE SPEECH API FAILED:', resp.status, errorText);
      throw new Error(`Azure TTS failed: ${errorText}`);
    }
    
    const blob = await resp.blob();
    console.log('Azure audio blob received, size:', blob.size, 'type:', blob.type);
    
    if (blob.size === 0) {
      throw new Error("Empty audio response");
    }
    
    // Verify this is actually audio content
    if (!blob.type.includes('audio')) {
      console.error('Response is not audio:', blob.type);
      const text = await blob.text();
      console.error('Non-audio response content:', text.substring(0, 200));
      throw new Error(`Expected audio, got ${blob.type}`);
    }
    
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    console.log('Created audio element, attempting playback...');
    
    // Store reference to current audio for stopping
    currentAudio = audio;
    
    // Enhanced mobile audio handling
    if (isMobile) {
      audio.preload = 'metadata'; // Use metadata instead of auto for mobile
      audio.playsInline = true; // Prevent fullscreen on iOS
      audio.muted = false;
      audio.volume = 1.0;
      
      // For mobile Chrome, we need to handle autoplay restrictions
      if (isMobileChrome) {
        // Try to enable audio context on user interaction
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            console.log('Audio context suspended, attempting to resume...');
            await audioContext.resume();
          }
        } catch (contextError) {
          console.warn('Audio context handling failed:', contextError);
        }
      }
    } else {
      audio.preload = 'auto';
    }
    
    audio.onplay = () => {
      toast("🔊 Playing Hindi audio!");
      // Update all listen buttons to show stop icon while playing
      document.querySelectorAll('.listen-btn').forEach(btn => {
        btn.innerHTML = '<span>⏹️</span>';
        btn.onclick = () => stopAudio();
      });
    };
    
    audio.onended = () => {
      URL.revokeObjectURL(url); // Clean up memory
      currentAudio = null;
      // Reset all listen buttons back to play icon
      document.querySelectorAll('.listen-btn').forEach(btn => {
        const originalText = btn.getAttribute('data-original-text');
        if (originalText) {
          btn.innerHTML = '<span>🔊</span>';
          btn.onclick = () => speak(originalText);
        }
      });
    };
    
    audio.onerror = () => {
      currentAudio = null;
      // Reset buttons on error
      document.querySelectorAll('.listen-btn').forEach(btn => {
        const originalText = btn.getAttribute('data-original-text');
        if (originalText) {
          btn.innerHTML = '<span>🔊</span>';
          btn.onclick = () => speak(originalText);
        }
      });
      throw new Error("Audio playback failed");
    };
    
    // Enhanced mobile playback handling
    const playAudio = async () => {
      try {
        // Ensure no other audio is playing
        stopCurrentAudio();
        currentAudio = audio;
        
        // Add a small delay for mobile processing
        if (isMobile) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await audio.play();
      } catch (playError) {
        console.warn('Direct audio play failed:', playError.name, playError.message);
        // On mobile, audio might need user interaction
        if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
          toast("🔊 Tap to play audio (mobile browser requirement)");
          // Create a temporary button for user interaction
          const playBtn = document.createElement('button');
          playBtn.innerHTML = '🔊 Play Hindi Audio';
          playBtn.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            padding: 20px 30px;
            font-size: 18px;
            font-weight: bold;
            background: #14b8a6;
            color: white;
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            cursor: pointer;
            min-width: 200px;
            text-align: center;
          `;
          document.body.appendChild(playBtn);
          
          // Add touch feedback
          playBtn.addEventListener('touchstart', () => {
            playBtn.style.transform = 'translate(-50%, -50%) scale(0.95)';
          });
          
          playBtn.addEventListener('touchend', () => {
            playBtn.style.transform = 'translate(-50%, -50%) scale(1)';
          });
          
          playBtn.onclick = async () => {
            try {
              // Enable audio context first
              try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === 'suspended') {
                  await audioContext.resume();
                }
              } catch (contextError) {
                console.warn('Audio context resume failed:', contextError);
              }
              
              await audio.play();
              document.body.removeChild(playBtn);
              toast("🔊 Playing Hindi audio!");
            } catch (e) {
              console.error('Manual play also failed:', e);
              document.body.removeChild(playBtn);
              toast("❌ Audio playback not supported on this device");
            }
          };
          
          // Auto-remove button after 10 seconds
          setTimeout(() => {
            if (document.body.contains(playBtn)) {
              document.body.removeChild(playBtn);
              toast("Audio play timeout - try again");
            }
          }, 10000);
          
        } else {
          throw playError;
        }
      }
    };
    
    await playAudio();
    
  } catch (e) {
    console.error('Speech API failed, falling back to browser TTS:', e);
    toast(`Azure TTS failed (${e.message}), using browser voice...`);
    
    // Fallback to browser TTS if Azure TTS fails
    if ("speechSynthesis" in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const u = new SpeechSynthesisUtterance(text);
      // Use appropriate language based on content
      const isHindiPhrase = /[\u0900-\u097F]/.test(text);
      u.lang = isHindiPhrase ? "hi-IN" : "en-US";
      u.rate = 0.6;
      u.pitch = 1.0;
      u.volume = 0.9;
      
      // Store reference for browser TTS
      currentAudio = { 
        pause: () => window.speechSynthesis.cancel(),
        currentTime: 0,
        paused: false
      };
      
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice;
      
      if (isHindiPhrase) {
        console.log('Looking for Hindi voice for text:', text.match(/[\u0900-\u097F]/g));
        selectedVoice = voices.find(voice => 
          voice.lang.includes('hi') || 
          voice.name.toLowerCase().includes('hindi') ||
          voice.name.toLowerCase().includes('india')
        );
      } else {
        console.log('Looking for English voice for text:', text.substring(0, 30));
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-US') || 
          voice.name.toLowerCase().includes('english')
        );
      }
      
      if (selectedVoice) {
        u.voice = selectedVoice;
        console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
      } else {
        console.log('No suitable voice found, using default');
      }
      
      u.onstart = () => {
        // Update all listen buttons to show stop icon while playing
        document.querySelectorAll('.listen-btn').forEach(btn => {
          btn.innerHTML = '<span>⏹️</span>';
          btn.onclick = () => stopAudio();
        });
      };
      
      u.onend = () => {
        currentAudio = null;
        // Reset all listen buttons back to play icon
        document.querySelectorAll('.listen-btn').forEach(btn => {
          const originalText = btn.getAttribute('data-original-text');
          if (originalText) {
            btn.innerHTML = '<span>🔊</span>';
            btn.onclick = () => speak(originalText);
          }
        });
      };
      
      u.onerror = () => {
        currentAudio = null;
        // Reset buttons on error
        document.querySelectorAll('.listen-btn').forEach(btn => {
          const originalText = btn.getAttribute('data-original-text');
          if (originalText) {
            btn.innerHTML = '<span>🔊</span>';
            btn.onclick = () => speak(originalText);
          }
        });
        toast("Audio not available on this device 📱");
      };
      
      window.speechSynthesis.speak(u);
    } else {
      toast("Audio not available on this device 📱");
    }
  }
}

function stopAudio() {
  stopCurrentAudio();
  
  // Reset all listen buttons back to play icon
  document.querySelectorAll('.listen-btn').forEach(btn => {
    const originalText = btn.getAttribute('data-original-text');
    if (originalText) {
      btn.innerHTML = '<span>🔊</span>';
      btn.onclick = () => speak(originalText);
    }
  });
  
  toast("🔇 Audio stopped");
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

function stopCurrentAudio() {
  if (currentAudio) {
    if (currentAudio.pause) {
      // For HTML5 Audio
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // Cancel browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    currentAudio = null;
  }
}

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
    // Use transliteration for display
    // Prioritize transliteration display for readability
    const displayText = p.displayText || p.pronunciation || p.tr || p.englishMeaning || p.en;
    const tooltip = `${p.englishMeaning || p.en} ${p.culturalNote ? '• ' + p.culturalNote : ''}`;
    b.style.cursor = "pointer";
    b.setAttribute("ontouchstart", ""); // Enable :active on iOS
    b.addEventListener("click", () => {
      input.value = p.pronunciation || p.tr;
      speak(p.hindiPhrase || p.hi); // Speak the Hindi phrase when clicked
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
    
    // Force voice loading on mobile
    setTimeout(() => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Trigger voice loading on mobile
        const utterance = new SpeechSynthesisUtterance('');
        speechSynthesis.speak(utterance);
        speechSynthesis.cancel();
        // Try loading again after a delay
        setTimeout(loadVoices, 1000);
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