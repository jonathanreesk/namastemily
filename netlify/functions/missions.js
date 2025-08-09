import { OpenAI } from 'openai';

export const handler = async (event, context) => {
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
    
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
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
      prompt = `Generate 4-6 realistic Hindi phrase suggestions for Emily based on her current scene and progress.

Context: American learning Hindi for daily life in India. Progress: ${JSON.stringify(userProgress)}

Requirements:
- Phrases should be immediately useful in India
- Include both English explanation and Hindi phrase
- Make them culturally appropriate
- Focus on practical communication
- Include pronunciation guide

Format as JSON array:
[
  {
    "englishIntro": "When you want to ask if vegetables are fresh at the market",
    "hindiPhrase": "यह ताज़ा है?",
    "englishMeaning": "Is this fresh?",
    "pronunciation": "Yeh taaza hai?",
    "culturalNote": "Vendors appreciate when you check freshness - shows you know quality"
  }
]`;
    }

    const resp = await client.chat.completions.create({
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
    
    const content = resp.choices?.[0]?.message?.content || '{}';
    
    // Parse and validate JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      throw new Error('Invalid JSON response from AI');
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