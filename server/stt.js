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
    // Parse multipart form data (simplified for Netlify functions)
    const audioFile = event.body; // This would need proper multipart parsing
    
    if (!audioFile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "missing_audio" })
      };
    }
    
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcript = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
      language: "hi",
      response_format: "json"
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: transcript.text || "" })
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "stt_failed", details: e.message })
    };
  }
};