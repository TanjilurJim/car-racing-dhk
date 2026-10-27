/**
 * DHAKA CITY 3D - MAIN GAME CONTROLLER (Three.js WebGL)
 * True 3D Chase-Camera Racing across Dhaka City Blocks with Indestructible Car (No Damage Cap).
 */

(function () {
  'use strict';

  const CARS = [
    {
      id: 'premio',
      name: 'TOYOTA PREMIO 1.5',
      nickname: '"The Dhaka Corporate Rocket"',
      modelType: 'premio',
      maxSpeed: 45,
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
      maxSpeed: 43,
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
      maxSpeed: 42,
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
      maxSpeed: 48,
      accel: 34,
      turnRate: 2.9,
      driftFactor: 0.94,
      nitroPower: 1.6
    }
  ];

  const QUIPS = [
    'মামা ডানে কাটেন! মোড়ে ফাঁকা আছে! (Turn right, the intersection is clear!)',
    'রিকশাওয়ালা মামা সাইড দিন! (Uncle rickshaw, move aside!)',
    'শাপলা চত্বরের গোলচক্করে সুন্দর থ্রিডি ড্রিফট! (Sweet 3D drift around Shapla Chottor!)',
    'মেট্রোরেলের নিচে ১২০ কিমি গতিতে ছুটছেন! (Speeding under the Metro Rail!)',
    'পুরান ঢাকার গলিতে ফুল স্পীড টার্ন! (High-speed turn in Old Dhaka!)',
    'হর্ন দিলেন, ট্রাফিক সাইড দিলো! (Honked loud, cleared the road!)',
    'গাড়ি শক্তিশালী! কোনো ড্যামেজ নেই! (Car is indestructible! Keep rolling!)'
  ];

  class DhakaCity3DGame {
    constructor() {
      this.selectedCarIndex = 0;
      this.cameraMode = 'CHASE'; // 'CHASE' or 'HOOD'

      // Three.js Core
      this.container = document.getElementById('webgl-container');
      this.scene = null;
      this.camera = null;
      this.renderer = null;

      // Minimap Canvas
      this.miniCanvas = document.getElementById('minimap');
      this.miniCtx = this.miniCanvas ? this.miniCanvas.getContext('2d') : null;

      // Player Vehicle State
      this.playerMesh = null;
      this.x = -100; // Start on Kazi Nazrul Islam Ave
      this.z = 20;
      this.angle = 0; // Heading in radians
      this.speed = 0;
      this.steerAngle = 0;
      this.vx = 0;
      this.vz = 0;

      // Invincible / No Damage Cap
      this.nitro = 100;
      this.nitroActive = false;
      this.score = 0;
      this.topSpeedRecord = 0;
      this.jobsCompleted = 0;
      this.honkCount = 0;

      // Camera Smooth Follow
      this.camPos = new THREE.Vector3(this.x, 6, this.z - 14);
      this.camTarget = new THREE.Vector3(this.x, 1.5, this.z);

      // Traffic Vehicles
      this.traffic = [];

      // Particle Systems (Nitro flames, tire smoke, sparks)
      this.particles = [];

      // Missions
      this.currentMission = null;

      // Input keys
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

      // Start render loop
      requestAnimationFrame((t) => this.loop(t));
    }

    initThree() {
      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x070b16);
      this.scene.fog = new THREE.FogExp2(0x070b16, 0.0035);

      // Camera (Perspective, FOV 60)
      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.5, 1200);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);

      // Lighting: Dusk / Evening Dhaka Atmosphere
      const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x080820, 0.65);
      this.scene.add(hemiLight);

      // Warm Directional Sun/Moon light
      this.dirLight = new THREE.DirectionalLight(0xffa726, 0.85);
      this.dirLight.position.set(120, 160, 90);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 400;
      const d = 140;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.scene.add(this.dirLight);

      // Build 3D City
      City3D.build(this.scene);

      // Spawn 3D Traffic
      this.spawn3DTraffic();

      // Window resize
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }

    setupDOM() {
      this.hud = document.getElementById('hud');
      this.startScreen = document.getElementById('start-screen');

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

      // Carousel
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

      // Taxi Job button
      document.getElementById('btn-job').onclick = () => {
        if (!this.currentMission) {
          this.startNewTaxiMission();
        } else {
          this.cancelMission();
        }
      };

      // Audio toggle
      const musicToggle = document.getElementById('music-toggle');
      musicToggle.onchange = (e) => {
        window.soundEngine.toggle(e.target.checked);
      };

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
      this.statSpeed.style.width = (car.maxSpeed / 50 * 100) + '%';
      this.statHandling.style.width = (car.turnRate / 3.0 * 100) + '%';
      this.statArmor.style.width = '100%';

      // 2D Preview Drawing
      const ctx = this.previewCtx;
      const pw = this.previewCanvas.width;
      const ph = this.previewCanvas.height;
      ctx.clearRect(0, 0, pw, ph);

      // Draw stylized car preview
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

      // Create / swap player 3D car mesh
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

      // Reset state
      this.x = -100; // on Kazi Nazrul Islam Ave
      this.z = 20;
      this.angle = 0; // facing along street
      this.speed = 0;
      this.steerAngle = 0;
      this.vx = 0;
      this.vz = 0;
      this.nitro = 100;
      this.score = 0;
      this.honkCount = 0;
      this.jobsCompleted = 0;

      this.gameState = 'PLAYING';
      this.startScreen.classList.add('hidden');
      this.hud.classList.remove('hidden');

      this.showQuip('৩ডি ঢাকা শহরে যাত্রা শুরু! কোনো ড্যামেজ নেই — ফুল স্পীডে ছুটুন! 🏎️');
    }

    // ==========================================
    // 3D TRAFFIC SYSTEM
    // ==========================================
    spawn3DTraffic() {
      this.traffic = [];

      // Avenues traffic
      City3D.avenues.forEach(ave => {
        // 2 cars northbound, 2 cars southbound
        [-1, 1].forEach(dir => {
          for (let i = 0; i < 2; i++) {
            const laneX = ave.x + (dir * ave.width * 0.25);
            const z = (i * 260) - 200 + (Math.random() * 60 - 30);

            // Alternate Rickshaw, CNG, Bus
            let mesh, type, speed;
            const rand = Math.random();
            if (rand < 0.4) {
              mesh = Models3D.createRickshawModel();
              type = 'Rickshaw';
              speed = 5.5;
            } else if (rand < 0.75) {
              mesh = Models3D.createCngModel(false);
              type = 'CNG';
              speed = 13.0;
            } else {
              mesh = Models3D.createBusModel('shikhor');
              type = 'Bus';
              speed = 17.0;
            }

            mesh.position.set(laneX, 0, z);
            mesh.rotation.y = dir > 0 ? 0 : Math.PI;
            this.scene.add(mesh);

            this.traffic.push({
              mesh: mesh,
              x: laneX,
              z: z,
              dirZ: dir,
              dirX: 0,
              isAvenue: true,
              street: ave,
              speed: speed,
              baseSpeed: speed,
              type: type,
              radius: type === 'Bus' ? 4.0 : 1.6,
              honkedTimer: 0
            });
          }
        });
      });

      // Streets traffic
      City3D.streets.forEach(str => {
        [-1, 1].forEach(dir => {
          const laneZ = str.z + (dir * str.width * 0.25);
          const x = (Math.random() * 400 - 200);

          const mesh = Math.random() < 0.5 ? Models3D.createCngModel(false) : Models3D.createBusModel('balaka');
          const type = mesh.children.length > 8 ? 'Bus' : 'CNG';
          const speed = type === 'Bus' ? 17.0 : 13.0;

          mesh.position.set(x, 0, laneZ);
          mesh.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          this.scene.add(mesh);

          this.traffic.push({
            mesh: mesh,
            x: x,
            z: laneZ,
            dirZ: 0,
            dirX: dir,
            isAvenue: false,
            street: str,
            speed: speed,
            baseSpeed: speed,
            type: type,
            radius: type === 'Bus' ? 4.0 : 1.6,
            honkedTimer: 0
          });
        });
      });
    }

    updateTraffic(dt) {
      this.traffic.forEach(car => {
        if (car.honkedTimer > 0) {
          car.honkedTimer -= dt;
          car.speed = car.baseSpeed * 0.4;
        } else {
          car.speed = car.baseSpeed;
        }

        if (car.isAvenue) {
          car.z += car.dirZ * car.speed * dt;
          if (car.z > 550) car.z = -550;
          if (car.z < -550) car.z = 550;
        } else {
          car.x += car.dirX * car.speed * dt;
          if (car.x > 550) car.x = -550;
          if (car.x < -550) car.x = 550;
        }

        car.mesh.position.set(car.x, 0, car.z);

        // Spin wheels
        if (car.mesh.wheels) {
          car.mesh.wheels.forEach(w => w.rotation.x += car.speed * dt * 2.0);
        }

        // Collision with player
        const dist = Math.hypot(this.x - car.x, this.z - car.z);
        if (dist < car.radius + 1.8) {
          this.handleCrash(car.x, car.z, car.type);
        }
      });
    }

    // ==========================================
    // CRASH HANDLER (NO DAMAGE CAP — INDESTRUCTIBLE)
    // ==========================================
    handleCrash(otherX, otherZ, otherName = 'Obstacle') {
      window.soundEngine.playCrash();

      const dx = this.x - otherX;
      const dz = this.z - otherZ;
      const len = Math.hypot(dx, dz) || 1;
      const nx = dx / len;
      const nz = dz / len;

      // Realistic physical rebound impulse
      this.vx += nx * 14;
      this.vz += nz * 14;
      this.speed *= -0.3;

      // Spawn bright spark particles
      for (let i = 0; i < 18; i++) {
        this.spawnParticle(this.x + nx * 1.5, 1.2, this.z + nz * 1.5, [0xffcc00, 0xff0055, 0xffffff]);
      }

      if (otherName === 'Bus') {
        this.showQuip('💥 বাসের সাথে ধাক্কা! নো প্রবলেম, গাড়ি বুলেটপ্রুফ!');
      } else if (otherName === 'Building') {
        this.showQuip('🚨 দেয়ালে ক্র্যাশ! বাউন্স করে ফুল স্পীডে ছুটুন!');
      } else {
        this.showQuip('⚠️ ট্রাফিকের সাথে ধাক্কা লাগলো! গাড়ি অক্ষত!');
      }
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
        if (dist < 45) {
          car.honkedTimer = 3.5;
          count++;

          if (car.type === 'Rickshaw') {
            window.soundEngine.playRickshawBell();
            if (car.isAvenue) car.x += (car.x > this.x ? 4 : -4);
            else car.z += (car.z > this.z ? 4 : -4);
          } else if (car.type === 'CNG') {
            window.soundEngine.playCngSputter();
            if (car.isAvenue) car.x += (car.x > this.x ? 3 : -3);
            else car.z += (car.z > this.z ? 3 : -3);
          } else {
            window.soundEngine.playBusHorn();
          }
        }
      });

      if (count > 0) {
        this.score += count * 75;
        this.showQuip(`📢 হর্ন শুনে ${count}টি গাড়ি সাইড দিলো! (+${count * 75} pts)`);
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
    // TAXI / CHAI DELIVERY MISSIONS
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

      // Compass pointer angle
      const targetAngle = Math.atan2(dx, dz);
      const relAngle = targetAngle - this.angle;
      this.compassArrow.style.transform = `rotate(${relAngle}rad)`;
      this.compassDist.textContent = `${Math.round(dist * 3)}m`;

      if (dist < 18) {
        // Arrived at destination!
        window.soundEngine.playChaiPickup();
        const earned = this.currentMission.reward + Math.round(this.currentMission.timeLeft * 10);
        this.score += earned;
        this.jobsCompleted++;
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

      // Nitro management
      if (this.keys.nitro && this.nitro > 0 && Math.abs(this.speed) > 5) {
        this.nitroActive = true;
        this.nitro = Math.max(0, this.nitro - dt * 30);
        window.soundEngine.playNitroSound();

        // Spawn 3D blue flame particles behind car
        const flameZ = this.z - Math.cos(this.angle) * 2.8;
        const flameX = this.x - Math.sin(this.angle) * 2.8;
        this.spawnParticle(flameX, 0.6, flameZ, [0x00f0ff, 0xff0055, 0xff9900]);
      } else {
        this.nitroActive = false;
        this.nitro = Math.min(100, this.nitro + dt * 8);
      }

      const effectiveMaxSpeed = maxSpeed * (this.nitroActive ? car.nitroPower : 1.0);

      // Gas / Brake / Reverse
      if (this.keys.forward) {
        this.speed = Math.min(effectiveMaxSpeed, this.speed + accel * dt * (this.nitroActive ? 1.8 : 1.0));
      } else if (this.keys.backward) {
        this.speed = Math.max(-maxSpeed * 0.4, this.speed - accel * 1.6 * dt);
      } else {
        this.speed *= Math.pow(0.96, dt * 60);
      }

      // Steering with wheel angle
      const targetSteer = (this.keys.left ? 0.5 : 0) - (this.keys.right ? 0.5 : 0);
      this.steerAngle += (targetSteer - this.steerAngle) * 0.2;

      // Visibly turn 3D front wheels
      if (this.playerMesh && this.playerMesh.frontWheels) {
        this.playerMesh.frontWheels.forEach(w => w.rotation.y = this.steerAngle);
      }

      // Apply yaw rotation
      let currentTurn = turnRate * (this.keys.drift ? 1.5 : 1.0);
      const speedRatio = Math.min(1.0, Math.abs(this.speed) / (maxSpeed * 0.4));
      this.angle += this.steerAngle * currentTurn * speedRatio * dt * (this.speed >= 0 ? 1 : -1);

      // Drift & Lateral grip
      const forwardX = Math.sin(this.angle);
      const forwardZ = Math.cos(this.angle);

      const targetVx = forwardX * this.speed;
      const targetVz = forwardZ * this.speed;

      const grip = this.keys.drift ? car.driftFactor * 0.75 : car.driftFactor;
      this.vx = this.vx * grip + targetVx * (1 - grip);
      this.vz = this.vz * grip + targetVz * (1 - grip);

      // Update position
      this.x += this.vx * dt;
      this.z += this.vz * dt;

      // World boundary clamp
      this.x = Math.max(-560, Math.min(560, this.x));
      this.z = Math.max(-560, Math.min(560, this.z));

      // Roll 3D wheels
      if (this.playerMesh && this.playerMesh.wheels) {
        this.playerMesh.wheels.forEach(w => w.rotation.x += this.speed * dt * 2.5);
      }

      // Drift smoke
      if (this.keys.drift && Math.abs(this.speed) > 10) {
        this.spawnParticle(this.x, 0.3, this.z, [0xcccccc, 0x888888]);
      }

      // Update 3D player mesh transform
      if (this.playerMesh) {
        this.playerMesh.position.set(this.x, 0, this.z);
        this.playerMesh.rotation.y = this.angle;
      }

      // Collision with 3D buildings & pillars (NO DAMAGE CAP — CAR BOUNCES!)
      const col = City3D.checkCollision(this.x, this.z, 2.2);
      if (col.collided) {
        this.handleCrash(this.x - col.nx * 3, this.z - col.nz * 3, 'Building');
      }

      // Record top speed in KM/H
      const kmh = Math.round(Math.abs(this.speed) * 3.6);
      if (kmh > this.topSpeedRecord) this.topSpeedRecord = kmh;

      // Update Engine Audio
      window.soundEngine.updateEngine(Math.abs(this.speed) / maxSpeed, this.keys.forward, this.nitroActive);

      // Update 3D Camera (Chase Cam or Hood Cam)
      this.updateCamera(dt);

      // Update 3D Metro Train overhead
      if (City3D.metroTrainMesh) {
        City3D.metroTrainMesh.position.z = (City3D.metroTrainMesh.position.z + 18 * dt);
        if (City3D.metroTrainMesh.position.z > 580) City3D.metroTrainMesh.position.z = -580;
      }

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

      this.updateHUD();
    }

    updateCamera(dt) {
      if (this.cameraMode === 'CHASE') {
        const dist = 14 + (Math.abs(this.speed) / 50) * 4;
        const height = 5.5;

        // Position behind car
        const targetX = this.x - Math.sin(this.angle) * dist;
        const targetZ = this.z - Math.cos(this.angle) * dist;
        const targetY = height;

        this.camPos.x += (targetX - this.camPos.x) * 0.14;
        this.camPos.y += (targetY - this.camPos.y) * 0.14;
        this.camPos.z += (targetZ - this.camPos.z) * 0.14;

        this.camTarget.x += (this.x - this.camTarget.x) * 0.2;
        this.camTarget.y += (1.4 - this.camTarget.y) * 0.2;
        this.camTarget.z += (this.z - this.camTarget.z) * 0.2;

        this.camera.position.copy(this.camPos);
        this.camera.lookAt(this.camTarget);
      } else {
        // Hood / Bumper Cam
        const hoodX = this.x + Math.sin(this.angle) * 1.8;
        const hoodZ = this.z + Math.cos(this.angle) * 1.8;
        this.camera.position.set(hoodX, 1.3, hoodZ);
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

      // Radar background
      m.fillStyle = '#070b16';
      m.fillRect(0, 0, size, size);

      // Avenues
      m.fillStyle = '#1e293b';
      City3D.avenues.forEach(ave => {
        m.fillRect((ave.x + halfW - ave.width / 2) * scale, 0, ave.width * scale, size);
      });

      // Streets
      City3D.streets.forEach(str => {
        m.fillRect(0, (str.z + halfW - str.width / 2) * scale, size, str.width * scale);
      });

      // Shapla Chottor Roundabout
      m.fillStyle = '#0284c7';
      m.beginPath();
      m.arc((City3D.roundabout.x + halfW) * scale, (City3D.roundabout.z + halfW) * scale, 6, 0, Math.PI * 2);
      m.fill();

      // Traffic dots
      this.traffic.forEach(car => {
        m.fillStyle = car.type === 'Bus' ? '#f97316' : (car.type === 'CNG' ? '#00e676' : '#ff1493');
        m.fillRect((car.x + halfW) * scale - 1, (car.z + halfW) * scale - 1, 3, 3);
      });

      // Waypoint Beacon
      if (this.currentMission) {
        m.fillStyle = '#facc15';
        m.beginPath();
        m.arc((this.currentMission.dest.x + halfW) * scale, (this.currentMission.dest.z + halfW) * scale, 4, 0, Math.PI * 2);
        m.fill();
      }

      // Player arrow
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
        this.update(dt);
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
