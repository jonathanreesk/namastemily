# Namaste, Emily — Hindi Learning App

An interactive Hindi learning application designed specifically for Emily's journey living in India with her family.

## Features

- **AI-Powered Conversations**: Chat with Asha Aunty, your friendly Hindi teacher
- **Text-to-Speech**: Hear authentic Hindi pronunciation 
- **Speech Recognition**: Practice speaking Hindi phrases
- **Gamification**: Earn XP, maintain streaks, unlock badges
- **Daily Missions**: Personalized learning challenges
- **Scene-Based Learning**: Market, taxi, neighbor, church, rickshaw, and introduction scenarios
- **Phrase Packs**: Quick access to essential Hindi phrases

## Quick Start

### 1. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8888`

## Deployment

### Netlify Deployment

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `AZURE_SPEECH_KEY`: (Optional) For better Hindi TTS
   - `AZURE_SPEECH_REGION`: (Optional) Azure region

3. Deploy - Netlify will automatically build and serve your app

## API Endpoints

- `/api/roleplay` - AI conversation with Asha Aunty
- `/api/speech` - Text-to-speech for Hindi pronunciation
- `/api/missions` - Generate daily missions and phrase suggestions
- `/api/stt` - Speech-to-text (placeholder)

## Project Structure

```
├── public/                 # Static files served directly
│   ├── index.html         # Main HTML file
│   ├── script.js          # Frontend JavaScript
│   ├── style.css          # Styling
│   └── phrases.json       # Static phrase packs
├── netlify/functions/     # Serverless functions
│   ├── roleplay.js        # AI chat endpoint
│   ├── speech.js          # Text-to-speech
│   ├── missions.js        # Mission generation
│   └── stt.js            # Speech recognition
├── server/               # Server configuration
│   ├── persona.txt       # AI teacher persona
│   └── scenes.json       # Learning scenarios
└── package.json          # Dependencies and scripts
```

## Learning Scenes

- **🛒 Market**: Buying vegetables, asking prices, bargaining
- **🚕 Taxi**: Destinations, fares, polite requests
- **👋 Neighbor**: Introductions, small talk, invitations
- **🤝 Introductions**: Family introductions, background sharing
- **⛪ Church**: Respectful greetings, blessings, community interaction
- **🛺 Rickshaw**: Negotiating rides, destinations, pricing

## Gamification System

- **Streaks**: Daily learning consistency
- **XP Points**: Earned through conversations and practice
- **Chai Cups**: Special rewards for completing missions
- **Badges**: Achievements for various milestones
- **Daily Missions**: Personalized learning challenges

## Technical Details

- **Frontend**: Vanilla JavaScript, modern CSS
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenAI GPT-4 for conversations
- **TTS**: Azure Speech Services (with browser fallback)
- **STT**: Web Speech API (browser-based)

## Support

This app is specifically designed for Emily's Hindi learning journey in India. For technical issues or feature requests, please check the repository issues or create a new one.

## License

Private project for personal use.