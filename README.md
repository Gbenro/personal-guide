# Personal Guide 🎯

> AI-powered personal assistant for growth, habits, and self-discovery

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/personal-guide)

## ✨ Features

### 🧠 AI-Powered Chat System
- **Multi-Persona AI**: Choose from Mentor, Coach, Friend, or Mirror personalities
- **Context-Aware Conversations**: Intelligent personality switching based on your needs
- **Natural Language Processing**: Advanced mood analysis and pattern recognition

### 📊 Comprehensive Tracking
- **Habit Tracking**: Visual progress, streak calculations, and analytics
- **Mood & Energy Logging**: Correlate emotions with activities and habits
- **Journal System**: Integrated journaling with mood correlation and insights

### 🎨 Modern Interface
- **Progressive Web App**: Install on mobile devices for native app experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization and animations

### 🏗️ Production-Ready Infrastructure
- **DevOps Pipeline**: Complete CI/CD with GitHub Actions
- **Monitoring**: Prometheus/Grafana integration for performance tracking
- **Security**: Comprehensive error tracking and secrets management

## 🚀 Quick Deploy to Railway

1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Add environment variables:
   ```
   # Required: Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # AI Providers (at least one required)
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_claude_api_key  # For Claude fallback
   ```
4. Deploy and enjoy!

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)
- OpenAI API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gbenro/personal-guide.git
   cd personal-guide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your keys
   ```

4. **Set up database**
   ```bash
   # Run the Supabase schema
   # Import supabase-schema.sql into your Supabase project
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📱 PWA Installation

### Mobile (iOS/Android)
1. Open the app in your mobile browser
2. Look for "Add to Home Screen" prompt
3. Follow the installation steps

### Desktop
1. Look for the install icon in your browser's address bar
2. Click to install as a desktop app

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **AI**: OpenAI GPT-4/3.5 with custom personalities
- **State Management**: Zustand with persistence
- **Deployment**: Railway with Docker containerization

### Key Features
- **Multi-persona AI chat** with personality switching
- **Real-time habit tracking** with streak calculations
- **Mood analytics** with trend visualization
- **Journal integration** with mood correlation
- **PWA capabilities** for mobile installation
- **Production monitoring** and error tracking

## 🔧 Configuration

### Environment Variables
```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration (At least one required)
OPENAI_API_KEY=your_openai_api_key         # For GPT models
ANTHROPIC_API_KEY=your_claude_api_key      # For Claude models (fallback)

# Optional: Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_DATADOG_API_KEY=your_datadog_key
```

## 🚢 Deployment

### Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on every push

### Docker
```bash
docker build -t personal-guide .
docker run -p 3000:3000 personal-guide
```

### Manual
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- Powered by [OpenAI](https://openai.com)
- Database by [Supabase](https://supabase.com)
- Deployed on [Railway](https://railway.app)

---

**Start your personal growth journey today!** 🌱