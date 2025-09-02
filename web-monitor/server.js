import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configuration
const CONFIG = {
  THINLEVER_ADDRESS: process.env.THINLEVER_ADDRESS || "0x18D8B7045BbBC2163FF0270b6e4cF8F8Db9624f5",
  TARGET_HF: parseFloat(process.env.TARGET_HF || "1.25"),
  TOLERANCE: parseFloat(process.env.TOLERANCE || "0.05"),
  REFRESH_INTERVAL: parseInt(process.env.REFRESH_INTERVAL || "20"),
  RPC_URL: process.env.ARB_RPC_URL || "https://arb1.arbitrum.io/rpc",
  PORT: process.env.PORT || 3000
};

// ThinLever ABI (only what we need)
const THINLEVER_ABI = [
  "function getAccountData() external view returns (uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrows, uint256 ltv, uint256 healthFactor)",
  "function owner() external view returns (address)"
];

// Setup provider and contract
const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
const thinLever = new ethers.Contract(CONFIG.THINLEVER_ADDRESS, THINLEVER_ABI, provider);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for config
app.get('/api/config', (req, res) => {
  res.json({
    thinLeverAddress: CONFIG.THINLEVER_ADDRESS,
    targetHF: CONFIG.TARGET_HF,
    tolerance: CONFIG.TOLERANCE,
    refreshInterval: CONFIG.REFRESH_INTERVAL
  });
});

// Fetch position data
async function getPositionData() {
  try {
    const [accountData, owner] = await Promise.all([
      thinLever.getAccountData(),
      thinLever.owner()
    ]);
    
    const collateral = Number(accountData[0]) / 1e8;
    const debt = Number(accountData[1]) / 1e8;
    const availableBorrows = Number(accountData[2]) / 1e8;
    const liquidationThreshold = Number(accountData[3]) / 100;
    const currentHF = Number(accountData[4]) / 1e18;
    
    // Calculate derived metrics
    const leverage = debt > 0 ? collateral / (collateral - debt) : 1;
    const netValue = collateral - debt;
    const utilizationRate = liquidationThreshold > 0 ? (debt / (collateral * liquidationThreshold / 100)) * 100 : 0;
    
    // Determine status
    const lowerBound = CONFIG.TARGET_HF - CONFIG.TOLERANCE;
    const upperBound = CONFIG.TARGET_HF + CONFIG.TOLERANCE;
    
    let action = 'IN_RANGE';
    if (currentHF < lowerBound) {
      action = 'LEVER_DOWN';
    } else if (currentHF > upperBound) {
      action = 'LEVER_UP';
    }
    
    let riskLevel = 'LOW';
    if (currentHF < 1.15) {
      riskLevel = 'HIGH';
    } else if (currentHF < 1.3) {
      riskLevel = 'MEDIUM';
    }
    
    return {
      timestamp: new Date().toISOString(),
      contract: CONFIG.THINLEVER_ADDRESS,
      owner: owner,
      healthFactor: {
        current: currentHF,
        target: CONFIG.TARGET_HF,
        tolerance: CONFIG.TOLERANCE,
        lowerBound: lowerBound,
        upperBound: upperBound
      },
      position: {
        collateral: collateral,
        debt: debt,
        netValue: netValue,
        availableBorrows: availableBorrows
      },
      leverage: {
        current: leverage,
        utilization: utilizationRate,
        liquidationThreshold: liquidationThreshold
      },
      status: {
        action: action,
        riskLevel: riskLevel,
        needsRebalance: action !== 'IN_RANGE',
        nearLiquidation: currentHF < 1.1
      }
    };
  } catch (error) {
    console.error('Error fetching position data:', error);
    return null;
  }
}

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial data
  getPositionData().then(data => {
    if (data) {
      socket.emit('positionUpdate', data);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Broadcast updates to all connected clients
setInterval(async () => {
  const data = await getPositionData();
  if (data) {
    io.emit('positionUpdate', data);
  }
}, CONFIG.REFRESH_INTERVAL * 1000);

server.listen(CONFIG.PORT, () => {
  console.log(`ThinLever Monitor running on http://localhost:${CONFIG.PORT}`);
  console.log(`Monitoring contract: ${CONFIG.THINLEVER_ADDRESS}`);
  console.log(`Target HF: ${CONFIG.TARGET_HF} ± ${CONFIG.TOLERANCE}`);
});