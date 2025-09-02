# ThinLever Web Monitor

A beautiful web-based dashboard for monitoring ThinLever V5 positions in real-time.

## Features

- 🔄 Real-time position updates via WebSocket
- 📊 Visual health factor tracking with dynamic charts
- 💰 Position metrics (collateral, debt, net value)
- 🎚️ Leverage visualization
- 🚦 Risk status indicators
- 📱 Responsive design for all devices
- 🌐 Deploy to Render for public access

## Local Development

### 1. Install Dependencies

```bash
cd web-monitor
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

### 3. Run Locally

```bash
npm start
```

Visit http://localhost:3000 to view the monitor.

## Deploy to Render

### Option 1: Deploy via GitHub

1. **Push to GitHub:**
   ```bash
   git add web-monitor/
   git commit -m "Add web monitor"
   git push origin main
   ```

2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select the repository

3. **Configure Service:**
   - **Name:** thinlever-monitor
   - **Root Directory:** web-monitor
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. **Add Environment Variables:**
   ```
   ARB_RPC_URL=https://arb1.arbitrum.io/rpc
   THINLEVER_ADDRESS=0x18D8B7045BbBC2163FF0270b6e4cF8F8Db9624f5
   TARGET_HF=1.25
   TOLERANCE=0.05
   REFRESH_INTERVAL=20
   PORT=10000
   ```

5. **Deploy:** Click "Create Web Service"

### Option 2: Deploy via Render Blueprint

1. Update `render.yaml` with your GitHub repo URL
2. Push to GitHub
3. Go to Render Dashboard
4. Click "New +" → "Blueprint"
5. Connect your repo
6. Render will automatically use `render.yaml` configuration

### Option 3: Manual Deploy (without GitHub)

1. **Install Render CLI:**
   ```bash
   npm install -g @render/cli
   ```

2. **Login to Render:**
   ```bash
   render login
   ```

3. **Deploy:**
   ```bash
   cd web-monitor
   render deploy
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ARB_RPC_URL` | Arbitrum RPC endpoint | https://arb1.arbitrum.io/rpc |
| `THINLEVER_ADDRESS` | ThinLever contract address | 0x18D8B7045BbBC2163FF0270b6e4cF8F8Db9624f5 |
| `TARGET_HF` | Target health factor | 1.25 |
| `TOLERANCE` | Health factor tolerance | 0.05 |
| `REFRESH_INTERVAL` | Update interval (seconds) | 20 |
| `PORT` | Server port | 3000 (10000 on Render) |

## Customization

### Modify Styling

Edit `public/styles.css` to customize:
- Colors and theme
- Layout and spacing
- Animations and effects

### Update Metrics

Edit `server.js` to add new metrics:
- Add calculations in `getPositionData()`
- Emit new data via WebSocket

### Change Update Frequency

Modify `REFRESH_INTERVAL` environment variable (in seconds).

## Architecture

```
web-monitor/
├── server.js           # Express + Socket.io server
├── public/
│   ├── index.html     # Main HTML structure
│   ├── styles.css     # Styling
│   └── app.js         # Client-side JavaScript
├── package.json       # Dependencies
├── render.yaml        # Render deployment config
└── .env.example       # Environment template
```

## Features in Detail

### Health Factor Visualization
- Dynamic bar showing current HF position
- Target zone highlighted
- Color-coded status (green/yellow/red)

### Position Metrics
- Total collateral value
- Outstanding debt
- Net position value
- Available borrowing capacity

### Leverage Display
- Current leverage ratio
- Visual progress bar
- Utilization percentage

### Status Indicators
- Risk level (Low/Medium/High)
- Balance status
- Liquidation warnings

### Real-time Updates
- WebSocket connection for instant updates
- Auto-reconnect on disconnect
- Visual connection status

## Troubleshooting

### Connection Issues
- Check RPC URL is accessible
- Verify contract address is correct
- Ensure WebSocket port is not blocked

### No Data Showing
- Verify ThinLever contract has a position
- Check browser console for errors
- Ensure environment variables are set

### Render Deployment
- Check build logs for errors
- Verify all environment variables are set
- Ensure PORT is set to 10000

## Live Demo

Once deployed to Render, your monitor will be available at:
```
https://thinlever-monitor.onrender.com
```

Share this URL to allow anyone to monitor your ThinLever position!