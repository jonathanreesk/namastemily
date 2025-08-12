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
    const { text, slow = true, forceAzure = false } = JSON.parse(event.body || "{}");
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

    // If forceAzure is true, fail immediately if no Azure credentials
    if (forceAzure && (!key || !region)) {
      console.error('FORCE AZURE: Missing credentials');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "AZURE_SPEECH_KEY or AZURE_SPEECH_REGION not configured in Netlify environment variables. Azure Hindi voice requires these credentials.",
          debug: { hasKey: !!key, hasRegion: !!region, forceAzure: true }
        })
      };
    }

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

    // FORCE HINDI: Apply phoneme corrections for proper pronunciation
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

    // FORCE HINDI: Always treat as Hindi and apply phoneme corrections
    console.log('FORCE HINDI MODE: Processing text as Hindi');
    const processedText = applyHindiPhonemes(text);
    
    // FORCE HINDI: Always use Hindi voice and language
    const voice = "hi-IN-SwaraNeural";
    const lang = "hi-IN";
    const rate = slow ? "-20%" : "-10%"; // Slower for Hindi learning
    
    console.log('FORCE HINDI: Using voice:', voice, 'language:', lang, 'rate:', rate);
    
    const ssml = `
<speak version="1.0" xml:lang="${lang}" xmlns:mstts="https://www.w3.org/2001/mstts">
  <voice name="${voice}">
    <prosody rate="${rate}">
      ${processedText}
    </prosody>
  </voice>
</speak>`.trim();

    console.log('HINDI SSML generated:', ssml);

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    console.log('AZURE HINDI API request to:', url);
    
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml
    });

    console.log('AZURE HINDI API response:', {
      status: resp.status,
      statusText: resp.statusText,
      headers: Object.fromEntries(resp.headers.entries())
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('AZURE HINDI API ERROR:', resp.status, errText);
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
    console.log('AZURE HINDI audio buffer size:', buf.length, 'bytes');
    
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