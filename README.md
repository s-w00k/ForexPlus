# 🚀 ForexPulse – Real-Time Forex Analytics Dashboard

A real-time Forex analytics dashboard built using JavaScript (ES5) and Chart.js.

This project transforms raw market data into actionable trading insights using trend analysis, session-based levels, and volatility metrics.

⚠️ Disclaimer

This tool is for educational and analytical purposes only.

It does NOT guarantee profitable trading. Forex trading involves risk.

--------------------------------------------------------------------------------------------------------------------------------------------------------

## 📊 Features

### 📈 Market Visualization
- Real-time price chart (line chart)
- EMA overlays (20, 50, 200)
- Clean dark-theme trading UI

### 📉 Trend Analysis
- EMA-based trend detection
- Bullish / bearish structure visualization

### ⏱ Session-Based Levels
- Asian Session High / Low
- London Session High / Low
- New York Session High / Low

### 📏 Volatility Metrics
- Daily Range (in pips)
- ADR (Average Daily Range – 14 days)

### 🤖 Trade Signal Engine
- Automated **BUY / WAIT** signals based on:
  - Trend alignment (EMA 20/50/200)
  - Price proximity to session lows
  - Bounce confirmation
  - Remaining daily range (ADR logic)
  - Active trading session (London / NY)

### 🎯 Clean UI for Fast Decision Making
- Color-coded signal system
- Minimal clutter
- Designed for quick execution

--------------------------------------------------------------------------------------------------------------------------------------------------------

## 🛠 Tech Stack

- JavaScript (ES5)
- Chart.js
- HTML5 / CSS3
- Twelve Data API (Forex data)

--------------------------------------------------------------------------------------------------------------------------------------------------------

## 📂 Project Structure
forex-pulse/
│
├── index.html
├── styles.css
├── app.js
└── README.md

--------------------------------------------------------------------------------------------------------------------------------------------------------

## 🔑 Setup

1. Get a free API key from:
   https://twelvedata.com

2. Open `app.js` and replace:

```javascript
var API_KEY = "YOUR_API_KEY";
