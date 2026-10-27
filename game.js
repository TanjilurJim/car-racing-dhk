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

      requestAnimationFrame((t) => this.loop(t));
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x101626);
      // Light atmospheric fog so entire city and roads remain visible
      this.scene.fog = new THREE.FogExp2(0x101626, 0.0012);

      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.5, 2000);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);

      // Ambient & Directional Lighting
      const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x111625, 0.75);
      this.scene.add(hemiLight);

      this.dirLight = new THREE.DirectionalLight(0xffb74d, 0.95);
      this.dirLight.position.set(160, 220, 120);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 600;
      const d = 220;
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

      this.gameState = 'PLAYING';
      this.startScreen.classList.add('hidden');
      this.hud.classList.remove('hidden');

      this.showQuip('৩ডি ঢাকা কানেক্টেড রোডে স্বাগতম! ফুল স্পীডে ছুটুন! 🏎️');
    }

    // ==========================================
    // 3D TRAFFIC WITH REALISTIC MASSES
    // ==========================================
    spawn3DTraffic() {
      this.traffic = [];

      // Avenues traffic
      City3D.avenues.forEach(ave => {
        [-1, 1].forEach(dir => {
          for (let i = 0; i < 2; i++) {
            const laneX = ave.x + (dir * ave.width * 0.25);
            const z = (i * 260) - 200 + (Math.random() * 60 - 30);

            let mesh, type, speed, mass;
            const rand = Math.random();
            if (rand < 0.4) {
              mesh = Models3D.createRickshawModel();
              type = 'Rickshaw';
              speed = 5.5;
              mass = 120; // super light!
            } else if (rand < 0.75) {
              mesh = Models3D.createCngModel(false);
              type = 'CNG';
              speed = 13.0;
              mass = 420;
            } else {
              mesh = Models3D.createBusModel('shikhor');
              type = 'Bus';
              speed = 16.0;
              mass = 8500; // massive bus!
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
              radius: type === 'Bus' ? 4.2 : 1.6,
              honkedTimer: 0,
              spinAngle: 0
            });
          }
        });
      });

      // Streets traffic
      City3D.streets.forEach(str => {
        [-1, 1].forEach(dir => {
          const laneZ = str.z + (dir * str.width * 0.25);
          const x = (Math.random() * 400 - 200);

          const isBus = Math.random() > 0.5;
          const mesh = isBus ? Models3D.createBusModel('balaka') : Models3D.createCngModel(false);
          const type = isBus ? 'Bus' : 'CNG';
          const speed = isBus ? 16.0 : 13.0;
          const mass = isBus ? 8500 : 420;

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
            radius: isBus ? 4.2 : 1.6,
            honkedTimer: 0,
            spinAngle: 0
          });
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

      otherCar.vx -= nx * oImpulse * 0.5;
      otherCar.vz -= nz * oImpulse * 0.5;

      // Screen shake proportional to impact force on player
      this.screenShake = Math.min(1.4, pImpulse * 0.08);

      // Sparks
      for (let i = 0; i < 16; i++) {
        this.spawnParticle((this.x + otherCar.x) / 2, 1.2, (this.z + otherCar.z) / 2, [0xffcc00, 0xff3344, 0xffffff]);
      }

      // Damage calculation (reduces health, but NO GAME OVER)
      const damage = Math.round((impulse / m1) * 2.5);
      this.health = Math.max(5, this.health - damage); // Never drops below 5%, no game over!

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

      this.screenShake = Math.min(1.2, hitSpeed * 0.05);

      for (let i = 0; i < 15; i++) {
        this.spawnParticle(this.x + nx * 1.6, 1.2, this.z + nz * 1.6, [0xffcc00, 0xff0055, 0xffffff]);
      }

      // Take damage but NEVER game over!
      this.health = Math.max(5, this.health - Math.round(hitSpeed * 0.6));
      this.showQuip('🚨 দেয়ালে ক্র্যাশ! মেরামত কিট তুলে নতুন হয়ে যান!');
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
          } else {
            window.soundEngine.playBusHorn();
          }
        }
      });

      if (count > 0) {
        this.score += count * 80;
        this.showQuip(`📢 হর্ন শুনে ${count}টি গাড়ি সাইড দিলো! (+${count * 80} pts)`);
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

      // Gas / Reverse
      if (this.keys.forward) {
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
      this.angle += this.steerAngle * currentTurn * speedRatio * dt * (this.speed >= 0 ? 1 : -1);

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

      // Drift smoke
      if (this.keys.drift && Math.abs(this.speed) > 10) {
        this.spawnParticle(this.x, 0.3, this.z, [0xcccccc, 0x888888]);
      }

      // Low health smoke puffs
      if (this.health < 35 && Math.random() < 0.2) {
        this.spawnParticle(this.x, 1.2, this.z, [0x333333, 0x555555]);
      }

      if (this.playerMesh) {
        this.playerMesh.position.set(this.x, 0, this.z);
        this.playerMesh.rotation.y = this.angle;
      }

      // Collision with 3D buildings & pillars
      const col = City3D.checkCollision(this.x, this.z, 2.2);
      if (col.collided) {
        this.handleBuildingCollision(col.nx, col.nz);
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

      this.updateTraffic(dt);
      this.updatePickups(dt);
      this.updateMissions(dt);
      this.updateParticles(dt);

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
