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
      const scene = userProgress.scene || 'market';
      const sceneContexts = {
        market: "bustling Indian vegetable markets (sabzi mandi) with vendors, bargaining, fresh produce",
        taxi: "Indian taxi rides with drivers, fare negotiation, directions, traffic",
        rickshaw: "auto-rickshaw rides, price bargaining, short distances, local transport",
        neighbor: "residential Indian neighborhoods, building relationships, community interactions",
        introductions: "meeting new people in India, family introductions, cultural exchange",
        church: "Indian Christian community, respectful interactions, religious gatherings"
      };
      
      prompt = `Generate a realistic daily Hindi learning mission for Emily, an American living in India for 6 months with her husband Jonathan and daughter Sophia.

SCENE FOCUS: ${scene} - ${sceneContexts[scene]}
Current progress: ${JSON.stringify(userProgress)}

Requirements:
- Must be specific to ${scene} situations Emily encounters in India
- Should be achievable in one conversation session  
- Include 3-4 specific Hindi phrases relevant to ${scene}
- Make it culturally authentic to real Indian ${scene} experiences
- Consider her family context (husband Jonathan, daughter Sophia)

Format as JSON:
{
  "scene": "${scene}",
  "title": "Scene-specific title",
  "description": "Detailed description of ${scene} activity",
  "specificGoals": ["Goal 1 for ${scene}", "Goal 2 for ${scene}", "Goal 3 for ${scene}"],
  "culturalTip": "Important cultural insight about ${scene} interactions in India"
}`;
    } else if (type === 'suggestions') {
      const scene = userProgress.scene || 'market';
      const level = userProgress.level || 'beginner';
      const sceneDetails = {
        market: {
          context: "Indian vegetable markets (sabzi mandi)",
          situations: ["asking for vegetables", "price negotiation", "checking freshness", "quantity requests", "payment"],
          vocabulary: ["vegetables", "prices", "quality", "weights", "bargaining phrases"]
        },
        taxi: {
          context: "Indian taxi rides and transportation",
          situations: ["giving destinations", "fare discussion", "safety requests", "time estimates", "directions"],
          vocabulary: ["locations", "money", "speed", "directions", "politeness"]
        },
        rickshaw: {
          context: "Auto-rickshaw rides and local transport",
          situations: ["destination requests", "price bargaining", "short distances", "waiting", "sharing rides"],
          vocabulary: ["places", "rupees", "time", "directions", "negotiations"]
        },
        neighbor: {
          context: "Indian residential community interactions",
          situations: ["introductions", "family talk", "invitations", "help requests", "daily greetings"],
          vocabulary: ["family terms", "greetings", "time", "help", "social phrases"]
        },
        introductions: {
          context: "Meeting new people in Indian social settings",
          situations: ["self introduction", "family introduction", "background sharing", "future plans", "contact exchange"],
          vocabulary: ["names", "places", "family", "work", "time periods"]
        },
        church: {
          context: "Indian Christian community interactions",
          situations: ["respectful greetings", "prayer requests", "blessings", "service feedback", "community connection"],
          vocabulary: ["religious terms", "respect", "blessings", "community", "gratitude"]
        }
      };
      
      const sceneInfo = sceneDetails[scene] || sceneDetails.market;
      
      prompt = `Generate 5-6 realistic Hindi phrase suggestions for Emily, specifically for ${scene} situations in India.

SCENE: ${scene} - ${sceneInfo.context}
LEVEL: ${level}
SITUATIONS: ${sceneInfo.situations.join(', ')}
KEY VOCABULARY: ${sceneInfo.vocabulary.join(', ')}

Progress: ${JSON.stringify(userProgress)}

Requirements:
- ALL phrases must be specific to ${scene} situations Emily encounters in India
- Must be appropriate for ${level} level (${level === 'beginner' ? 'simple, essential phrases' : 'slightly more complex but still practical'})
- Include cultural context for each phrase
- Focus on real ${scene} scenarios Emily faces with her family
- Provide clear pronunciation guides

Format as JSON array:
[
  {
    "englishIntro": "When you need to [specific ${scene} situation]",
    "hindiPhrase": "Hindi phrase for ${scene}",
    "englishMeaning": "Exact English meaning",
    "pronunciation": "Clear pronunciation guide",
    "culturalNote": "Important cultural insight about this ${scene} interaction"
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