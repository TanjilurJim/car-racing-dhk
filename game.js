/**
 * DHAKA CITY 3D - ADVANCED PHYSICS & OPEN CONNECTED MAP
 * Mass-based vehicle collisions, realistic momentum transfer, continuous ring road,
 * repair pickups, and indestructible driving (zero game-over interruption).
 */

(function () {
  'use strict';

  const CARS = [
    {
      id: 'premio',
      name: 'TOYOTA PREMIO 1.5',
      nickname: '"The Dhaka Corporate Rocket"',
      modelType: 'premio',
      mass: 1400, // kg
      maxSpeed: 48,
      accel: 28,
      turnRate: 2.2,
      driftFactor: 0.88,
      nitroPower: 1.5
    },
    {
      id: 'taxi',
      name: 'YELLOW DHAKA CAB',
      nickname: '"Meter Chara Jabo Na"',
      modelType: 'taxi',
      mass: 1350,
      maxSpeed: 46,
      accel: 30,
      turnRate: 2.5,
      driftFactor: 0.90,
      nitroPower: 1.45
    },
    {
      id: 'suv',
      name: 'VIP BLACK SUV (PRADO)',
      nickname: '"Wrong Side King with Siren"',
      modelType: 'suv',
      mass: 2600, // Heavyweight juggernaut!
      maxSpeed: 44,
      accel: 24,
      turnRate: 1.9,
      driftFactor: 0.82,
      nitroPower: 1.4
    },
    {
      id: 'cng',
      name: 'MODIFIED TURBO CNG',
      nickname: '"The 3-Wheeled Green Demon"',
      modelType: 'cng',
      mass: 450, // Lightweight racer
      maxSpeed: 52,
      accel: 36,
      turnRate: 2.9,
      driftFactor: 0.94,
      nitroPower: 1.65
    }
  ];

  const QUIPS = [
    'মামা ডানে কাটেন! রিং রোডে ঢুকুন! (Turn right onto the Ring Road!)',
    'রিকশাওয়ালা মামা সাইড দিন! (Uncle rickshaw, move aside!)',
    'শাপলা চত্বরের গোলচক্করে সুন্দর থ্রিডি ড্রিফট! (Sweet 3D drift around Shapla Chottor!)',
    'মেট্রোরেলের নিচে স্পীড রান! (Speeding under the Metro Rail!)',
    'মেরামত কিট তুললেন! গাড়ি একদম নতুনের মতো! (Repair kit collected! Brand new again!)',
    'হর্ন দিলেন, ট্রাফিক সাইড দিলো! (Honked loud, traffic moved aside!)',
    'গাড়ি শক্তিশালী! কোনো গেম ওভার নেই — চালান! (Car is indestructible! Keep rolling!)'
  ];

  class DhakaCity3DGame {
    constructor() {
      this.selectedCarIndex = 0;
      this.cameraMode = 'CHASE';

      // Three.js Core
      this.container = document.getElementById('webgl-container');
      this.scene = null;
      this.camera = null;
      this.renderer = null;

      // Minimap Canvas
      this.miniCanvas = document.getElementById('minimap');
      this.miniCtx = this.miniCanvas ? this.miniCanvas.getContext('2d') : null;

      // Player State
      this.playerMesh = null;
      this.x = -120; // on Kazi Nazrul Islam Ave
      this.z = 20;
      this.angle = 0; // heading
      this.speed = 0;
      this.steerAngle = 0;
      this.vx = 0;
      this.vz = 0;

      // Health & Nitro (No Game Over)
      this.health = 100;
      this.nitro = 100;
      this.nitroActive = false;
      this.score = 0;
      this.topSpeedRecord = 0;
      this.jobsCompleted = 0;
      this.honkCount = 0;

      // Screen Shake
      this.screenShake = 0;

      // Realistic Physics & Dynamics (Weight Transfer & Spin)
      this.pitch = 0;
      this.roll = 0;
      this.spinVy = 0;
      this.skidMarks = [];

      // Pause State
      this.isPaused = false;

      // LAN Multiplayer State
      this.lanWs = null;
      this.myId = null;
      this.myName = 'Dhakaiya Racer';
      this.remotePlayers = new Map();
      this.lanSendTimer = 0;

      // Game Mode: 'OPEN_WORLD' or 'RACE_COMBAT'
      this.gameMode = 'OPEN_WORLD';

      // Combat Weapons State
      this.ammoRockets = 3;
      this.ammoMines = 2;
      this.rocketCooldown = 0;
      this.mineCooldown = 0;
      this.rocketReloadTimer = 0;
      this.mineReloadTimer = 0;
      this.activeRockets = [];
      this.activeMines = [];

      // 1v1 Race Circuit State
      this.raceCountdown = -1;
      this.raceCountdownTimer = 0;
      this.raceActive = false;
      this.currentCheckpoint = 0;
      this.currentLap = 1;
      this.totalLaps = 2;
      this.raceStartTime = 0;
      this.raceFinished = false;
      this.myGridIndex = 0;
      this.aiRival = null;

      // Camera Follow
      this.camPos = new THREE.Vector3(this.x, 6, this.z - 14);
      this.camTarget = new THREE.Vector3(this.x, 1.5, this.z);

      // Traffic
      this.traffic = [];

      // Particles
      this.particles = [];

      // Missions
      this.currentMission = null;

      this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        drift: false,
        horn: false,
        nitro: false
      };

      this.gameState = 'START';
      this.lastTime = performance.now();

      this.initThree();
      this.setupDOM();
      this.setupControls();
      this.initLanMultiplayer();

      requestAnimationFrame((t) => this.loop(t));
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1528);
      // Soft atmospheric twilight fog so distant buildings and sky stay visible
      this.scene.fog = new THREE.FogExp2(0x1a1528, 0.00075);

      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.5, 2000);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);

      // Ambient & Directional Lighting
      const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x241d3b, 0.85);
      this.scene.add(hemiLight);

      this.dirLight = new THREE.DirectionalLight(0xffa347, 1.1);
      this.dirLight.position.set(180, 240, 140);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 600;
      const d = 240;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.scene.add(this.dirLight);

      // Build 3D City
      City3D.build(this.scene);

      // Spawn 3D Traffic
      this.spawn3DTraffic();

      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }

    setupDOM() {
      this.hud = document.getElementById('hud');
      this.startScreen = document.getElementById('start-screen');

      this.scoreVal = document.getElementById('score-val');
      this.streetNameVal = document.getElementById('street-name-val');
      this.missionSubtext = document.getElementById('mission-subtext');
      this.timeVal = document.getElementById('time-val');
      this.quipBanner = document.getElementById('quip-banner');

      this.navCompass = document.getElementById('nav-compass');
      this.compassArrow = document.getElementById('compass-arrow');
      this.compassDist = document.getElementById('compass-dist');

      this.speedVal = document.getElementById('speed-val');
      this.gearVal = document.getElementById('gear-val');
      this.nitroPercent = document.getElementById('nitro-percent');
      this.nitroBarFill = document.getElementById('nitro-bar-fill');
      this.healthVal = document.getElementById('health-val');

      this.carName = document.getElementById('car-name');
      this.carNickname = document.getElementById('car-nickname');
      this.statSpeed = document.getElementById('stat-speed');
      this.statHandling = document.getElementById('stat-handling');
      this.statArmor = document.getElementById('stat-armor');
      this.previewCanvas = document.getElementById('vehicle-preview');
      this.previewCtx = this.previewCanvas.getContext('2d');

      document.getElementById('prev-car').onclick = () => this.changeCar(-1);
      document.getElementById('next-car').onclick = () => this.changeCar(1);
      document.getElementById('btn-start').onclick = () => this.startGame();

      document.getElementById('btn-job').onclick = () => {
        if (!this.currentMission) {
          this.startNewTaxiMission();
        } else {
          this.cancelMission();
        }
      };

      const musicToggle = document.getElementById('music-toggle');
      musicToggle.onchange = (e) => {
        window.soundEngine.toggle(e.target.checked);
      };

      // Driver Name Input Field
      const nameInput = document.getElementById('player-name-input');
      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          this.myName = e.target.value.trim().substring(0, 20) || 'Dhakaiya Racer';
          if (this.lanWs && this.lanWs.readyState === 1) {
            this.lanWs.send(JSON.stringify({
              type: 'SET_PROFILE',
              name: this.myName,
              carType: CARS[this.selectedCarIndex].id,
              gameMode: this.gameMode
            }));
          }
        });
      }

      // Game Mode Selection Cards: Open World vs Race & Combat
      const modeOpen = document.getElementById('mode-open-world');
      const modeRace = document.getElementById('mode-race-combat');
      if (modeOpen && modeRace) {
        modeOpen.onclick = () => {
          this.gameMode = 'OPEN_WORLD';
          modeOpen.classList.add('active');
          modeRace.classList.remove('active');
          const tag1 = modeOpen.querySelector('.mode-tag');
          const tag2 = modeRace.querySelector('.mode-tag');
          if (tag1) tag1.textContent = 'SELECTED';
          if (tag2) tag2.textContent = 'SELECT';
          if (this.lanWs && this.lanWs.readyState === 1) {
            this.lanWs.send(JSON.stringify({
              type: 'SET_PROFILE',
              name: this.myName,
              carType: CARS[this.selectedCarIndex].id,
              gameMode: this.gameMode
            }));
          }
        };
        modeRace.onclick = () => {
          this.gameMode = 'RACE_COMBAT';
          modeRace.classList.add('active');
          modeOpen.classList.remove('active');
          const tag1 = modeOpen.querySelector('.mode-tag');
          const tag2 = modeRace.querySelector('.mode-tag');
          if (tag1) tag1.textContent = 'SELECT';
          if (tag2) tag2.textContent = 'SELECTED';
          if (this.lanWs && this.lanWs.readyState === 1) {
            this.lanWs.send(JSON.stringify({
              type: 'SET_PROFILE',
              name: this.myName,
              carType: CARS[this.selectedCarIndex].id,
              gameMode: this.gameMode
            }));
          }
        };
      }

      // Weapon action buttons
      const fireRocketBtn = document.getElementById('btn-fire-rocket');
      if (fireRocketBtn) fireRocketBtn.onclick = () => this.fireRocket();

      const dropMineBtn = document.getElementById('btn-drop-mine');
      if (dropMineBtn) dropMineBtn.onclick = () => this.dropMine();

      const touchFireBtn = document.getElementById('btn-touch-fire');
      if (touchFireBtn) {
        touchFireBtn.onclick = (e) => { e.preventDefault(); this.fireRocket(); };
        touchFireBtn.ontouchstart = (e) => { e.preventDefault(); this.fireRocket(); };
      }

      const touchMineBtn = document.getElementById('btn-touch-mine');
      if (touchMineBtn) {
        touchMineBtn.onclick = (e) => { e.preventDefault(); this.dropMine(); };
        touchMineBtn.ontouchstart = (e) => { e.preventDefault(); this.dropMine(); };
      }

      // Winner Modal Rematch & Freeroam buttons
      const rematchBtn = document.getElementById('btn-race-rematch');
      if (rematchBtn) {
        rematchBtn.onclick = () => {
          const modal = document.getElementById('winner-modal');
          if (modal) modal.classList.add('hidden');
          if (this.lanWs && this.lanWs.readyState === 1) {
            this.lanWs.send(JSON.stringify({ type: 'TRIGGER_RACE' }));
          } else {
            this.startSoloRace();
          }
        };
      }

      const freeroamBtn = document.getElementById('btn-race-freeroam');
      if (freeroamBtn) {
        freeroamBtn.onclick = () => {
          const modal = document.getElementById('winner-modal');
          if (modal) modal.classList.add('hidden');
          this.gameMode = 'OPEN_WORLD';
          const raceCard = document.getElementById('race-card');
          if (raceCard) raceCard.classList.add('hidden');
          this.raceActive = false;
          this.showQuip('মুক্ত শহর মোডে ফিরে এসেছেন! ইচ্ছামতো ঢাকা শহর ড্রাইভ করুন! 🏙️');
        };
      }

      this.updateCarPreview();
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
        if (e.code === 'KeyC') {
          this.cameraMode = this.cameraMode === 'CHASE' ? 'HOOD' : 'CHASE';
          this.showQuip(`Camera switched to ${this.cameraMode} View! 🎥`);
        }
        if (e.code === 'KeyF' || e.code === 'KeyX') {
          if (this.gameState === 'PLAYING') this.fireRocket();
        }
        if (e.code === 'KeyB' || e.code === 'KeyM') {
          if (this.gameState === 'PLAYING') this.dropMine();
        }
        if (e.code === 'Escape') {
          if (this.gameState === 'PLAYING') {
            this.togglePause();
          }
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

      // Mobile Touch Camera Toggle
      const camBtn = document.getElementById('btn-cam');
      if (camBtn) {
        const toggleCam = (e) => {
          e.preventDefault();
          this.cameraMode = this.cameraMode === 'CHASE' ? 'HOOD' : 'CHASE';
          this.showQuip(`Camera switched to ${this.cameraMode} View! 🎥`);
        };
        camBtn.addEventListener('click', toggleCam);
        camBtn.addEventListener('touchstart', toggleCam, { passive: false });
      }

      // Pause Button & Pause Menu Bindings
      const pauseBtn = document.getElementById('btn-pause');
      if (pauseBtn) {
        pauseBtn.onclick = () => this.togglePause();
      }

      const resumeBtn = document.getElementById('btn-resume');
      if (resumeBtn) {
        resumeBtn.onclick = () => this.togglePause();
      }

      const restartBtn = document.getElementById('btn-restart');
      if (restartBtn) {
        restartBtn.onclick = () => this.restartGame();
      }

      const pauseCamBtn = document.getElementById('btn-pause-cam');
      if (pauseCamBtn) {
        pauseCamBtn.onclick = () => {
          this.cameraMode = this.cameraMode === 'CHASE' ? 'HOOD' : 'CHASE';
          this.showQuip(`Camera switched to ${this.cameraMode} View! 🎥`);
        };
      }

      const serviceBtn = document.getElementById('btn-service');
      if (serviceBtn) {
        serviceBtn.onclick = () => {
          this.health = 100;
          this.nitro = 100;
          Models3D.updateDamageDeformation(this.playerMesh, 100);
          this.showQuip('🛠️ ফুল সার্ভিসিং সম্পন্ন! গাড়ি একদম নতুনের মতো (100% Brand New)! ✨');
          this.togglePause();
        };
      }

      // Copy LAN link buttons
      const wireCopy = (btnId, inputId) => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (btn && input) {
          btn.onclick = () => {
            input.select();
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(input.value);
            }
            btn.textContent = 'COPIED! ✅';
            setTimeout(() => { btn.textContent = '📋 COPY LINK'; }, 2000);
          };
        }
      };

      wireCopy('btn-copy-lan', 'lan-link-input');
      wireCopy('btn-start-copy-lan', 'start-lan-input');
    }

    changeCar(delta) {
      this.selectedCarIndex = (this.selectedCarIndex + delta + CARS.length) % CARS.length;
      this.updateCarPreview();
      window.soundEngine.init();
      window.soundEngine.playRickshawBell();
    }

    updateCarPreview() {
      const car = CARS[this.selectedCarIndex];
      this.carName.textContent = car.name;
      this.carNickname.textContent = car.nickname;
      this.statSpeed.style.width = (car.maxSpeed / 52 * 100) + '%';
      this.statHandling.style.width = (car.turnRate / 3.0 * 100) + '%';
      this.statArmor.style.width = (car.mass / 2600 * 100) + '%';

      const ctx = this.previewCtx;
      const pw = this.previewCanvas.width;
      const ph = this.previewCanvas.height;
      ctx.clearRect(0, 0, pw, ph);

      ctx.fillStyle = car.id === 'taxi' ? '#ffcc00' : (car.id === 'cng' ? '#00e676' : (car.id === 'suv' ? '#222' : '#f8fafc'));
      ctx.beginPath();
      ctx.roundRect(pw / 2 - 45, ph / 2 - 20, 90, 40, 10);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(pw / 2 - 25, ph / 2 - 16, 50, 32);

      ctx.fillStyle = '#ff0055';
      ctx.fillRect(pw / 2 - 47, ph / 2 - 14, 4, 8);
      ctx.fillRect(pw / 2 - 47, ph / 2 + 6, 4, 8);

      ctx.fillStyle = '#fff';
      ctx.fillRect(pw / 2 + 43, ph / 2 - 14, 4, 8);
      ctx.fillRect(pw / 2 + 43, ph / 2 + 6, 4, 8);
    }

    startGame() {
      window.soundEngine.init();
      window.soundEngine.resume();
      window.soundEngine.startMusic();

      const nameInput = document.getElementById('player-name-input');
      if (nameInput && nameInput.value.trim()) {
        this.myName = nameInput.value.trim().substring(0, 20);
      }

      if (this.playerMesh) {
        this.scene.remove(this.playerMesh);
      }

      const car = CARS[this.selectedCarIndex];
      if (car.modelType === 'cng') {
        this.playerMesh = Models3D.createCngModel(true);
      } else {
        this.playerMesh = Models3D.createCarModel(car.modelType);
      }
      this.scene.add(this.playerMesh);

      // Start on Kazi Nazrul Islam Ave
      this.x = -120;
      this.z = 20;
      this.angle = 0;
      this.speed = 0;
      this.steerAngle = 0;
      this.vx = 0;
      this.vz = 0;
      this.health = 100;
      this.nitro = 100;
      this.score = 0;
      this.honkCount = 0;
      this.jobsCompleted = 0;

      // Reset weapons
      this.ammoRockets = 3;
      this.ammoMines = 2;
      this.rocketCooldown = 0;
      this.mineCooldown = 0;
      this.updateWeaponHUD();

      this.gameState = 'PLAYING';
      this.isPaused = false;
      const pauseModal = document.getElementById('pause-modal');
      if (pauseModal) pauseModal.classList.add('hidden');

      this.startScreen.classList.add('hidden');
      this.hud.classList.remove('hidden');

      const raceCard = document.getElementById('race-card');
      const jobBtn = document.getElementById('btn-job');

      // Send Profile & Selected Mode to Server over LAN
      if (this.lanWs && this.lanWs.readyState === 1) {
        this.lanWs.send(JSON.stringify({
          type: 'SET_PROFILE',
          name: this.myName,
          carType: car.modelType,
          gameMode: this.gameMode
        }));
      }

      if (this.gameMode === 'RACE_COMBAT') {
        if (raceCard) raceCard.classList.remove('hidden');
        if (jobBtn) jobBtn.style.display = 'none';

        // Check if there are remote players already online
        if (this.remotePlayers.size >= 1 && this.lanWs && this.lanWs.readyState === 1) {
          this.lanWs.send(JSON.stringify({ type: 'TRIGGER_RACE' }));
          this.showQuip(`🏁 রেস ও শুটার ব্যাটেল শুরু হচ্ছে! প্রতিপক্ষ প্রস্তুত! ⚔️`);
        } else {
          // Solo mode until friend joins: spawn AI competitor to race & shoot!
          this.startSoloRace();
        }
      } else {
        if (raceCard) raceCard.classList.add('hidden');
        if (jobBtn) jobBtn.style.display = 'block';
        this.raceActive = false;
        if (this.aiRival && this.aiRival.mesh) {
          this.scene.remove(this.aiRival.mesh);
          this.aiRival = null;
        }
        this.showQuip('৩ডি ঢাকা মুক্ত শহরে স্বাগতম! ফ্রি-রোম ড্রাইভ ও মিশন উপভোগ করুন! 🏙️');
      }
    }

    // ==========================================
    // ESCAPE KEY & PAUSE SYSTEM
    // ==========================================
    togglePause() {
      if (this.gameState !== 'PLAYING') return;
      this.isPaused = !this.isPaused;
      const pauseModal = document.getElementById('pause-modal');

      if (this.isPaused) {
        if (pauseModal) pauseModal.classList.remove('hidden');
        window.soundEngine.stopEngine();

        // Update stats on pause modal
        const street = City3D.getStreetAt(this.x, this.z);
        const pStreet = document.getElementById('pause-street-val');
        if (pStreet) pStreet.textContent = street.name;

        const pSpeed = document.getElementById('pause-speed-val');
        if (pSpeed) pSpeed.textContent = Math.round(Math.abs(this.speed) * 3.6) + ' KM/H';

        const pScore = document.getElementById('pause-score-val');
        if (pScore) pScore.textContent = this.score.toLocaleString();

        const pHealth = document.getElementById('pause-health-val');
        if (pHealth) {
          pHealth.textContent = `${this.health}% (${this.health >= 80 ? 'BRAND NEW' : (this.health >= 40 ? 'GOOD' : 'CRITICAL')})`;
          pHealth.style.color = this.health >= 80 ? '#00e676' : (this.health >= 40 ? '#facc15' : '#ff3344');
        }
      } else {
        if (pauseModal) pauseModal.classList.add('hidden');
        this.lastTime = performance.now();
      }
    }

    restartGame() {
      const pauseModal = document.getElementById('pause-modal');
      if (pauseModal) pauseModal.classList.add('hidden');
      this.isPaused = false;
      this.startGame();
    }

    // ==========================================
    // LAN MULTIPLAYER CLIENT (PvP Racing & Damage)
    // ==========================================
    initLanMultiplayer() {
      const isHttp = typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http');
      const wsHost = isHttp ? window.location.host : 'localhost:3000';
      const wsProto = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') ? 'wss:' : 'ws:';
      const wsUrl = `${wsProto}//${wsHost}`;

      // Update input fields with LAN IP
      if (isHttp && typeof fetch === 'function') {
        fetch('/api/lan-info')
          .then(res => res.json())
          .then(info => {
            const el1 = document.getElementById('lan-link-input');
            const el2 = document.getElementById('start-lan-input');
            if (el1) el1.value = info.lanUrl;
            if (el2) el2.value = info.lanUrl;
          })
          .catch(() => {});
      }

      if (typeof WebSocket === 'undefined') return;

      try {
        this.lanWs = new WebSocket(wsUrl);

        this.lanWs.onopen = () => {
          console.log('[LAN] Connected to multiplayer server at', wsUrl);
          const badge1 = document.getElementById('lan-status-tag');
          const badge2 = document.getElementById('start-lan-badge');
          if (badge1) { badge1.textContent = '🟢 CONNECTED'; badge1.className = 'lan-status-tag'; }
          if (badge2) { badge2.textContent = '🟢 LAN READY'; badge2.className = 'lan-badge-active'; }
        };

        this.lanWs.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            this.handleLanMessage(msg);
          } catch (e) {}
        };

        this.lanWs.onclose = () => {
          const badge1 = document.getElementById('lan-status-tag');
          if (badge1) { badge1.textContent = '⚪ OFFLINE'; }
        };
      } catch (err) {
        console.warn('[LAN] Offline or local file mode', err);
      }
    }

    handleLanMessage(msg) {
      if (msg.type === 'WELCOME') {
        this.myId = msg.myId;
        this.myName = msg.myName;
        if (msg.players) {
          msg.players.forEach(p => {
            if (p.id !== this.myId) this.spawnRemotePlayer(p);
          });
          const countEl = document.getElementById('lan-count');
          if (countEl) countEl.textContent = this.remotePlayers.size + 1;
        }
      } else if (msg.type === 'PLAYER_JOINED') {
        if (msg.player && msg.player.id !== this.myId) {
          this.spawnRemotePlayer(msg.player);
          this.showQuip(`🏎️ ${msg.player.name} ল্যান রেসে যোগ দিলেন!`);
          const countEl = document.getElementById('lan-count');
          if (countEl) countEl.textContent = this.remotePlayers.size + 1;
        }
      } else if (msg.type === 'PLAYER_UPDATE') {
        if (msg.id === this.myId) return;
        let remote = this.remotePlayers.get(msg.id);
        if (!remote) {
          remote = this.spawnRemotePlayer(msg);
        }
        if (remote) {
          remote.targetX = msg.x;
          remote.targetZ = msg.z;
          remote.targetAngle = msg.angle;
          remote.speed = msg.speed;
          remote.pitch = msg.pitch || 0;
          remote.roll = msg.roll || 0;
          remote.health = msg.health;
          if (remote.nameTag && remote.nameTag.updateNameTag) {
            remote.nameTag.updateNameTag(msg.name || remote.name, msg.health);
          }
          Models3D.updateDamageDeformation(remote.mesh, msg.health);
        }
      } else if (msg.type === 'PVP_RAM_EVENT') {
        if (msg.targetId === this.myId) {
          // You got rammed by another player!
          window.soundEngine.playCrash();
          this.vx += msg.nx * msg.impulse * 0.45;
          this.vz += msg.nz * msg.impulse * 0.45;
          this.speed *= 0.35;
          this.health = Math.max(5, this.health - msg.damage);
          this.screenShake = 1.3;
          Models3D.updateDamageDeformation(this.playerMesh, this.health);
          for (let i = 0; i < 20; i++) {
            this.spawnParticle(this.x, 1.2, this.z, [0xffcc00, 0xff0055, 0xffffff]);
          }
          this.showQuip(`💥 ${msg.attackerName} আপনাকে প্রচণ্ড ধাক্কা দিলো! (-${msg.damage}% HP)`);
        }
      } else if (msg.type === 'PLAYER_HONKED') {
        window.soundEngine.playBusHorn();
      } else if (msg.type === 'PLAYER_PROFILE_UPDATED') {
        if (msg.id !== this.myId) {
          let remote = this.remotePlayers.get(msg.id);
          if (!remote) remote = this.spawnRemotePlayer(msg);
          if (remote) {
            remote.name = msg.name;
            remote.gameMode = msg.gameMode;
            if (remote.nameTag && remote.nameTag.updateNameTag) {
              remote.nameTag.updateNameTag(msg.name, remote.health);
            }
          }
        }
      } else if (msg.type === 'RACE_COUNTDOWN_START') {
        this.startRaceCountdown(msg.racers);
      } else if (msg.type === 'ROCKET_FIRED') {
        this.spawnRemoteRocket(msg);
      } else if (msg.type === 'MINE_DROPPED') {
        this.spawnRemoteMine(msg);
      } else if (msg.type === 'ROCKET_HIT_EVENT') {
        this.handleRocketHitEvent(msg);
      } else if (msg.type === 'MINE_HIT_EVENT') {
        this.handleMineHitEvent(msg);
      } else if (msg.type === 'RACER_CHECKPOINT') {
        const remote = this.remotePlayers.get(msg.id);
        if (remote) {
          remote.currentCheckpoint = msg.checkpointIndex;
          remote.currentLap = msg.lap;
        }
      } else if (msg.type === 'RACE_WINNER_ANNOUNCED') {
        this.showWinnerModal(msg.winnerName, msg.finalTime);
      } else if (msg.type === 'PLAYER_LEFT') {
        const remote = this.remotePlayers.get(msg.id);
        if (remote) {
          this.scene.remove(remote.mesh);
          this.remotePlayers.delete(msg.id);
          this.showQuip(`👋 ${remote.name} রেস থেকে বের হয়ে গেলেন।`);
          const countEl = document.getElementById('lan-count');
          if (countEl) countEl.textContent = this.remotePlayers.size + 1;
        }
      }
    }

    spawnRemotePlayer(data) {
      if (this.remotePlayers.has(data.id)) return this.remotePlayers.get(data.id);
      const mesh = data.carType === 'cng' ? Models3D.createCngModel(false) : Models3D.createCarModel(data.carType || 'premio');
      mesh.position.set(data.x, 0, data.z);
      this.scene.add(mesh);

      // Floating 3D billboard player name tag
      const nameTag = Models3D.createPlayerNameTag(data.name || 'RACER', '#00f0ff');
      mesh.add(nameTag);

      const remoteObj = {
        id: data.id,
        name: data.name || 'RACER',
        mesh: mesh,
        nameTag: nameTag,
        targetX: data.x,
        targetZ: data.z,
        targetAngle: data.angle || 0,
        speed: data.speed || 0,
        pitch: 0,
        roll: 0,
        health: data.health || 100,
        carType: data.carType || 'premio'
      };

      this.remotePlayers.set(data.id, remoteObj);
      return remoteObj;
    }

    updateRemotePlayers(dt) {
      this.remotePlayers.forEach(remote => {
        // Smooth interpolation
        remote.mesh.position.x += (remote.targetX - remote.mesh.position.x) * 0.35;
        remote.mesh.position.z += (remote.targetZ - remote.mesh.position.z) * 0.35;
        remote.mesh.rotation.y += (remote.targetAngle - remote.mesh.rotation.y) * 0.35;
        remote.mesh.rotation.x = remote.pitch;
        remote.mesh.rotation.z = remote.roll;

        if (remote.mesh.wheels) {
          remote.mesh.wheels.forEach(w => w.rotation.x += remote.speed * dt * 2.5);
        }
      });
    }

    updatePvPCollisions() {
      if (this.remotePlayers.size === 0) return;
      const myCar = CARS[this.selectedCarIndex];
      const m1 = myCar.mass;

      this.remotePlayers.forEach(remote => {
        const dx = this.x - remote.mesh.position.x;
        const dz = this.z - remote.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 2.8) {
          const m2 = 1400; // estimated remote car mass
          const nx = (dx / dist) || 0;
          const nz = (dz / dist) || 1;

          const relSpeed = Math.abs(this.speed - remote.speed) + 8;
          const impulse = ((1 + 0.6) * relSpeed * (m1 * m2)) / (m1 + m2);

          // Local recoil & damage
          this.vx += nx * (impulse / m1) * 0.45;
          this.vz += nz * (impulse / m1) * 0.45;
          this.speed *= 0.5;

          const damage = Math.min(40, Math.round((impulse / m1) * 2.8));
          this.health = Math.max(5, this.health - damage);
          this.screenShake = 1.2;
          window.soundEngine.playCrash();

          Models3D.updateDamageDeformation(this.playerMesh, this.health);

          // Broadcast RAM to remote player over WebSocket
          if (this.lanWs && this.lanWs.readyState === 1) { // 1 = OPEN
            this.lanWs.send(JSON.stringify({
              type: 'PVP_RAM',
              targetId: remote.id,
              damage: damage,
              impulse: impulse / m2,
              nx: -nx,
              nz: -nz,
              x: this.x,
              z: this.z
            }));
          }

          for (let i = 0; i < 20; i++) {
            this.spawnParticle(this.x - nx * 1.2, 1.2, this.z - nz * 1.2, [0xffcc00, 0xff0055, 0xffffff]);
          }

          this.showQuip(`💥 আপনি ${remote.name}-কে প্রচণ্ড ধাক্কা দিলেন! (-${damage}% HP)`);
        }
      });
    }

    // ==========================================
    // 3D COMBAT & WEAPONS SYSTEM (Rockets & Mines)
    // ==========================================
    updateWeaponHUD() {
      const rocketAmmoEl = document.getElementById('ammo-rocket');
      const mineAmmoEl = document.getElementById('ammo-mine');
      if (rocketAmmoEl) rocketAmmoEl.textContent = this.ammoRockets;
      if (mineAmmoEl) mineAmmoEl.textContent = this.ammoMines;
    }

    fireRocket() {
      if (this.ammoRockets <= 0 || this.rocketCooldown > 0) return;
      this.ammoRockets--;
      this.rocketCooldown = 0.8;
      this.updateWeaponHUD();

      const fwdX = Math.sin(this.angle);
      const fwdZ = Math.cos(this.angle);
      const rX = this.x + fwdX * 2.8;
      const rY = 0.75;
      const rZ = this.z + fwdZ * 2.8;
      const speed = 80;

      const rMesh = Models3D.createRocketProjectile();
      rMesh.position.set(rX, rY, rZ);
      rMesh.rotation.y = this.angle;
      this.scene.add(rMesh);

      const rocketId = 'rkt_' + Math.random().toString(36).substring(2, 8);
      this.activeRockets.push({
        id: rocketId,
        mesh: rMesh,
        x: rX,
        y: rY,
        z: rZ,
        vx: fwdX * speed,
        vz: fwdZ * speed,
        angle: this.angle,
        life: 1.8,
        isMine: true
      });

      window.soundEngine.playShootRocket();
      this.showQuip('🚀 রকেট ফায়ার করলেন! (Rocket fired!)');

      if (this.lanWs && this.lanWs.readyState === 1) {
        this.lanWs.send(JSON.stringify({
          type: 'SHOOT_ROCKET',
          rocketId: rocketId,
          originX: rX,
          originY: rY,
          originZ: rZ,
          angle: this.angle,
          speed: speed
        }));
      }
    }

    dropMine() {
      if (this.ammoMines <= 0 || this.mineCooldown > 0) return;
      this.ammoMines--;
      this.mineCooldown = 1.5;
      this.updateWeaponHUD();

      const fwdX = Math.sin(this.angle);
      const fwdZ = Math.cos(this.angle);
      const mX = this.x - fwdX * 2.8;
      const mZ = this.z - fwdZ * 2.8;

      const mMesh = Models3D.createSpikeTrap();
      mMesh.position.set(mX, 0.05, mZ);
      this.scene.add(mMesh);

      const mineId = 'mine_' + Math.random().toString(36).substring(2, 8);
      this.activeMines.push({
        id: mineId,
        mesh: mMesh,
        x: mX,
        z: mZ,
        dropperId: this.myId,
        life: 40
      });

      window.soundEngine.playMineDrop();
      this.showQuip('💣 রাস্তায় স্পাইক মাইন পাতলেন! (Spike mine dropped!)');

      if (this.lanWs && this.lanWs.readyState === 1) {
        this.lanWs.send(JSON.stringify({
          type: 'DROP_MINE',
          mineId: mineId,
          x: mX,
          z: mZ
        }));
      }
    }

    spawnRemoteRocket(data) {
      const rMesh = Models3D.createRocketProjectile();
      rMesh.position.set(data.originX, data.originY || 0.75, data.originZ);
      rMesh.rotation.y = data.angle;
      this.scene.add(rMesh);

      const fwdX = Math.sin(data.angle);
      const fwdZ = Math.cos(data.angle);
      const speed = data.speed || 80;

      this.activeRockets.push({
        id: data.rocketId,
        mesh: rMesh,
        x: data.originX,
        y: data.originY || 0.75,
        z: data.originZ,
        vx: fwdX * speed,
        vz: fwdZ * speed,
        angle: data.angle,
        life: 1.8,
        isMine: false,
        shooterId: data.shooterId
      });

      window.soundEngine.playShootRocket();
    }

    spawnRemoteMine(data) {
      const mMesh = Models3D.createSpikeTrap();
      mMesh.position.set(data.x, 0.05, data.z);
      this.scene.add(mMesh);

      this.activeMines.push({
        id: data.mineId,
        mesh: mMesh,
        x: data.x,
        z: data.z,
        dropperId: data.dropperId,
        life: 40
      });

      window.soundEngine.playMineDrop();
    }

    handleRocketHitEvent(msg) {
      window.soundEngine.playExplosion();
      for (let i = 0; i < 28; i++) {
        this.spawnParticle(msg.hitX || this.x, 1.2, msg.hitZ || this.z, [0xff0044, 0xffa500, 0xffffff, 0x333333]);
      }

      if (msg.targetId === this.myId) {
        this.health = Math.max(5, this.health - msg.damage);
        this.vx += (msg.nx || 0) * (msg.impulse || 35) * 0.45;
        this.vz += (msg.nz || 1) * (msg.impulse || 35) * 0.45;
        this.spinVy = 6.2;
        this.screenShake = 1.4;
        Models3D.updateDamageDeformation(this.playerMesh, this.health);
        this.showQuip(`🚀 ${msg.attackerName} আপনাকে রকেট মেরে উড়াল দিলো! (-${msg.damage}% HP)`);
      }
    }

    handleMineHitEvent(msg) {
      const idx = this.activeMines.findIndex(m => m.id === msg.mineId);
      if (idx !== -1) {
        this.scene.remove(this.activeMines[idx].mesh);
        this.activeMines.splice(idx, 1);
      }

      window.soundEngine.playMineDetonate();
      for (let i = 0; i < 22; i++) {
        this.spawnParticle(msg.x || this.x, 0.6, msg.z || this.z, [0xff5500, 0xffff00, 0xff0000]);
      }

      if (msg.targetId === this.myId) {
        this.health = Math.max(5, this.health - msg.damage);
        this.speed *= 0.25;
        this.spinVy = 8.5;
        this.screenShake = 1.3;
        Models3D.updateDamageDeformation(this.playerMesh, this.health);
        this.showQuip('💣 স্পাইক মাইনে চাকা নষ্ট! গাড়ি ৩৬০° ঘুরপাক খেলো!');
      }
    }

    updateWeapons(dt) {
      // Passive Ammo Recharge
      if (this.ammoRockets < 3) {
        this.rocketReloadTimer += dt;
        if (this.rocketReloadTimer >= 4.5) {
          this.ammoRockets++;
          this.rocketReloadTimer = 0;
          this.updateWeaponHUD();
        }
      }
      if (this.ammoMines < 2) {
        this.mineReloadTimer += dt;
        if (this.mineReloadTimer >= 7.5) {
          this.ammoMines++;
          this.mineReloadTimer = 0;
          this.updateWeaponHUD();
        }
      }
      if (this.rocketCooldown > 0) this.rocketCooldown -= dt;
      if (this.mineCooldown > 0) this.mineCooldown -= dt;

      // Update Active Rockets
      for (let i = this.activeRockets.length - 1; i >= 0; i--) {
        const r = this.activeRockets[i];
        r.life -= dt;
        r.x += r.vx * dt;
        r.z += r.vz * dt;
        r.mesh.position.set(r.x, r.y, r.z);

        // Rocket exhaust particle trail
        if (Math.random() < 0.75) {
          this.spawnParticle(r.x, r.y, r.z, [0x00f0ff, 0xff9900, 0xff2200]);
        }

        let exploded = false;

        // Collision with remote players (if local fired)
        if (r.isMine) {
          this.remotePlayers.forEach(remote => {
            if (exploded) return;
            const dist = Math.hypot(r.x - remote.mesh.position.x, r.z - remote.mesh.position.z);
            if (dist < 3.2) {
              exploded = true;
              const nx = (r.vx / 80) || 0;
              const nz = (r.vz / 80) || 1;
              if (this.lanWs && this.lanWs.readyState === 1) {
                this.lanWs.send(JSON.stringify({
                  type: 'ROCKET_HIT',
                  targetId: remote.id,
                  damage: 25,
                  impulse: 38,
                  nx: nx,
                  nz: nz,
                  hitX: r.x,
                  hitZ: r.z
                }));
              }
              this.showQuip(`🚀 সরাসরি আঘাত! ${remote.name}-কে রকেট দিয়ে ধ্বংস করলেন!`);
            }
          });

          // Collision with AI rival (if in solo race)
          if (!exploded && this.aiRival && this.aiRival.mesh) {
            const dist = Math.hypot(r.x - this.aiRival.x, r.z - this.aiRival.z);
            if (dist < 3.2) {
              exploded = true;
              this.aiRival.health = Math.max(5, this.aiRival.health - 25);
              this.aiRival.spinVy = 7.0;
              this.aiRival.speed *= 0.3;
              Models3D.updateDamageDeformation(this.aiRival.mesh, this.aiRival.health);
              window.soundEngine.playExplosion();
              for (let p = 0; p < 25; p++) {
                this.spawnParticle(r.x, 1.2, r.z, [0xff4500, 0xffd700, 0xffffff]);
              }
              this.showQuip(`🚀 দারুণ শট! AI প্রতিদ্বন্দ্বীকে রকেট দিয়ে উড়িয়ে দিলেন!`);
            }
          }
        }

        // Collision with traffic vehicles
        if (!exploded) {
          for (const t of this.traffic) {
            const dist = Math.hypot(r.x - t.x, r.z - t.z);
            if (dist < t.radius + 1.2) {
              exploded = true;
              t.speed = 0;
              t.spinVy = 9.0;
              window.soundEngine.playExplosion();
              for (let p = 0; p < 22; p++) {
                this.spawnParticle(r.x, 1.2, r.z, [0xff9900, 0xff0055, 0x333333]);
              }
              break;
            }
          }
        }

        // Collision with city buildings
        if (!exploded && City3D.checkCollision(r.x, r.z, 0.8).collided) {
          exploded = true;
          window.soundEngine.playExplosion();
          for (let p = 0; p < 18; p++) {
            this.spawnParticle(r.x, 1.2, r.z, [0xff5500, 0x888888]);
          }
        }

        if (exploded || r.life <= 0) {
          this.scene.remove(r.mesh);
          this.activeRockets.splice(i, 1);
        }
      }

      // Update Active Mines
      for (let i = this.activeMines.length - 1; i >= 0; i--) {
        const m = this.activeMines[i];
        m.life -= dt;

        // Pulsate red beacon
        if (m.mesh.beaconMesh) {
          const s = 1 + Math.sin(performance.now() * 0.012) * 0.3;
          m.mesh.beaconMesh.scale.set(s, s, s);
        }

        let triggered = false;

        // Check if local player hit opponent mine
        if (m.dropperId !== this.myId) {
          const dist = Math.hypot(this.x - m.x, this.z - m.z);
          if (dist < 2.3) {
            triggered = true;
            if (this.lanWs && this.lanWs.readyState === 1) {
              this.lanWs.send(JSON.stringify({
                type: 'MINE_HIT',
                mineId: m.id,
                targetId: this.myId,
                damage: 20,
                x: m.x,
                z: m.z
              }));
            }
          }
        }

        // Check if AI rival hit mine
        if (!triggered && this.aiRival && this.aiRival.mesh) {
          const dist = Math.hypot(this.aiRival.x - m.x, this.aiRival.z - m.z);
          if (dist < 2.3) {
            triggered = true;
            this.aiRival.health = Math.max(5, this.aiRival.health - 20);
            this.aiRival.spinVy = 8.5;
            this.aiRival.speed *= 0.2;
            Models3D.updateDamageDeformation(this.aiRival.mesh, this.aiRival.health);
            window.soundEngine.playMineDetonate();
            for (let p = 0; p < 22; p++) {
              this.spawnParticle(m.x, 0.6, m.z, [0xff4500, 0xffd700, 0xffffff]);
            }
            this.showQuip('💣 AI প্রতিদ্বন্দ্বী মাইনে পা দিয়ে স্পিন খেলো!');
          }
        }

        if (triggered || m.life <= 0) {
          this.scene.remove(m.mesh);
          this.activeMines.splice(i, 1);
        }
      }
    }

    // ==========================================
    // 1v1 RACE CIRCUIT & SYNCHRONIZED COUNTDOWN
    // ==========================================
    startRaceCountdown(racersList = []) {
      const overlay = document.getElementById('countdown-overlay');
      const numEl = document.getElementById('countdown-number');
      const banglaEl = document.getElementById('countdown-bangla');
      if (overlay) overlay.classList.remove('hidden');

      // Grid position assignment
      const grid0 = { x: -120, z: 22, angle: 0 };
      const grid1 = { x: -125, z: 16, angle: 0 };

      let myGrid = grid0;
      if (Array.isArray(racersList)) {
        const found = racersList.find(r => r.id === this.myId);
        if (found && found.gridPos) {
          myGrid = found.gridPos;
          this.myGridIndex = found.gridIndex;
        }
      }

      // Teleport local car to grid
      this.x = myGrid.x;
      this.z = myGrid.z;
      this.angle = myGrid.angle || 0;
      this.speed = 0;
      this.vx = 0;
      this.vz = 0;
      this.health = 100;
      Models3D.updateDamageDeformation(this.playerMesh, 100);

      this.currentCheckpoint = 1;
      this.currentLap = 1;
      this.raceFinished = false;
      this.raceActive = true;
      this.raceCountdown = 3;
      this.raceCountdownTimer = 1.0;

      if (numEl) numEl.textContent = '3';
      if (banglaEl) banglaEl.textContent = '৩... ২... ১... ভাগো!';
      window.soundEngine.playRaceCountdown(3);

      const raceCard = document.getElementById('race-card');
      if (raceCard) raceCard.classList.remove('hidden');
    }

    startSoloRace() {
      // Spawn AI Rival side-by-side
      if (!this.aiRival) {
        const aiMesh = Models3D.createCarModel('premio');
        this.scene.add(aiMesh);
        const nameTag = Models3D.createPlayerNameTag('SULTANA AI 🤖', '#f43f5e');
        aiMesh.add(nameTag);

        this.aiRival = {
          name: 'SULTANA AI 🤖',
          mesh: aiMesh,
          nameTag: nameTag,
          x: -125,
          z: 16,
          angle: 0,
          speed: 0,
          spinVy: 0,
          health: 100,
          currentCheckpoint: 1,
          currentLap: 1
        };
      } else {
        this.aiRival.x = -125;
        this.aiRival.z = 16;
        this.aiRival.angle = 0;
        this.aiRival.speed = 0;
        this.aiRival.health = 100;
        this.aiRival.currentCheckpoint = 1;
        this.aiRival.currentLap = 1;
        Models3D.updateDamageDeformation(this.aiRival.mesh, 100);
      }

      this.startRaceCountdown([
        { id: this.myId, gridIndex: 0, gridPos: { x: -120, z: 22, angle: 0 } },
        { id: 'ai_rival', gridIndex: 1, gridPos: { x: -125, z: 16, angle: 0 } }
      ]);
    }

    updateRace(dt) {
      // Handle Countdown sequence
      if (this.raceCountdown >= 0) {
        this.raceCountdownTimer -= dt;
        const numEl = document.getElementById('countdown-number');
        const banglaEl = document.getElementById('countdown-bangla');
        const overlay = document.getElementById('countdown-overlay');

        if (this.raceCountdownTimer <= 0) {
          this.raceCountdown--;
          this.raceCountdownTimer = 1.0;

          if (this.raceCountdown === 2) {
            if (numEl) numEl.textContent = '2';
            window.soundEngine.playRaceCountdown(2);
          } else if (this.raceCountdown === 1) {
            if (numEl) numEl.textContent = '1';
            window.soundEngine.playRaceCountdown(1);
          } else if (this.raceCountdown === 0) {
            if (numEl) numEl.textContent = 'GO!';
            if (banglaEl) banglaEl.textContent = 'ভাগো! পূর্ণ গতিতে ছোটেন!';
            window.soundEngine.playRaceCountdown(0);
            this.raceStartTime = performance.now();
          } else if (this.raceCountdown < 0) {
            if (overlay) overlay.classList.add('hidden');
          }
        }
      }

      if (!this.raceActive || this.raceFinished) return;

      // Checkpoint detection
      const targetCp = City3D.checkpoints[this.currentCheckpoint];
      if (targetCp) {
        const distToCp = Math.hypot(this.x - targetCp.x, this.z - targetCp.z);

        if (distToCp < 22) {
          // Passed Checkpoint!
          window.soundEngine.playCheckpointChime();
          for (let p = 0; p < 20; p++) {
            this.spawnParticle(targetCp.x, 5.0, targetCp.z, [0x00f0ff, 0xffd700, 0xffffff]);
          }

          this.score += 500;
          this.currentCheckpoint = (this.currentCheckpoint + 1) % City3D.checkpoints.length;

          if (this.lanWs && this.lanWs.readyState === 1) {
            this.lanWs.send(JSON.stringify({
              type: 'CHECKPOINT_PASS',
              checkpointIndex: this.currentCheckpoint,
              lap: this.currentLap
            }));
          }

          // Completed a full lap!
          if (this.currentCheckpoint === 1) {
            this.currentLap++;
            if (this.currentLap > this.totalLaps) {
              // Race Finished - VICTORY!
              this.raceFinished = true;
              const elapsedSec = Math.round((performance.now() - this.raceStartTime) / 1000);
              const m = Math.floor(elapsedSec / 60);
              const s = elapsedSec % 60;
              const timeStr = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

              if (this.lanWs && this.lanWs.readyState === 1) {
                this.lanWs.send(JSON.stringify({
                  type: 'RACE_FINISHED',
                  finalTime: timeStr
                }));
              }
              this.showWinnerModal(this.myName, timeStr);
            } else {
              this.showQuip(`🏁 ল্যাপ ${this.currentLap - 1} সম্পন্ন! ফাইনাল ল্যাপে স্পীড বাড়ান!`);
            }
          } else {
            this.showQuip(`⚡ চেকপয়েন্ট পাস করলেন! (+500 PTS)`);
          }
        }
      }

      // Update Navigation Compass Arrow to next checkpoint
      if (targetCp) {
        const dx = targetCp.x - this.x;
        const dz = targetCp.z - this.z;
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        if (this.navCompass) this.navCompass.classList.remove('hidden');
        if (this.compassArrow) this.compassArrow.style.transform = `rotate(${diff}rad)`;
        if (this.compassDist) {
          const d = Math.round(Math.hypot(dx, dz));
          this.compassDist.textContent = `${d}m`;
        }
      }

      // Calculate Real-time Race Standing (1st vs 2nd)
      let isFirst = true;
      const myProgress = this.currentLap * 1000 + this.currentCheckpoint * 100 - (targetCp ? Math.hypot(this.x - targetCp.x, this.z - targetCp.z) : 0);

      this.remotePlayers.forEach(r => {
        const rLap = r.currentLap || 1;
        const rCp = r.currentCheckpoint || 1;
        const rTarget = City3D.checkpoints[rCp] || targetCp;
        const rDist = rTarget ? Math.hypot(r.mesh.position.x - rTarget.x, r.mesh.position.z - rTarget.z) : 50;
        const rProg = rLap * 1000 + rCp * 100 - rDist;
        if (rProg > myProgress) isFirst = false;
      });

      if (this.aiRival) {
        const aiTarget = City3D.checkpoints[this.aiRival.currentCheckpoint] || targetCp;
        const aiDist = aiTarget ? Math.hypot(this.aiRival.x - aiTarget.x, this.aiRival.z - aiTarget.z) : 50;
        const aiProg = this.aiRival.currentLap * 1000 + this.aiRival.currentCheckpoint * 100 - aiDist;
        if (aiProg > myProgress) isFirst = false;
      }

      const lapEl = document.getElementById('race-lap-val');
      const cpEl = document.getElementById('race-cp-val');
      const posEl = document.getElementById('race-pos-val');

      if (lapEl) lapEl.textContent = `${Math.min(this.currentLap, this.totalLaps)}/${this.totalLaps}`;
      if (cpEl) cpEl.textContent = `${this.currentCheckpoint}/6`;
      if (posEl) {
        posEl.textContent = isFirst ? '1st 🥇' : '2nd 🥈';
        posEl.className = isFirst ? 'pos-badge pos-1st' : 'pos-badge pos-2nd';
      }
    }

    updateAiRival(dt) {
      if (!this.aiRival || !this.aiRival.mesh) return;
      const ai = this.aiRival;

      // Spin decay
      if (Math.abs(ai.spinVy) > 0.05) {
        ai.angle += ai.spinVy * dt;
        ai.spinVy *= 0.92;
      }

      if (this.raceCountdown > 0) return;

      const cp = City3D.checkpoints[ai.currentCheckpoint];
      if (cp) {
        const dx = cp.x - ai.x;
        const dz = cp.z - ai.z;
        const dist = Math.hypot(dx, dz);
        const desiredAngle = Math.atan2(dx, dz);

        let angleDiff = desiredAngle - ai.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        ai.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 2.2 * dt);

        const targetSpeed = 36.0;
        ai.speed += (targetSpeed - ai.speed) * 0.8 * dt;

        ai.x += Math.sin(ai.angle) * ai.speed * dt;
        ai.z += Math.cos(ai.angle) * ai.speed * dt;

        if (dist < 22) {
          ai.currentCheckpoint = (ai.currentCheckpoint + 1) % City3D.checkpoints.length;
          if (ai.currentCheckpoint === 1) ai.currentLap++;
        }
      }

      ai.mesh.position.set(ai.x, 0, ai.z);
      ai.mesh.rotation.y = ai.angle;

      if (ai.nameTag && ai.nameTag.updateNameTag) {
        ai.nameTag.updateNameTag(ai.name, ai.health);
      }
    }

    showWinnerModal(winnerName, timeStr = '01:30') {
      this.raceFinished = true;
      window.soundEngine.playVictoryFanfare();

      const modal = document.getElementById('winner-modal');
      const nameEl = document.getElementById('winner-name');
      const timeEl = document.getElementById('winner-time-val');
      const titleEl = document.getElementById('winner-title');

      const isMe = (winnerName === this.myName);
      if (titleEl) titleEl.textContent = isMe ? '🏆 VICTORY! আপনি বিজয়ী! 🏆' : '🏁 RACE FINISHED! রেস সমাপ্ত 🏁';
      if (nameEl) nameEl.textContent = `${winnerName} WINS!`;
      if (timeEl) timeEl.textContent = timeStr;
      if (modal) modal.classList.remove('hidden');

      for (let i = 0; i < 40; i++) {
        this.spawnParticle(this.x, 3, this.z, [0xffd700, 0x00f0ff, 0xff0055, 0xffffff]);
      }
    }

    // ==========================================
    // 3D TRAFFIC WITH DIVERSE BANGLADESHI VEHICLES
    // ==========================================
    spawn3DTraffic() {
      this.traffic = [];

      // Avenues traffic (Mirpur, Nazrul Islam, Satmasjid, Gulshan)
      City3D.avenues.forEach(ave => {
        [-1, 1].forEach(dir => {
          for (let i = 0; i < 3; i++) {
            const laneX = ave.x + (dir * ave.width * 0.25);
            const z = (i * 240) - 260 + (Math.random() * 50 - 25);

            let mesh, type, speed, mass, radius;
            const rand = Math.random();

            if (rand < 0.22) {
              // Cycle Rickshaw with puller & hood art
              mesh = Models3D.createRickshawModel();
              type = 'Rickshaw';
              speed = 6.0;
              mass = 120; // light
              radius = 1.4;
            } else if (rand < 0.42) {
              // Delivery Motorbike (Pathao / Foodpanda)
              const isPathao = Math.random() > 0.5;
              mesh = Models3D.createMotorbikeModel(isPathao);
              type = isPathao ? 'Pathao Bike' : 'Foodpanda Bike';
              speed = 22.0; // fast & agile!
              mass = 220;
              radius = 1.2;
            } else if (rand < 0.65) {
              // Green Auto Rickshaw (CNG)
              mesh = Models3D.createCngModel(false);
              type = 'CNG';
              speed = 14.0;
              mass = 450;
              radius = 1.6;
            } else if (rand < 0.82) {
              // Dhaka Laguna / Human Hauler (লেগুনা)
              mesh = Models3D.createLagunaModel();
              type = 'Laguna';
              speed = 17.0;
              mass = 2100;
              radius = 2.4;
            } else {
              // Heavy Dhaka Local Bus (Shikhor / Balaka / Bikolpo)
              const busNames = ['shikhor', 'balaka', 'bikolpo'];
              mesh = Models3D.createBusModel(busNames[Math.floor(Math.random() * busNames.length)]);
              type = 'Bus';
              speed = 15.5;
              mass = 8500; // massive juggernaut!
              radius = 4.4;
            }

            mesh.position.set(laneX, 0, z);
            mesh.rotation.y = dir > 0 ? 0 : Math.PI;
            this.scene.add(mesh);

            this.traffic.push({
              mesh: mesh,
              x: laneX,
              z: z,
              vx: 0,
              vz: dir * speed,
              dirZ: dir,
              dirX: 0,
              isAvenue: true,
              street: ave,
              speed: speed,
              baseSpeed: speed,
              mass: mass,
              type: type,
              radius: radius,
              honkedTimer: 0,
              spinAngle: 0
            });
          }
        });
      });

      // Cross Streets traffic (Airport Rd, Panthapath, Dhanmondi 27, Old Dhaka)
      City3D.streets.forEach(str => {
        [-1, 1].forEach(dir => {
          for (let k = 0; k < 2; k++) {
            const laneZ = str.z + (dir * str.width * 0.25);
            const x = (k * 300) - 150 + (Math.random() * 60 - 30);

            let mesh, type, speed, mass, radius;
            const rand = Math.random();

            if (rand < 0.3) {
              // Delivery Motorbike
              mesh = Models3D.createMotorbikeModel(true);
              type = 'Pathao Bike';
              speed = 22.0;
              mass = 220;
              radius = 1.2;
            } else if (rand < 0.6) {
              // CNG
              mesh = Models3D.createCngModel(false);
              type = 'CNG';
              speed = 14.0;
              mass = 450;
              radius = 1.6;
            } else if (rand < 0.82) {
              // Laguna
              mesh = Models3D.createLagunaModel();
              type = 'Laguna';
              speed = 17.0;
              mass = 2100;
              radius = 2.4;
            } else {
              // Bus
              mesh = Models3D.createBusModel('balaka');
              type = 'Bus';
              speed = 15.5;
              mass = 8500;
              radius = 4.4;
            }

            mesh.position.set(x, 0, laneZ);
            mesh.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
            this.scene.add(mesh);

            this.traffic.push({
              mesh: mesh,
              x: x,
              z: laneZ,
              vx: dir * speed,
              vz: 0,
              dirZ: 0,
              dirX: dir,
              isAvenue: false,
              street: str,
              speed: speed,
              baseSpeed: speed,
              mass: mass,
              type: type,
              radius: radius,
              honkedTimer: 0,
              spinAngle: 0
            });
          }
        });
      });
    }

    updateTraffic(dt) {
      this.traffic.forEach(car => {
        if (car.honkedTimer > 0) {
          car.honkedTimer -= dt;
          car.speed = car.baseSpeed * 0.45;
        } else {
          car.speed = car.baseSpeed;
        }

        // Recover from impact physics
        car.vx *= 0.95;
        car.vz *= 0.95;

        if (car.isAvenue) {
          car.z += (car.dirZ * car.speed + car.vz) * dt;
          car.x += car.vx * dt;
          if (car.z > 520) car.z = -520;
          if (car.z < -520) car.z = 520;
        } else {
          car.x += (car.dirX * car.speed + car.vx) * dt;
          car.z += car.vz * dt;
          if (car.x > 520) car.x = -520;
          if (car.x < -520) car.x = 520;
        }

        car.mesh.position.set(car.x, 0, car.z);

        // Spin wheels
        if (car.mesh.wheels) {
          car.mesh.wheels.forEach(w => w.rotation.x += car.speed * dt * 2.2);
        }

        // Check collision with player
        const dist = Math.hypot(this.x - car.x, this.z - car.z);
        if (dist < car.radius + 1.8) {
          this.handleMassBasedCollision(car);
        }
      });
    }

    // ==========================================
    // MASS & SIZE BASED COLLISION PHYSICS
    // ==========================================
    handleMassBasedCollision(otherCar) {
      window.soundEngine.playCrash();

      const playerCar = CARS[this.selectedCarIndex];
      const m1 = playerCar.mass;
      const m2 = otherCar.mass;

      const dx = this.x - otherCar.x;
      const dz = this.z - otherCar.z;
      const dist = Math.hypot(dx, dz) || 1;
      const nx = dx / dist;
      const nz = dz / dist;

      // Relative velocity
      const relVx = this.vx - otherCar.vx;
      const relVz = this.vz - otherCar.vz;
      const relSpeed = Math.hypot(relVx, relVz);

      // Elasticity factor
      const e = 0.55;

      // Impulse scalar J = (-(1 + e) * v_rel) / (1/m1 + 1/m2)
      const impulse = ((1 + e) * relSpeed * (m1 * m2)) / (m1 + m2);

      // Apply impulses based on respective masses
      const pImpulse = impulse / m1;
      const oImpulse = impulse / m2;

      this.vx += nx * pImpulse * 0.45;
      this.vz += nz * pImpulse * 0.45;
      this.speed *= (m1 > m2 ? 0.7 : 0.2); // Heavy car keeps more speed!

      // Off-center angular spin torque
      this.spinVy += (Math.random() - 0.5) * pImpulse * 0.35;

      otherCar.vx -= nx * oImpulse * 0.5;
      otherCar.vz -= nz * oImpulse * 0.5;

      // Screen shake proportional to impact force on player
      this.screenShake = Math.min(1.4, pImpulse * 0.08);

      // Metal shards, glass debris & sparks
      for (let i = 0; i < 20; i++) {
        this.spawnParticle((this.x + otherCar.x) / 2, 0.8, (this.z + otherCar.z) / 2, [0xffcc00, 0xdddddd, 0x334155, 0xff0044]);
      }

      // Damage calculation (reduces health, but NO GAME OVER)
      const damage = Math.round((impulse / m1) * 2.5);
      this.health = Math.max(5, this.health - damage); // Never drops below 5%, no game over!

      // Visual battle damage deformation
      Models3D.updateDamageDeformation(this.playerMesh, this.health);

      if (m1 > m2 * 2) {
        this.showQuip(`💥 বড় গাড়ির ধাক্কা! ${otherCar.type} ছিটকে গেলো! (+${Math.round(impulse * 0.1)} pts)`);
        this.score += 150;
      } else if (m2 > m1 * 2) {
        this.showQuip(`🚨 বাসের ধাক্কায় রিবBOUND! মেরামত কিট খুঁজুন!`);
      } else {
        this.showQuip(`💥 মুখোমুখি সংঘর্ষ! গাড়ি অক্ষত — ড্রাইভ করুন!`);
      }
    }

    // Collision with 3D buildings and concrete pillars
    handleBuildingCollision(nx, nz) {
      window.soundEngine.playCrash();

      const hitSpeed = Math.abs(this.speed);
      this.vx += nx * (hitSpeed * 0.5 + 4);
      this.vz += nz * (hitSpeed * 0.5 + 4);
      this.speed *= -0.35;

      this.spinVy += (Math.random() - 0.5) * hitSpeed * 0.22;
      this.screenShake = Math.min(1.2, hitSpeed * 0.05);

      for (let i = 0; i < 18; i++) {
        this.spawnParticle(this.x + nx * 1.6, 1.2, this.z + nz * 1.6, [0xffcc00, 0xff0055, 0x94a3b8, 0xffffff]);
      }

      // Take damage but NEVER game over!
      this.health = Math.max(5, this.health - Math.round(hitSpeed * 0.6));
      Models3D.updateDamageDeformation(this.playerMesh, this.health);
      this.showQuip('🚨 দেয়ালে ক্র্যাশ! মেরামত কিট তুলে নতুন হয়ে যান!');
    }

    // Collision with Hatirjheel Lake stone promenade railings (Water bounce)
    handleLakeCollision(nx, nz) {
      if (window.soundEngine.playSplash) {
        window.soundEngine.playSplash();
      } else {
        window.soundEngine.playCrash();
      }

      const hitSpeed = Math.abs(this.speed);
      this.vx += nx * (hitSpeed * 0.6 + 5);
      this.vz += nz * (hitSpeed * 0.6 + 5);
      this.speed *= -0.3;

      this.screenShake = Math.min(1.2, hitSpeed * 0.05);

      // Water spray particles
      for (let i = 0; i < 24; i++) {
        this.spawnParticle(this.x + nx * 1.5, 1.0, this.z + nz * 1.5, [0x0284c7, 0x38bdf8, 0xffffff, 0x7dd3fc]);
      }

      this.health = Math.max(5, this.health - 6);
      this.showQuip('🌊 হাতিরঝিল লেক প্রমেনেড! পানিতে পড়ার আগেই রেলিংয়ে আটকে গেলেন!');
    }

    // ==========================================
    // 3D WALKING PEDESTRIANS UPDATE LOOP
    // ==========================================
    updatePedestrians(dt) {
      if (!City3D.pedestrians) return;

      City3D.pedestrians.forEach(p => {
        if (p.scaredTimer > 0) {
          p.scaredTimer -= dt;
          // Panic sprint when honked!
          p.walkAnim += dt * p.speed * 8.0;
          if (p.dirZ !== 0) {
            p.z += p.dirZ * p.speed * 2.2 * dt;
            p.x += (p.x > p.baseX ? 2.8 : -2.8) * dt;
          } else {
            p.x += p.dirX * p.speed * 2.2 * dt;
          }
        } else {
          p.walkAnim += dt * p.speed * 3.8;
          if (p.dirZ !== 0) {
            p.z += p.dirZ * p.speed * dt;
            p.x += (p.baseX - p.x) * 0.1;
          } else {
            p.x += p.dirX * p.speed * dt;
          }
        }

        // Animate legs swinging
        if (p.mesh.leftLeg && p.mesh.rightLeg) {
          p.mesh.leftLeg.rotation.x = Math.sin(p.walkAnim) * 0.6;
          p.mesh.rightLeg.rotation.x = -Math.sin(p.walkAnim) * 0.6;
        }

        // Boundaries wrap-around
        if (p.dirZ !== 0) {
          if (p.z > 520) p.z = -520;
          if (p.z < -520) p.z = 520;
        } else {
          if (p.x > 330) p.dirX = -1;
          if (p.x < 155) p.dirX = 1;
        }

        p.mesh.position.set(p.x, 0.15, p.z);
        if (p.dirZ !== 0) {
          p.mesh.rotation.y = p.dirZ > 0 ? 0 : Math.PI;
        } else {
          p.mesh.rotation.y = p.dirX > 0 ? Math.PI / 2 : -Math.PI / 2;
        }

        // Near-miss with player car
        const pDist = Math.hypot(this.x - p.x, this.z - p.z);
        if (pDist < 2.5) {
          p.scaredTimer = 3.0;
          p.x += (this.x > p.x ? -3.0 : 3.0);
          if (!this.quipBanner.classList.contains('show')) {
            const shouts = [
              '🗣️ পথচারী: "এই ভাই দেখে চালান না! রাস্তা কি বাপের?!"',
              '🚶‍♂️ পথচারী: "আরে মামা ফুটপাতে গাড়ি উঠান ক্যান?!"',
              '⚠️ সাবধান! পথচারী প্রায় চাপা পড়ছিলো! নিরাপদে ড্রাইভ করুন!'
            ];
            this.showQuip(shouts[Math.floor(Math.random() * shouts.length)]);
          }
        }
      });
    }

    // ==========================================
    // FLOATING PICKUPS (HEALTH, COINS, CHA)
    // ==========================================
    updatePickups(dt) {
      City3D.pickups.forEach(p => {
        if (!p.collected) {
          // Continuous 3D rotation & hover
          p.mesh.rotation.y += 2.0 * dt;
          p.mesh.position.y = 1.4 + Math.sin(performance.now() * 0.004) * 0.25;

          // Check collection by player
          const dist = Math.hypot(this.x - p.x, this.z - p.z);
          if (dist < 3.2) {
            p.collected = true;
            this.scene.remove(p.mesh);

            window.soundEngine.playChaiPickup();

            if (p.type === 'repair') {
              this.health = 100; // BRAND NEW AGAIN!
              Models3D.updateDamageDeformation(this.playerMesh, 100);
              this.showQuip('🛠️ মেরামত কিট পেলেন! গাড়ি একদম নতুনের মতো (100% Brand New)! ✨');
            } else if (p.type === 'coin') {
              this.score += 250;
              this.showQuip('🪙 ২৫০ টাকা গোল্ড কয়েন বোনাস পেলেন!');
            } else {
              this.health = Math.min(100, this.health + 45);
              this.nitro = 100;
              this.showQuip('☕ গরম দুধ চা! হেলথ ও নাইট্রো রিফিল হলো!');
            }

            // Respawn pickup after 25 seconds
            setTimeout(() => {
              p.collected = false;
              this.scene.add(p.mesh);
            }, 25000);
          }
        }
      });
    }

    // ==========================================
    // HORN MECHANIC
    // ==========================================
    triggerHorn() {
      window.soundEngine.playPlayerHorn();
      this.honkCount++;

      let count = 0;
      this.traffic.forEach(car => {
        const dist = Math.hypot(this.x - car.x, this.z - car.z);
        if (dist < 50) {
          car.honkedTimer = 3.5;
          count++;

          if (car.type === 'Rickshaw') {
            window.soundEngine.playRickshawBell();
            if (car.isAvenue) car.x += (car.x > this.x ? 4.5 : -4.5);
            else car.z += (car.z > this.z ? 4.5 : -4.5);
          } else if (car.type === 'CNG') {
            window.soundEngine.playCngSputter();
            if (car.isAvenue) car.x += (car.x > this.x ? 3.5 : -3.5);
            else car.z += (car.z > this.z ? 3.5 : -3.5);
          } else if (car.type.includes('Bike')) {
            if (car.isAvenue) car.x += (car.x > this.x ? 3.0 : -3.0);
            else car.z += (car.z > this.z ? 3.0 : -3.0);
          } else {
            window.soundEngine.playBusHorn();
          }
        }
      });

      // Pedestrians panic and dodge when honked at!
      if (City3D.pedestrians) {
        City3D.pedestrians.forEach(p => {
          const dist = Math.hypot(this.x - p.x, this.z - p.z);
          if (dist < 45) {
            p.scaredTimer = 3.0;
          }
        });
      }

      if (count > 0) {
        this.score += count * 80;
        this.showQuip(`📢 হর্ন শুনে ${count}টি গাড়ি ও পথচারী সাইড দিলো! (+${count * 80} pts)`);
      }
    }

    showQuip(text) {
      this.quipBanner.textContent = text;
      this.quipBanner.classList.add('show');
      if (this.quipTimeout) clearTimeout(this.quipTimeout);
      this.quipTimeout = setTimeout(() => {
        this.quipBanner.classList.remove('show');
      }, 2800);
    }

    // ==========================================
    // TAXI MISSIONS
    // ==========================================
    startNewTaxiMission() {
      const dest = City3D.destinations[Math.floor(Math.random() * City3D.destinations.length)];
      this.currentMission = {
        dest: dest,
        timeLeft: 60,
        reward: dest.reward
      };

      this.navCompass.classList.remove('hidden');
      document.getElementById('btn-job').textContent = '❌ CANCEL JOB';
      this.missionSubtext.textContent = `Destination: ${dest.name} (${dest.bangla})`;
      this.showQuip(`নতুন ট্রিপ: ${dest.bangla} যাত্রী পৌঁছান! ⏱️`);
    }

    cancelMission() {
      this.currentMission = null;
      this.navCompass.classList.add('hidden');
      document.getElementById('btn-job').textContent = '🚖 START TAXI JOB';
      this.missionSubtext.textContent = 'Free Roaming 3D Dhaka (Invincible Mode 🛡️)';
      this.timeVal.textContent = '--:--';
    }

    updateMissions(dt) {
      if (!this.currentMission) return;

      this.currentMission.timeLeft -= dt;
      const m = Math.floor(Math.max(0, this.currentMission.timeLeft) / 60);
      const s = Math.floor(Math.max(0, this.currentMission.timeLeft) % 60);
      this.timeVal.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;

      const dx = this.currentMission.dest.x - this.x;
      const dz = this.currentMission.dest.z - this.z;
      const dist = Math.hypot(dx, dz);

      const targetAngle = Math.atan2(dx, dz);
      const relAngle = targetAngle - this.angle;
      this.compassArrow.style.transform = `rotate(${relAngle}rad)`;
      this.compassDist.textContent = `${Math.round(dist * 3)}m`;

      if (dist < 20) {
        window.soundEngine.playChaiPickup();
        const earned = this.currentMission.reward + Math.round(this.currentMission.timeLeft * 12);
        this.score += earned;
        this.jobsCompleted++;
        this.health = 100;
        this.nitro = 100;
        this.showQuip(`🎉 গন্তব্যে পৌঁছালেন! +${earned} টাকা ভাড়া পেলেন!`);
        this.startNewTaxiMission();
      } else if (this.currentMission.timeLeft <= 0) {
        this.showQuip('⏰ সময় শেষ! যাত্রী অন্য রিকশায় চলে গেলো!');
        this.cancelMission();
      }
    }

    // ==========================================
    // VEHICLE PHYSICS & UPDATE
    // ==========================================
    update(dt) {
      if (this.gameState !== 'PLAYING') return;

      const car = CARS[this.selectedCarIndex];
      const maxSpeed = car.maxSpeed;
      const accel = car.accel;
      const turnRate = car.turnRate;

      // Nitro
      if (this.keys.nitro && this.nitro > 0 && Math.abs(this.speed) > 5) {
        this.nitroActive = true;
        this.nitro = Math.max(0, this.nitro - dt * 28);
        window.soundEngine.playNitroSound();

        const flameZ = this.z - Math.cos(this.angle) * 2.8;
        const flameX = this.x - Math.sin(this.angle) * 2.8;
        this.spawnParticle(flameX, 0.6, flameZ, [0x00f0ff, 0xff0055, 0xff9900]);
      } else {
        this.nitroActive = false;
        this.nitro = Math.min(100, this.nitro + dt * 8);
      }

      const effectiveMaxSpeed = maxSpeed * (this.nitroActive ? car.nitroPower : 1.0);

      // Gas / Reverse (Input locked during 3-2-1 race countdown)
      if (this.raceCountdown > 0) {
        this.speed = 0;
        this.vx = 0;
        this.vz = 0;
      } else if (this.keys.forward) {
        this.speed = Math.min(effectiveMaxSpeed, this.speed + accel * dt * (this.nitroActive ? 1.8 : 1.0));
      } else if (this.keys.backward) {
        this.speed = Math.max(-maxSpeed * 0.45, this.speed - accel * 1.6 * dt);
      } else {
        this.speed *= Math.pow(0.965, dt * 60);
      }

      // Steering
      const targetSteer = (this.keys.left ? 0.52 : 0) - (this.keys.right ? 0.52 : 0);
      this.steerAngle += (targetSteer - this.steerAngle) * 0.22;

      if (this.playerMesh && this.playerMesh.frontWheels) {
        this.playerMesh.frontWheels.forEach(w => w.rotation.y = this.steerAngle);
      }

      let currentTurn = turnRate * (this.keys.drift ? 1.55 : 1.0);
      const speedRatio = Math.min(1.0, Math.abs(this.speed) / (maxSpeed * 0.4));

      // Suspension pitch (dive on brake, squat on accel)
      if (this.keys.forward) {
        this.pitch = this.pitch * 0.85 + (-0.038 * (this.speed / maxSpeed)) * 0.15;
      } else if (this.keys.backward && Math.abs(this.speed) > 4) {
        this.pitch = this.pitch * 0.85 + (0.065 * Math.min(1.0, Math.abs(this.speed) / 20)) * 0.15;
      } else {
        this.pitch *= 0.88;
      }

      // Suspension roll (body roll on turns and drifts)
      const rollTarget = -this.steerAngle * 0.14 * Math.min(1.0, Math.abs(this.speed) / 22);
      this.roll = this.roll * 0.82 + rollTarget * 0.18;

      // Angular spin momentum from off-center impacts
      this.angle += (this.steerAngle * currentTurn * speedRatio + this.spinVy) * dt * (this.speed >= 0 ? 1 : -1);
      this.spinVy *= Math.pow(0.85, dt * 60);

      // Drift & Lateral grip
      const forwardX = Math.sin(this.angle);
      const forwardZ = Math.cos(this.angle);

      const targetVx = forwardX * this.speed;
      const targetVz = forwardZ * this.speed;

      const grip = this.keys.drift ? car.driftFactor * 0.72 : car.driftFactor;
      this.vx = this.vx * grip + targetVx * (1 - grip);
      this.vz = this.vz * grip + targetVz * (1 - grip);

      this.x += this.vx * dt;
      this.z += this.vz * dt;

      // Keep inside outer ring boundary
      this.x = Math.max(-620, Math.min(620, this.x));
      this.z = Math.max(-620, Math.min(620, this.z));

      // Roll wheels
      if (this.playerMesh && this.playerMesh.wheels) {
        this.playerMesh.wheels.forEach(w => w.rotation.x += this.speed * dt * 2.5);
      }

      // Drift smoke & Tire Screech Audio
      if ((this.keys.drift || (this.keys.backward && Math.abs(this.speed) > 15)) && Math.abs(this.speed) > 10) {
        window.soundEngine.playTireScreech();
        this.spawnParticle(this.x, 0.25, this.z, [0xbbbbbb, 0x888888]);
      }

      // High-damage smoke, steam & fiery embers
      if (this.health < 65 && Math.random() < 0.22) {
        this.spawnParticle(this.x + forwardX * 1.8, 1.1, this.z + forwardZ * 1.8, [0xeeeeee, 0xd4d4d8]);
      }
      if (this.health < 40 && Math.random() < 0.35) {
        this.spawnParticle(this.x, 1.2, this.z, [0x18181b, 0x3f3f46]);
      }
      if (this.health < 20 && Math.random() < 0.38) {
        this.spawnParticle(this.x + forwardX * 1.2, 0.9, this.z + forwardZ * 1.2, [0xff3300, 0xff9900, 0xffcc00]);
      }

      if (this.playerMesh) {
        this.playerMesh.position.set(this.x, 0, this.z);
        this.playerMesh.rotation.y = this.angle;
        this.playerMesh.rotation.x = this.pitch;
        this.playerMesh.rotation.z = this.roll;
      }

      // Visual battle damage deformation
      Models3D.updateDamageDeformation(this.playerMesh, this.health);

      // Collision with 3D buildings, pillars, and Hatirjheel Lake barriers
      const col = City3D.checkCollision(this.x, this.z, 2.2);
      if (col.collided) {
        if (col.isLake) {
          this.handleLakeCollision(col.nx, col.nz);
        } else {
          this.handleBuildingCollision(col.nx, col.nz);
        }
      }

      const kmh = Math.round(Math.abs(this.speed) * 3.6);
      if (kmh > this.topSpeedRecord) this.topSpeedRecord = kmh;

      window.soundEngine.updateEngine(Math.abs(this.speed) / maxSpeed, this.keys.forward, this.nitroActive);

      // Camera follow with dynamic screen shake
      this.updateCamera(dt);

      // Metro Train
      if (City3D.metroTrainMesh) {
        City3D.metroTrainMesh.position.z = (City3D.metroTrainMesh.position.z + 18 * dt);
        if (City3D.metroTrainMesh.position.z > 580) City3D.metroTrainMesh.position.z = -580;
      }

      // Animate Hatirjheel Lake Water Shimmer
      if (City3D.lakeWaterMesh) {
        City3D.lakeWaterMesh.position.y = 0.06 + Math.sin(performance.now() * 0.003) * 0.03;
      }

      this.updateTraffic(dt);
      this.updatePedestrians(dt);
      this.updatePickups(dt);
      this.updateMissions(dt);
      this.updateParticles(dt);

      // Send LAN multiplayer state (20 updates/second)
      this.lanSendTimer += dt;
      if (this.lanSendTimer >= 0.05) {
        this.lanSendTimer = 0;
        if (this.lanWs && this.lanWs.readyState === 1) { // 1 = OPEN
          const car = CARS[this.selectedCarIndex];
          this.lanWs.send(JSON.stringify({
            type: 'UPDATE',
            x: this.x,
            z: this.z,
            angle: this.angle,
            speed: this.speed,
            carType: car.modelType,
            health: this.health,
            pitch: this.pitch,
            roll: this.roll,
            steer: this.steerAngle,
            nitro: this.nitroActive
          }));
        }
      }

      this.updateRemotePlayers(dt);
      this.updatePvPCollisions();

      // Weapons simulation (Rockets & Road Mines)
      this.updateWeapons(dt);

      // Race Mode & Head-to-Head circuit logic
      if (this.gameMode === 'RACE_COMBAT') {
        this.updateRace(dt);
        this.updateAiRival(dt);
      }

      if (Math.random() < 0.002 && !this.quipBanner.classList.contains('show')) {
        const randQuip = QUIPS[Math.floor(Math.random() * QUIPS.length)];
        this.showQuip(randQuip);
      }

      this.updateHUD();
    }

    updateCamera(dt) {
      // Screen shake decay
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
      }
      const shakeX = (Math.random() - 0.5) * this.screenShake * 2.5;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 1.5;

      if (this.cameraMode === 'CHASE') {
        const dist = 14 + (Math.abs(this.speed) / 52) * 5;
        const height = 5.8;

        const targetX = this.x - Math.sin(this.angle) * dist + shakeX;
        const targetZ = this.z - Math.cos(this.angle) * dist;
        const targetY = height + shakeY;

        this.camPos.x += (targetX - this.camPos.x) * 0.14;
        this.camPos.y += (targetY - this.camPos.y) * 0.14;
        this.camPos.z += (targetZ - this.camPos.z) * 0.14;

        this.camTarget.x += (this.x - this.camTarget.x) * 0.2;
        this.camTarget.y += (1.4 - this.camTarget.y) * 0.2;
        this.camTarget.z += (this.z - this.camTarget.z) * 0.2;

        this.camera.position.copy(this.camPos);
        this.camera.lookAt(this.camTarget);
      } else {
        const hoodX = this.x + Math.sin(this.angle) * 1.8 + shakeX;
        const hoodZ = this.z + Math.cos(this.angle) * 1.8;
        this.camera.position.set(hoodX, 1.3 + shakeY, hoodZ);
        this.camera.lookAt(hoodX + Math.sin(this.angle) * 20, 1.2, hoodZ + Math.cos(this.angle) * 20);
      }
    }

    spawnParticle(x, y, z, colors) {
      const geo = new THREE.SphereGeometry(0.3, 4, 4);
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      this.particles.push({
        mesh: mesh,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        vz: (Math.random() - 0.5) * 4,
        life: 0.35,
        maxLife: 0.35
      });
    }

    updateParticles(dt) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.life -= dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.scale.multiplyScalar(0.92);

        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
          i--;
        }
      }
    }

    updateHUD() {
      this.scoreVal.textContent = this.score.toLocaleString();

      const street = City3D.getStreetAt(this.x, this.z);
      this.streetNameVal.textContent = street.name;

      const kmh = Math.round(Math.abs(this.speed) * 3.6);
      this.speedVal.textContent = kmh;

      if (this.speed > 1) {
        if (kmh > 120) this.gearVal.textContent = '5';
        else if (kmh > 90) this.gearVal.textContent = '4';
        else if (kmh > 55) this.gearVal.textContent = '3';
        else if (kmh > 25) this.gearVal.textContent = '2';
        else this.gearVal.textContent = '1';
      } else if (this.speed < -1) {
        this.gearVal.textContent = 'R';
      } else {
        this.gearVal.textContent = 'N';
      }

      this.nitroPercent.textContent = Math.round(this.nitro) + '%';
      this.nitroBarFill.style.width = this.nitro + '%';

      // Update Health Status
      if (this.health >= 80) {
        this.healthVal.textContent = 'BRAND NEW (100% 🛡️)';
        this.healthVal.style.color = '#00e676';
      } else if (this.health >= 40) {
        this.healthVal.textContent = `GOOD CONDITION (${this.health}% 🛠️)`;
        this.healthVal.style.color = '#ffcc00';
      } else {
        this.healthVal.textContent = `SMOKING! GRAB REPAIR KIT (${this.health}%)`;
        this.healthVal.style.color = '#ff3344';
      }
    }

    // ==========================================
    // 2D GPS RADAR MINIMAP
    // ==========================================
    renderMinimap() {
      if (!this.miniCtx) return;
      const m = this.miniCtx;
      const size = this.miniCanvas.width;
      const worldS = City3D.WORLD_SIZE;
      const scale = size / worldS;
      const halfW = worldS / 2;

      m.clearRect(0, 0, size, size);

      m.fillStyle = '#0a101d';
      m.fillRect(0, 0, size, size);

      // Outer Ring Highway
      m.strokeStyle = '#22324f';
      m.lineWidth = 4;
      m.strokeRect(10, 10, size - 20, size - 20);

      // Avenues
      m.fillStyle = '#1e2b42';
      City3D.avenues.forEach(ave => {
        m.fillRect((ave.x + halfW - ave.width / 2) * scale, 10, ave.width * scale, size - 20);
      });

      // Streets
      City3D.streets.forEach(str => {
        m.fillRect(10, (str.z + halfW - str.width / 2) * scale, size - 20, str.width * scale);
      });

      // Hatirjheel Lake on Radar (Blue Water)
      const lk = City3D.lake;
      m.fillStyle = '#0284c7';
      m.fillRect((lk.minX + halfW) * scale, (lk.minZ + halfW) * scale, (lk.maxX - lk.minX) * scale, (lk.maxZ - lk.minZ) * scale);

      // Shapla Chottor
      m.fillStyle = '#0284c7';
      m.beginPath();
      m.arc((City3D.roundabout.x + halfW) * scale, (City3D.roundabout.z + halfW) * scale, 6, 0, Math.PI * 2);
      m.fill();

      // Collectible Pickups on Radar
      City3D.pickups.forEach(p => {
        if (!p.collected) {
          m.fillStyle = p.type === 'repair' ? '#00e676' : (p.type === 'coin' ? '#ffd700' : '#ff9900');
          m.fillRect((p.x + halfW) * scale - 1.5, (p.z + halfW) * scale - 1.5, 3.5, 3.5);
        }
      });

      // Traffic
      this.traffic.forEach(car => {
        m.fillStyle = car.type === 'Bus' ? '#f97316' : (car.type === 'CNG' ? '#00e676' : '#ff1493');
        m.fillRect((car.x + halfW) * scale - 1, (car.z + halfW) * scale - 1, 3, 3);
      });

      // Remote LAN Players on Minimap (Cyan Circles)
      this.remotePlayers.forEach(remote => {
        m.fillStyle = '#00f0ff';
        m.beginPath();
        m.arc((remote.mesh.position.x + halfW) * scale, (remote.mesh.position.z + halfW) * scale, 3.8, 0, Math.PI * 2);
        m.fill();
      });

      // AI Rival on Minimap (Red Circle)
      if (this.aiRival) {
        m.fillStyle = '#f43f5e';
        m.beginPath();
        m.arc((this.aiRival.x + halfW) * scale, (this.aiRival.z + halfW) * scale, 3.8, 0, Math.PI * 2);
        m.fill();
      }

      // Checkpoints Circuit on Minimap
      if (this.gameMode === 'RACE_COMBAT' && City3D.checkpoints) {
        City3D.checkpoints.forEach((cp, idx) => {
          const isTarget = idx === this.currentCheckpoint;
          m.fillStyle = isTarget ? '#ffea00' : '#00f0ff';
          m.fillRect((cp.x + halfW) * scale - (isTarget ? 3 : 2), (cp.z + halfW) * scale - (isTarget ? 3 : 2), isTarget ? 6 : 4, isTarget ? 6 : 4);
        });
      }

      // Mission destination
      if (this.currentMission) {
        m.fillStyle = '#facc15';
        m.beginPath();
        m.arc((this.currentMission.dest.x + halfW) * scale, (this.currentMission.dest.z + halfW) * scale, 4.5, 0, Math.PI * 2);
        m.fill();
      }

      // Player Arrow
      m.save();
      m.translate((this.x + halfW) * scale, (this.z + halfW) * scale);
      m.rotate(this.angle);
      m.fillStyle = '#00f0ff';
      m.beginPath();
      m.moveTo(0, 7);
      m.lineTo(-4, -4);
      m.lineTo(0, -2);
      m.lineTo(4, -4);
      m.closePath();
      m.fill();
      m.restore();
    }

    loop(currentTime) {
      const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      try {
        if (!this.isPaused) {
          this.update(dt);
        }
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
        this.renderMinimap();
      } catch (err) {
        console.error('Error in 3D loop:', err);
      }

      requestAnimationFrame((t) => this.loop(t));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.dhakaCity3DGame = new DhakaCity3DGame();
  });
})();
