exports.handler = async (event, context) => {
  console.log('Speech function called with method:', event.httpMethod);
  console.log('Speech function called');
  console.log('Environment check:', {
    hasKey: !!process.env.AZURE_SPEECH_KEY,
    hasRegion: !!process.env.AZURE_SPEECH_REGION,
    keyLength: process.env.AZURE_SPEECH_KEY ? process.env.AZURE_SPEECH_KEY.length : 0
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
    if (!key || !region) {
      console.error('Missing Azure credentials:', { 
        key: !!key, 
        region: !!region,
        keyPreview: key ? key.substring(0, 8) + '...' : 'undefined'
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Missing Azure speech environment variables",
          debug: { hasKey: !!key, hasRegion: !!region }
        })
      };
    }

    // Check if this is a Hindi phrase for pronunciation (contains Devanagari)
    const isHindiPhrase = /[\u0900-\u097F]/.test(text);
    
    // For mixed content (English + Hindi), use structured SSML
    if (text.includes('|HINDI|')) {
      const parts = text.split('|HINDI|');
      const englishPart = parts[0] || '';
      const hindiPart = parts[1] || '';
      
      const processedHindi = applyHindiPhonemes(hindiPart);
      
      const rate = slow ? "-10%" : "0%";
      const ssml = `
<speak version="1.0" xml:lang="en-US" xmlns:mstts="https://www.w3.org/2001/mstts">
  <voice name="en-US-JennyNeural">
    <prosody rate="${rate}">
      ${englishPart}
      <break time="300ms"/>
      <lang xml:lang="hi-IN">
        <voice name="hi-IN-SwaraNeural">
          ${processedHindi}
        </voice>
      </lang>
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
          body: JSON.stringify({ error: `azure_speech_failed: ${errText}` })
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
    }

    // Apply Hindi phoneme corrections for proper pronunciation
    function applyHindiPhonemes(s) {
      // Force correct pronunciation for common confusing words
      return s
        // pronoun & postposition
        .replace(/मैं/g, '<phoneme alphabet="ipa" ph="mɛ̃">मैं</phoneme>')
        .replace(/में/g, '<phoneme alphabet="ipa" ph="meː̃">में</phoneme>')
        
        // copula / auxiliaries / negation / deictics
        .replace(/हूँ/g, '<phoneme alphabet="ipa" ph="huː̃">हूँ</phoneme>')
        .replace(/हैं/g, '<phoneme alphabet="ipa" ph="hɛ̃">हैं</phoneme>')
        .replace(/नहीं/g, '<phoneme alphabet="ipa" ph="nəɦĩː">नहीं</phoneme>')
        .replace(/कहाँ/g, '<phoneme alphabet="ipa" ph="kəɦãː">कहाँ</phoneme>')
        .replace(/यहाँ/g, '<phoneme alphabet="ipa" ph="jəɦãː">यहाँ</phoneme>')
        .replace(/वहाँ/g, '<phoneme alphabet="ipa" ph="ʋəɦãː">वहाँ</phoneme>')
        
        // politeness & set phrases
        .replace(/कृपया/g, '<phoneme alphabet="ipa" ph="kɾɪpjaː">कृपया</phoneme>')
        .replace(/धन्यवाद/g, '<phoneme alphabet="ipa" ph="d̪ʱənjəʋaːd̪">धन्यवाद</phoneme>')
        .replace(/नमस्ते/g, '<phoneme alphabet="ipa" ph="nəməsˈteː">नमस्ते</phoneme>')
        .replace(/ज़रा/g, '<phoneme alphabet="ipa" ph="zəɾaː">ज़रा</phoneme>')
        .replace(/ज़रूर/g, '<phoneme alphabet="ipa" ph="zəˈruːɾ">ज़रूर</phoneme>')
        .replace(/शुक्रिया/g, '<phoneme alphabet="ipa" ph="ʃʊkɾijaː">शुक्रिया</phoneme>')
        .replace(/जी/g, '<phoneme alphabet="ipa" ph="d͡ʒiː">जी</phoneme>')
        
        // market & travel words
        .replace(/थोड़ा/g, '<phoneme alphabet="ipa" ph="t̪ʰoːɽaː">थोड़ा</phoneme>')
        .replace(/ज़्यादा/g, '<phoneme alphabet="ipa" ph="zjɑːd̪aː">ज़्यादा</phoneme>')
        .replace(/कितना/g, '<phoneme alphabet="ipa" ph="kɪt̪naː">कितना</phoneme>')
        .replace(/कीमत/g, '<phoneme alphabet="ipa" ph="kiːmət̪">कीमत</phoneme>')
        .replace(/चाहिए/g, '<phoneme alphabet="ipa" ph="t͡ʃaːɦije">चाहिए</phoneme>')
        .replace(/किराया/g, '<phoneme alphabet="ipa" ph="kɪɾaːjaː">किराया</phoneme>')
        
        // future/plural polite "will take/go"
        .replace(/लेंगे/g, '<phoneme alphabet="ipa" ph="leːŋɡe">लेंगे</phoneme>')
        .replace(/चलेंगे/g, '<phoneme alphabet="ipa" ph="t͡ʃəleːŋɡe">चलेंगे</phoneme>');
    }

    // Normalize common Hinglish to Devanagari
    function normalizeHinglishToDev(text) {
      return text
        .replace(/\bmain\b/gi, 'मैं')
        .replace(/\bmein\b/gi, 'में')
        .replace(/\bnahi\b/gi, 'नहीं')
        .replace(/\byahan\b/gi, 'यहाँ')
        .replace(/\bwahan\b/gi, 'वहाँ')
        .replace(/\bthoda\b/gi, 'थोड़ा')
        .replace(/\bzyada\b/gi, 'ज़्यादा')
        .replace(/\bkripya\b/gi, 'कृपया')
        .replace(/\bdhanyavaad\b/gi, 'धन्यवाद')
        .replace(/\bchahiye\b/gi, 'चाहिए')
        .replace(/\bkiraya\b/gi, 'किराया')
        .replace(/\blenge\b/gi, 'लेंगे')
        .replace(/\bchalenge\b/gi, 'चलेंगे')
        .replace(/\bhai\b/gi, 'है')
        .replace(/\bhun\b/gi, 'हूँ');
    }
    // Apply corrections based on content type
    let processedText;
    if (isHindiPhrase) {
      processedText = applyHindiPhonemes(text);
    } else {
      // Convert common Hinglish to Devanagari, then apply phonemes
      const normalized = normalizeHinglishToDev(text);
      const hasHindiAfterNorm = /[\u0900-\u097F]/.test(normalized);
      processedText = hasHindiAfterNorm ? applyHindiPhonemes(normalized) : normalized;
    }

    // Choose voice based on content
    const rate = slow ? "-10%" : "0%";
    
    let ssml;
    if (isHindiPhrase) {
      // Pure Hindi content - use Hindi voice with phoneme corrections
      ssml = `
<speak version="1.0" xml:lang="hi-IN" xmlns:mstts="https://www.w3.org/2001/mstts">
  <voice name="hi-IN-SwaraNeural">
    <prosody rate="${rate}">
      ${processedText}
    </prosody>
  </voice>
</speak>`.trim();
    } else {
      // English content - use friendly American English voice
      ssml = `
<speak version="1.0" xml:lang="en-US" xmlns:mstts="https://www.w3.org/2001/mstts">
  <voice name="en-US-JennyNeural">
    <prosody rate="${rate}">
      ${processedText}
    </prosody>
  </voice>
</speak>`.trim();
    }

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
      console.error('Azure API error:', resp.status, errText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `azure_speech_failed: ${resp.status} ${errText}`,
          status: resp.status
        })
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
    console.error('Speech function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "speech_failed", 
        details: e.message 
      })
    };
  }
}