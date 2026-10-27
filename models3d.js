/**
 * DHAKA CITY 3D - PROCEDURAL 3D VEHICLE & PROP MODELS (Three.js)
 * Creates 3D procedural meshes for player cars, rickshaws, CNGs, buses, and city monuments.
 */

const Models3D = {
  // Shared materials for performance
  materials: {},

  initMaterials() {
    if (Object.keys(this.materials).length > 0) return;

    this.materials = {
      rubber: new THREE.MeshLambertMaterial({ color: 0x18181b }),
      rim: new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x0f172a, transmission: 0.6, opacity: 0.85, transparent: true, roughness: 0.1 }),
      headlight: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      taillight: new THREE.MeshLambertMaterial({ color: 0xff0033, emissive: 0xaa0022 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 }),

      // Car paints
      premioWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.2, roughness: 0.3 }),
      taxiYellow: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.2, roughness: 0.3 }),
      suvBlack: new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0.4, roughness: 0.2 }),
      cngGreen: new THREE.MeshStandardMaterial({ color: 0x00c853, metalness: 0.3, roughness: 0.3 }),
      cngBlackCanvas: new THREE.MeshLambertMaterial({ color: 0x18181b }),
      cngYellowCage: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),

      // Rickshaw
      rickshawPink: new THREE.MeshLambertMaterial({ color: 0xff1493 }),
      rickshawGreen: new THREE.MeshLambertMaterial({ color: 0x00897b }),
      rickshawWood: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      skin: new THREE.MeshLambertMaterial({ color: 0x8d5b4c }),
      gamchaRed: new THREE.MeshLambertMaterial({ color: 0xd90429 }),

      // Buses
      busBlue: new THREE.MeshLambertMaterial({ color: 0x2563eb }),
      busOrange: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
      busGreen: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
      busRoof: new THREE.MeshLambertMaterial({ color: 0x334155 }),

      // City & Monuments
      concrete: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      railSilver: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 }),
      waterBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7, opacity: 0.85, transparent: true }),
      lilyWhite: new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x222222 }),
      lilyGold: new THREE.MeshLambertMaterial({ color: 0xfacc15 })
    };
  },

  // Helper to create a 3D wheel with tire and rim
  createWheel(radius = 0.42, width = 0.28) {
    const group = new THREE.Group();
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, this.materials.rubber);
    tire.castShadow = true;
    group.add(tire);

    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, this.materials.rim);
    group.add(rim);

    return group;
  },

  // ==========================================
  // PLAYER CAR: TOYOTA PREMIO / TAXI / SUV
  // ==========================================
  createCarModel(type = 'premio') {
    this.initMaterials();
    const car = new THREE.Group();

    let paintMat = this.materials.premioWhite;
    let length = 4.6;
    let width = 1.85;
    let height = 1.35;
    let hasSpoiler = false;
    let hasTaxiSign = false;
    let isSuv = false;

    if (type === 'taxi') {
      paintMat = this.materials.taxiYellow;
      hasTaxiSign = true;
    } else if (type === 'suv') {
      paintMat = this.materials.suvBlack;
      length = 5.0;
      width = 2.0;
      height = 1.8;
      isSuv = true;
    } else if (type === 'premio') {
      hasSpoiler = true;
    }

    // Lower Chassis / Body
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.45, length);
    const body = new THREE.Mesh(bodyGeo, paintMat);
    body.position.y = height * 0.45;
    body.castShadow = true;
    car.add(body);

    // Front Bumper & Grille
    const bumperGeo = new THREE.BoxGeometry(width * 0.98, height * 0.35, 0.4);
    const bumper = new THREE.Mesh(bumperGeo, this.materials.chrome);
    bumper.position.set(0, height * 0.38, length / 2 + 0.15);
    car.add(bumper);

    // Cabin / Roof & Windows
    const cabinLen = length * (isSuv ? 0.68 : 0.52);
    const cabinWidth = width * 0.88;
    const cabinHeight = height * 0.52;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLen);
    const cabin = new THREE.Mesh(cabinGeo, this.materials.glass);
    cabin.position.set(0, height * 0.72, isSuv ? -0.2 : -0.3);
    cabin.castShadow = true;
    car.add(cabin);

    // Opaque Roof Plate
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.95, 0.08, cabinLen * 0.85);
    const roof = new THREE.Mesh(roofGeo, paintMat);
    roof.position.set(0, height * 0.72 + cabinHeight / 2 + 0.04, isSuv ? -0.2 : -0.3);
    car.add(roof);

    // Headlights (Twin bright white)
    const hlGeo = new THREE.BoxGeometry(0.32, 0.16, 0.1);
    const leftHL = new THREE.Mesh(hlGeo, this.materials.headlight);
    leftHL.position.set(-width * 0.36, height * 0.45, length / 2 + 0.02);
    const rightHL = new THREE.Mesh(hlGeo, this.materials.headlight);
    rightHL.position.set(width * 0.36, height * 0.45, length / 2 + 0.02);
    car.add(leftHL);
    car.add(rightHL);

    // Headlight Light Beams (Spotlights)
    const spotL = new THREE.SpotLight(0xfffff0, 1.2, 35, Math.PI / 6, 0.4);
    spotL.position.set(0, height * 0.45, length / 2);
    spotL.target.position.set(0, 0, length / 2 + 25);
    car.add(spotL);
    car.add(spotL.target);

    // Taillights (Twin glowing red)
    const tlGeo = new THREE.BoxGeometry(0.32, 0.16, 0.1);
    const leftTL = new THREE.Mesh(tlGeo, this.materials.taillight);
    leftTL.position.set(-width * 0.36, height * 0.48, -length / 2 - 0.02);
    const rightTL = new THREE.Mesh(tlGeo, this.materials.taillight);
    rightTL.position.set(width * 0.36, height * 0.48, -length / 2 - 0.02);
    car.add(leftTL);
    car.add(rightTL);

    // Taxi Roof Sign
    if (hasTaxiSign) {
      const signGeo = new THREE.BoxGeometry(0.7, 0.22, 0.3);
      const sign = new THREE.Mesh(signGeo, new THREE.MeshLambertMaterial({ color: 0xffcc00, emissive: 0x664400 }));
      sign.position.set(0, height * 0.72 + cabinHeight / 2 + 0.18, -0.3);
      car.add(sign);
    }

    // Spoiler
    if (hasSpoiler) {
      const wingGeo = new THREE.BoxGeometry(width * 0.9, 0.08, 0.35);
      const wing = new THREE.Mesh(wingGeo, new THREE.MeshLambertMaterial({ color: 0x111111 }));
      wing.position.set(0, height * 0.75, -length / 2 + 0.2);
      car.add(wing);
    }

    // 4 Wheels
    const wheelR = isSuv ? 0.48 : 0.4;
    const wheelW = 0.26;
    const zOffset = length * 0.32;
    const xOffset = width / 2 + 0.05;

    car.wheels = [];
    const flWheel = this.createWheel(wheelR, wheelW);
    flWheel.position.set(-xOffset, wheelR, zOffset);
    const frWheel = this.createWheel(wheelR, wheelW);
    frWheel.position.set(xOffset, wheelR, zOffset);
    const rlWheel = this.createWheel(wheelR, wheelW);
    rlWheel.position.set(-xOffset, wheelR, -zOffset);
    const rrWheel = this.createWheel(wheelR, wheelW);
    rrWheel.position.set(xOffset, wheelR, -zOffset);

    car.add(flWheel);
    car.add(frWheel);
    car.add(rlWheel);
    car.add(rrWheel);

    car.wheels.push(flWheel, frWheel, rlWheel, rrWheel);
    car.frontWheels = [flWheel, frWheel];

    return car;
  },

  // ==========================================
  // MODIFIED GREEN CNG (3-WHEELER WITH DUAL EXHAUSTS)
  // ==========================================
  createCngModel(isPlayer = false) {
    this.initMaterials();
    const cng = new THREE.Group();

    const w = 1.45;
    const h = 1.7;
    const l = 2.8;

    // Green Lower Cabin
    const bodyGeo = new THREE.BoxGeometry(w, h * 0.45, l * 0.85);
    const bodyMat = isPlayer ? new THREE.MeshStandardMaterial({ color: 0x00e676, metalness: 0.3 }) : this.materials.cngGreen;
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, h * 0.45, -0.1);
    body.castShadow = true;
    cng.add(body);

    // Front Nose Taper
    const noseGeo = new THREE.CylinderGeometry(0.2, w * 0.5, l * 0.35, 4);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(0, h * 0.35, l * 0.38);
    cng.add(nose);

    // Black Canvas Curved Canopy
    const roofGeo = new THREE.CylinderGeometry(w * 0.52, w * 0.52, l * 0.7, 12, 1, false, 0, Math.PI);
    roofGeo.rotateZ(Math.PI / 2);
    roofGeo.rotateY(Math.PI / 2);
    const roof = new THREE.Mesh(roofGeo, this.materials.cngBlackCanvas);
    roof.position.set(0, h * 0.75, -0.2);
    cng.add(roof);

    // Yellow Security Mesh Cage
    const cageGeo = new THREE.BoxGeometry(w * 0.95, h * 0.45, l * 0.7);
    const cage = new THREE.Mesh(cageGeo, new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true }));
    cage.position.set(0, h * 0.7, -0.2);
    cng.add(cage);

    // Headlight & Taillights
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.1), this.materials.headlight);
    hl.position.set(0, h * 0.38, l * 0.5 + 0.05);
    cng.add(hl);

    // Wheels (1 front, 2 rear)
    const wheelR = 0.34;
    const fWheel = this.createWheel(wheelR, 0.2);
    fWheel.position.set(0, wheelR, l * 0.38);
    const rlWheel = this.createWheel(wheelR, 0.22);
    rlWheel.position.set(-w / 2 - 0.05, wheelR, -l * 0.25);
    const rrWheel = this.createWheel(wheelR, 0.22);
    rrWheel.position.set(w / 2 + 0.05, wheelR, -l * 0.25);

    cng.add(fWheel);
    cng.add(rlWheel);
    cng.add(rrWheel);

    cng.wheels = [fWheel, rlWheel, rrWheel];
    cng.frontWheels = [fWheel];

    // Dual Chrome Nitro Exhausts if Player
    if (isPlayer) {
      const exGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
      exGeo.rotateX(Math.PI / 2);
      const exLeft = new THREE.Mesh(exGeo, this.materials.chrome);
      exLeft.position.set(-0.35, 0.35, -l * 0.48);
      const exRight = new THREE.Mesh(exGeo, this.materials.chrome);
      exRight.position.set(0.35, 0.35, -l * 0.48);
      cng.add(exLeft);
      cng.add(exRight);
    }

    return cng;
  },

  // ==========================================
  // DHAKA CYCLE RICKSHAW 3D
  // ==========================================
  createRickshawModel() {
    this.initMaterials();
    const rickshaw = new THREE.Group();

    // Wooden Chassis & Passenger Seat
    const seatGeo = new THREE.BoxGeometry(1.2, 0.6, 0.9);
    const seat = new THREE.Mesh(seatGeo, this.materials.rickshawWood);
    seat.position.set(0, 0.7, -0.4);
    rickshaw.add(seat);

    // Ornate Curved Hood (হুড)
    const hoodGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.25, 12, 1, false, 0, Math.PI);
    hoodGeo.rotateZ(Math.PI / 2);
    hoodGeo.rotateY(Math.PI / 2);
    const hood = new THREE.Mesh(hoodGeo, this.materials.rickshawPink);
    hood.position.set(0, 1.35, -0.5);
    rickshaw.add(hood);

    // Rickshaw Art Back Plate (আর্ট প্লেট)
    const plateGeo = new THREE.PlaneGeometry(1.1, 0.4);
    const plate = new THREE.Mesh(plateGeo, new THREE.MeshLambertMaterial({ color: 0xffcc00 }));
    plate.position.set(0, 0.65, -0.86);
    plate.rotateY(Math.PI);
    rickshaw.add(plate);

    // Rickshaw Puller (মাথায় লাল গামছা)
    const pullerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8), this.materials.skin);
    pullerBody.position.set(0, 1.05, 0.4);
    const pullerHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this.materials.gamchaRed);
    pullerHead.position.set(0, 1.5, 0.4);
    rickshaw.add(pullerBody);
    rickshaw.add(pullerHead);

    // 3 Wheels (2 rear, 1 front bicycle wheel)
    const rWheelR = 0.48;
    const fWheelR = 0.42;
    const rlWheel = this.createWheel(rWheelR, 0.12);
    rlWheel.position.set(-0.68, rWheelR, -0.4);
    const rrWheel = this.createWheel(rWheelR, 0.12);
    rrWheel.position.set(0.68, rWheelR, -0.4);
    const fWheel = this.createWheel(fWheelR, 0.1);
    fWheel.position.set(0, fWheelR, 0.9);

    rickshaw.add(rlWheel);
    rickshaw.add(rrWheel);
    rickshaw.add(fWheel);

    rickshaw.wheels = [rlWheel, rrWheel, fWheel];
    return rickshaw;
  },

  // ==========================================
  // DHAKA LOCAL BUS 3D (Shikhor / Balaka / Bikolpo)
  // ==========================================
  createBusModel(name = 'shikhor') {
    this.initMaterials();
    const bus = new THREE.Group();

    const w = 2.4;
    const h = 2.8;
    const l = 8.5;

    let paint = this.materials.busBlue;
    if (name === 'balaka') paint = this.materials.busOrange;
    if (name === 'bikolpo') paint = this.materials.busGreen;

    // Bus Body Box
    const bodyGeo = new THREE.BoxGeometry(w, h * 0.75, l);
    const body = new THREE.Mesh(bodyGeo, paint);
    body.position.set(0, h * 0.55, 0);
    body.castShadow = true;
    bus.add(body);

    // Roof Luggage Carrier
    const rackGeo = new THREE.BoxGeometry(w * 0.85, 0.25, l * 0.75);
    const rack = new THREE.Mesh(rackGeo, this.materials.busRoof);
    rack.position.set(0, h * 0.96 + 0.12, 0);
    bus.add(rack);

    // Window Stripe (Tinted Glass)
    const winGeo = new THREE.BoxGeometry(w * 1.02, 0.7, l * 0.88);
    const win = new THREE.Mesh(winGeo, this.materials.glass);
    win.position.set(0, h * 0.65, 0);
    bus.add(win);

    // Windshield Front
    const frontWinGeo = new THREE.BoxGeometry(w * 0.92, 0.8, 0.2);
    const frontWin = new THREE.Mesh(frontWinGeo, this.materials.glass);
    frontWin.position.set(0, h * 0.65, l / 2 + 0.02);
    bus.add(frontWin);

    // Dented Heavy Metal Bumper
    const bGeo = new THREE.BoxGeometry(w * 1.04, 0.45, 0.4);
    const bumper = new THREE.Mesh(bGeo, this.materials.chrome);
    bumper.position.set(0, 0.45, l / 2 + 0.15);
    bus.add(bumper);

    // Headlights & Taillights
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), this.materials.headlight);
    hl1.position.set(-0.85, 0.65, l / 2 + 0.08);
    const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), this.materials.headlight);
    hl2.position.set(0.85, 0.65, l / 2 + 0.08);
    bus.add(hl1);
    bus.add(hl2);

    // Wheels (4 dual wheel assemblies)
    const wheelR = 0.55;
    const wZ1 = l * 0.32;
    const wZ2 = -l * 0.28;
    const wX = w / 2 + 0.08;

    const flW = this.createWheel(wheelR, 0.32);
    flW.position.set(-wX, wheelR, wZ1);
    const frW = this.createWheel(wheelR, 0.32);
    frW.position.set(wX, wheelR, wZ1);
    const rlW = this.createWheel(wheelR, 0.35);
    rlW.position.set(-wX, wheelR, wZ2);
    const rrW = this.createWheel(wheelR, 0.35);
    rrW.position.set(wX, wheelR, wZ2);

    bus.add(flW);
    bus.add(frW);
    bus.add(rlW);
    bus.add(rrW);

    bus.wheels = [flW, frW, rlW, rrW];
    return bus;
  },

  // ==========================================
  // SHAPLA CHOTTOR MONUMENT 3D
  // ==========================================
  createShaplaMonument() {
    this.initMaterials();
    const group = new THREE.Group();

    // Circular Water Pool Basin
    const poolGeo = new THREE.CylinderGeometry(14, 15, 1.2, 32);
    const pool = new THREE.Mesh(poolGeo, this.materials.concrete);
    pool.position.y = 0.6;
    group.add(pool);

    // Water Surface
    const waterGeo = new THREE.CircleGeometry(13.8, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, this.materials.waterBlue);
    water.position.y = 1.21;
    group.add(water);

    // Giant White Water Lily Sculpture (শাপলা পাপড়ি)
    const petalCount = 8;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * Math.PI * 2) / petalCount;
      const petalGeo = new THREE.ConeGeometry(1.6, 9, 5);
      petalGeo.rotateZ(0.4);
      const petal = new THREE.Mesh(petalGeo, this.materials.lilyWhite);
      petal.position.set(Math.cos(angle) * 3, 4.5, Math.sin(angle) * 3);
      petal.rotation.y = -angle + Math.PI / 2;
      group.add(petal);
    }

    // Golden Center Stamen
    const stamenGeo = new THREE.CylinderGeometry(1.2, 1.5, 7, 12);
    const stamen = new THREE.Mesh(stamenGeo, this.materials.lilyGold);
    stamen.position.y = 4.2;
    group.add(stamen);

    return group;
  }
};

window.Models3D = Models3D;
