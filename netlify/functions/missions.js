const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  // Debug all environment variables
  console.log('Missions - All environment variables:', Object.keys(process.env));
  console.log('Missions - OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  
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
    const { type, userProgress = {} } = JSON.parse(event.body || '{}');
    
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('Missions API Key check:', {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      startsWithSk: apiKey ? apiKey.startsWith('sk-') : false
    });

    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.error('Missing OpenAI API key in missions');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Invalid or missing OpenAI API key in missions",
          debug: {
            hasKey: !!apiKey,
            keyLength: apiKey ? apiKey.length : 0,
            startsWithSk: apiKey ? apiKey.startsWith('sk-') : false
          }
        })
      };
    }
    
    const client = new OpenAI({ apiKey: apiKey });
    
    let prompt = '';
    
    if (type === 'mission') {
      prompt = `Generate a realistic daily Hindi learning mission for Emily, an American living in India for 6 months with her husband Jonathan and daughter Sophia. 

Context: She's learning practical Hindi for daily life in India. Current progress: ${JSON.stringify(userProgress)}

Requirements:
- Must be achievable in one conversation session
- Should involve real situations she'd encounter in India
- Include specific Hindi phrases to practice
- Choose from scenes: market, taxi, rickshaw, neighbor, introductions, church
- Make it culturally authentic to Indian daily life

Format as JSON:
{
  "scene": "market",
  "title": "Buy Fresh Vegetables",
  "description": "Visit the local sabzi mandi and practice asking for seasonal vegetables in Hindi",
  "specificGoals": ["Ask for 2 vegetables", "Negotiate price politely", "Ask if items are fresh"],
  "culturalTip": "In Indian markets, gentle bargaining is expected and shows engagement"
}`;
    } else if (type === 'suggestions') {
      prompt = `Generate 6-8 of the MOST COMMON and practical Hindi phrases that Emily would actually use daily in this scene. Focus on phrases locals use constantly.

Context: American family (Emily, husband Jonathan, daughter Sophia) living in India for 6 months. They need the most essential, frequently-used phrases for real daily situations.

Current scene: ${userProgress.scene || 'market'}
User progress: ${JSON.stringify(userProgress)}

Requirements:
- Choose the TOP phrases locals actually say every day in this situation
- Include phrases for different politeness levels (formal/informal)
- Add phrases for common problems/situations that arise
- Include both asking AND responding phrases
- Make pronunciation guides very clear for Americans
- Add cultural context when the phrase has special meaning
- Focus on phrases that will make Emily sound natural, not textbook

Format as JSON array:
[
  {
    "englishIntro": "The most common way to ask if vegetables are fresh - vendors expect this",
    "hindiPhrase": "यह ताज़ा है?", 
    "englishMeaning": "Is this fresh?",
    "pronunciation": "Yeh taaza hai?",
    "displayText": "Yeh taaza hai?",
    "culturalNote": "Vendors appreciate when you check freshness - shows you know quality",
    "frequency": "very_high"
  }
]`;
    }

    let resp;
    try {
      resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are an expert in Indian culture and Hindi language learning. Generate realistic, culturally authentic content for an American family living in India. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
    } catch (apiError) {
      console.error('OpenAI API call failed in missions:', apiError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "openai_api_failed", 
          details: apiError.message 
        })
      };
    }
    
    const content = resp.choices?.[0]?.message?.content || '{}';
    
    // Parse and validate JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      // Return fallback suggestions
      result = [
        {
          "englishIntro": "Essential greeting everyone should know",
          "hindiPhrase": "नमस्ते",
          "englishMeaning": "Hello/Goodbye",
          "pronunciation": "Namaste",
          "displayText": "Namaste"
        },
        {
          "englishIntro": "Polite way to say thank you",
          "hindiPhrase": "धन्यवाद",
          "englishMeaning": "Thank you",
          "pronunciation": "Dhanyavaad",
          "displayText": "Dhanyavaad"
        }
      ];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (e) {
    console.error('Missions function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "missions_failed", 
        details: e.message 
      })
    };
  }
};