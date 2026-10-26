/**
 * DHAKA STREET RUSH - CORE ENGINE
 * Pseudo-3D Outrun Curved Road Engine with Dhaka Traffic & Authentic Mechanics
 */

(function () {
  'use strict';

  // Constants & Config
  const FPS = 60;
  const STEP = 1 / FPS;
  const WIDTH = 1024;
  const HEIGHT = 768;
  const ROAD_WIDTH = 2000;
  const SEGMENT_LENGTH = 200;
  const RUMBLE_LENGTH = 3;
  const LANES = 3;
  const DRAW_DISTANCE = 300;
  const CAMERA_HEIGHT = 1000;
  const CAMERA_DEPTH = 0.8;

  // Car definitions
  const CARS = [
    {
      id: 'premio',
      name: 'TOYOTA PREMIO 1.5',
      nickname: '"The Dhaka Corporate Rocket"',
      sprite: 'player_premio',
      maxSpeed: 210,
      accel: 55,
      handling: 2.8,
      durability: 100,
      nitroPower: 1.45,
      previewScale: 1.2
    },
    {
      id: 'taxi',
      name: 'YELLOW DHAKA CAB',
      nickname: '"Meter Chara Jabo Na"',
      sprite: 'player_taxi',
      maxSpeed: 195,
      accel: 60,
      handling: 3.3,
      durability: 85,
      nitroPower: 1.4,
      previewScale: 1.2
    },
    {
      id: 'suv',
      name: 'VIP BLACK SUV (PRADO)',
      nickname: '"Wrong Side King with Siren"',
      sprite: 'player_suv',
      maxSpeed: 200,
      accel: 48,
      handling: 2.2,
      durability: 160,
      nitroPower: 1.35,
      previewScale: 1.15
    },
    {
      id: 'cng',
      name: 'MODIFIED TURBO CNG',
      nickname: '"The 3-Wheeled Green Demon"',
      sprite: 'player_cng',
      maxSpeed: 230,
      accel: 70,
      handling: 3.8,
      durability: 60,
      nitroPower: 1.6,
      previewScale: 1.35
    }
  ];

  // Zones in Dhaka
  const ZONES = [
    { name: 'HATIRJHEEL', color: '#ff7700', sky1: '#1e1b4b', sky2: '#f97316', metro: true },
    { name: 'FARMGATE - MIRPUR', color: '#00f0ff', sky1: '#090a15', sky2: '#2e1065', metro: true },
    { name: 'AIRPORT ROAD', color: '#00e676', sky1: '#022c22', sky2: '#064e3b', metro: false }
  ];

  // Bengali Quips for In-Game Toast
  const QUIPS = [
    'মামা ডানে কাটেন! (Mama, cut right!)',
    'রিকশাওয়ালা মামা সাইড দিন! (Uncle rickshaw, move aside!)',
    'CNG মামা নো সিগন্যালে ঘুরলো! (CNG turning without signal!)',
    'শিকড় পরিবহনের সাথে ওভারটেক! (Overtook Shikhor Bus!)',
    'মেট্রোরেলের নিচে স্পীড রান! (Speed run under Metro Rail!)',
    'জ্যামের আগেই ছুটো! (Beat the Dhaka traffic jam!)',
    'হর্ন বাজালেন, পথ পরিষ্কার! (Honked loud & cleared the lane!)',
    'রাস্তা ফাঁকা পাইলে বাঙালি পাইলট! (Dhaka drivers when road is clear!)'
  ];

  // Helper Math
  function easeInOut(a, b, percent) {
    return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
  }

  function project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;
    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
    p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
    p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
  }

  // Main Game Class
  class DhakaGame {
    constructor() {
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');

      this.selectedCarIndex = 0;
      this.currentZoneIndex = 0;

      // Track Segments
      this.segments = [];
      this.trackLength = 0;

      // Player State
      this.position = 0;
      this.playerX = 0; // -1 (left shoulder) to 1 (right shoulder)
      this.speed = 0;
      this.nitro = 100;
      this.nitroActive = false;
      this.health = 100;
      this.maxHealth = 100;
      this.score = 0;
      this.distance = 0;
      this.honkCount = 0;
      this.topSpeedRecord = 0;

      // Key Inputs
      this.keys = {
        left: false,
        right: false,
        faster: false,
        slower: false,
        horn: false,
        nitro: false
      };

      // Metro overhead train animation
      this.metroTrain = {
        active: false,
        x: -600,
        y: 80,
        speed: 18
      };

      // Particle system (nitro flames, smoke, sparks)
      this.particles = [];

      this.gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
      this.lastFrameTime = performance.now();

      this.setupDOM();
      this.setupControls();
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      Sprites.init();
      this.buildRoad(); // Ensure road is fully constructed before first frame
      this.renderCarPreview();
      this.loadHighScore();

      // Start main game loop
      requestAnimationFrame((t) => this.loop(t));
    }

    setupDOM() {
      // Screen overlays
      this.hud = document.getElementById('hud');
      this.startScreen = document.getElementById('start-screen');
      this.gameOverScreen = document.getElementById('game-over-screen');

      // HUD elements
      this.scoreVal = document.getElementById('score-val');
      this.locationVal = document.getElementById('location-val');
      this.distanceVal = document.getElementById('distance-val');
      this.speedVal = document.getElementById('speed-val');
      this.gearVal = document.getElementById('gear-val');
      this.nitroPercent = document.getElementById('nitro-percent');
      this.nitroBarFill = document.getElementById('nitro-bar-fill');
      this.healthVal = document.getElementById('health-val');
      this.healthBarFill = document.getElementById('health-bar-fill');
      this.quipBanner = document.getElementById('quip-banner');

      // Carousel elements
      this.carName = document.getElementById('car-name');
      this.carNickname = document.getElementById('car-nickname');
      this.statSpeed = document.getElementById('stat-speed');
      this.statHandling = document.getElementById('stat-handling');
      this.statArmor = document.getElementById('stat-armor');
      this.previewCanvas = document.getElementById('vehicle-preview');
      this.previewCtx = this.previewCanvas.getContext('2d');

      // Buttons
      document.getElementById('prev-car').onclick = () => this.changeCar(-1);
      document.getElementById('next-car').onclick = () => this.changeCar(1);
      document.getElementById('btn-start').onclick = () => this.startGame();
      document.getElementById('btn-restart').onclick = () => this.startGame();
      document.getElementById('btn-change-car').onclick = () => this.showStartScreen();

      // Audio toggle
      const musicToggle = document.getElementById('music-toggle');
      musicToggle.onchange = (e) => {
        window.soundEngine.toggle(e.target.checked);
      };
    }

    setupControls() {
      // Keyboard
      window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.faster = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.slower = true;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
        if (e.code === 'Space' || e.code === 'KeyH') {
          if (!this.keys.horn && this.gameState === 'PLAYING') {
            this.triggerHorn();
          }
          this.keys.horn = true;
          e.preventDefault();
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') {
          this.keys.nitro = true;
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.faster = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.slower = false;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
        if (e.code === 'Space' || e.code === 'KeyH') this.keys.horn = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') {
          this.keys.nitro = false;
        }
      });

      // Touch Buttons
      const bindTouch = (id, keyName, onTrigger) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const start = (e) => {
          e.preventDefault();
          this.keys[keyName] = true;
          if (onTrigger) onTrigger();
        };
        const end = (e) => {
          e.preventDefault();
          this.keys[keyName] = false;
        };
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end);
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
      };

      bindTouch('btn-left', 'left');
      bindTouch('btn-right', 'right');
      bindTouch('btn-gas', 'faster');
      bindTouch('btn-brake', 'slower');
      bindTouch('btn-nitro', 'nitro');
      bindTouch('btn-horn', 'horn', () => this.triggerHorn());
    }

    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    changeCar(delta) {
      this.selectedCarIndex = (this.selectedCarIndex + delta + CARS.length) % CARS.length;
      this.renderCarPreview();
      window.soundEngine.init();
      window.soundEngine.playRickshawBell();
    }

    renderCarPreview() {
      const car = CARS[this.selectedCarIndex];
      this.carName.textContent = car.name;
      this.carNickname.textContent = car.nickname;
      this.statSpeed.style.width = (car.maxSpeed / 240 * 100) + '%';
      this.statHandling.style.width = (car.handling / 4.0 * 100) + '%';
      this.statArmor.style.width = (car.durability / 160 * 100) + '%';

      // Draw onto preview canvas
      const pw = this.previewCanvas.width;
      const ph = this.previewCanvas.height;
      this.previewCtx.clearRect(0, 0, pw, ph);

      const sprite = Sprites.cache[car.sprite];
      if (sprite) {
        const scale = car.previewScale || 1;
        const sw = sprite.width * scale;
        const sh = sprite.height * scale;
        this.previewCtx.drawImage(sprite, (pw - sw) / 2, (ph - sh) / 2 + 10, sw, sh);
      }
    }

    showStartScreen() {
      this.gameState = 'START';
      this.startScreen.classList.remove('hidden');
      this.gameOverScreen.classList.add('hidden');
      this.hud.classList.add('hidden');
      window.soundEngine.stopEngine();
      window.soundEngine.stopMusic();
    }

    startGame() {
      window.soundEngine.init();
      window.soundEngine.resume();
      window.soundEngine.startMusic();

      const car = CARS[this.selectedCarIndex];
      this.maxHealth = car.durability;
      this.health = this.maxHealth;
      this.nitro = 100;
      this.speed = 0;
      this.score = 0;
      this.distance = 0;
      this.honkCount = 0;
      this.playerX = 0;
      this.position = 0;
      this.topSpeedRecord = 0;

      this.buildRoad();

      this.gameState = 'PLAYING';
      this.startScreen.classList.add('hidden');
      this.gameOverScreen.classList.add('hidden');
      this.hud.classList.remove('hidden');

      this.showQuip('যাত্রা শুরু! ঢাকাইয়া গতিতে ছুটুন! 🔥');
    }

    // ==========================================
    // ROAD GENERATION (OUTRUN TRACK)
    // ==========================================
    buildRoad() {
      this.segments = [];

      const addSegment = (curve, y) => {
        const n = this.segments.length;
        this.segments.push({
          index: n,
          p1: { world: { y: this.lastY(), z: n * SEGMENT_LENGTH }, camera: {}, screen: {} },
          p2: { world: { y: y, z: (n + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
          curve: curve,
          cars: [],
          sprites: [],
          color: Math.floor(n / RUMBLE_LENGTH) % 2 ? {
            road: '#2b2d42',
            grass: '#15803d',
            rumble: '#e63946',
            lane: '#ffffff'
          } : {
            road: '#1e1f2f',
            grass: '#166534',
            rumble: '#ffffff',
            lane: 'rgba(255,255,255,0)'
          }
        });
      };

      const addRoad = (enter, hold, leave, curve, y) => {
        const startY = this.lastY();
        const endY = startY + (y * SEGMENT_LENGTH);
        const total = enter + hold + leave;
        for (let i = 0; i < enter; i++) {
          addSegment(easeInOut(0, curve, i / enter), easeInOut(startY, endY, i / total));
        }
        for (let i = 0; i < hold; i++) {
          addSegment(curve, easeInOut(startY, endY, (enter + i) / total));
        }
        for (let i = 0; i < leave; i++) {
          addSegment(easeInOut(curve, 0, i / leave), easeInOut(startY, endY, (enter + hold + i) / total));
        }
      };

      // Construct a vibrant Dhaka course (curves, flyovers, stretches)
      for (let i = 0; i < 4; i++) {
        addRoad(50, 50, 50, 0, 0); // Straight
        addRoad(60, 60, 60, 2, 20); // Hatirjheel bend & climb
        addRoad(50, 50, 50, -2, -20); // Turn down
        addRoad(80, 80, 80, 3, 0); // Sharp Dhaka flyover curve
        addRoad(60, 60, 60, -3, 15);
        addRoad(70, 70, 70, 0, -15);
      }

      this.trackLength = this.segments.length * SEGMENT_LENGTH;

      // Populate roadside props (Metro pillars, Tea stalls, Signboards)
      this.populateRoadsideProps();

      // Populate Traffic Vehicles
      this.populateTraffic();
    }

    lastY() {
      return (this.segments.length === 0) ? 0 : this.segments[this.segments.length - 1].p2.world.y;
    }

    populateRoadsideProps() {
      const signs = ['sign_hatirjheel', 'sign_farmgate', 'sign_airport'];

      for (let n = 20; n < this.segments.length; n += 6) {
        // Metro Rail Concrete Pillars along the center/side
        if (n % 12 === 0) {
          this.segments[n].sprites.push({
            source: Sprites.cache['prop_metro_pillar'],
            offset: -1.75
          });
          this.segments[n].sprites.push({
            source: Sprites.cache['prop_metro_pillar'],
            offset: 1.75
          });
        }

        // Tea Stalls (টং এর দোকান)
        if (n % 45 === 0) {
          this.segments[n].sprites.push({
            source: Sprites.cache['prop_cha_dokan'],
            offset: 1.6
          });
        }

        // Green Coconut Carts
        if (n % 65 === 0) {
          this.segments[n].sprites.push({
            source: Sprites.cache['prop_dab_cart'],
            offset: -1.55
          });
        }

        // Roadside palm/banyan trees
        if (n % 10 === 0) {
          this.segments[n].sprites.push({
            source: Sprites.cache['prop_tree'],
            offset: (n % 20 === 0 ? 1.9 : -1.9)
          });
        }

        // Highway Overhead Signs
        if (n % 120 === 0) {
          const sName = signs[Math.floor(Math.random() * signs.length)];
          this.segments[n].sprites.push({
            source: Sprites.cache[sName],
            offset: 1.45
          });
        }

        // Collectible Chai Pickups on the road!
        if (n % 50 === 25) {
          this.segments[n].sprites.push({
            source: Sprites.cache['pickup_chai'],
            offset: (Math.random() * 1.4 - 0.7),
            isPickup: true
          });
        }
      }
    }

    populateTraffic() {
      const trafficTypes = [
        { sprite: 'traffic_rickshaw', speed: 20, width: 90, name: 'Rickshaw' },
        { sprite: 'traffic_cng', speed: 55, width: 100, name: 'CNG' },
        { sprite: 'traffic_bus_shikhor', speed: 75, width: 140, name: 'Shikhor Bus' },
        { sprite: 'traffic_bus_balaka', speed: 80, width: 140, name: 'Balaka Bus' },
        { sprite: 'traffic_bus_bikolpo', speed: 70, width: 140, name: 'Bikolpo Bus' },
        { sprite: 'traffic_police', speed: 100, width: 120, name: 'Police VIP' }
      ];

      // Spawn traffic vehicles along the track
      for (let n = 40; n < this.segments.length; n += 18) {
        const type = trafficTypes[Math.floor(Math.random() * trafficTypes.length)];
        const laneOffset = [-0.65, 0, 0.65][Math.floor(Math.random() * 3)];

        this.segments[n].cars.push({
          offset: laneOffset,
          z: n * SEGMENT_LENGTH,
          sprite: Sprites.cache[type.sprite],
          speed: type.speed + (Math.random() * 15 - 7),
          width: type.width,
          type: type.name,
          honked: false
        });
      }
    }

    findSegment(z) {
      return this.segments[Math.floor(z / SEGMENT_LENGTH) % this.segments.length];
    }

    // ==========================================
    // HORN MECHANIC (THE SIGNATURE DHAKA FEATURE)
    // ==========================================
    triggerHorn() {
      window.soundEngine.playPlayerHorn();
      this.honkCount++;

      // Check for cars ahead within honking distance
      const playerSegment = this.findSegment(this.position);
      let scurryCount = 0;

      for (let n = 1; n <= 35; n++) {
        const seg = this.segments[(playerSegment.index + n) % this.segments.length];
        for (let i = 0; i < seg.cars.length; i++) {
          const car = seg.cars[i];
          if (!car.honked) {
            car.honked = true;
            // Rickshaws and CNGs scurry to the sides when honked!
            if (car.type === 'Rickshaw') {
              car.offset = car.offset > 0 ? 0.95 : -0.95;
              window.soundEngine.playRickshawBell();
              scurryCount++;
            } else if (car.type === 'CNG') {
              car.offset = car.offset > 0 ? 0.85 : -0.85;
              window.soundEngine.playCngSputter();
              scurryCount++;
            } else if (car.type.includes('Bus')) {
              window.soundEngine.playBusHorn();
            }
          }
        }
      }

      if (scurryCount > 0) {
        this.score += scurryCount * 75;
        this.showQuip(`📢 হর্ন শুনে ${scurryCount}টি গাড়ি সাইড দিলো! (+${scurryCount * 75} pts)`);
      }
    }

    showQuip(text) {
      this.quipBanner.textContent = text;
      this.quipBanner.classList.add('show');
      if (this.quipTimeout) clearTimeout(this.quipTimeout);
      this.quipTimeout = setTimeout(() => {
        this.quipBanner.classList.remove('show');
      }, 2600);
    }

    // ==========================================
    // UPDATE CYCLE
    // ==========================================
    update(dt) {
      if (this.gameState !== 'PLAYING') return;

      const car = CARS[this.selectedCarIndex];
      const maxSpeed = car.maxSpeed;
      const accel = car.accel;
      const handling = car.handling;

      // Nitro management
      if (this.keys.nitro && this.nitro > 0 && this.speed > 30) {
        this.nitroActive = true;
        this.nitro = Math.max(0, this.nitro - dt * 28);
        window.soundEngine.playNitroSound();

        // Spawn nitro flame particles
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            x: (Math.random() * 20 - 10),
            y: 20 + Math.random() * 10,
            vx: (Math.random() * 4 - 2),
            vy: (Math.random() * 4 + 4),
            life: 0.35,
            maxLife: 0.35,
            color: ['#00f0ff', '#ff0055', '#ff9900'][Math.floor(Math.random() * 3)]
          });
        }
      } else {
        this.nitroActive = false;
        // Slowly recharge nitro
        this.nitro = Math.min(100, this.nitro + dt * 6);
      }

      const effectiveMaxSpeed = maxSpeed * (this.nitroActive ? car.nitroPower : 1.0);

      // Acceleration / Braking
      if (this.keys.faster) {
        this.speed = Math.min(effectiveMaxSpeed, this.speed + accel * dt * (this.nitroActive ? 1.8 : 1.0));
      } else if (this.keys.slower) {
        this.speed = Math.max(0, this.speed - accel * 2.2 * dt);
      } else {
        // Natural engine brake / coasting
        this.speed = Math.max(0, this.speed - accel * 0.45 * dt);
      }

      // Track top speed record
      if (this.speed > this.topSpeedRecord) {
        this.topSpeedRecord = Math.round(this.speed);
      }

      // Steering with centrifugal force on curves
      const currentSegment = this.findSegment(this.position);
      const playerSegment = currentSegment;
      const speedRatio = this.speed / maxSpeed;
      const centrifugal = currentSegment.curve * speedRatio * speedRatio * 1.5;

      if (this.keys.left) {
        this.playerX -= handling * dt * (0.6 + speedRatio * 0.7);
      }
      if (this.keys.right) {
        this.playerX += handling * dt * (0.6 + speedRatio * 0.7);
      }

      this.playerX -= centrifugal * dt;

      // Off-road penalty
      if ((this.playerX < -1 || this.playerX > 1) && this.speed > 50) {
        this.speed = Math.max(50, this.speed - accel * 1.8 * dt);
      }

      // Clamp player position
      this.playerX = Math.max(-2.0, Math.min(2.0, this.playerX));

      // Advance player position along the track
      this.position = (this.position + this.speed * 12 * dt) % this.trackLength;
      this.distance += (this.speed * dt) / 3600; // in km

      // Update Zone based on distance
      const zIdx = Math.floor(this.distance / 3) % ZONES.length;
      if (zIdx !== this.currentZoneIndex) {
        this.currentZoneIndex = zIdx;
        this.showQuip(`Entering ${ZONES[this.currentZoneIndex].name}! 🚗`);
      }

      // Update engine audio
      window.soundEngine.updateEngine(speedRatio, this.keys.faster, this.nitroActive);

      // Score accumulation based on high speed
      if (this.speed > 60) {
        this.score += Math.round((this.speed / 10) * dt * 25);
      }

      // Update Overhead Metro Train
      this.updateMetro(dt);

      // Update Traffic Cars AI & Collision Check
      this.updateTraffic(dt, playerSegment);

      // Check Collectible Chai Pickups
      this.checkPickups(playerSegment);

      // Update particles
      this.updateParticles(dt);

      // Random Dhaka traffic quips trigger
      if (Math.random() < 0.003 && !this.quipBanner.classList.contains('show')) {
        const randQuip = QUIPS[Math.floor(Math.random() * QUIPS.length)];
        this.showQuip(randQuip);
      }

      // Check Health & Game Over
      if (this.health <= 0) {
        this.triggerGameOver('Vehicle Completely Totaled!');
      }

      // Update HUD
      this.updateHUD();
    }

    updateMetro(dt) {
      if (!this.metroTrain.active) {
        // Occasionally launch metro train overhead
        if (Math.random() < 0.005) {
          this.metroTrain.active = true;
          this.metroTrain.x = -600;
        }
      } else {
        this.metroTrain.x += this.metroTrain.speed * 60 * dt;
        if (this.metroTrain.x > window.innerWidth + 200) {
          this.metroTrain.active = false;
        }
      }
    }

    updateTraffic(dt, playerSegment) {
      for (let n = 0; n < this.segments.length; n++) {
        const segment = this.segments[n];
        for (let i = 0; i < segment.cars.length; i++) {
          const car = segment.cars[i];

          // Advance traffic car along z
          car.z = (car.z + car.speed * 8 * dt) % this.trackLength;

          // Check if car moved to next segment
          const newSegment = this.findSegment(car.z);
          if (newSegment !== segment) {
            segment.cars.splice(i, 1);
            newSegment.cars.push(car);
            i--;
          }
        }
      }

      // Collision Detection with Player
      // Check segments immediately around the player
      const checkRange = 3;
      for (let offset = 0; offset <= checkRange; offset++) {
        const seg = this.segments[(playerSegment.index + offset) % this.segments.length];
        for (let i = 0; i < seg.cars.length; i++) {
          const car = seg.cars[i];
          const distZ = Math.abs(car.z - this.position);

          if (distZ < 150) {
            const distX = Math.abs(this.playerX - car.offset);
            // Overlap check
            if (distX < 0.45) {
              this.handleCollision(car);
            }
          }
        }
      }
    }

    handleCollision(car) {
      window.soundEngine.playCrash();

      // Damage calculation
      let damage = 25;
      if (car.type.includes('Bus')) {
        damage = 45;
        this.showQuip('🚨 বাসের ধাক্কা! ওস্তাদ সাইড দিন!');
      } else if (car.type === 'Rickshaw') {
        damage = 15;
        this.showQuip('⚠️ রিকশায় ঘষা লাগলো!');
      } else {
        this.showQuip('💥 সংঘর্ষ! সাবধানে ড্রাইভ করুন!');
      }

      this.health = Math.max(0, this.health - damage);
      this.speed = Math.max(20, this.speed * 0.4); // speed drop

      // Spawn collision spark particles
      for (let p = 0; p < 14; p++) {
        this.particles.push({
          x: (Math.random() * 40 - 20),
          y: 10 + Math.random() * 15,
          vx: (Math.random() * 14 - 7),
          vy: (Math.random() * 12 - 6),
          life: 0.4,
          maxLife: 0.4,
          color: ['#ffcc00', '#ff3344', '#ffffff'][Math.floor(Math.random() * 3)]
        });
      }

      // Push opponent car away
      car.offset += (this.playerX < car.offset ? 0.3 : -0.3);
    }

    checkPickups(playerSegment) {
      for (let offset = 0; offset <= 2; offset++) {
        const seg = this.segments[(playerSegment.index + offset) % this.segments.length];
        for (let i = 0; i < seg.sprites.length; i++) {
          const prop = seg.sprites[i];
          if (prop.isPickup && !prop.collected) {
            const distX = Math.abs(this.playerX - prop.offset);
            if (distX < 0.4) {
              prop.collected = true;
              window.soundEngine.playChaiPickup();
              this.score += 250;
              this.nitro = Math.min(100, this.nitro + 35);
              this.health = Math.min(this.maxHealth, this.health + 15);
              this.showQuip('☕ ধোঁয়া ওঠা গরম দুধ চা! (+250 pts, Health & Nitro Boost!)');
            }
          }
        }
      }
    }

    updateParticles(dt) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx;
        p.y += p.vy;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          i--;
        }
      }
    }

    updateHUD() {
      this.scoreVal.textContent = this.score.toLocaleString();
      this.locationVal.textContent = ZONES[this.currentZoneIndex].name;
      this.distanceVal.textContent = this.distance.toFixed(1) + ' km';

      const kmh = Math.round(this.speed);
      this.speedVal.textContent = kmh;

      // Realistic gear calculation
      let gear = 1;
      if (kmh > 160) gear = 5;
      else if (kmh > 120) gear = 4;
      else if (kmh > 80) gear = 3;
      else if (kmh > 40) gear = 2;
      this.gearVal.textContent = gear;

      // Nitro bar
      this.nitroPercent.textContent = Math.round(this.nitro) + '%';
      this.nitroBarFill.style.width = this.nitro + '%';

      // Health bar
      const healthPct = Math.max(0, Math.round((this.health / this.maxHealth) * 100));
      this.healthVal.textContent = healthPct + '%';
      this.healthBarFill.style.width = healthPct + '%';
      if (healthPct < 30) {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #ff3344, #ff9900)';
      }
    }

    triggerGameOver(reason) {
      this.gameState = 'GAMEOVER';
      window.soundEngine.stopEngine();
      window.soundEngine.stopMusic();

      document.getElementById('crash-reason').textContent = reason;
      document.getElementById('final-score').textContent = this.score.toLocaleString();
      document.getElementById('final-distance').textContent = this.distance.toFixed(1) + ' km';
      document.getElementById('final-speed').textContent = this.topSpeedRecord + ' km/h';
      document.getElementById('final-honks').textContent = this.honkCount;

      const isHigh = this.saveHighScore(this.score);
      const hsTag = document.getElementById('high-score-tag');
      hsTag.textContent = isHigh ? `🏆 NEW HIGH SCORE: ${this.score.toLocaleString()}!` : `HIGH SCORE: ${this.getHighScore().toLocaleString()}`;

      this.hud.classList.add('hidden');
      this.gameOverScreen.classList.remove('hidden');
    }

    saveHighScore(score) {
      const current = this.getHighScore();
      if (score > current) {
        localStorage.setItem('dhaka_racer_highscore', score);
        return true;
      }
      return false;
    }

    getHighScore() {
      return parseInt(localStorage.getItem('dhaka_racer_highscore') || '0', 10);
    }

    loadHighScore() {
      const hs = this.getHighScore();
      if (hs > 0) {
        document.getElementById('high-score-tag').textContent = `HIGH SCORE: ${hs.toLocaleString()}`;
      }
    }

    // ==========================================
    // RENDER CYCLE (OUTRUN 3D ROAD PROJECTION)
    // ==========================================
    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Sky & Dhaka Skyline Background
      this.renderSky(ctx, w, h);

      // Base ground horizon
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, h * 0.48, w, h * 0.52);

      // 2. Metro Rail Train if active
      if (this.metroTrain.active) {
        const mSprite = Sprites.cache['metro_train'];
        if (mSprite) {
          ctx.drawImage(mSprite, this.metroTrain.x, this.metroTrain.y, 450, 60);
        }
      }

      // 3. Render Curved Pseudo-3D Road Segments
      const baseSegment = this.findSegment(this.position);
      const basePercent = (this.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
      const playerSegment = this.findSegment(this.position + (CAMERA_HEIGHT * CAMERA_DEPTH));
      const playerPercent = ((this.position + (CAMERA_HEIGHT * CAMERA_DEPTH)) % SEGMENT_LENGTH) / SEGMENT_LENGTH;
      const playerY = easeInOut(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);

      let maxy = h;
      let x = 0;
      let dx = -(baseSegment.curve * basePercent);

      // Calculate camera coordinates
      for (let n = 0; n < DRAW_DISTANCE; n++) {
        const segment = this.segments[(baseSegment.index + n) % this.segments.length];
        segment.looped = segment.index < baseSegment.index;
        segment.clip = maxy;

        const cameraZ = this.position - (segment.looped ? this.trackLength : 0);
        project(segment.p1, (this.playerX * ROAD_WIDTH) - x, playerY + CAMERA_HEIGHT, cameraZ, CAMERA_DEPTH, w, h, ROAD_WIDTH);
        project(segment.p2, (this.playerX * ROAD_WIDTH) - x - dx, playerY + CAMERA_HEIGHT, cameraZ, CAMERA_DEPTH, w, h, ROAD_WIDTH);

        x = x + dx;
        dx = dx + segment.curve;

        if ((segment.p1.camera.z <= CAMERA_DEPTH) || (segment.p2.screen.y >= maxy)) {
          continue;
        }

        // Render Grass, Road & Rumble
        this.renderSegment(ctx, w, LANES,
          segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
          segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
          segment.color
        );

        maxy = segment.p2.screen.y;
      }

      // 4. Render Sprites and Traffic from back to front
      for (let n = DRAW_DISTANCE - 1; n > 0; n--) {
        const segment = this.segments[(baseSegment.index + n) % this.segments.length];

        // Draw Roadside Props
        for (let i = 0; i < segment.sprites.length; i++) {
          const prop = segment.sprites[i];
          if (prop.collected) continue;
          const spriteScale = segment.p1.screen.scale;
          const spriteX = segment.p1.screen.x + (spriteScale * prop.offset * ROAD_WIDTH * w / 2);
          const spriteY = segment.p1.screen.y;
          this.drawSprite(ctx, w, h, prop.source, spriteScale, spriteX, spriteY, (prop.offset < 0 ? -1 : 0), -1, segment.clip);
        }

        // Draw Traffic Cars
        for (let i = 0; i < segment.cars.length; i++) {
          const car = segment.cars[i];
          const spriteScale = segment.p1.screen.scale;
          const spriteX = segment.p1.screen.x + (spriteScale * car.offset * ROAD_WIDTH * w / 2);
          const spriteY = segment.p1.screen.y;
          this.drawSprite(ctx, w, h, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
        }
      }

      // 5. Render Player's Car in Front
      this.renderPlayer(ctx, w, h);

      // 6. Speed motion blur lines when driving fast or on nitro
      if (this.speed > 130) {
        this.renderSpeedLines(ctx, w, h);
      }
    }

    renderSky(ctx, w, h) {
      const zone = ZONES[this.currentZoneIndex];
      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      grad.addColorStop(0, zone.sky1);
      grad.addColorStop(1, zone.sky2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h * 0.65);

      // Dhaka City Skyline Silhouette in background
      ctx.fillStyle = 'rgba(10, 12, 22, 0.7)';
      for (let bx = 0; bx < w; bx += 60) {
        const bh = 50 + ((bx * 37) % 90);
        ctx.fillRect(bx, h * 0.48 - bh, 55, bh + 30);
        // Window lights
        ctx.fillStyle = 'rgba(255, 204, 0, 0.4)';
        if (bx % 3 === 0) {
          ctx.fillRect(bx + 12, h * 0.48 - bh + 15, 8, 8);
          ctx.fillRect(bx + 28, h * 0.48 - bh + 25, 8, 8);
        }
        ctx.fillStyle = 'rgba(10, 12, 22, 0.7)';
      }

      // Overhead Metro Rail Viaduct Girders running across
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 135, w, 14);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 149, w, 6);
    }

    renderSegment(ctx, width, lanes, x1, y1, w1, x2, y2, w2, color) {
      const r1 = w1 / Math.max(6, 2 * lanes);
      const r2 = w2 / Math.max(6, 2 * lanes);
      const l1 = w1 / lanes;
      const l2 = w2 / lanes;

      // Grass
      ctx.fillStyle = color.grass;
      ctx.fillRect(0, y2, width, y1 - y2);

      // Road Polygon
      this.drawPolygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

      // Rumble Strips
      this.drawPolygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
      this.drawPolygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);

      // Lane line dividers
      if (color.lane) {
        const laneW1 = w1 * 2 / lanes;
        const laneW2 = w2 * 2 / lanes;
        let laneX1 = x1 - w1 + laneW1;
        let laneX2 = x2 - w2 + laneW2;
        for (let lane = 1; lane < lanes; laneX1 += laneW1, laneX2 += laneW2, lane++) {
          this.drawPolygon(ctx, laneX1 - 2, y1, laneX1 + 2, y1, laneX2 + 2, y2, laneX2 - 2, y2, color.lane);
        }
      }
    }

    drawPolygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.fill();
    }

    drawSprite(ctx, w, h, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
      if (!sprite || !isFinite(scale) || scale <= 0) return;
      const destW = (sprite.width * scale * w / 2) * (ROAD_WIDTH / 1000);
      const destH = (sprite.height * scale * w / 2) * (ROAD_WIDTH / 1000);

      destX = destX + (destW * (offsetX || 0));
      destY = destY + (destH * (offsetY || 0));

      if (!isFinite(destX) || !isFinite(destY) || destW <= 0 || destH <= 0) return;

      const clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
      if (clipH < destH) {
        const sHeight = Math.floor(sprite.height - (sprite.height * clipH / destH));
        const dHeight = Math.floor(destH - clipH);
        const dWidth = Math.floor(destW);

        if (sHeight > 0 && dHeight > 0 && dWidth > 0) {
          ctx.drawImage(
            sprite,
            0, 0, sprite.width, sHeight,
            destX, destY, dWidth, dHeight
          );
        }
      }
    }

    renderPlayer(ctx, w, h) {
      const car = CARS[this.selectedCarIndex];
      const sprite = Sprites.cache[car.sprite];
      if (!sprite) return;

      const playerScale = 1.5;
      const pw = sprite.width * playerScale;
      const ph = sprite.height * playerScale;

      // Position car centered at bottom, comfortably above HUD elements
      const px = (w / 2) - (pw / 2);
      const bounce = (this.speed > 10) ? Math.sin(performance.now() * 0.02) * 2.5 : 0;
      const py = h - ph - 80 + bounce;

      // Steer tilt rotation
      let tilt = 0;
      if (this.keys.left) tilt = -0.06;
      if (this.keys.right) tilt = 0.06;

      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(tilt);

      // Render nitro flame particles behind player car
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, ph * 0.38 + p.y, (p.life / p.maxLife) * 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.drawImage(sprite, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }

    renderSpeedLines(ctx, w, h) {
      const count = this.nitroActive ? 22 : 12;
      ctx.strokeStyle = this.nitroActive ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;

      for (let i = 0; i < count; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        const len = 40 + Math.random() * 80;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + len);
        ctx.stroke();
      }
    }

    // ==========================================
    // MAIN LOOP
    // ==========================================
    loop(currentTime) {
      const dt = Math.min(1, (currentTime - this.lastFrameTime) / 1000);
      this.lastFrameTime = currentTime;

      this.update(dt);
      this.render();

      requestAnimationFrame((t) => this.loop(t));
    }
  }

  // Launch when page is loaded
  window.addEventListener('DOMContentLoaded', () => {
    window.dhakaGame = new DhakaGame();
  });
})();

