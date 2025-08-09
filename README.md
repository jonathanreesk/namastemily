# Namaste, Emily — Bolt Version
This is a Bolt-ready Hindi learning pilot for Emily.

## Features
- Roleplay chat with "Asha Aunty" (Market, Taxi, Neighbor, Church, Rickshaw, Introductions)
- Hindi TTS in browser
- Optional server Whisper STT for better Hindi recognition
- Phrase packs for each scene
- Gamification with streaks, XP, badges, and daily missions

## Running in Bolt
1. Upload this folder to your Bolt workspace.
2. **IMPORTANT**: Set environment variable `OPENAI_API_KEY` in Bolt's settings or Netlify environment variables.
3. Click "Run" — your app will be live with `/api/roleplay` and `/api/stt` endpoints.

## For Netlify Deployment
1. In your Netlify dashboard, go to Site settings → Environment variables
2. Add: `OPENAI_API_KEY` = your OpenAI API key
3. Redeploy the site

Without the API key, the AI chat features won't work (you'll see network errors).

Static files are in `/public`.
API routes are defined in `bolt.config.json`.
