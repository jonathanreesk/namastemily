const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Debug all environment variables
  console.log('All environment variables:', Object.keys(process.env));
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  console.log('OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : false);
  
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

    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key check:', {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      startsWithSk: apiKey ? apiKey.startsWith('sk-') : false,
      preview: apiKey ? apiKey.substring(0, 20) + '...' : 'undefined'
    });

    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.error('Missing OpenAI API key');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Invalid or missing OpenAI API key",
          debug: {
            hasKey: !!apiKey,
            keyLength: apiKey ? apiKey.length : 0,
            startsWithSk: apiKey ? apiKey.startsWith('sk-') : false,
            allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI') || key.includes('API'))
          },
          instructions: "Please check OPENAI_API_KEY in Netlify environment variables"
        })
      };
    }

    // Read files from the correct location in Netlify
    let scenes, persona;
    try {
      const scenesPath = path.join(process.cwd(), 'server', 'scenes.json');
      const personaPath = path.join(process.cwd(), 'server', 'persona.txt');
      
      scenes = JSON.parse(fs.readFileSync(scenesPath, 'utf8'));
      persona = fs.readFileSync(personaPath, 'utf8');
    } catch (fileError) {
      console.log('Using fallback persona and scenes due to file read error:', fileError.message);
      // Fallback content
      persona = "You are Aasha Aunty, a warm, encouraging Hindi teacher who speaks primarily in clear American English. Always speak in English first, then teach Hindi phrases.";
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
      "Persona scene:", scenePersona,
      level === "beginner" ? "Use very simple sentences and slow pace." : "Use simple sentences; allow a bit more variety.",
      "Start with a friendly greeting and a clear question."
    ].join("\n");

    const messages = [
      { role: "system", content: system },
      ...history
    ];

    // Use dynamic import for OpenAI
    let client;
    try {
      const { OpenAI } = await import('openai');
      client = new OpenAI({ apiKey: apiKey });
    } catch (importError) {
      console.error('Failed to import OpenAI:', importError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "openai_import_failed", 
          details: importError.message 
        })
      };
    }
    
    let resp;
    try {
      resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages
      });
    } catch (apiError) {
      console.error('OpenAI API call failed:', apiError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "openai_api_failed", 
          details: apiError.message 
        })
      };
    }
    
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