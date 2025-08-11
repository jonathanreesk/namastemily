import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import http from 'http';
import url from 'url';
import fetch from 'node-fetch';

// Load environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

console.log('Environment check:', {
  hasOpenAI: !!OPENAI_API_KEY,
  hasAzureKey: !!AZURE_SPEECH_KEY,
  hasAzureRegion: !!AZURE_SPEECH_REGION,
  openAIPreview: OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 20) + '...' : 'undefined'
});

const server = http.createServer(async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  // Handle /api/roleplay endpoint
  if (parsedUrl.pathname === '/api/roleplay' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { history = [], scene = "market", level = "beginner" } = JSON.parse(body || '{}');

        if (!OPENAI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Missing OpenAI API key", debug: "Check environment variables" }));
          return;
        }

        // Read persona and scene files
        let persona, scenes;
        try {
          const __dirname = path.dirname(new URL(import.meta.url).pathname);
          persona = fs.readFileSync(path.join(__dirname, '..', 'server', 'persona.txt'), 'utf8');
          scenes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'scenes.json'), 'utf8'));
        } catch (fileError) {
          persona = `You are Aasha Aunty, a warm, encouraging Hindi teacher who speaks primarily in clear American English. Always speak in English first, then teach Hindi phrases.`;
          scenes = {
            market: "You are teaching Emily market vocabulary in Hindi. Use English explanations first.",
            taxi: "You are teaching Emily taxi phrases in Hindi. Use English explanations first.",
            neighbor: "You are teaching Emily neighborly conversation in Hindi. Use English explanations first.",
            church: "You are teaching Emily respectful Hindi phrases for church. Use English explanations first.",
            rickshaw: "You are teaching Emily rickshaw phrases in Hindi. Use English explanations first.",
            introductions: "You are teaching Emily introduction phrases in Hindi. Use English explanations first."
          };
        }

        const scenePersona = scenes[scene] || scenes.market;
        const system = [
          persona,
          "Scene context:", scenePersona,
          level === "beginner" ? "Use very simple sentences and slow pace." : "Use simple sentences with more variety.",
          "Always start with friendly English, then teach Hindi phrases with pronunciation."
        ].join("\n");

        const messages = [
          { role: "system", content: system },
          ...history
        ];

        const client = new OpenAI({ apiKey: OPENAI_API_KEY });
        
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.6,
          messages
        });
        
        const reply = response.choices?.[0]?.message?.content || "Namaste, Emily! How can I help you learn Hindi today?";

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      });
    } catch (error) {
      console.error('Roleplay error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "roleplay_failed", details: error.message }));
    }
  }
  
  // Handle /api/missions endpoint
  else if (parsedUrl.pathname === '/api/missions' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { type, userProgress = {} } = JSON.parse(body || '{}');

        if (!OPENAI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Missing OpenAI API key", debug: "Check environment variables" }));
          return;
        }

        const client = new OpenAI({ apiKey: OPENAI_API_KEY });
        
        let prompt = '';
        
        if (type === 'suggestions') {
          const scene = userProgress.scene || 'market';
          const level = userProgress.level || 'beginner';
          prompt = `Generate 4-6 realistic Hindi phrase suggestions for Emily based on her current scene and progress.

Context: American learning Hindi for daily life in India. Progress: ${JSON.stringify(userProgress)}
Scene: ${scene}, Level: ${level}

Requirements:
- Phrases should be immediately useful in India
- Include both English explanation and Hindi phrase
- Make them culturally appropriate
- Focus on practical communication
- Include pronunciation guide

Format as JSON array:
[
  {
    "englishIntro": "When you want to ask if vegetables are fresh at the market",
    "hindiPhrase": "यह ताज़ा है?",
    "englishMeaning": "Is this fresh?",
    "pronunciation": "Yeh taaza hai?"
  }
]`;
        } else {
          prompt = `Generate a realistic daily Hindi learning mission for Emily. Return as JSON object with scene, title, description, specificGoals array, and culturalTip.`;
        }
        
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: "You are an expert in Indian culture and Hindi language learning. Generate realistic, culturally authentic content for an American family living in India. Always respond with valid JSON only."
            },
            {
              role: "user", 
              content: prompt 
            }
          ]
        });
        
        let result;
        try {
          result = JSON.parse(response.choices[0].message.content);
        } catch {
          result = [
            { 
              englishIntro: "A basic greeting everyone should know",
              hindiPhrase: "नमस्ते", 
              englishMeaning: "Hello/Goodbye", 
              pronunciation: "namaste" 
            },
            { 
              englishIntro: "Essential phrase for showing gratitude",
              hindiPhrase: "धन्यवाद", 
              englishMeaning: "Thank you", 
              pronunciation: "dhanyawad" 
            }
          ];
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      });
    } catch (error) {
      console.error('Missions error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "missions_failed", details: error.message }));
    }
  }
  
  // Handle /api/speech endpoint
  else if (parsedUrl.pathname === '/api/speech' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { text = "", voice = "hi-IN-SwaraNeural" } = JSON.parse(body || '{}');

        if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: "Missing Azure speech credentials",
            debug: { hasKey: !!AZURE_SPEECH_KEY, hasRegion: !!AZURE_SPEECH_REGION }
          }));
          return;
        }

        try {
          // Apply Hindi phoneme corrections for proper pronunciation
          function applyHindiPhonemes(s) {
            return s
              .replace(/मैं/g, '<phoneme alphabet="ipa" ph="mɛ̃">मैं</phoneme>')
              .replace(/में/g, '<phoneme alphabet="ipa" ph="meː̃">में</phoneme>')
              .replace(/नहीं/g, '<phoneme alphabet="ipa" ph="nəɦĩː">नहीं</phoneme>')
              .replace(/कृपया/g, '<phoneme alphabet="ipa" ph="kɾɪpjaː">कृपया</phoneme>')
              .replace(/धन्यवाद/g, '<phoneme alphabet="ipa" ph="d̪ʱənjəʋaːd̪">धन्यवाद</phoneme>')
              .replace(/नमस्ते/g, '<phoneme alphabet="ipa" ph="nəməsˈteː">नमस्ते</phoneme>')
              .replace(/चाहिए/g, '<phoneme alphabet="ipa" ph="t͡ʃaːɦije">चाहिए</phoneme>');
          }

          const isHindiPhrase = /[\u0900-\u097F]/.test(text);
          const processedText = isHindiPhrase ? applyHindiPhonemes(text) : text;
          
          const ssml = `
<speak version="1.0" xml:lang="${isHindiPhrase ? 'hi-IN' : 'en-US'}" xmlns:mstts="https://www.w3.org/2001/mstts">
  <voice name="${isHindiPhrase ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural'}">
    <prosody rate="-10%">
      ${processedText}
    </prosody>
  </voice>
</speak>`.trim();

          const url = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
              "Content-Type": "application/ssml+xml",
              "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            },
            body: ssml
          });

          if (!response.ok) {
            throw new Error(`Azure TTS failed: ${response.status}`);
          }

          const audioBuffer = Buffer.from(await response.arrayBuffer());
          
          res.writeHead(200, { 
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=3600'
          });
          res.end(audioBuffer);
          
        } catch (error) {
          console.error('Speech synthesis error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: "speech_synthesis_failed", 
            details: error.message 
          }));
        }
      });
    } catch (error) {
      console.error('Speech error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "speech_failed", details: error.message }));
    }
  }
  
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});