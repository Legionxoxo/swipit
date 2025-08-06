# BuzzHunt 🔍

Advanced social media content analysis and research platform for Instagram and YouTube creators.

## Overview

BuzzHunt enables deep content analysis and research of social media channels. Scrape videos, reels, and channel data to gain insights into content performance, trends, and creator analytics.

## Features

### 📊 **Content Analysis**
- Instagram reel scraping and metadata extraction
- YouTube channel and video analysis
- Content performance tracking
- Deep research capabilities with exportable reports

### 🎯 **Platform Support**
- **Instagram**: Profile analysis, reel scraping, metadata collection
- **YouTube**: Channel analytics, video data extraction, performance metrics

### 📈 **Analytics & Export**
- CSV and JSON export formats
- Statistical analysis and reporting
- Content trend identification
- Performance metrics calculation

### 🔧 **Technical Features**
- Real-time analysis tracking
- Job queue management
- SQLite database storage
- RESTful API architecture

## Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** database
- **Python** integration for scraping
- **Instaloader** for Instagram data
- **YouTube Data API v3**

### Frontend
- **React 19** with TypeScript
- **Vite** build system
- **TailwindCSS** for styling
- **Modern UI components**

## Installation

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
pip install -r requirements.txt
cp .env.example .env  # Configure your API keys
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Analysis
- `POST /api/analyze` - Start channel analysis
- `GET /api/analysis/:id` - Check analysis status
- `POST /api/instagram/analyze` - Instagram-specific analysis

### Export
- `GET /api/export/:id/:format` - Export analysis data (CSV/JSON)

### Health Check
- `GET /health` - Server status

## Configuration

Create `.env` file in backend directory:
```env
PORT=3001
YOUTUBE_API_KEY=your_youtube_api_key
DATABASE_PATH=../data/buzzhunt.db
```

## Usage

1. **Start Analysis**: Submit Instagram profile or YouTube channel URL
2. **Track Progress**: Monitor analysis status in real-time
3. **Review Results**: View detailed analytics and insights
4. **Export Data**: Download results in CSV or JSON format

## Project Structure

```
├── backend/           # Node.js API server
│   ├── functions/     # Analysis and processing logic
│   ├── routes/        # API route handlers
│   ├── database/      # Database models and connections
│   └── utils/         # Helper utilities
├── frontend/          # React application
│   ├── src/           # React components and services
│   └── dist/          # Production build
├── data/              # SQLite database storage
└── documentation/     # Project documentation
```

## Development

### Type Checking
```bash
# Backend
npm run check

# Frontend  
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

1. Follow existing code conventions
2. Run type checks before committing
3. Write clear, descriptive commit messages
4. Test functionality before submitting PRs

## License

ISC License

## Disclaimer

BuzzHunt is for research and analytics purposes only. Ensure compliance with platform terms of service and respect content creators' rights when using this tool.

---

**Built for deep social media research and content analysis** 🚀