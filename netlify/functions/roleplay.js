const { readFileSync } = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { history = [], scene = "market", level = "beginner" } = JSON.parse(event.body || '{}');

    // Read files from the correct location in Netlify
    const scenesPath = path.join(process.cwd(), 'server', 'scenes.json');
    const personaPath = path.join(process.cwd(), 'server', 'persona.txt');
    
    const scenes = JSON.parse(readFileSync(scenesPath, 'utf8'));
    const persona = readFileSync(personaPath, 'utf8');

    const scenePersona = scenes[scene] || scenes.market;
    const system = [
      persona,
      "Persona scene:", scenePersona,
      level === "beginner" ? "Use very simple sentences and slow pace." : "Use simple sentences; allow a bit more variety.",
      "Start with a friendly greeting and a clear question."
    ].join("\n");

    const messages = [
      { role: "system", content: system },
      ...history
    ];

    // Use dynamic import for OpenAI
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages
    });
    
    const reply = resp.choices?.[0]?.message?.content || "Namaste, Emily! Kaise madad karun? (How can I help?)";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    console.error('Roleplay function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "roleplay_failed", 
        details: e.message,
        stack: e.stack 
      })
    };
  }
};