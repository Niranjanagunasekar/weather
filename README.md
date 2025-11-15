# Wherther — Simple Weather Search

Small Express app that serves a static frontend and proxies requests to OpenWeatherMap.

**Status**: ✅ Ready for Render deployment

## Prerequisites
- Node.js 18+ (for global `fetch`) — Node 18 or newer is recommended.

## Install

```bash
npm install
```

## Run

```bash
npm start
# then open http://localhost:3000
```

## Environment Variables

Create a `.env` file with your OpenWeatherMap API key:

```
OPENWEATHER_API_KEY=your_key_here
```

## How It Works

- **Frontend**: `public/index.html` - Simple weather search UI
- **Backend**: `server.js` - Express server that proxies requests to OpenWeatherMap API
- **API Endpoint**: `/api/weather?city=CityName`

## Deployed on Render

Visit your live app at: [Your Render URL]
