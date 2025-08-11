const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Simple HTTP handler for Bolt environment
const http = require('http');
const url = require('url');

const server = http.createServer(async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
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
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});