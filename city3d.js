/**
 * DHAKA CITY 3D - CONNECTED STREET NETWORK & CITY BUILDER
 * Features an interconnected grid with outer ring road, dense streetfront buildings,
 * streetlights, Shapla Chottor roundabout, and floating collectible health/coin pickups.
 */

const City3D = {
  WORLD_SIZE: 1400,

  // Avenues (North - South)
  avenues: [
    { id: 'mirpur', name: 'MIRPUR ROAD', bangla: 'মিরপুর রোড', x: -360, width: 32, hasMetro: false },
    { id: 'nazrul', name: 'KAZI NAZRUL ISLAM AVE', bangla: 'কাজী নজরুল ইসলাম এভিনিউ', x: -120, width: 38, hasMetro: true },
    { id: 'satmasjid', name: 'SATMASJID ROAD', bangla: 'সাতমসজিদ রোড', x: 120, width: 32, hasMetro: false },
    { id: 'gulshan', name: 'GULSHAN AVENUE', bangla: 'গুলশান এভিনিউ', x: 360, width: 36, hasMetro: false }
  ],

  // Cross Streets (East - West)
  streets: [
    { id: 'airport', name: 'AIRPORT ROAD', bangla: 'বিমানবন্দর রোড', z: -360, width: 32 },
    { id: 'panthapath', name: 'PANTHAPATH', bangla: 'পান্থপথ', z: -120, width: 32 },
    { id: 'dhanmondi27', name: 'DHANMONDI ROAD 27', bangla: 'ধানমন্ডি ২৭', z: 120, width: 32 },
    { id: 'old_dhaka', name: 'OLD DHAKA HERITAGE WAY', bangla: 'পুরান ঢাকা সড়ক', z: 360, width: 30 }
  ],

  // Outer Ring Highway Connecting the entire city perimeter
  ringRoads: [
    { name: 'DHAKA OUTER BYPASS NORTH', z: -520, width: 36, isHorizontal: true },
    { name: 'DHAKA OUTER BYPASS SOUTH', z: 520, width: 36, isHorizontal: true },
    { name: 'DHAKA RING ROAD WEST', x: -520, width: 36, isHorizontal: false },
    { name: 'DHAKA RING ROAD EAST', x: 520, width: 36, isHorizontal: false }
  ],

  roundabout: { name: 'SHAPLA CHOTTOR', bangla: 'শাপলা চত্বর', x: -120, z: 120, radius: 30 },

  collisionBoxes: [],
  pickups: [],
  destinations: [],

  build(scene) {
    this.collisionBoxes = [];
    this.pickups = [];

    this.buildSkyAndHorizon(scene);
    this.buildGroundAndStreets(scene);
    this.buildRoundabout(scene);
    this.buildBuildings(scene);
    this.buildMetroRail(scene);
    this.buildStreetlights(scene);
    this.buildPickups(scene);
    this.buildDestinations();
  },

  // Beautiful Dusk Sky with distant city horizon glow
  buildSkyAndHorizon(scene) {
    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(850, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x141b2d,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // Warm Sunset Glow on Horizon
    const horizonGeo = new THREE.CylinderGeometry(840, 840, 140, 32, 1, true);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x4a1d24,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.65
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.position.y = 50;
    scene.add(horizon);
  },

  buildGroundAndStreets(scene) {
    const size = this.WORLD_SIZE;

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(size + 400, size + 400);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x1e2638 });
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    const roadLength = 1100;

    // Avenues (North-South)
    this.avenues.forEach(ave => {
      const roadGeo = new THREE.PlaneGeometry(ave.width, roadLength);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(ave.x, 0.02, 0);
      road.receiveShadow = true;
      scene.add(road);

      // Curbs
      const curbL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, roadLength), curbMat);
      curbL.position.set(ave.x - ave.width / 2, 0.15, 0);
      const curbR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, roadLength), curbMat);
      curbR.position.set(ave.x + ave.width / 2, 0.15, 0);
      scene.add(curbL);
      scene.add(curbR);

      // Center Line
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.35, roadLength), yellowStripeMat);
      centerLine.rotateX(-Math.PI / 2);
      centerLine.position.set(ave.x, 0.03, 0);
      scene.add(centerLine);
    });

    // Cross Streets (East-West)
    this.streets.forEach(str => {
      const roadGeo = new THREE.PlaneGeometry(roadLength, str.width);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(0, 0.02, str.z);
      road.receiveShadow = true;
      scene.add(road);

      // Curbs
      const curbT = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.3, 1.2), curbMat);
      curbT.position.set(0, 0.15, str.z - str.width / 2);
      const curbB = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.3, 1.2), curbMat);
      curbB.position.set(0, 0.15, str.z + str.width / 2);
      scene.add(curbT);
      scene.add(curbB);

      // Center Line
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.35), whiteStripeMat);
      centerLine.rotateX(-Math.PI / 2);
      centerLine.position.set(0, 0.03, str.z);
      scene.add(centerLine);
    });

    // Outer Ring Highways (Complete Continuous Perimeter Loop)
    this.ringRoads.forEach(ring => {
      let rMesh;
      if (ring.isHorizontal) {
        rMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadLength + 100, ring.width), asphaltMat);
        rMesh.position.set(0, 0.022, ring.z);
      } else {
        rMesh = new THREE.Mesh(new THREE.PlaneGeometry(ring.width, roadLength + 100), asphaltMat);
        rMesh.position.set(ring.x, 0.022, 0);
      }
      rMesh.rotateX(-Math.PI / 2);
      rMesh.receiveShadow = true;
      scene.add(rMesh);
    });

    // Zebra Crossings at all 4-way intersections
    this.avenues.forEach(ave => {
      this.streets.forEach(str => {
        this.addZebraCrossings(scene, ave.x, str.z, ave.width, str.width, whiteStripeMat);
      });
    });
  },

  addZebraCrossings(scene, ix, iz, aw, sw, mat) {
    const stripeW = 0.9;
    const stripeL = 3.2;
    for (let x = ix - aw / 2 + 2.5; x < ix + aw / 2 - 2.5; x += 2.0) {
      const sN = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, stripeL), mat);
      sN.rotateX(-Math.PI / 2);
      sN.position.set(x, 0.04, iz - sw / 2 - stripeL / 2);
      scene.add(sN);

      const sS = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, stripeL), mat);
      sS.rotateX(-Math.PI / 2);
      sS.position.set(x, 0.04, iz + sw / 2 + stripeL / 2);
      scene.add(sS);
    }
  },

  buildRoundabout(scene) {
    const r = this.roundabout;
    const ringGeo = new THREE.RingGeometry(12, r.radius, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x1e2638, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(r.x, 0.025, r.z);
    scene.add(ring);

    // 3D Monument in Center
    const monument = Models3D.createShaplaMonument();
    monument.position.set(r.x, 0, r.z);
    scene.add(monument);

    this.collisionBoxes.push({
      minX: r.x - 12,
      maxX: r.x + 12,
      minZ: r.z - 12,
      maxZ: r.z + 12
    });
  },

  // Dense Streetfront 3D Buildings
  buildBuildings(scene) {
    const aveX = [-520, ...this.avenues.map(a => a.x), 520];
    const strZ = [-520, ...this.streets.map(s => s.z), 520];

    const bldColors = [
      0x334155, 0x78350f, 0x1e293b, 0x0f766e, 0x475569, 0xb45309, 0x3b82f6
    ];

    const billboardNames = ['বিকাশ', 'রকমারি', 'প্রাণ', 'গ্রামীণফোন', 'দারাজ', 'পাঠাও'];

    for (let i = 0; i < aveX.length - 1; i++) {
      for (let j = 0; j < strZ.length - 1; j++) {
        const left = aveX[i] + 24;
        const right = aveX[i + 1] - 24;
        const top = strZ[j] + 24;
        const bottom = strZ[j + 1] - 24;

        const bw = right - left;
        const bl = bottom - top;

        if (bw > 35 && bl > 35) {
          const subX = bw > 100 ? 3 : 2;
          const subZ = bl > 100 ? 3 : 2;
          const bSizeX = (bw - (subX + 1) * 5) / subX;
          const bSizeZ = (bl - (subZ + 1) * 5) / subZ;

          for (let sx = 0; sx < subX; sx++) {
            for (let sz = 0; sz < subZ; sz++) {
              const x = left + 5 + sx * (bSizeX + 5) + bSizeX / 2;
              const z = top + 5 + sz * (bSizeZ + 5) + bSizeZ / 2;
              const height = 22 + ((sx * 4 + sz * 7) % 6) * 11; // 22m to 77m
              const col = bldColors[(i + j * 2 + sx + sz) % bldColors.length];

              const bGeo = new THREE.BoxGeometry(bSizeX, height, bSizeZ);
              const bMat = new THREE.MeshStandardMaterial({
                color: col,
                roughness: 0.5,
                metalness: 0.2
              });
              const bMesh = new THREE.Mesh(bGeo, bMat);
              bMesh.position.set(x, height / 2, z);
              bMesh.castShadow = true;
              bMesh.receiveShadow = true;
              scene.add(bMesh);

              // Windows Grid Texture (Lit Windows)
              const winGeo = new THREE.BoxGeometry(bSizeX * 1.01, height * 0.85, bSizeZ * 1.01);
              const winMat = new THREE.MeshLambertMaterial({
                color: 0xffffff,
                emissive: 0xffcc44,
                wireframe: true
              });
              const winMesh = new THREE.Mesh(winGeo, winMat);
              winMesh.position.set(x, height / 2, z);
              scene.add(winMesh);

              // Rooftop Accent Trim
              const trimGeo = new THREE.BoxGeometry(bSizeX * 0.96, 0.6, bSizeZ * 0.96);
              const trimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
              const trim = new THREE.Mesh(trimGeo, trimMat);
              trim.position.set(x, height + 0.3, z);
              scene.add(trim);

              // Rooftop Billboard
              if ((sx + sz) % 2 === 0) {
                const bBoardGeo = new THREE.BoxGeometry(bSizeX * 0.7, 3.8, 0.4);
                const bBoardMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
                const bBoard = new THREE.Mesh(bBoardGeo, bBoardMat);
                bBoard.position.set(x, height + 2.5, z + bSizeZ / 2 - 1.2);
                scene.add(bBoard);
              }

              this.collisionBoxes.push({
                minX: x - bSizeX / 2 - 1.0,
                maxX: x + bSizeX / 2 + 1.0,
                minZ: z - bSizeZ / 2 - 1.0,
                maxZ: z + bSizeZ / 2 + 1.0
              });
            }
          }
        }
      }
    }
  },

  // Elevated Metro Rail (MRT Line 6)
  buildMetroRail(scene) {
    const nazrul = this.avenues.find(a => a.id === 'nazrul');
    if (!nazrul) return;

    const trackY = 12.0;
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });

    const totalLen = 1100;
    const girder = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, totalLen), beamMat);
    girder.position.set(nazrul.x, trackY - 0.7, 0);
    scene.add(girder);

    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, totalLen), railMat);
    leftRail.position.set(nazrul.x - 1.8, trackY + 0.2, 0);
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, totalLen), railMat);
    rightRail.position.set(nazrul.x + 1.8, trackY + 0.2, 0);
    scene.add(leftRail);
    scene.add(rightRail);

    // Pillars
    for (let z = -500; z <= 500; z += 42) {
      const isNearInt = this.streets.some(s => Math.abs(s.z - z) < 20);
      if (!isNearInt) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, trackY - 1.4, 16), beamMat);
        col.position.set(nazrul.x, (trackY - 1.4) / 2, z);
        scene.add(col);

        const tBeam = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.2, 3.0), beamMat);
        tBeam.position.set(nazrul.x, trackY - 1.4, z);
        scene.add(tBeam);

        this.collisionBoxes.push({
          minX: nazrul.x - 1.5,
          maxX: nazrul.x + 1.5,
          minZ: z - 1.5,
          maxZ: z + 1.5
        });
      }
    }

    // 3D Metro Train
    this.metroTrainMesh = new THREE.Group();
    const trainLen = 36;
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, trainLen), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    tBody.position.y = 1.7;
    this.metroTrainMesh.add(tBody);

    const gStripe = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.45, trainLen), new THREE.MeshBasicMaterial({ color: 0x15803d }));
    gStripe.position.y = 1.2;
    const rStripe = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.3, trainLen), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    rStripe.position.y = 0.8;
    this.metroTrainMesh.add(gStripe);
    this.metroTrainMesh.add(rStripe);

    const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    mHead.position.set(0, 1.4, trainLen / 2 + 0.1);
    this.metroTrainMesh.add(mHead);

    this.metroTrainMesh.position.set(nazrul.x, trackY + 0.2, 0);
    scene.add(this.metroTrainMesh);
  },

  // Streetlamps along avenues casting warm street atmosphere
  buildStreetlights(scene) {
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });

    this.avenues.forEach(ave => {
      for (let z = -480; z <= 480; z += 60) {
        [-1, 1].forEach(side => {
          const lx = ave.x + side * (ave.width / 2 + 1.8);
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 7.5, 8), lampMat);
          pole.position.set(lx, 3.75, z);
          scene.add(pole);

          const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), lampMat);
          arm.position.set(lx - side * 0.8, 7.4, z);
          scene.add(arm);

          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bulbMat);
          bulb.position.set(lx - side * 1.5, 7.2, z);
          scene.add(bulb);
        });
      }
    });
  },

  // Floating Collectibles: 🛠️ Repair Kits, 🪙 Gold Coins, ☕ Doodh Cha
  buildPickups(scene) {
    const types = ['repair', 'coin', 'cha'];
    const locations = [
      { x: -120, z: -40, type: 'repair' },
      { x: -120, z: 80, type: 'cha' },
      { x: -120, z: 240, type: 'coin' },
      { x: -360, z: -120, type: 'repair' },
      { x: -360, z: 120, type: 'coin' },
      { x: 120, z: -120, type: 'cha' },
      { x: 120, z: 120, type: 'repair' },
      { x: 360, z: 0, type: 'coin' },
      { x: 360, z: 200, type: 'cha' },
      { x: 0, z: -120, type: 'coin' },
      { x: 0, z: 120, type: 'repair' }
    ];

    locations.forEach((loc, idx) => {
      const group = new THREE.Group();
      if (loc.type === 'repair') {
        // Green Cross Repair Kit 🛠️
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x008040 }));
        group.add(box);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.45, 0.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        group.add(crossH);
        group.add(crossV);
      } else if (loc.type === 'coin') {
        // Gold Taka Coin 🪙
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x997700, metalness: 0.9, roughness: 0.2 }));
        coin.rotateZ(Math.PI / 2);
        group.add(coin);
      } else {
        // Hot Doodh Cha Cup ☕
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0x663300 }));
        group.add(cup);
      }

      group.position.set(loc.x, 1.4, loc.z);
      scene.add(group);

      this.pickups.push({
        mesh: group,
        x: loc.x,
        z: loc.z,
        type: loc.type,
        collected: false
      });
    });
  },

  buildDestinations() {
    this.destinations = [
      { name: 'FARMGATE METRO STATION', bangla: 'ফার্মগেট মেট্রো স্টেশন', x: -120, z: -120, reward: 500 },
      { name: 'DHANMONDI 27 CHAI HUB', bangla: 'ধানমন্ডি ২৭ আড্ডা', x: 120, z: 120, reward: 600 },
      { name: 'GULSHAN PINK CITY', bangla: 'গুলশান পিংক সিটি', x: 360, z: -120, reward: 750 },
      { name: 'SHAPLA CHOTTOR ROUNDABOUT', bangla: 'শাপলা চত্বর গোলচক্কর', x: -120, z: 190, reward: 700 },
      { name: 'OLD DHAKA BIRYANI LANE', bangla: 'পুরান ঢাকা বিরিয়ানি', x: -360, z: 360, reward: 850 },
      { name: 'AIRPORT ROAD FLYOVER', bangla: 'বিমানবন্দর রোড', x: 120, z: -360, reward: 650 }
    ];
  },

  checkCollision(px, pz, radius = 1.6) {
    for (const b of this.collisionBoxes) {
      if (px + radius > b.minX && px - radius < b.maxX &&
          pz + radius > b.minZ && pz - radius < b.maxZ) {
        const overlapX1 = (px + radius) - b.minX;
        const overlapX2 = b.maxX - (px - radius);
        const overlapZ1 = (pz + radius) - b.minZ;
        const overlapZ2 = b.maxZ - (pz - radius);

        const minOverlap = Math.min(overlapX1, overlapX2, overlapZ1, overlapZ2);
        let nx = 0, nz = 0;

        if (minOverlap === overlapX1) nx = -1;
        else if (minOverlap === overlapX2) nx = 1;
        else if (minOverlap === overlapZ1) nz = -1;
        else nz = 1;

        return { collided: true, nx, nz };
      }
    }
    return { collided: false };
  },

  getStreetAt(x, z) {
    const distR = Math.hypot(x - this.roundabout.x, z - this.roundabout.z);
    if (distR < this.roundabout.radius + 12) {
      return { name: this.roundabout.name, bangla: this.roundabout.bangla };
    }

    for (const ave of this.avenues) {
      if (Math.abs(x - ave.x) <= ave.width / 2) {
        return { name: ave.name, bangla: ave.bangla };
      }
    }

    for (const str of this.streets) {
      if (Math.abs(z - str.z) <= str.width / 2) {
        return { name: str.name, bangla: str.bangla };
      }
    }

    for (const ring of this.ringRoads) {
      if (ring.isHorizontal && Math.abs(z - ring.z) <= ring.width / 2) {
        return { name: ring.name, bangla: 'ঢাকা রিং রোড' };
      }
      if (!ring.isHorizontal && Math.abs(x - ring.x) <= ring.width / 2) {
        return { name: ring.name, bangla: 'ঢাকা রিং রোড' };
      }
    }

    return { name: 'DHAKA RESIDENTIAL BLOCK', bangla: 'আবাসিক ব্লক' };
  }
};

window.City3D = City3D;
