# 🌤️ Telegram Weather Bot

Intelligent Telegram bot for weather forecasting with AI style and leisure advice.

## 📋 Description

The bot provides current weather information, forecasts, and personalized recommendations based on weather conditions. Uses modern APIs for weather data and AI for advice generation.

## ✨ Features

### Main capabilities:
- 🌤 **Today's Weather** - hourly forecast for the current day
- 📅 **Weekly Forecast** - 7-day weather forecast
- 🏙 **City Selection** - user city setup
- 🔔 **Daily Subscription** - automatic weather delivery at 8:00 AM
- 💡 **AI Advice** - style and leisure recommendations based on weather

### Features:
- 4 AI requests per day limit per user
- Support for Russian and English city names
- Automatic daily limit reset
- User settings persistence
- Error handling and data validation

## 🛠 Technologies

- **Node.js** - runtime environment
- **TypeScript** - typed JavaScript
- **node-telegram-bot-api** - Telegram API interaction
- **Open-Meteo API** - weather data
- **Google Gemini AI** - advice generation
- **node-cron** - task scheduler

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd new_bot_tg
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
TELEGRAM_TOKEN=your_bot_token_from_BotFather
GEMINI_API_KEY=your_Google_Gemini_API_key
```

### Getting API Keys:

1. **Telegram Bot Token:**
   - Go to [@BotFather](https://t.me/botfather) in Telegram
   - Create a new bot with `/newbot` command
   - Copy the received token

2. **Google Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

## 🚀 Running

### Development mode:
```bash
npm run build-and-start
```

### Production:
```bash
npm run build
npm start
```

## 📱 Usage

1. **Start the bot with `/start` command**
2. **Select city** - press "🏙 Select City" and enter the name
3. **Get weather:**
   - "🌤 Today's Weather" - hourly forecast
   - "📅 Weekly Forecast" - weekly forecast
4. **Enable subscription** - "🔔 Subscription" for daily delivery
5. **Get advice** - "Today's Advice/Weekly Advice" (4 requests/day limit)

## 📁 Project Structure

```
new_bot_tg/
├── main.ts                 # Main application file
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .env                   # Environment variables
├── src/
│   └── utils/
│       ├── constants.ts   # Constants and configuration
│       ├── types.ts       # Data types
│       ├── tools.ts       # Utilities and API functions
│       └── users.json     # User data
└── dist/                  # Compiled files
```

## 🔧 Scripts

- `npm run build` - TypeScript compilation
- `npm run start` - run compiled code
- `npm run build-and-start` - build and run

## 📊 API Usage

### Open-Meteo API
- City geocoding
- Hourly and daily weather forecasts
- Free, no restrictions

### Google Gemini AI
- Personalized advice generation
- Limit: 4 requests per day per user

## 🛡️ Security

- API keys stored in environment variables
- User input validation
- API error handling
- AI function usage limits

## 🤝 Contributing

1. Fork the repository
2. Create a branch for new functionality
3. Make changes
4. Create a Pull Request

## 📄 License

ISC License

## 📞 Support

If you encounter problems:
1. Check API keys correctness in `.env`
2. Make sure all dependencies are installed
3. Check console logs for errors

---

**Enjoy using! 🌤️**
