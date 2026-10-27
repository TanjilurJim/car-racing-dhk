/**
 * DHAKA CITY 3D - CITY MAP, HATIRJHEEL LAKE & BANGLADESHI ARCHITECTURE
 * Features: Hatirjheel Lake (inaccessible with stone railings, water shimmer, arched bridge),
 * Bangladeshi multi-story buildings with authentic storefront signs (Shwapno, Haji Biryani,
 * Lazz Pharma, Chai Tong, Rokomari, bKash, Aarong, PRAN-RFL), balconies, rooftop Gazi water tanks,
 * roadside Tong Tea stalls, street trees, Metro Rail viaduct, and 3D pedestrians.
 */

const City3D = {
  WORLD_SIZE: 1400,

  avenues: [
    { id: 'mirpur', name: 'MIRPUR ROAD', bangla: 'মিরপুর রোড', x: -360, width: 32, hasMetro: false },
    { id: 'nazrul', name: 'KAZI NAZRUL ISLAM AVE', bangla: 'কাজী নজরুল ইসলাম এভিনিউ', x: -120, width: 38, hasMetro: true },
    { id: 'satmasjid', name: 'SATMASJID ROAD', bangla: 'সাতমসজিদ রোড', x: 120, width: 32, hasMetro: false },
    { id: 'gulshan', name: 'GULSHAN AVENUE', bangla: 'গুলশান এভিনিউ', x: 360, width: 36, hasMetro: false }
  ],

  streets: [
    { id: 'airport', name: 'AIRPORT ROAD', bangla: 'বিমানবন্দর রোড', z: -360, width: 32 },
    { id: 'panthapath', name: 'PANTHAPATH', bangla: 'পান্থপথ', z: -120, width: 32 },
    { id: 'dhanmondi27', name: 'DHANMONDI ROAD 27', bangla: 'ধানমন্ডি ২৭', z: 120, width: 32 },
    { id: 'old_dhaka', name: 'OLD DHAKA HERITAGE WAY', bangla: 'পুরান ঢাকা সড়ক', z: 360, width: 30 }
  ],

  ringRoads: [
    { name: 'DHAKA OUTER BYPASS NORTH', z: -520, width: 36, isHorizontal: true },
    { name: 'DHAKA OUTER BYPASS SOUTH', z: 520, width: 36, isHorizontal: true },
    { name: 'DHAKA RING ROAD WEST', x: -520, width: 36, isHorizontal: false },
    { name: 'DHAKA RING ROAD EAST', x: 520, width: 36, isHorizontal: false }
  ],

  // Hatirjheel Lake (Dedicated Southeast Urban Lake Quadrant)
  // Perfectly bounded inside the block between Satmasjid Road (x=120) and Gulshan Ave (x=360),
  // and between Dhanmondi 27 (z=120) and Old Dhaka (z=360). Does not obstruct any road!
  lake: {
    name: 'HATIRJHEEL LAKE',
    bangla: 'হাতিরঝিল লেক',
    minX: 150, maxX: 330,
    minZ: 150, maxZ: 330
  },

  roundabout: { name: 'SHAPLA CHOTTOR', bangla: 'শাপলা চত্বর', x: -120, z: 120, radius: 28 },

  checkpoints: [
    { index: 0, title: 'START / FINISH', name: 'KAZI NAZRUL ISLAM AVE', x: -120, z: 20, rotationY: 0, width: 38, isFinish: true },
    { index: 1, title: 'CHECKPOINT 1', name: 'PANTHAPATH CROSSING', x: -120, z: -120, rotationY: 0, width: 38, isFinish: false },
    { index: 2, title: 'CHECKPOINT 2', name: 'PANTHAPATH EASTWAY', x: 0, z: -120, rotationY: Math.PI / 2, width: 32, isFinish: false },
    { index: 3, title: 'CHECKPOINT 3', name: 'SATMASJID ROAD', x: 120, z: 0, rotationY: 0, width: 32, isFinish: false },
    { index: 4, title: 'CHECKPOINT 4', name: 'HATIRJHEEL LAKE DRIVE', x: 0, z: 120, rotationY: Math.PI / 2, width: 32, isFinish: false },
    { index: 5, title: 'CHECKPOINT 5', name: 'SHAPLA CHOTTOR ROUNDABOUT', x: -120, z: 120, rotationY: 0, width: 38, isFinish: false }
  ],
  checkpointGates: [],

  collisionBoxes: [],
  pickups: [],
  destinations: [],
  pedestrians: [],
  lakeWaterMesh: null,
  metroTrainMesh: null,

  build(scene) {
    this.collisionBoxes = [];
    this.pickups = [];
    this.pedestrians = [];

    this.buildSkyAndHorizon(scene);
    this.buildGroundAndStreets(scene);
    this.buildHatirjheelLake(scene);
    this.buildRoundabout(scene);
    this.buildBangladeshiBuildings(scene);
    this.buildMetroRail(scene);
    this.buildStreetDecorations(scene);
    this.buildStreetlights(scene);
    this.buildPedestrians(scene);
    this.buildPickups(scene);
    this.buildCheckpoints(scene);
    this.buildDestinations();
  },

  buildSkyAndHorizon(scene) {
    // Sky Dome with warm twilight gradient
    const skyGeo = new THREE.SphereGeometry(980, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x1a1528, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // Golden Sunset Horizon Glow Band
    const horizonGeo = new THREE.CylinderGeometry(970, 970, 220, 32, 1, true);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x831843, side: THREE.BackSide, transparent: true, opacity: 0.55 });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.position.y = 70;
    scene.add(horizon);
  },

  buildGroundAndStreets(scene) {
    const size = this.WORLD_SIZE;
    const roadLength = 1140;

    // Full Base Terrain Pavement (Eliminates all black voids!)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x121826, roughness: 0.95 });
    const baseGround = new THREE.Mesh(new THREE.PlaneGeometry(size, size), groundMat);
    baseGround.rotateX(-Math.PI / 2);
    baseGround.position.y = 0;
    baseGround.receiveShadow = true;
    scene.add(baseGround);

    const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x1e2638 });
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    // Avenues (North - South)
    this.avenues.forEach(ave => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(ave.width, roadLength), asphaltMat);
      road.rotateX(-Math.PI / 2);
      road.position.set(ave.x, 0.02, 0);
      road.receiveShadow = true;
      scene.add(road);

      // Raised Sidewalks on left & right
      const swW = 3.5;
      const swL = new THREE.Mesh(new THREE.BoxGeometry(swW, 0.22, roadLength), sidewalkMat);
      swL.position.set(ave.x - ave.width / 2 - swW / 2, 0.11, 0);
      const swR = new THREE.Mesh(new THREE.BoxGeometry(swW, 0.22, roadLength), sidewalkMat);
      swR.position.set(ave.x + ave.width / 2 + swW / 2, 0.11, 0);
      scene.add(swL); scene.add(swR);

      // Curbs
      const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, roadLength), curbMat);
      curbL.position.set(ave.x - ave.width / 2, 0.15, 0);
      const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, roadLength), curbMat);
      curbR.position.set(ave.x + ave.width / 2, 0.15, 0);
      scene.add(curbL); scene.add(curbR);

      // Yellow Center Line
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.4, roadLength), yellowStripeMat);
      centerLine.rotateX(-Math.PI / 2);
      centerLine.position.set(ave.x, 0.03, 0);
      scene.add(centerLine);
    });

    // Cross Streets (East - West)
    this.streets.forEach(str => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, str.width), asphaltMat);
      road.rotateX(-Math.PI / 2);
      road.position.set(0, 0.02, str.z);
      road.receiveShadow = true;
      scene.add(road);

      // Sidewalks
      const swH = 3.5;
      const swT = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.22, swH), sidewalkMat);
      swT.position.set(0, 0.11, str.z - str.width / 2 - swH / 2);
      const swB = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.22, swH), sidewalkMat);
      swB.position.set(0, 0.11, str.z + str.width / 2 + swH / 2);
      scene.add(swT); scene.add(swB);

      // Curbs
      const curbT = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.3, 0.8), curbMat);
      curbT.position.set(0, 0.15, str.z - str.width / 2);
      const curbB = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.3, 0.8), curbMat);
      curbB.position.set(0, 0.15, str.z + str.width / 2);
      scene.add(curbT); scene.add(curbB);

      // White Center Line
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.4), whiteStripeMat);
      centerLine.rotateX(-Math.PI / 2);
      centerLine.position.set(0, 0.03, str.z);
      scene.add(centerLine);
    });

    // Outer Ring Roads (Seamless Dhaka Bypass Loop)
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

    // Zebra Crossings at all 16 major intersections
    this.avenues.forEach(ave => {
      this.streets.forEach(str => {
        this.addZebraCrossings(scene, ave.x, str.z, ave.width, str.width, whiteStripeMat);
      });
    });
  },

  addZebraCrossings(scene, ix, iz, aw, sw, mat) {
    const stripeW = 0.9, stripeL = 3.4;
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

  // ==========================================
  // HATIRJHEEL LAKE 3D (Shimmering Water & Inaccessible Promenade)
  // ==========================================
  buildHatirjheelLake(scene) {
    const lk = this.lake;
    const w = lk.maxX - lk.minX; // 180m wide
    const d = lk.maxZ - lk.minZ; // 180m long
    const cx = (lk.minX + lk.maxX) / 2;
    const cz = (lk.minZ + lk.maxZ) / 2;

    // Shimmering Blue Water Mesh
    const waterGeo = new THREE.PlaneGeometry(w, d, 24, 24);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.75,
      transparent: true,
      opacity: 0.92
    });
    this.lakeWaterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.lakeWaterMesh.position.set(cx, 0.06, cz);
    scene.add(this.lakeWaterMesh);

    // Stone Promenade Barrier Railings (Prevents car access to water!)
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35 });
    const railingH = 1.6;

    // North & South Barrier Walls
    const rN = new THREE.Mesh(new THREE.BoxGeometry(w, railingH, 1.4), railMat);
    rN.position.set(cx, railingH / 2, lk.minZ);
    const rS = new THREE.Mesh(new THREE.BoxGeometry(w, railingH, 1.4), railMat);
    rS.position.set(cx, railingH / 2, lk.maxZ);
    scene.add(rN); scene.add(rS);

    // West & East Barrier Walls
    const rW = new THREE.Mesh(new THREE.BoxGeometry(1.4, railingH, d), railMat);
    rW.position.set(lk.minX, railingH / 2, cz);
    const rE = new THREE.Mesh(new THREE.BoxGeometry(1.4, railingH, d), railMat);
    rE.position.set(lk.maxX, railingH / 2, cz);
    scene.add(rW); scene.add(rE);

    // Hatirjheel Arched Bridge across the lake
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 });

    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, d), bridgeMat);
    bridgeDeck.position.set(cx, 3.2, cz);
    scene.add(bridgeDeck);

    // White Tubular Arches over bridge
    const archGeo = new THREE.TorusGeometry(d * 0.45, 0.8, 12, 32, Math.PI);
    const arch1 = new THREE.Mesh(archGeo, archMat);
    arch1.position.set(cx - 4.5, 3.2, cz);
    arch1.rotation.y = Math.PI / 2;
    const arch2 = new THREE.Mesh(archGeo, archMat);
    arch2.position.set(cx + 4.5, 3.2, cz);
    arch2.rotation.y = Math.PI / 2;
    scene.add(arch1); scene.add(arch2);

    // Water Fountain Jets in Hatirjheel Lake
    const fMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.75 });
    for (let f = 0; f < 3; f++) {
      const fX = cx + (f - 1) * 35;
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2.8, 12, 8), fMat);
      jet.position.set(fX, 6.0, cz - 30);
      scene.add(jet);
    }

    // Floating Lotus / Lily pads in lake
    const padMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    for (let l = 0; l < 8; l++) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(2.5, 8), padMat);
      pad.rotateX(-Math.PI / 2);
      pad.position.set(cx - 50 + (l % 4) * 28, 0.08, cz - 40 + Math.floor(l / 4) * 55);
      scene.add(pad);
    }

    // Lake Billboard "হাতিরঝিল লেক ড্রাইভ • HATIRJHEEL LAKE"
    const signGeo = new THREE.BoxGeometry(26, 4.5, 0.8);
    const signMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(cx, 4.5, lk.minZ - 2.5);
    scene.add(sign);

    // Collision Box: Inaccessible Hatirjheel Lake
    this.collisionBoxes.push({
      minX: lk.minX - 1.5,
      maxX: lk.maxX + 1.5,
      minZ: lk.minZ - 1.5,
      maxZ: lk.maxZ + 1.5,
      isLake: true
    });
  },

  buildRoundabout(scene) {
    const r = this.roundabout;
    const ringGeo = new THREE.RingGeometry(10, r.radius, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x1e2638, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(r.x, 0.025, r.z);
    scene.add(ring);

    const monument = Models3D.createShaplaMonument();
    monument.position.set(r.x, 0, r.z);
    scene.add(monument);

    this.collisionBoxes.push({
      minX: r.x - 11, maxX: r.x + 11,
      minZ: r.z - 11, maxZ: r.z + 11
    });
  },

  // ==========================================
  // BANGLADESHI MULTI-STORY BUILDINGS & STOREFRONTS
  // ==========================================
  buildBangladeshiBuildings(scene) {
    const aveX = [-520, ...this.avenues.map(a => a.x), 520];
    const strZ = [-520, ...this.streets.map(s => s.z), 520];

    const storeKeys = Object.keys(Models3D.storeTextures);

    const bldColors = [
      0x334155, 0x854d0e, 0x1e293b, 0x0f766e, 0x475569, 0xb45309, 0x1e3a8a, 0x6b21a8, 0x047857
    ];

    for (let i = 0; i < aveX.length - 1; i++) {
      for (let j = 0; j < strZ.length - 1; j++) {
        const blockMidX = (aveX[i] + aveX[i + 1]) / 2;
        const blockMidZ = (strZ[j] + strZ[j + 1]) / 2;

        // Skip building over Hatirjheel Lake block
        if (blockMidX > this.lake.minX && blockMidX < this.lake.maxX &&
            blockMidZ > this.lake.minZ && blockMidZ < this.lake.maxZ) {
          continue;
        }

        const left = aveX[i] + 24;
        const right = aveX[i + 1] - 24;
        const top = strZ[j] + 24;
        const bottom = strZ[j + 1] - 24;

        const bw = right - left;
        const bl = bottom - top;

        if (bw > 35 && bl > 35) {
          const subX = bw > 110 ? 3 : 2;
          const subZ = bl > 110 ? 3 : 2;
          const bSizeX = (bw - (subX + 1) * 6) / subX;
          const bSizeZ = (bl - (subZ + 1) * 6) / subZ;

          for (let sx = 0; sx < subX; sx++) {
            for (let sz = 0; sz < subZ; sz++) {
              const x = left + 6 + sx * (bSizeX + 6) + bSizeX / 2;
              const z = top + 6 + sz * (bSizeZ + 6) + bSizeZ / 2;
              const height = 24 + ((sx * 5 + sz * 7 + i * 3 + j * 4) % 7) * 9; // 24m to 78m
              const col = bldColors[(i * 3 + j * 2 + sx + sz) % bldColors.length];

              const bGeo = new THREE.BoxGeometry(bSizeX, height, bSizeZ);
              const bMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.2 });
              const bMesh = new THREE.Mesh(bGeo, bMat);
              bMesh.position.set(x, height / 2, z);
              bMesh.castShadow = true;
              bMesh.receiveShadow = true;
              scene.add(bMesh);

              // Ground-Floor Storefront Signboards (Bilingual Bengali + English)
              const storeKey = storeKeys[(i * 4 + j * 3 + sx + sz) % storeKeys.length];
              const storeMat = Models3D.storeTextures[storeKey];
              if (storeMat) {
                // Front Signboard (facing Z)
                const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(bSizeX * 0.88, 3.2), storeMat);
                frontSign.position.set(x, 2.8, z + bSizeZ / 2 + 0.06);
                scene.add(frontSign);

                // Back Signboard (facing -Z)
                const backSign = new THREE.Mesh(new THREE.PlaneGeometry(bSizeX * 0.88, 3.2), storeMat);
                backSign.rotateY(Math.PI);
                backSign.position.set(x, 2.8, z - bSizeZ / 2 - 0.06);
                scene.add(backSign);
              }

              // Balconies with railings on 2nd and 3rd floors
              for (let f = 1; f <= 3; f++) {
                const balc = new THREE.Mesh(new THREE.BoxGeometry(bSizeX * 0.7, 0.8, 1.2), new THREE.MeshLambertMaterial({ color: 0x334155 }));
                balc.position.set(x, f * 5.5, z + bSizeZ / 2 + 0.6);
                scene.add(balc);
              }

              // Rooftop Gazi Water Tank (গাজী পানির ট্যাংক)
              const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.6, 12), new THREE.MeshLambertMaterial({ color: 0x0284c7 }));
              tank.position.set(x - bSizeX * 0.25, height + 1.3, z - bSizeZ * 0.25);
              scene.add(tank);

              // Collision Box for this building (safe clearance from street)
              this.collisionBoxes.push({
                minX: x - bSizeX / 2 - 0.8,
                maxX: x + bSizeX / 2 + 0.8,
                minZ: z - bSizeZ / 2 - 0.8,
                maxZ: z + bSizeZ / 2 + 0.8
              });
            }
          }
        }
      }
    }
  },

  // ==========================================
  // METRO RAIL (KAZI NAZRUL ISLAM AVE)
  // ==========================================
  buildMetroRail(scene) {
    const nazrul = this.avenues.find(a => a.id === 'nazrul');
    if (!nazrul) return;

    const trackY = 12.0;
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });

    const totalLen = 1140;
    const girder = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, totalLen), beamMat);
    girder.position.set(nazrul.x, trackY - 0.7, 0);
    scene.add(girder);

    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, totalLen), railMat);
    leftRail.position.set(nazrul.x - 1.8, trackY + 0.2, 0);
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, totalLen), railMat);
    rightRail.position.set(nazrul.x + 1.8, trackY + 0.2, 0);
    scene.add(leftRail); scene.add(rightRail);

    // Elevated concrete pillars along median
    for (let z = -500; z <= 500; z += 42) {
      const isNearInt = this.streets.some(s => Math.abs(s.z - z) < 22);
      if (!isNearInt) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, trackY - 1.4, 16), beamMat);
        col.position.set(nazrul.x, (trackY - 1.4) / 2, z);
        scene.add(col);

        const tBeam = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.2, 3.0), beamMat);
        tBeam.position.set(nazrul.x, trackY - 1.4, z);
        scene.add(tBeam);

        this.collisionBoxes.push({
          minX: nazrul.x - 1.5, maxX: nazrul.x + 1.5,
          minZ: z - 1.5, maxZ: z + 1.5
        });
      }
    }

    // Metro Train Model (Green & Red Bangladesh Metro)
    this.metroTrainMesh = new THREE.Group();
    const trainLen = 38;
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, trainLen), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    tBody.position.y = 1.7;
    this.metroTrainMesh.add(tBody);

    const gStripe = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.45, trainLen), new THREE.MeshBasicMaterial({ color: 0x15803d }));
    gStripe.position.y = 1.2;
    const rStripe = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.3, trainLen), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    rStripe.position.y = 0.8;
    this.metroTrainMesh.add(gStripe); this.metroTrainMesh.add(rStripe);

    const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    mHead.position.set(0, 1.4, trainLen / 2 + 0.1);
    this.metroTrainMesh.add(mHead);

    this.metroTrainMesh.position.set(nazrul.x, trackY + 0.2, 0);
    scene.add(this.metroTrainMesh);
  },

  // ==========================================
  // STREETSIDE DECORATIONS (TONG STALLS & TREES)
  // ==========================================
  buildStreetDecorations(scene) {
    // Roadside Tong Tea Stalls (টং দোকান) on sidewalk corners
    const stallCoords = [
      { x: -120 + 22, z: -100 },
      { x: -120 - 22, z: 140 },
      { x: 120 + 19, z: -100 },
      { x: -360 + 19, z: -100 },
      { x: 360 - 21, z: 100 },
      { x: 120 + 19, z: 340 }
    ];

    stallCoords.forEach(pos => {
      const stall = Models3D.createTongTeaStall();
      stall.position.set(pos.x, 0.15, pos.z);
      scene.add(stall);
    });

    // Street Trees along sidewalks
    this.avenues.forEach(ave => {
      for (let z = -460; z <= 460; z += 55) {
        [-1, 1].forEach(side => {
          const tx = ave.x + side * (ave.width / 2 + 3.8);
          const tree = Models3D.createStreetTree();
          tree.position.set(tx, 0.15, z + (side * 6));
          scene.add(tree);
        });
      }
    });
  },

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

          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bulbMat);
          bulb.position.set(lx - side * 1.5, 7.2, z);
          scene.add(bulb);
        });
      }
    });

    // Decorative lamps around Hatirjheel Lake Promenade
    const lk = this.lake;
    for (let x = lk.minX; x <= lk.maxX; x += 36) {
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 5.0, 8), lampMat);
      p1.position.set(x, 2.5, lk.minZ - 1.2);
      scene.add(p1);
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      b1.position.set(x, 5.0, lk.minZ - 1.2);
      scene.add(b1);
    }
  },

  // ==========================================
  // 3D WALKING PEDESTRIANS / HUMANS
  // ==========================================
  buildPedestrians(scene) {
    this.pedestrians = [];

    // Spawn 40+ pedestrians on sidewalks and crossings
    for (let i = 0; i < 42; i++) {
      const ave = this.avenues[i % this.avenues.length];
      const side = (i % 2 === 0 ? 1 : -1);
      const px = ave.x + side * (ave.width / 2 + 2.4);
      const pz = (i * 26) - 500;

      const pMesh = Models3D.createPedestrianModel(i);
      pMesh.position.set(px, 0.15, pz);
      scene.add(pMesh);

      this.pedestrians.push({
        mesh: pMesh,
        x: px,
        z: pz,
        baseX: px,
        dirZ: (i % 2 === 0 ? 1 : -1),
        dirX: 0,
        speed: 1.4 + (i % 4) * 0.35,
        scaredTimer: 0,
        walkAnim: (i * 1.2) % (Math.PI * 2)
      });
    }

    // Pedestrians strolling along Hatirjheel Lake walkway
    for (let k = 0; k < 6; k++) {
      const lkZ = this.lake.minZ - 2.8;
      const lkX = this.lake.minX + 25 + k * 28;
      const pMesh = Models3D.createPedestrianModel(k + 40);
      pMesh.position.set(lkX, 0.15, lkZ);
      scene.add(pMesh);

      this.pedestrians.push({
        mesh: pMesh,
        x: lkX,
        z: lkZ,
        baseX: lkX,
        dirZ: 0,
        dirX: (k % 2 === 0 ? 1 : -1),
        speed: 1.2,
        scaredTimer: 0,
        walkAnim: k * 0.9
      });
    }
  },

  buildPickups(scene) {
    const locations = [
      { x: -120, z: -40, type: 'repair' },
      { x: -120, z: 80, type: 'cha' },
      { x: -120, z: 240, type: 'coin' },
      { x: -360, z: -120, type: 'repair' },
      { x: -360, z: 120, type: 'coin' },
      { x: 120, z: -120, type: 'cha' },
      { x: 120, z: 120, type: 'repair' },
      { x: 360, z: 0, type: 'coin' },
      { x: 360, z: -200, type: 'cha' },
      { x: 0, z: -120, type: 'coin' },
      { x: 0, z: 120, type: 'repair' },
      { x: 240, z: 120, type: 'coin' },
      { x: 360, z: 360, type: 'repair' }
    ];

    locations.forEach((loc) => {
      const group = new THREE.Group();
      if (loc.type === 'repair') {
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x008040 }));
        group.add(box);
      } else if (loc.type === 'coin') {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x997700, metalness: 0.9 }));
        coin.rotateZ(Math.PI / 2);
        group.add(coin);
      } else {
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

  buildCheckpoints(scene) {
    this.checkpointGates = [];
    this.checkpoints.forEach((cp) => {
      const gate = Models3D.createCheckpointGate(cp.title, cp.isFinish, cp.width);
      gate.position.set(cp.x, 0, cp.z);
      gate.rotation.y = cp.rotationY;
      scene.add(gate);
      this.checkpointGates.push(gate);
    });
  },

  buildDestinations() {
    this.destinations = [
      { name: 'FARMGATE METRO STATION', bangla: 'ফার্মগেট মেট্রো স্টেশন', x: -120, z: -120, reward: 500 },
      { name: 'DHANMONDI 27 CHAI HUB', bangla: 'ধানমন্ডি ২৭ আড্ডা', x: 120, z: 120, reward: 600 },
      { name: 'GULSHAN PINK CITY', bangla: 'গুলশান পিংক সিটি', x: 360, z: -120, reward: 750 },
      { name: 'SHAPLA CHOTTOR ROUNDABOUT', bangla: 'শাপলা চত্বর গোলচক্কর', x: -120, z: 190, reward: 700 },
      { name: 'OLD DHAKA BIRYANI LANE', bangla: 'পুরান ঢাকা বিরিয়ানি', x: -360, z: 360, reward: 850 },
      { name: 'AIRPORT ROAD FLYOVER', bangla: 'বিমানবন্দর রোড', x: 120, z: -360, reward: 650 },
      { name: 'HATIRJHEEL LAKE PROMENADE', bangla: 'হাতিরঝিল লেক ওয়াকওয়ে', x: 240, z: 140, reward: 800 }
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

        return { collided: true, nx, nz, isLake: b.isLake };
      }
    }
    return { collided: false };
  },

  getStreetAt(x, z) {
    if (x >= this.lake.minX - 10 && x <= this.lake.maxX + 10 &&
        z >= this.lake.minZ - 10 && z <= this.lake.maxZ + 10) {
      return { name: this.lake.name, bangla: this.lake.bangla };
    }

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