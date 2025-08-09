// netlify/functions/tts-azure.js
export async function handler(event) {
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
    const { text, slow = true } = JSON.parse(event.body || "{}");
    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing text" })
      };
    }

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing Azure speech env vars" })
      };
    }

    // Simple heuristic: if Devanagari present, treat as Hindi; else Indian English.
    const isHindi = /[\u0900-\u097F]/.test(text);

    // SSML: Delhi-style Hindi as primary; Indian English for any embedded English.
    // You can feed fully-Hindi text for best effect.
    const rate = slow ? "-10%" : "0%";
    const ssml = `
<speak version="1.0" xml:lang="hi-IN">
  <voice name="hi-IN-SwaraNeural">
    <prosody rate="${rate}">
      ${isHindi
        ? text
        : `<lang xml:lang="en-IN"><voice name="en-IN-NeerjaNeural">${text}</voice></lang>`}
    </prosody>
  </voice>
</speak>`.trim();

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `azure_tts_failed: ${errText}` })
      };
    }

    const buf = Buffer.from(await resp.arrayBuffer());
    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600"
      },
      body: buf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    console.error('Azure TTS function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "tts_failed", 
        details: e.message 
      })
    };
  }
}