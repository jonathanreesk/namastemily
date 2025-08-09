const { OpenAI } = require('openai');

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
    const { text } = JSON.parse(event.body || '{}');
    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing text" })
      };
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Use tts-1 model with alloy voice (works well for Hindi)
    const resp = await client.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // Neutral voice that handles Hindi well
      input: text,
      response_format: "mp3"
    });

    const audio = Buffer.from(await resp.arrayBuffer());
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600"
      },
      body: audio.toString("base64"),
      isBase64Encoded: true
    };
  } catch (e) {
    console.error('TTS function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "tts_failed", 
        details: e.message 
      })
    };
  }
};