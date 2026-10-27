/**
 * DHAKA CITY RUSH - OPEN BLOCK RACING ENGINE
 * 360-degree city block driving with intersections, roundabouts (Shapla Chottor),
 * Metro Rail viaduct, 2.5D extruded buildings, dynamic tire skid marks, and traffic AI.
 */

(function () {
  'use strict';

  // Car definitions
  const CARS = [
    {
      id: 'premio',
      name: 'TOYOTA PREMIO 1.5',
      nickname: '"The Dhaka Corporate Rocket"',
      sprite: 'player_premio',
      maxSpeed: 14.5,
      accel: 0.22,
      turnRate: 0.052,
      driftFactor: 0.92,
      durability: 100,
      nitroPower: 1.45,
      scale: 1.0
    },
    {
      id: 'taxi',
      name: 'YELLOW DHAKA CAB',
      nickname: '"Meter Chara Jabo Na"',
      sprite: 'player_taxi',
      maxSpeed: 14.0,
      accel: 0.24,
      turnRate: 0.058,
      driftFactor: 0.94,
      durability: 85,
      nitroPower: 1.4,
      scale: 1.0
    },
    {
      id: 'suv',
      name: 'VIP BLACK SUV (PRADO)',
      nickname: '"Wrong Side King with Siren"',
      sprite: 'player_suv',
      maxSpeed: 13.8,
      accel: 0.18,
      turnRate: 0.044,
      driftFactor: 0.88,
      durability: 160,
      nitroPower: 1.35,
      scale: 1.08
    },
    {
      id: 'cng',
      name: 'MODIFIED TURBO CNG',
      nickname: '"The 3-Wheeled Green Demon"',
      sprite: 'player_cng',
      maxSpeed: 15.5,
      accel: 0.28,
      turnRate: 0.068,
      driftFactor: 0.96,
      durability: 60,
      nitroPower: 1.6,
      scale: 1.05
    }
  ];

  const QUIPS = [
    'মামা ডানে কাটেন! মোড়ে ফাঁকা আছে! (Turn right, the intersection is clear!)',
    'রিকশাওয়ালা মামা সাইড দিন! (Uncle rickshaw, move aside!)',
    'শাপলা চত্বরের গোলচক্করে সুন্দর ড্রিফট! (Sweet drift around Shapla Chottor!)',
    'মেট্রোরেলের নিচে স্পীড রান! (Speeding under the Metro Rail!)',
    'পুরান ঢাকার গলিতে ঢুকে পড়লেন! (Entered Old Dhaka alleys!)',
    'CNG মামা নো সিগন্যালে মোড় নিলো! (CNG turning without signal!)',
    'যাত্রী সময়মতো পৌঁছালো! বকশিস পেলেন! (Delivered passenger on time! Got a tip!)',
    'হর্ন দিলেন, ট্রাফিক সাইড দিলো! (Honked loud and cleared the street!)'
  ];

  class DhakaCityGame {
    constructor() {
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');

      this.minimapCanvas = document.getElementById('minimap');
      this.miniCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

      this.selectedCarIndex = 0;
      this.gameMode = 'FREE'; // 'FREE' or 'TAXI'

      // Player State
      this.x = 1200; // Start on Kazi Nazrul Islam Ave
      this.y = 800;
      this.angle = -Math.PI / 2; // Facing North
      this.speed = 0;
      this.angularVelocity = 0;
      this.vx = 0;
      this.vy = 0;

      this.nitro = 100;
      this.nitroActive = false;
      this.health = 100;
      this.maxHealth = 100;
      this.score = 0;
      this.topSpeedRecord = 0;
      this.jobsCompleted = 0;
      this.honkCount = 0;

      // Camera State
      this.camX = this.x;
      this.camY = this.y;
      this.camAngle = this.angle;
      this.zoom = 1.0;

      // Keys Input
      this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        drift: false,
        horn: false,
        nitro: false
      };

      // Environmental FX
      this.skidMarks = [];
      this.particles = [];
      this.traffic = [];

      // Mission / Waypoint System
      this.currentMission = null;
      this.missionTimer = 0;

      // Metro Rail overhead train
      this.metroTrain = {
        active: true,
        y: 0,
        speed: 12
      };

      this.gameState = 'START';
      this.lastFrameTime = performance.now();

      this.setupDOM();
      this.setupControls();
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      Sprites.init();
      CityMap.init();
      this.spawnInitialTraffic();
      this.renderCarPreview();

      // Start loop
      requestAnimationFrame((t) => this.loop(t));
    }

    setupDOM() {
      this.hud = document.getElementById('hud');
      this.startScreen = document.getElementById('start-screen');
      this.gameOverScreen = document.getElementById('game-over-screen');

      // Top HUD
      this.scoreVal = document.getElementById('score-val');
      this.streetNameVal = document.getElementById('street-name-val');
      this.missionSubtext = document.getElementById('mission-subtext');
      this.timeVal = document.getElementById('time-val');
      this.quipBanner = document.getElementById('quip-banner');

      // Compass
      this.navCompass = document.getElementById('nav-compass');
      this.compassArrow = document.getElementById('compass-arrow');
      this.compassDist = document.getElementById('compass-dist');

      // Bottom HUD
      this.speedVal = document.getElementById('speed-val');
      this.gearVal = document.getElementById('gear-val');
      this.nitroPercent = document.getElementById('nitro-percent');
      this.nitroBarFill = document.getElementById('nitro-bar-fill');
      this.healthVal = document.getElementById('health-val');
      this.healthBarFill = document.getElementById('health-bar-fill');

      // Buttons
      document.getElementById('prev-car').onclick = () => this.changeCar(-1);
      document.getElementById('next-car').onclick = () => this.changeCar(1);
      document.getElementById('btn-start').onclick = () => this.startGame();
      document.getElementById('btn-restart').onclick = () => this.startGame();
      document.getElementById('btn-change-car').onclick = () => this.showStartScreen();

      // Taxi Job toggle button
      document.getElementById('btn-job').onclick = () => {
        if (!this.currentMission) {
          this.startNewTaxiMission();
        } else {
          this.cancelMission();
        }
      };

      // Mode select buttons in start screen
      const modeFree = document.getElementById('mode-free');
      const modeTaxi = document.getElementById('mode-taxi');
      modeFree.onclick = () => {
        this.gameMode = 'FREE';
        modeFree.classList.add('active');
        modeTaxi.classList.remove('active');
      };
      modeTaxi.onclick = () => {
        this.gameMode = 'TAXI';
        modeTaxi.classList.add('active');
        modeFree.classList.remove('active');
      };

      // Music toggle
      const musicToggle = document.getElementById('music-toggle');
      musicToggle.onchange = (e) => {
        window.soundEngine.toggle(e.target.checked);
      };

      // Car preview elements
      this.carName = document.getElementById('car-name');
      this.carNickname = document.getElementById('car-nickname');
      this.statSpeed = document.getElementById('stat-speed');
      this.statHandling = document.getElementById('stat-handling');
      this.statArmor = document.getElementById('stat-armor');
      this.previewCanvas = document.getElementById('vehicle-preview');
      this.previewCtx = this.previewCanvas.getContext('2d');
    }

    setupControls() {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.forward = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.backward = true;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
        if (e.code === 'Space') {
          this.keys.drift = true;
          e.preventDefault();
        }
        if (e.code === 'KeyH') {
          if (!this.keys.horn && this.gameState === 'PLAYING') {
            this.triggerHorn();
          }
          this.keys.horn = true;
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') {
          this.keys.nitro = true;
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.forward = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.backward = false;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
        if (e.code === 'Space') this.keys.drift = false;
        if (e.code === 'KeyH') this.keys.horn = false;
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
      };

      bindTouch('btn-left', 'left');
      bindTouch('btn-right', 'right');
      bindTouch('btn-gas', 'forward');
      bindTouch('btn-brake', 'backward');
      bindTouch('btn-drift', 'drift');
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
      this.statSpeed.style.width = (car.maxSpeed / 16.0 * 100) + '%';
      this.statHandling.style.width = (car.turnRate / 0.07 * 100) + '%';
      this.statArmor.style.width = (car.durability / 160 * 100) + '%';

      const pw = this.previewCanvas.width;
      const ph = this.previewCanvas.height;
      this.previewCtx.clearRect(0, 0, pw, ph);

      const sprite = Sprites.cache[car.sprite];
      if (sprite) {
        this.previewCtx.save();
        this.previewCtx.translate(pw / 2, ph / 2);
        this.previewCtx.rotate(-Math.PI / 6);
        this.previewCtx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        this.previewCtx.restore();
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
      this.angularVelocity = 0;
      this.vx = 0;
      this.vy = 0;
      this.score = 0;
      this.jobsCompleted = 0;
      this.honkCount = 0;
      this.topSpeedRecord = 0;

      // Start on Kazi Nazrul Islam Ave
      this.x = 1200;
      this.y = 800;
      this.angle = -Math.PI / 2;
      this.camX = this.x;
      this.camY = this.y;
      this.camAngle = this.angle;

      this.skidMarks = [];
      this.particles = [];

      this.gameState = 'PLAYING';
      this.startScreen.classList.add('hidden');
      this.gameOverScreen.classList.add('hidden');
      this.hud.classList.remove('hidden');

      if (this.gameMode === 'TAXI') {
        this.startNewTaxiMission();
      } else {
        this.currentMission = null;
        this.navCompass.classList.add('hidden');
        document.getElementById('btn-job').textContent = '🚖 START TAXI JOB';
        this.showQuip('ঢাকা শহরে স্বাগতম! ঘুরে বেড়ান অথবা ট্যাক্সি চালান! 🚗');
      }
    }

    // ==========================================
    // TRAFFIC AI SYSTEM
    // ==========================================
    spawnInitialTraffic() {
      this.traffic = [];
      const types = [
        { sprite: 'traffic_rickshaw', speed: 1.8, radius: 18, name: 'Rickshaw' },
        { sprite: 'traffic_cng', speed: 4.8, radius: 20, name: 'CNG' },
        { sprite: 'traffic_bus_shikhor', speed: 6.2, radius: 36, name: 'Bus' },
        { sprite: 'traffic_bus_balaka', speed: 6.5, radius: 36, name: 'Bus' },
        { sprite: 'traffic_bus_bikolpo', speed: 5.8, radius: 36, name: 'Bus' }
      ];

      // Spawn traffic along avenues and streets
      CityMap.trafficNodes.forEach(node => {
        const count = node.type === 'avenue' ? 3 : 2;
        for (let i = 0; i < count; i++) {
          const tType = types[Math.floor(Math.random() * types.length)];
          const progress = (i + 0.3 + Math.random() * 0.4) / count;
          const x = node.x1 + (node.x2 - node.x1) * progress;
          const y = node.y1 + (node.y2 - node.y1) * progress;

          this.traffic.push({
            x, y,
            angle: node.angle,
            speed: tType.speed + (Math.random() * 0.6 - 0.3),
            baseSpeed: tType.speed,
            sprite: Sprites.cache[tType.sprite],
            radius: tType.radius,
            type: tType.name,
            node: node,
            honkedTimer: 0
          });
        }
      });
    }

    updateTraffic(dt) {
      this.traffic.forEach(car => {
        // Honked scared swerving
        if (car.honkedTimer > 0) {
          car.honkedTimer -= dt;
          car.speed = Math.max(0.5, car.baseSpeed * 0.5);
        } else {
          car.speed = car.baseSpeed;
        }

        // Advance along street
        car.x += Math.cos(car.angle) * car.speed * 60 * dt;
        car.y += Math.sin(car.angle) * car.speed * 60 * dt;

        // Loop around at world boundaries
        if (car.x < 30) car.x = CityMap.WORLD_SIZE - 50;
        if (car.x > CityMap.WORLD_SIZE - 30) car.x = 50;
        if (car.y < 30) car.y = CityMap.WORLD_SIZE - 50;
        if (car.y > CityMap.WORLD_SIZE - 30) car.y = 50;

        // Collision with player
        const dist = Math.hypot(this.x - car.x, this.y - car.y);
        if (dist < car.radius + 18) {
          this.handleVehicleCollision(car);
        }
      });
    }

    handleVehicleCollision(car) {
      window.soundEngine.playCrash();

      const pushX = (this.x - car.x) / (Math.hypot(this.x - car.x, this.y - car.y) || 1);
      const pushY = (this.y - car.y) / (Math.hypot(this.x - car.x, this.y - car.y) || 1);

      this.vx += pushX * 3.5;
      this.vy += pushY * 3.5;
      this.speed *= 0.3;

      let damage = 20;
      if (car.type === 'Bus') {
        damage = 38;
        this.showQuip('🚨 বাসের সাথে মারাত্মক সংঘর্ষ!');
      } else if (car.type === 'Rickshaw') {
        damage = 10;
        this.showQuip('⚠️ রিকশায় ধাক্কা লাগলো!');
      } else {
        damage = 18;
        this.showQuip('💥 সিএনজির সাথে ঠোকাঠুকি!');
      }

      this.health = Math.max(0, this.health - damage);

      // Spawn collision spark particles
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: (this.x + car.x) / 2,
          y: (this.y + car.y) / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 0.35,
          maxLife: 0.35,
          color: ['#ffcc00', '#ff0055', '#ffffff'][Math.floor(Math.random() * 3)]
        });
      }
    }

    // ==========================================
    // HORN MECHANIC (Clears traffic onto sidewalks)
    // ==========================================
    triggerHorn() {
      window.soundEngine.playPlayerHorn();
      this.honkCount++;

      let count = 0;
      this.traffic.forEach(car => {
        const dist = Math.hypot(this.x - car.x, this.y - car.y);
        if (dist < 260) {
          car.honkedTimer = 3.0;
          count++;
          // Shift away from player
          if (car.type === 'Rickshaw') {
            window.soundEngine.playRickshawBell();
            car.x += (car.x > this.x ? 25 : -25);
          } else if (car.type === 'CNG') {
            window.soundEngine.playCngSputter();
            car.y += (car.y > this.y ? 25 : -25);
          } else {
            window.soundEngine.playBusHorn();
          }
        }
      });

      if (count > 0) {
        this.score += count * 60;
        this.showQuip(`📢 হর্ন শুনে ${count}টি গাড়ি সাইড দিলো! (+${count * 60} pts)`);
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
    // TAXI / CHAI DELIVERY MISSION SYSTEM
    // ==========================================
    startNewTaxiMission() {
      const dest = CityMap.destinations[Math.floor(Math.random() * CityMap.destinations.length)];
      this.currentMission = {
        dest: dest,
        timeLeft: 60, // seconds
        reward: dest.reward
      };

      this.navCompass.classList.remove('hidden');
      document.getElementById('btn-job').textContent = '❌ CANCEL JOB';
      this.missionSubtext.textContent = `Destination: ${dest.name} (${dest.bangla})`;
      this.showQuip(`নতুন ট্রিপ: ${dest.bangla} পৌঁছান! ⏱️`);
    }

    cancelMission() {
      this.currentMission = null;
      this.navCompass.classList.add('hidden');
      document.getElementById('btn-job').textContent = '🚖 START TAXI JOB';
      this.missionSubtext.textContent = 'Free Roaming the City';
      this.timeVal.textContent = '--:--';
    }

    updateMissions(dt) {
      if (!this.currentMission) return;

      this.currentMission.timeLeft -= dt;
      const m = Math.floor(Math.max(0, this.currentMission.timeLeft) / 60);
      const s = Math.floor(Math.max(0, this.currentMission.timeLeft) % 60);
      this.timeVal.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;

      // Check arrival at waypoint
      const dx = this.currentMission.dest.x - this.x;
      const dy = this.currentMission.dest.y - this.y;
      const dist = Math.hypot(dx, dy);

      // Update Compass Arrow
      const targetAngle = Math.atan2(dy, dx);
      const relAngle = targetAngle - this.angle - Math.PI / 2;
      this.compassArrow.style.transform = `rotate(${relAngle}rad)`;
      this.compassDist.textContent = `${Math.round(dist / 5)}m`;

      if (dist < 65) {
        // Mission Completed!
        window.soundEngine.playChaiPickup();
        const earned = this.currentMission.reward + Math.round(this.currentMission.timeLeft * 10);
        this.score += earned;
        this.jobsCompleted++;
        this.health = Math.min(this.maxHealth, this.health + 30);
        this.nitro = 100;

        this.showQuip(`🎉 গন্তব্যে সফল ড্রপ! +${earned} টাকা ভাড়া পেলেন!`);
        this.startNewTaxiMission(); // Continue to next passenger
      } else if (this.currentMission.timeLeft <= 0) {
        this.showQuip('⏰ সময় শেষ! যাত্রী অন্য রিকশায় চলে গেলো!');
        this.cancelMission();
      }
    }

    // ==========================================
    // VEHICLE PHYSICS & INPUT
    // ==========================================
    update(dt) {
      if (this.gameState !== 'PLAYING') return;

      const car = CARS[this.selectedCarIndex];
      const maxSpeed = car.maxSpeed;
      const accel = car.accel;
      const turnRate = car.turnRate;

      // Nitro management
      if (this.keys.nitro && this.nitro > 0 && Math.abs(this.speed) > 2) {
        this.nitroActive = true;
        this.nitro = Math.max(0, this.nitro - dt * 32);
        window.soundEngine.playNitroSound();

        // Spawn flame particles from rear exhaust
        const rearX = this.x - Math.cos(this.angle) * 32;
        const rearY = this.y - Math.sin(this.angle) * 32;
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            x: rearX,
            y: rearY,
            vx: -Math.cos(this.angle) * (Math.random() * 4 + 3) + (Math.random() - 0.5) * 2,
            vy: -Math.sin(this.angle) * (Math.random() * 4 + 3) + (Math.random() - 0.5) * 2,
            life: 0.3,
            maxLife: 0.3,
            color: ['#00f0ff', '#ff0055', '#ff9900'][Math.floor(Math.random() * 3)]
          });
        }
      } else {
        this.nitroActive = false;
        this.nitro = Math.min(100, this.nitro + dt * 6);
      }

      const effectiveMaxSpeed = maxSpeed * (this.nitroActive ? car.nitroPower : 1.0);

      // Gas / Brake / Reverse
      if (this.keys.forward) {
        this.speed = Math.min(effectiveMaxSpeed, this.speed + accel * 60 * dt * (this.nitroActive ? 1.6 : 1.0));
      } else if (this.keys.backward) {
        this.speed = Math.max(-maxSpeed * 0.45, this.speed - accel * 1.5 * 60 * dt);
      } else {
        // Coasting friction
        this.speed *= Math.pow(0.96, dt * 60);
      }

      // Steering
      const speedRatio = Math.min(1.0, Math.abs(this.speed) / (maxSpeed * 0.6));
      let currentTurn = turnRate * (0.4 + speedRatio * 0.6);

      if (this.keys.drift) {
        currentTurn *= 1.45; // sharper turn during drift
      }

      if (this.keys.left) {
        this.angle -= currentTurn * (this.speed >= 0 ? 1 : -1) * 60 * dt;
      }
      if (this.keys.right) {
        this.angle += currentTurn * (this.speed >= 0 ? 1 : -1) * 60 * dt;
      }

      // Drift physics (lateral grip vs sliding)
      const forwardX = Math.cos(this.angle);
      const forwardY = Math.sin(this.angle);

      // Target velocity
      const targetVx = forwardX * this.speed;
      const targetVy = forwardY * this.speed;

      const grip = this.keys.drift ? 0.85 : 0.94;
      this.vx = this.vx * grip + targetVx * (1 - grip);
      this.vy = this.vy * grip + targetVy * (1 - grip);

      // Advance position
      this.x += this.vx * 60 * dt;
      this.y += this.vy * 60 * dt;

      // Keep inside city boundary
      this.x = Math.max(40, Math.min(CityMap.WORLD_SIZE - 40, this.x));
      this.y = Math.max(40, Math.min(CityMap.WORLD_SIZE - 40, this.y));

      // Leave dynamic skid marks when drifting or braking at speed
      const slip = Math.hypot(this.vx - targetVx, this.vy - targetVy);
      if (slip > 1.8 && Math.abs(this.speed) > 4) {
        this.skidMarks.push({
          x: this.x - forwardX * 18,
          y: this.y - forwardY * 18,
          alpha: 0.6
        });
        if (this.skidMarks.length > 250) this.skidMarks.shift();
      }

      // Record top speed in KM/H
      const kmh = Math.round(Math.abs(this.speed) * 12);
      if (kmh > this.topSpeedRecord) this.topSpeedRecord = kmh;

      // Collision with City Buildings
      const col = CityMap.checkBuildingCollision(this.x, this.y, 20);
      if (col.collided) {
        window.soundEngine.playCrash();
        this.health = Math.max(0, this.health - 22);
        this.x += col.normalX * 6;
        this.y += col.normalY * 6;
        this.vx *= -0.4;
        this.vy *= -0.4;
        this.speed *= -0.3;
        this.showQuip('💥 ভবনের দেয়ালে ক্র্যাশ!');
      }

      // Update Engine Audio
      window.soundEngine.updateEngine(Math.abs(this.speed) / maxSpeed, this.keys.forward, this.nitroActive);

      // Update Camera (Smooth Chase Cam)
      const targetCamX = this.x;
      const targetCamY = this.y;
      this.camX += (targetCamX - this.camX) * 0.12;
      this.camY += (targetCamY - this.camY) * 0.12;

      // Smooth camera rotation to follow car heading
      let diff = this.angle - this.camAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.camAngle += diff * 0.08;

      // Dynamic Zoom based on speed
      const targetZoom = 1.0 - (Math.abs(this.speed) / maxSpeed) * 0.25;
      this.zoom += (targetZoom - this.zoom) * 0.08;

      // Update Metro Train along Kazi Nazrul Islam Ave
      this.metroTrain.y = (this.metroTrain.y + this.metroTrain.speed * 60 * dt) % CityMap.WORLD_SIZE;

      // Update Traffic & Missions
      this.updateTraffic(dt);
      this.updateMissions(dt);

      // Update Particles
      this.updateParticles(dt);

      // Random Dhaka traffic quips trigger
      if (Math.random() < 0.002 && !this.quipBanner.classList.contains('show')) {
        const randQuip = QUIPS[Math.floor(Math.random() * QUIPS.length)];
        this.showQuip(randQuip);
      }

      // Health check
      if (this.health <= 0) {
        this.triggerGameOver('Your car was totaled in Dhaka traffic!');
      }

      this.updateHUD();
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

      // Fade skid marks
      for (let i = 0; i < this.skidMarks.length; i++) {
        this.skidMarks[i].alpha -= dt * 0.015;
        if (this.skidMarks[i].alpha <= 0) {
          this.skidMarks.splice(i, 1);
          i--;
        }
      }
    }

    updateHUD() {
      this.scoreVal.textContent = this.score.toLocaleString();

      const currentStreet = CityMap.getStreetAt(this.x, this.y);
      this.streetNameVal.textContent = currentStreet.name;

      const kmh = Math.round(Math.abs(this.speed) * 12);
      this.speedVal.textContent = kmh;

      if (this.speed > 0.5) {
        if (kmh > 120) this.gearVal.textContent = '5';
        else if (kmh > 90) this.gearVal.textContent = '4';
        else if (kmh > 55) this.gearVal.textContent = '3';
        else if (kmh > 25) this.gearVal.textContent = '2';
        else this.gearVal.textContent = '1';
      } else if (this.speed < -0.5) {
        this.gearVal.textContent = 'R';
      } else {
        this.gearVal.textContent = 'N';
      }

      this.nitroPercent.textContent = Math.round(this.nitro) + '%';
      this.nitroBarFill.style.width = this.nitro + '%';

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
      document.getElementById('final-jobs').textContent = this.jobsCompleted;
      document.getElementById('final-speed').textContent = this.topSpeedRecord + ' km/h';
      document.getElementById('final-honks').textContent = this.honkCount;

      this.hud.classList.add('hidden');
      this.gameOverScreen.classList.remove('hidden');
    }

    // ==========================================
    // RENDER CYCLE (2.5D ROTATING CITY BLOCKS)
    // ==========================================
    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      // World ground base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      // Center camera and apply rotation & zoom
      ctx.translate(w / 2, h / 2);
      ctx.scale(this.zoom, this.zoom);
      ctx.rotate(-this.camAngle - Math.PI / 2);
      ctx.translate(-this.camX, -this.camY);

      // 1. Draw Streets, Avenues, and Intersections
      this.renderCityStreets(ctx);

      // 2. Draw Skid Marks
      this.renderSkidMarks(ctx);

      // 3. Draw Roadside Props & Landmarks (Shapla Chottor, Metro pillars)
      this.renderCityProps(ctx);

      // 4. Draw Waypoint Beacon if mission active
      if (this.currentMission) {
        const beacon = Sprites.cache['waypoint_beacon'];
        if (beacon) {
          ctx.drawImage(beacon, this.currentMission.dest.x - 30, this.currentMission.dest.y - 30);
        }
      }

      // 5. Draw 2.5D Extruded Buildings (with parallax wall heights)
      this.renderBuildings(ctx);

      // 6. Draw Traffic Vehicles
      this.renderTraffic(ctx);

      // 7. Draw Player's Car & Headlight Beams
      this.renderPlayerCar(ctx);

      // 8. Draw Overhead Metro Rail Viaduct & MRT-6 Train
      this.renderMetroRail(ctx);

      ctx.restore();

      // 9. Render Minimap GPS Radar
      this.renderMinimap();
    }

    renderCityStreets(ctx) {
      // Asphalt Avenues (North - South)
      CityMap.avenues.forEach(ave => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(ave.x - ave.width / 2, 0, ave.width, CityMap.WORLD_SIZE);

        // Sidewalk curbs
        ctx.fillStyle = '#475569';
        ctx.fillRect(ave.x - ave.width / 2 - 12, 0, 12, CityMap.WORLD_SIZE);
        ctx.fillRect(ave.x + ave.width / 2, 0, 12, CityMap.WORLD_SIZE);

        // Yellow Center Line
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.setLineDash([24, 20]);
        ctx.beginPath();
        ctx.moveTo(ave.x, 0);
        ctx.lineTo(ave.x, CityMap.WORLD_SIZE);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Asphalt Cross Streets (East - West)
      CityMap.streets.forEach(str => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, str.y - str.width / 2, CityMap.WORLD_SIZE, str.width);

        // Sidewalk curbs
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, str.y - str.width / 2 - 12, CityMap.WORLD_SIZE, 12);
        ctx.fillRect(0, str.y + str.width / 2, CityMap.WORLD_SIZE, 12);

        // White Lane dividers
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(0, str.y);
        ctx.lineTo(CityMap.WORLD_SIZE, str.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Zebra Crossings at all 4-way intersections
      CityMap.avenues.forEach(ave => {
        CityMap.streets.forEach(str => {
          this.renderZebraCrossings(ctx, ave.x, str.y, ave.width, str.width);
        });
      });

      // Shapla Chottor Roundabout (Circular asphalt ring)
      CityMap.roundabouts.forEach(r => {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius + 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.setLineDash([18, 14]);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius + 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    renderZebraCrossings(ctx, ix, iy, aw, sw) {
      ctx.fillStyle = '#ffffff';
      const stripeW = 8;
      // North crossing
      for (let x = ix - aw / 2 + 10; x < ix + aw / 2 - 10; x += 18) {
        ctx.fillRect(x, iy - sw / 2 - 20, stripeW, 16);
      }
      // South crossing
      for (let x = ix - aw / 2 + 10; x < ix + aw / 2 - 10; x += 18) {
        ctx.fillRect(x, iy + sw / 2 + 4, stripeW, 16);
      }
      // West crossing
      for (let y = iy - sw / 2 + 10; y < iy + sw / 2 - 10; y += 18) {
        ctx.fillRect(ix - aw / 2 - 20, y, 16, stripeW);
      }
      // East crossing
      for (let y = iy - sw / 2 + 10; y < iy + sw / 2 - 10; y += 18) {
        ctx.fillRect(ix + aw / 2 + 4, y, 16, stripeW);
      }
    }

    renderSkidMarks(ctx) {
      this.skidMarks.forEach(s => {
        ctx.fillStyle = `rgba(10, 10, 15, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    renderCityProps(ctx) {
      // Shapla Chottor Fountain
      const shapla = Sprites.cache['prop_shapla'];
      if (shapla) {
        CityMap.roundabouts.forEach(r => {
          ctx.drawImage(shapla, r.x - 45, r.y - 45);
        });
      }

      // Roadside Props (Tea stalls, Metro pillars, Carts)
      CityMap.props.forEach(p => {
        const sprite = Sprites.cache[p.type === 'metro_pillar' ? 'prop_metro_pillar' : 'prop_cha_dokan'];
        if (sprite) {
          ctx.drawImage(sprite, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
        }
      });
    }

    // 2.5D Extruded Buildings (Pseudo-3D parallax effect)
    renderBuildings(ctx) {
      // Only render buildings near camera viewport for performance
      const viewRadius = 800;

      CityMap.buildings.forEach(b => {
        if (Math.abs(b.x - this.camX) > viewRadius || Math.abs(b.y - this.camY) > viewRadius) return;

        // Calculate parallax offset based on camera position
        const offsetX = ((b.x + b.w / 2) - this.camX) * (b.height3D / 500);
        const offsetY = ((b.y + b.h / 2) - this.camY) * (b.height3D / 500);

        // Building Walls (Extrusion shadow)
        ctx.fillStyle = b.theme.wall;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.w, b.y);
        ctx.lineTo(b.x + b.w + offsetX, b.y + offsetY);
        ctx.lineTo(b.x + offsetX, b.y + offsetY);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(b.x + b.w, b.y);
        ctx.lineTo(b.x + b.w, b.y + b.h);
        ctx.lineTo(b.x + b.w + offsetX, b.y + b.h + offsetY);
        ctx.lineTo(b.x + b.w + offsetX, b.y + offsetY);
        ctx.closePath();
        ctx.fill();

        // Building Rooftop
        ctx.fillStyle = b.theme.roof;
        ctx.fillRect(b.x + offsetX, b.y + offsetY, b.w, b.h);

        // Rooftop Trim
        ctx.strokeStyle = b.theme.trim;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + offsetX, b.y + offsetY, b.w, b.h);

        // Rooftop Billboard
        if (b.billboard) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(b.x + offsetX + b.w / 2 - 30, b.y + offsetY + 6, 60, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Hind Siliguri, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.billboard, b.x + offsetX + b.w / 2, b.y + offsetY + 18);
        }

        // Water tank
        if (b.hasWaterTank) {
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(b.x + offsetX + 16, b.y + offsetY + 16, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    renderTraffic(ctx) {
      this.traffic.forEach(car => {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);
        ctx.drawImage(car.sprite, -car.sprite.width / 2, -car.sprite.height / 2);
        ctx.restore();
      });
    }

    renderPlayerCar(ctx) {
      const car = CARS[this.selectedCarIndex];
      const sprite = Sprites.cache[car.sprite];
      if (!sprite) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Headlight Beams projecting forward
      const grad = ctx.createRadialGradient(25, 0, 10, 140, 0, 160);
      grad.addColorStop(0, 'rgba(255, 255, 240, 0.45)');
      grad.addColorStop(1, 'rgba(255, 255, 240, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(25, -12);
      ctx.lineTo(240, -60);
      ctx.lineTo(240, 60);
      ctx.lineTo(25, 12);
      ctx.closePath();
      ctx.fill();

      // Render nitro flame particles
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.save();
        ctx.translate(p.x - this.x, p.y - this.y);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, (p.life / p.maxLife) * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Player Car Sprite
      const w = sprite.width * car.scale;
      const h = sprite.height * car.scale;
      ctx.drawImage(sprite, -w / 2, -h / 2, w, h);

      ctx.restore();
    }

    renderMetroRail(ctx) {
      const nazrul = CityMap.avenues.find(a => a.id === 'nazrul');
      if (!nazrul) return;

      // Elevated concrete viaduct tracks spanning along Nazrul Ave
      ctx.fillStyle = 'rgba(71, 85, 105, 0.85)';
      ctx.fillRect(nazrul.x - 22, 0, 44, CityMap.WORLD_SIZE);

      // Silver rail tracks
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(nazrul.x - 12, 0);
      ctx.lineTo(nazrul.x - 12, CityMap.WORLD_SIZE);
      ctx.moveTo(nazrul.x + 12, 0);
      ctx.lineTo(nazrul.x + 12, CityMap.WORLD_SIZE);
      ctx.stroke();

      // Metro Train zooming along tracks
      const trainY = this.metroTrain.y;
      ctx.save();
      ctx.translate(nazrul.x, trainY);
      ctx.fillStyle = '#f8fafc';
      ctx.roundRect(-18, -120, 36, 240, 8);
      ctx.fill();
      // Green & red stripe
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-18, -120, 6, 240);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -120, 4, 240);
      // MRT Headlight
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 115, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ==========================================
    // MINIMAP GPS RADAR
    // ==========================================
    renderMinimap() {
      if (!this.miniCtx) return;
      const m = this.miniCtx;
      const size = this.minimapCanvas.width;
      const scale = size / CityMap.WORLD_SIZE;

      m.clearRect(0, 0, size, size);

      // Background
      m.fillStyle = '#090e1a';
      m.fillRect(0, 0, size, size);

      // Draw Avenues & Streets
      m.fillStyle = '#223048';
      CityMap.avenues.forEach(a => {
        m.fillRect((a.x - a.width / 2) * scale, 0, a.width * scale, size);
      });
      CityMap.streets.forEach(s => {
        m.fillRect(0, (s.y - s.width / 2) * scale, size, s.width * scale);
      });

      // Draw Shapla Chottor
      CityMap.roundabouts.forEach(r => {
        m.fillStyle = '#0284c7';
        m.beginPath();
        m.arc(r.x * scale, r.y * scale, 8, 0, Math.PI * 2);
        m.fill();
      });

      // Draw Traffic Dots
      this.traffic.forEach(car => {
        m.fillStyle = car.type === 'Bus' ? '#f97316' : (car.type === 'CNG' ? '#00e676' : '#ff1493');
        m.fillRect(car.x * scale - 1, car.y * scale - 1, 3, 3);
      });

      // Draw Mission Objective Beacon
      if (this.currentMission) {
        m.fillStyle = '#facc15';
        m.beginPath();
        m.arc(this.currentMission.dest.x * scale, this.currentMission.dest.y * scale, 4, 0, Math.PI * 2);
        m.fill();
      }

      // Draw Player Arrow
      m.save();
      m.translate(this.x * scale, this.y * scale);
      m.rotate(this.angle);
      m.fillStyle = '#00f0ff';
      m.beginPath();
      m.moveTo(6, 0);
      m.lineTo(-4, -4);
      m.lineTo(-2, 0);
      m.lineTo(-4, 4);
      m.closePath();
      m.fill();
      m.restore();
    }

    loop(currentTime) {
      const dt = Math.min(0.1, (currentTime - this.lastFrameTime) / 1000);
      this.lastFrameTime = currentTime;

      try {
        this.update(dt);
        this.render();
      } catch (err) {
        console.error('Error during game tick:', err);
      }

      requestAnimationFrame((t) => this.loop(t));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.dhakaCityGame = new DhakaCityGame();
  });
})();
