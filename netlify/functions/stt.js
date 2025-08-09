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
    // For now, return a simple response since proper multipart parsing
    // in Netlify functions requires additional setup
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        text: "Speech recognition not fully implemented yet. Please use browser speech recognition instead.",
        error: "server_stt_not_implemented"
      })
    };
  } catch (e) {
    console.error('STT function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "stt_failed", 
        details: e.message 
      })
    };
  }
};