exports.handler = async (event, context) => {
  console.log('Speech function called with method:', event.httpMethod);
  console.log('Environment check:', {
    hasKey: !!process.env.AZURE_SPEECH_KEY,
    hasRegion: !!process.env.AZURE_SPEECH_REGION,
    keyLength: process.env.AZURE_SPEECH_KEY ? process.env.AZURE_SPEECH_KEY.length : 0,
    region: process.env.AZURE_SPEECH_REGION,
    keyPreview: process.env.AZURE_SPEECH_KEY ? process.env.AZURE_SPEECH_KEY.substring(0, 8) + '...' : 'undefined'
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
    
    console.log('Azure credentials check:', {
      hasKey: !!key,
      hasRegion: !!region,
      keyLength: key ? key.length : 0,
      region: region
    });

    if (!key || !region) {
      console.error('Missing Azure credentials:', { 
        key: !!key, 
        region: !!region,
        keyPreview: key ? key.substring(0, 8) + '...' : 'undefined',
        allEnvVars: Object.keys(process.env).filter(k => k.includes('AZURE') || k.includes('SPEECH')),
        message: 'AZURE CREDENTIALS NOT FOUND - WILL NOT WORK'
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "AZURE_SPEECH_KEY or AZURE_SPEECH_REGION not set in Netlify environment variables",
          debug: { hasKey: !!key, hasRegion: !!region }
        })
      };
    }

    // Import fetch for Node.js environment
    const fetch = require('node-fetch');

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

    // Check if text contains Hindi characters
    const hindiChars = text.match(/[\u0900-\u097F]/g);
    const isHindiPhrase = !!hindiChars;
    
    console.log('Text analysis:', {
      originalText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      isHindiPhrase,
      hindiCharsFound: hindiChars || 'none',
      hindiCharCount: hindiChars ? hindiChars.length : 0
    });
    
    const processedText = isHindiPhrase ? applyHindiPhonemes(text) : text;
    
    // Use appropriate voice and language based on content
    const rate = slow ? "-10%" : "0%";
    const voice = isHindiPhrase ? "hi-IN-SwaraNeural" : "en-US-AriaNeural";
    const lang = isHindiPhrase ? "hi-IN" : "en-US";
    
    console.log('Voice selection:', { 
      voice, 
      lang, 
      rate, 
      isHindiPhrase,
      textLength: text.length
    });
    
    const ssml = `
<speak version="1.0" xml:lang="${lang}" xmlns:mstts="https://www.w3.org/2001/mstts">
  <voice name="${voice}">
    <prosody rate="${rate}">
      ${processedText}
    </prosody>
  </voice>
</speak>`.trim();

    console.log('Generated SSML preview:', ssml.substring(0, 200) + '...');

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    console.log('Making Azure API request to:', url);
    
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml
    });

    console.log('Azure API response:', {
      status: resp.status,
      statusText: resp.statusText,
      headers: Object.fromEntries(resp.headers.entries())
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Azure API error:', resp.status, errText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `Azure TTS failed: ${resp.status} ${resp.statusText}`,
          status: resp.status,
          details: errText,
          ssml: ssml
        })
      };
    }

    const buf = Buffer.from(await resp.arrayBuffer());
    console.log('Audio buffer size:', buf.length);
    
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
    console.error('Speech function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "speech_failed", 
        details: e.message,
        stack: e.stack
      })
    };
  }
}