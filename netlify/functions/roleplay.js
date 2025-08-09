import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event, context) => {
  console.log('Roleplay function called with method:', event.httpMethod);
  console.log('Environment check:', {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
  });

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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "missing_api_key", 
          details: "OpenAI API key not configured. Please add OPENAI_API_KEY to your Netlify environment variables.",
          reply: "Hi Emily! I need my OpenAI API key to be configured in Netlify's environment variables to chat with you. Please add your OPENAI_API_KEY in the Netlify dashboard under Site settings → Environment variables. 🔧"
        })
      };
    }

    // Log API key status (first 8 chars only for security)
    console.log('OpenAI API key found:', process.env.OPENAI_API_KEY.substring(0, 8) + '...');
    console.log('API key length:', process.env.OPENAI_API_KEY.length);

    // Log API key status (first 8 chars only for security)
    console.log('OpenAI API key found:', process.env.OPENAI_API_KEY.substring(0, 8) + '...');
    console.log('API key length:', process.env.OPENAI_API_KEY.length);

    // Read files from the correct location in Netlify build
    let scenes, persona;
    try {
      const scenesPath = join(__dirname, '..', '..', 'server', 'scenes.json');
      const personaPath = join(__dirname, '..', '..', 'server', 'persona.txt');
      
      scenes = JSON.parse(readFileSync(scenesPath, 'utf8'));
      persona = readFileSync(personaPath, 'utf8');
    } catch (fileError) {
      console.error('Error reading server files:', fileError);
      // Fallback to inline content if files can't be read
      scenes = {
        market: "You are a friendly Hindi teacher helping Emily learn market vocabulary. Speak in English, introducing Hindi phrases for buying vegetables, asking prices, and being polite.",
        taxi: "You are teaching Emily essential taxi phrases in Hindi. Use English to explain each phrase's meaning and when to use it.",
        neighbor: "You're helping Emily learn neighborly conversation in Hindi. Teach greetings, introductions, and polite small talk in English first, then provide the Hindi phrases.",
        church: "You're teaching Emily respectful Hindi phrases for church interactions. Explain cultural context in English, then teach appropriate greetings.",
        rickshaw: "You're teaching Emily rickshaw negotiation phrases. Explain in English how bargaining works culturally, then teach the Hindi phrases.",
        introductions: "You're helping Emily learn how to introduce herself and her family in Hindi. Start with English explanations, then teach the Hindi phrases."
      };
      persona = "You are Aasha Aunty, a warm, encouraging Hindi teacher who speaks primarily in clear American English. Your role is to speak in friendly, motivating English as your primary language, introduce Hindi words and phrases with clear English explanations, and act like a patient language tutor.";
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
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    console.log('Making OpenAI API call with model: gpt-4o-mini');
    console.log('Messages being sent:', JSON.stringify(messages, null, 2));
    console.log('Messages being sent:', JSON.stringify(messages, null, 2));
    
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages
    });
    
    console.log('OpenAI API response received');
    console.log('Response status:', resp);
    console.log('Response status:', resp);
    const reply = resp.choices?.[0]?.message?.content || "Namaste, Emily! Kaise madad karun? (How can I help?)";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    console.error('Roleplay function error:', e);
    console.error('Error stack:', e.stack);
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    
    // Check if it's an OpenAI API error
    if (e.status) {
      console.error('OpenAI API status:', e.status);
      console.error('OpenAI API error:', e.error);
    }
    
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    
    // Check if it's an OpenAI API error
    if (e.status) {
      console.error('OpenAI API status:', e.status);
      console.error('OpenAI API error:', e.error);
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "roleplay_failed", 
        details: e.message,
        reply: `Sorry Emily! I'm having trouble connecting to my AI brain right now. Error: ${e.message}. ${e.status ? `(OpenAI API Status: ${e.status})` : ''} Please check the Netlify function logs for more details. 🔧`
      })
    };
  }
};