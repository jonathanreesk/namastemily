const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

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

        if (!process.env.OPENAI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Missing OpenAI API key" }));
          return;
        }

        // Read persona and scene files
        let persona, scenes;
        try {
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

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
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
        const { scene = "market", level = "beginner" } = JSON.parse(body || '{}');

        if (!process.env.OPENAI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Missing OpenAI API key" }));
          return;
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const prompt = `Generate 3 Hindi phrases for ${scene} scenario at ${level} level. Return as JSON array with objects containing 'hindi', 'english', and 'pronunciation' fields.`;
        
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }]
        });
        
        let phrases;
        try {
          phrases = JSON.parse(response.choices[0].message.content);
        } catch {
          phrases = [
            { hindi: "नमस्ते", english: "Hello", pronunciation: "namaste" },
            { hindi: "धन्यवाद", english: "Thank you", pronunciation: "dhanyawad" },
            { hindi: "कितना पैसा?", english: "How much money?", pronunciation: "kitna paisa?" }
          ];
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ phrases }));
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

        // For now, return a mock response since Azure TTS requires specific setup
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          audioUrl: null, 
          message: "Speech synthesis not configured. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION." 
        }));
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