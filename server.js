/**
 * DHAKA CITY 3D - ZERO-DEPENDENCY LAN MULTIPLAYER & HTTP SERVER
 * Built using Node.js standard modules (http, fs, path, os, crypto).
 * Allows anyone on the same Wi-Fi / Local Network to connect and race together in 3D!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// Detect LAN IP Address
function getLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip internal and IPv6
      if (net.family === 'IPv4' && !net.internal) {
        // Exclude virtual bridges/WSL if real Wi-Fi/Ethernet exists
        const isVirtual = name.toLowerCase().includes('vethernet') ||
                          name.toLowerCase().includes('wsl') ||
                          name.toLowerCase().includes('virtual') ||
                          name.toLowerCase().includes('vmware');
        candidates.push({ ip: net.address, isVirtual });
      }
    }
  }

  // Prefer physical Wi-Fi/Ethernet
  const physical = candidates.find(c => !c.isVirtual);
  return physical ? physical.ip : (candidates[0] ? candidates[0].ip : '127.0.0.1');
}

const LAN_IP = getLanIp();

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// ==========================================
// HTTP SERVER (Static files & LAN Info API)
// ==========================================
const server = http.createServer((req, res) => {
  // LAN Info API
  if (req.url === '/api/lan-info') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      ip: LAN_IP,
      port: PORT,
      players: players.size,
      lanUrl: `http://${LAN_IP}:${PORT}`
    }));
    return;
  }

  // Static File Serving
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

// ==========================================
// ZERO-DEPENDENCY WEBSOCKET PROTOCOL ENGINE
// ==========================================
const players = new Map(); // socket -> playerInfo
let nextPlayerNum = 1;

server.on('upgrade', (req, socket, head) => {
  const upgrade = req.headers['upgrade'];
  if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  // SHA-1 handshake
  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n'
  ];

  socket.write(headers.join('\r\n'));

  // Assign Player ID & spawn offset
  const playerId = 'player_' + Math.random().toString(36).substring(2, 8);
  const playerNumber = nextPlayerNum++;
  const defaultName = `Dhakaiya Racer ${playerNumber}`;
  const spawnOffset = (playerNumber % 4) * 8 - 12;

  const playerInfo = {
    id: playerId,
    num: playerNumber,
    name: defaultName,
    socket: socket,
    x: -120 + spawnOffset,
    z: 20 + spawnOffset,
    angle: 0,
    speed: 0,
    carType: 'premio',
    gameMode: 'OPEN_WORLD',
    health: 100,
    nitro: 100
  };

  players.set(socket, playerInfo);

  // Send Welcome & assigned ID to this player
  sendWsMessage(socket, {
    type: 'WELCOME',
    myId: playerId,
    myName: defaultName,
    lanIp: LAN_IP,
    port: PORT,
    players: Array.from(players.values()).map(p => ({
      id: p.id,
      name: p.name,
      x: p.x,
      z: p.z,
      angle: p.angle,
      carType: p.carType,
      gameMode: p.gameMode,
      health: p.health
    }))
  });

  // Broadcast to other players that new player joined
  broadcastExcept(socket, {
    type: 'PLAYER_JOINED',
    player: {
      id: playerId,
      name: defaultName,
      x: playerInfo.x,
      z: playerInfo.z,
      angle: 0,
      carType: playerInfo.carType,
      gameMode: playerInfo.gameMode,
      health: 100
    }
  });

  console.log(`[LAN] ${defaultName} connected! Total racers: ${players.size}`);

  // Buffer for incoming WS frames
  let buffer = Buffer.alloc(0);

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const isFinal = (firstByte & 0x80) !== 0;
      const opcode = firstByte & 0x0f;

      // Close opcode
      if (opcode === 0x08) {
        socket.end();
        return;
      }

      // Ping opcode -> send pong
      if (opcode === 0x09) {
        socket.write(Buffer.from([0x8a, 0x00]));
        buffer = buffer.slice(2);
        continue;
      }

      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLen = secondByte & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (buffer.length < 4) return;
        payloadLen = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (buffer.length < 10) return;
        payloadLen = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let maskKey = null;
      if (isMasked) {
        if (buffer.length < offset + 4) return;
        maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + payloadLen) return;

      const payload = buffer.slice(offset, offset + payloadLen);
      buffer = buffer.slice(offset + payloadLen);

      // Unmask payload
      if (isMasked && maskKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }

      // Handle text message
      if (opcode === 0x01) {
        try {
          const msg = JSON.parse(payload.toString('utf8'));
          handlePlayerMessage(socket, msg);
        } catch (e) {
          // ignore malformed
        }
      }
    }
  });

  socket.on('close', () => {
    const p = players.get(socket);
    if (p) {
      players.delete(socket);
      console.log(`[LAN] ${p.name} disconnected. Remaining racers: ${players.size}`);
      broadcast({
        type: 'PLAYER_LEFT',
        id: p.id
      });
    }
  });

  socket.on('error', () => {
    socket.destroy();
  });
});

function handlePlayerMessage(senderSocket, msg) {
  const p = players.get(senderSocket);
  if (!p) return;

  if (msg.type === 'UPDATE') {
    // Update player state
    p.x = msg.x;
    p.z = msg.z;
    p.angle = msg.angle;
    p.speed = msg.speed;
    p.carType = msg.carType || p.carType;
    p.health = msg.health !== undefined ? msg.health : p.health;
    p.pitch = msg.pitch || 0;
    p.roll = msg.roll || 0;
    p.steer = msg.steer || 0;
    p.nitro = msg.nitro;
    p.deform = msg.deform;

    // Relay position to everyone else
    broadcastExcept(senderSocket, {
      type: 'PLAYER_UPDATE',
      id: p.id,
      name: p.name,
      x: p.x,
      z: p.z,
      angle: p.angle,
      speed: p.speed,
      carType: p.carType,
      health: p.health,
      pitch: p.pitch,
      roll: p.roll,
      steer: p.steer,
      nitro: p.nitro,
      deform: p.deform
    });
  } else if (msg.type === 'PVP_RAM') {
    // Player A collided into Player B with physical force!
    broadcast({
      type: 'PVP_RAM_EVENT',
      attackerId: p.id,
      attackerName: p.name,
      targetId: msg.targetId,
      damage: msg.damage,
      impulse: msg.impulse,
      nx: msg.nx,
      nz: msg.nz,
      x: msg.x,
      z: msg.z
    });
  } else if (msg.type === 'HONK') {
    broadcastExcept(senderSocket, {
      type: 'PLAYER_HONKED',
      id: p.id,
      x: p.x,
      z: p.z
    });
  } else if (msg.type === 'SET_NAME') {
    if (msg.name && typeof msg.name === 'string') {
      p.name = msg.name.trim().substring(0, 20);
      broadcast({
        type: 'PLAYER_RENAMED',
        id: p.id,
        name: p.name
      });
    }
  } else if (msg.type === 'SET_PROFILE') {
    if (msg.name && typeof msg.name === 'string') {
      p.name = msg.name.trim().substring(0, 20);
    }
    if (msg.carType) p.carType = msg.carType;
    if (msg.gameMode) p.gameMode = msg.gameMode;

    console.log(`[LAN] Profile set: ${p.name} | Car: ${p.carType} | Mode: ${p.gameMode}`);

    broadcast({
      type: 'PLAYER_PROFILE_UPDATED',
      id: p.id,
      name: p.name,
      carType: p.carType,
      gameMode: p.gameMode
    });

    if (p.gameMode === 'RACE_COMBAT') {
      checkAndTriggerRace();
    }
  } else if (msg.type === 'TRIGGER_RACE') {
    checkAndTriggerRace(true);
  } else if (msg.type === 'SHOOT_ROCKET') {
    broadcastExcept(senderSocket, {
      type: 'ROCKET_FIRED',
      shooterId: p.id,
      shooterName: p.name,
      originX: msg.originX,
      originY: msg.originY,
      originZ: msg.originZ,
      angle: msg.angle,
      speed: msg.speed,
      rocketId: msg.rocketId || ('rkt_' + Math.random().toString(36).substring(2, 7))
    });
  } else if (msg.type === 'DROP_MINE') {
    broadcastExcept(senderSocket, {
      type: 'MINE_DROPPED',
      dropperId: p.id,
      dropperName: p.name,
      x: msg.x,
      z: msg.z,
      mineId: msg.mineId || ('mine_' + Math.random().toString(36).substring(2, 7))
    });
  } else if (msg.type === 'ROCKET_HIT') {
    broadcast({
      type: 'ROCKET_HIT_EVENT',
      attackerId: p.id,
      attackerName: p.name,
      targetId: msg.targetId,
      damage: msg.damage || 25,
      impulse: msg.impulse || 35,
      nx: msg.nx || 0,
      nz: msg.nz || 1,
      hitX: msg.hitX,
      hitZ: msg.hitZ
    });
  } else if (msg.type === 'MINE_HIT') {
    broadcast({
      type: 'MINE_HIT_EVENT',
      mineId: msg.mineId,
      targetId: msg.targetId,
      damage: msg.damage || 20,
      x: msg.x,
      z: msg.z
    });
  } else if (msg.type === 'CHECKPOINT_PASS') {
    broadcast({
      type: 'RACER_CHECKPOINT',
      id: p.id,
      name: p.name,
      checkpointIndex: msg.checkpointIndex,
      lap: msg.lap
    });
  } else if (msg.type === 'RACE_FINISHED') {
    broadcast({
      type: 'RACE_WINNER_ANNOUNCED',
      winnerId: p.id,
      winnerName: p.name,
      finalTime: msg.finalTime
    });
  }
}

const GRID_SPOTS = [
  { x: -120, z: 22, angle: 0 }, // Pole Position (Right lane, Northbound)
  { x: -125, z: 16, angle: 0 }, // Position 2 (Left lane)
  { x: -115, z: 10, angle: 0 }, // Position 3
  { x: -122, z: 4, angle: 0 }   // Position 4
];

let lastRaceTriggerTime = 0;

function checkAndTriggerRace(force = false) {
  const raceRacers = Array.from(players.values()).filter(p => p.gameMode === 'RACE_COMBAT');
  const now = Date.now();

  // Need at least 2 racers (or force triggered) and cooldown 4s
  if ((raceRacers.length >= 2 || (force && raceRacers.length >= 1)) && (now - lastRaceTriggerTime > 4000)) {
    lastRaceTriggerTime = now;
    console.log(`[LAN RACE] Triggering head-to-head race with ${raceRacers.length} racers!`);

    const raceEvent = {
      type: 'RACE_COUNTDOWN_START',
      racers: raceRacers.map((rp, idx) => ({
        id: rp.id,
        name: rp.name,
        carType: rp.carType,
        gridIndex: idx,
        gridPos: GRID_SPOTS[idx % GRID_SPOTS.length]
      }))
    };

    // Send ONLY to racers in RACE_COMBAT mode so Open World players are undisturbed!
    for (const rp of raceRacers) {
      if (rp.socket && !rp.socket.destroyed) {
        sendWsMessage(rp.socket, raceEvent);
      }
    }
  }
}

// Encode and send WebSocket frame
function sendWsMessage(socket, data) {
  if (socket.destroyed) return;
  const jsonStr = JSON.stringify(data);
  const payload = Buffer.from(jsonStr, 'utf8');
  const len = payload.length;

  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len <= 0xffff) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }

  try {
    socket.write(Buffer.concat([header, payload]));
  } catch (err) {
    // ignore
  }
}

function broadcast(data) {
  for (const socket of players.keys()) {
    sendWsMessage(socket, data);
  }
}

function broadcastExcept(excludeSocket, data) {
  for (const socket of players.keys()) {
    if (socket !== excludeSocket) {
      sendWsMessage(socket, data);
    }
  }
}

// ==========================================
// START SERVER
// ==========================================
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=================================================================');
  console.log('   🏎️  DHAKA CITY 3D - LAN MULTIPLAYER SERVER RUNNING!  ');
  console.log('=================================================================');
  console.log(`  🎮 Host URL (This PC):    http://localhost:${PORT}`);
  console.log(`  📱 LAN / Wi-Fi URL:       http://${LAN_IP}:${PORT}`);
  console.log('-----------------------------------------------------------------');
  console.log('  👥 Anyone connected to your Wi-Fi can open the LAN URL');
  console.log('     on their phone, tablet, or PC to join your 3D race and');
  console.log('     ram into each other with real-time PvP damage!');
  console.log('=================================================================\n');
});
