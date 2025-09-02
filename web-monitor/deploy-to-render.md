# Quick Deploy to Render

## Option 1: Deploy via Render Dashboard (Easiest)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Sign in or create account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Select "Deploy from a Git repository"

3. **Connect GitHub (if not connected)**
   - Click "Connect GitHub"
   - Authorize Render
   - Select your repository

4. **Configure Service**
   - **Name**: `thinlever-monitor`
   - **Region**: Oregon (USA West) or closest to you
   - **Branch**: main
   - **Root Directory**: `web-monitor`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Environment Variables** (click "Advanced"):
   ```
   PORT=10000
   ARB_RPC_URL=https://arb1.arbitrum.io/rpc
   THINLEVER_ADDRESS=0x18D8B7045BbBC2163FF0270b6e4cF8F8Db9624f5
   TARGET_HF=1.25
   TOLERANCE=0.05
   REFRESH_INTERVAL=20
   ```

6. **Click "Create Web Service"**

7. **Your URL will be:**
   ```
   https://thinlever-monitor.onrender.com
   ```

## Option 2: Direct Deploy (Without GitHub)

Since you need to push to GitHub first, here's the quickest way:

1. **Initialize git (if not done):**
   ```bash
   git init
   git add .
   git commit -m "Add ThinLever web monitor"
   ```

2. **Create GitHub repo:**
   ```bash
   gh repo create thinlever-monitor --public --source=. --remote=origin --push
   ```
   
   Or manually:
   - Go to https://github.com/new
   - Name: `thinlever-monitor`
   - Create repository
   - Follow instructions to push existing code

3. **Deploy on Render:**
   - Follow Option 1 steps above

## Expected Service URL

Your monitor will be available at:
```
https://thinlever-monitor.onrender.com
```

Note: If the name is taken, Render will suggest alternatives like:
- `https://thinlever-monitor-abc.onrender.com`
- `https://thinlever-monitor-1.onrender.com`

## After Deployment

The service will:
1. Build automatically (install dependencies)
2. Start the web server
3. Be accessible worldwide
4. Auto-refresh position data every 20 seconds
5. Show real-time updates via WebSocket

## Free Tier Notes

- Render free tier may spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading to paid tier for always-on service