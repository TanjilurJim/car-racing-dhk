/**
 * DHAKA CITY 3D - PROCEDURAL 3D CITY BUILDER (Three.js)
 * Constructs the multi-block 3D Dhaka street network, Shapla Chottor,
 * elevated Metro Rail viaduct, 3D buildings with billboards, and roadside tea stalls.
 */

const City3D = {
  WORLD_SIZE: 1200, // 3D units

  avenues: [
    { id: 'mirpur', name: 'MIRPUR ROAD', bangla: 'মিরপুর রোড', x: -350, width: 34, hasMetro: false },
    { id: 'nazrul', name: 'KAZI NAZRUL ISLAM AVE', bangla: 'কাজী নজরুল ইসলাম এভিনিউ', x: -100, width: 42, hasMetro: true },
    { id: 'satmasjid', name: 'SATMASJID ROAD', bangla: 'সাতমসজিদ রোড', x: 150, width: 34, hasMetro: false },
    { id: 'gulshan', name: 'GULSHAN AVENUE', bangla: 'গুলশান এভিনিউ', x: 400, width: 38, hasMetro: false }
  ],

  streets: [
    { id: 'airport', name: 'AIRPORT ROAD', bangla: 'বিমানবন্দর রোড', z: -350, width: 34 },
    { id: 'panthapath', name: 'PANTHAPATH', bangla: 'পান্থপথ', z: -100, width: 34 },
    { id: 'dhanmondi27', name: 'DHANMONDI ROAD 27', bangla: 'ধানমন্ডি ২৭', z: 150, width: 34 },
    { id: 'old_dhaka', name: 'OLD DHAKA HERITAGE WAY', bangla: 'পুরান ঢাকা সড়ক', z: 400, width: 30 }
  ],

  roundabout: { name: 'SHAPLA CHOTTOR', bangla: 'শাপলা চত্বর', x: -100, z: 150, radius: 32 },

  buildings: [],
  collisionBoxes: [],
  destinations: [],

  build(scene) {
    this.buildings = [];
    this.collisionBoxes = [];

    this.buildGroundAndStreets(scene);
    this.buildRoundabout(scene);
    this.buildBuildings(scene);
    this.buildMetroRail(scene);
    this.buildDestinations();
  },

  buildGroundAndStreets(scene) {
    const size = this.WORLD_SIZE;

    // Base Grass / Ground Plane
    const groundGeo = new THREE.PlaneGeometry(size, size);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    // Avenues (North - South, along Z)
    this.avenues.forEach(ave => {
      const roadGeo = new THREE.PlaneGeometry(ave.width, size);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(ave.x, 0.02, 0);
      road.receiveShadow = true;
      scene.add(road);

      // Curbs on left and right
      const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, size), curbMat);
      curbLeft.position.set(ave.x - ave.width / 2, 0.12, 0);
      const curbRight = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, size), curbMat);
      curbRight.position.set(ave.x + ave.width / 2, 0.12, 0);
      scene.add(curbLeft);
      scene.add(curbRight);

      // Center Yellow Divider Striping
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.4, size), yellowStripeMat);
      centerLine.rotateX(-Math.PI / 2);
      centerLine.position.set(ave.x, 0.03, 0);
      scene.add(centerLine);
    });

    // Cross Streets (East - West, along X)
    this.streets.forEach(str => {
      const roadGeo = new THREE.PlaneGeometry(size, str.width);
      roadGeo.rotateX(-Math.PI / 2);
      const road = new THREE.Mesh(roadGeo, asphaltMat);
      road.position.set(0, 0.02, str.z);
      road.receiveShadow = true;
      scene.add(road);

      // Curbs
      const curbTop = new THREE.Mesh(new THREE.BoxGeometry(size, 0.25, 1.4), curbMat);
      curbTop.position.set(0, 0.12, str.z - str.width / 2);
      const curbBottom = new THREE.Mesh(new THREE.BoxGeometry(size, 0.25, 1.4), curbMat);
      curbBottom.position.set(0, 0.12, str.z + str.width / 2);
      scene.add(curbTop);
      scene.add(curbBottom);

      // Center White Divider
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(size, 0.35), whiteStripeMat);
      centerLine.rotateX(-Math.PI / 2);
      centerLine.position.set(0, 0.03, str.z);
      scene.add(centerLine);
    });

    // Zebra Crossings at all 4-way intersections
    this.avenues.forEach(ave => {
      this.streets.forEach(str => {
        this.addZebraCrossings(scene, ave.x, str.z, ave.width, str.width, whiteStripeMat);
      });
    });
  },

  addZebraCrossings(scene, ix, iz, aw, sw, mat) {
    const stripeW = 1.0;
    const stripeL = 3.5;
    // North crossing
    for (let x = ix - aw / 2 + 3; x < ix + aw / 2 - 3; x += 2.2) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, stripeL), mat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(x, 0.04, iz - sw / 2 - stripeL / 2);
      scene.add(stripe);
    }
    // South crossing
    for (let x = ix - aw / 2 + 3; x < ix + aw / 2 - 3; x += 2.2) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, stripeL), mat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(x, 0.04, iz + sw / 2 + stripeL / 2);
      scene.add(stripe);
    }
    // West crossing
    for (let z = iz - sw / 2 + 3; z < iz + sw / 2 - 3; z += 2.2) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeL, stripeW), mat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(ix - aw / 2 - stripeL / 2, 0.04, z);
      scene.add(stripe);
    }
    // East crossing
    for (let z = iz - sw / 2 + 3; z < iz + sw / 2 - 3; z += 2.2) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeL, stripeW), mat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(ix + aw / 2 + stripeL / 2, 0.04, z);
      scene.add(stripe);
    }
  },

  buildRoundabout(scene) {
    const r = this.roundabout;
    // Circular Asphalt Ring
    const ringGeo = new THREE.RingGeometry(14, r.radius, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(r.x, 0.025, r.z);
    scene.add(ring);

    // 3D Shapla Chottor Monument in Center
    const monument = Models3D.createShaplaMonument();
    monument.position.set(r.x, 0, r.z);
    scene.add(monument);

    // Collision box for monument
    this.collisionBoxes.push({
      minX: r.x - 14,
      maxX: r.x + 14,
      minZ: r.z - 14,
      maxZ: r.z + 14
    });
  },

  // Build 3D City Blocks with varied height buildings, rooftops, and billboards
  buildBuildings(scene) {
    const aveX = [-600, ...this.avenues.map(a => a.x), 600];
    const strZ = [-600, ...this.streets.map(s => s.z), 600];

    const bldColors = [
      0x334155, // slate concrete
      0x78350f, // warm red brick (Old Dhaka)
      0x1e293b, // dark corporate
      0x0f766e, // teal glass
      0x475569, // steel grey
      0xb45309  // terracotta
    ];

    const billboardNames = ['বিকাশ', 'রকমারি', 'প্রাণ', 'গ্রামীণফোন', 'দারাজ', 'পাঠাও'];

    for (let i = 0; i < aveX.length - 1; i++) {
      for (let j = 0; j < strZ.length - 1; j++) {
        const left = aveX[i] + 28;
        const right = aveX[i + 1] - 28;
        const top = strZ[j] + 28;
        const bottom = strZ[j + 1] - 28;

        const bw = right - left;
        const bl = bottom - top;

        if (bw > 40 && bl > 40) {
          // Subdivide block into 2x2 or 3x3 buildings
          const subX = bw > 120 ? 3 : 2;
          const subZ = bl > 120 ? 3 : 2;
          const bSizeX = (bw - (subX + 1) * 6) / subX;
          const bSizeZ = (bl - (subZ + 1) * 6) / subZ;

          for (let sx = 0; sx < subX; sx++) {
            for (let sz = 0; sz < subZ; sz++) {
              const x = left + 6 + sx * (bSizeX + 6) + bSizeX / 2;
              const z = top + 6 + sz * (bSizeZ + 6) + bSizeZ / 2;
              const height = 18 + ((sx * 3 + sz * 7) % 7) * 9; // 18m to 72m tall
              const col = bldColors[(i + j * 2 + sx + sz) % bldColors.length];

              const bGeo = new THREE.BoxGeometry(bSizeX, height, bSizeZ);
              const bMat = new THREE.MeshStandardMaterial({
                color: col,
                roughness: 0.6,
                metalness: 0.2
              });
              const bMesh = new THREE.Mesh(bGeo, bMat);
              bMesh.position.set(x, height / 2, z);
              bMesh.castShadow = true;
              bMesh.receiveShadow = true;
              scene.add(bMesh);

              // Rooftop Accent Trim
              const trimGeo = new THREE.BoxGeometry(bSizeX * 0.96, 0.6, bSizeZ * 0.96);
              const trimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
              const trim = new THREE.Mesh(trimGeo, trimMat);
              trim.position.set(x, height + 0.3, z);
              scene.add(trim);

              // Rooftop Billboard on select towers
              if ((sx + sz) % 3 === 0) {
                const bBoardGeo = new THREE.BoxGeometry(bSizeX * 0.6, 3.5, 0.4);
                const bBoardMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
                const bBoard = new THREE.Mesh(bBoardGeo, bBoardMat);
                bBoard.position.set(x, height + 2.4, z + bSizeZ / 2 - 1.5);
                scene.add(bBoard);
              }

              // Rooftop Water Tank
              if ((sx + sz) % 2 === 0) {
                const tankGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.8, 12);
                const tankMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
                const tank = new THREE.Mesh(tankGeo, tankMat);
                tank.position.set(x - bSizeX * 0.25, height + 1.4, z - bSizeZ * 0.25);
                scene.add(tank);
              }

              // Collision box
              this.collisionBoxes.push({
                minX: x - bSizeX / 2 - 1.2,
                maxX: x + bSizeX / 2 + 1.2,
                minZ: z - bSizeZ / 2 - 1.2,
                maxZ: z + bSizeZ / 2 + 1.2
              });
            }
          }
        }
      }
    }
  },

  // Elevated Metro Rail (MRT Line 6) along Kazi Nazrul Islam Ave
  buildMetroRail(scene) {
    const nazrul = this.avenues.find(a => a.id === 'nazrul');
    if (!nazrul) return;

    const trackY = 12.0; // 12 meters elevated
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });

    // Elevated concrete girder beam
    const girderGeo = new THREE.BoxGeometry(6.5, 1.4, this.WORLD_SIZE);
    const girder = new THREE.Mesh(girderGeo, beamMat);
    girder.position.set(nazrul.x, trackY - 0.7, 0);
    scene.add(girder);

    // Silver Rail Tracks
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, this.WORLD_SIZE), railMat);
    leftRail.position.set(nazrul.x - 1.8, trackY + 0.2, 0);
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, this.WORLD_SIZE), railMat);
    rightRail.position.set(nazrul.x + 1.8, trackY + 0.2, 0);
    scene.add(leftRail);
    scene.add(rightRail);

    // Concrete Pillars every 45 meters (skipping street intersections)
    for (let z = -550; z <= 550; z += 45) {
      const isNearIntersection = this.streets.some(s => Math.abs(s.z - z) < 22);
      if (!isNearIntersection) {
        // Main cylindrical column
        const columnGeo = new THREE.CylinderGeometry(1.4, 1.6, trackY - 1.4, 16);
        const col = new THREE.Mesh(columnGeo, pillarMat);
        col.position.set(nazrul.x, (trackY - 1.4) / 2, z);
        col.castShadow = true;
        scene.add(col);

        // Crosshead T-beam on top of pillar
        const tGeo = new THREE.BoxGeometry(8.5, 1.2, 3.2);
        const tBeam = new THREE.Mesh(tGeo, pillarMat);
        tBeam.position.set(nazrul.x, trackY - 1.4, z);
        scene.add(tBeam);

        // Pillar collision box
        this.collisionBoxes.push({
          minX: nazrul.x - 1.6,
          maxX: nazrul.x + 1.6,
          minZ: z - 1.6,
          maxZ: z + 1.6
        });
      }
    }

    // 3D Metro Train (MRT Line 6) soaring overhead
    this.metroTrainMesh = new THREE.Group();
    const trainLen = 34;
    const tBodyGeo = new THREE.BoxGeometry(3.6, 3.4, trainLen);
    const tBody = new THREE.Mesh(tBodyGeo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
    tBody.position.y = 1.7;
    this.metroTrainMesh.add(tBody);

    // Green and Red Flag Stripes along train
    const gStripe = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.45, trainLen), new THREE.MeshBasicMaterial({ color: 0x15803d }));
    gStripe.position.y = 1.2;
    const rStripe = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.3, trainLen), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    rStripe.position.y = 0.8;
    this.metroTrainMesh.add(gStripe);
    this.metroTrainMesh.add(rStripe);

    // Cyan MRT Headlight
    const mHeadlight = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    mHeadlight.position.set(0, 1.4, trainLen / 2 + 0.1);
    this.metroTrainMesh.add(mHeadlight);

    this.metroTrainMesh.position.set(nazrul.x, trackY + 0.2, 0);
    scene.add(this.metroTrainMesh);
  },

  buildDestinations() {
    this.destinations = [
      { name: 'FARMGATE METRO STATION', bangla: 'ফার্মগেট মেট্রো স্টেশন', x: -100, z: -100, reward: 500 },
      { name: 'DHANMONDI 27 CHAI HUB', bangla: 'ধানমন্ডি ২৭ আড্ডা', x: 150, z: 150, reward: 600 },
      { name: 'GULSHAN PINK CITY', bangla: 'গুলশান পিংক সিটি', x: 400, z: -100, reward: 750 },
      { name: 'SHAPLA CHOTTOR ROUNDABOUT', bangla: 'শাপলা চত্বর গোলচক্কর', x: -100, z: 200, reward: 700 },
      { name: 'OLD DHAKA BIRYANI LANE', bangla: 'পুরান ঢাকা বিরিয়ানি', x: -350, z: 400, reward: 850 },
      { name: 'AIRPORT ROAD FLYOVER', bangla: 'বিমানবন্দর রোড', x: 150, z: -350, reward: 650 }
    ];
  },

  // Check collision with 3D buildings and pillars
  checkCollision(px, pz, radius = 1.5) {
    for (const b of this.collisionBoxes) {
      if (px + radius > b.minX && px - radius < b.maxX &&
          pz + radius > b.minZ && pz - radius < b.maxZ) {
        // Calculate push-out normal
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
    // Check roundabout
    const distToRoundabout = Math.hypot(x - this.roundabout.x, z - this.roundabout.z);
    if (distToRoundabout < this.roundabout.radius + 10) {
      return { name: this.roundabout.name, bangla: this.roundabout.bangla };
    }

    // Check avenues
    for (const ave of this.avenues) {
      if (Math.abs(x - ave.x) <= ave.width / 2) {
        return { name: ave.name, bangla: ave.bangla };
      }
    }

    // Check streets
    for (const str of this.streets) {
      if (Math.abs(z - str.z) <= str.width / 2) {
        return { name: str.name, bangla: str.bangla };
      }
    }

    return { name: 'DHAKA RESIDENTIAL BLOCK', bangla: 'আবাসিক এলাকা' };
  }
};

window.City3D = City3D;
