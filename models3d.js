/**
 * DHAKA CITY 3D - VEHICLES, PEDESTRIANS & BANGLADESHI STOREFRONTS
 * Includes: Delivery Motorbikes (Pathao), Laguna, Cycle Rickshaws, CNGs, Buses,
 * 3D walking pedestrians (humans), and Bangladeshi storefront textures.
 */

const Models3D = {
  materials: {},
  storeTextures: {},

  initMaterials() {
    if (Object.keys(this.materials).length > 0) return;

    this.materials = {
      rubber: new THREE.MeshLambertMaterial({ color: 0x18181b }),
      rim: new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x0f172a, transmission: 0.6, opacity: 0.85, transparent: true }),
      headlight: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      taillight: new THREE.MeshLambertMaterial({ color: 0xff0033, emissive: 0xcc0022 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 }),

      // Car Paints
      premioWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.2, roughness: 0.3 }),
      taxiYellow: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.2, roughness: 0.3 }),
      suvBlack: new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0.4, roughness: 0.2 }),
      cngGreen: new THREE.MeshStandardMaterial({ color: 0x00c853, metalness: 0.3, roughness: 0.3 }),
      cngBlackCanvas: new THREE.MeshLambertMaterial({ color: 0x18181b }),

      // Rickshaws & Bikes
      rickshawPink: new THREE.MeshLambertMaterial({ color: 0xff1493 }),
      rickshawWood: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      bikeRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.3 }),
      foodpandaPink: new THREE.MeshLambertMaterial({ color: 0xd81b60 }),
      pathaoGreen: new THREE.MeshLambertMaterial({ color: 0x00b0ff }),

      // Laguna
      lagunaBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),

      // Humans & Clothes
      skinBrown: new THREE.MeshLambertMaterial({ color: 0x8d5538 }),
      panjabiWhite: new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }),
      shirtBlue: new THREE.MeshLambertMaterial({ color: 0x2563eb }),
      sareeRed: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
      sareeGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      pantsDark: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      gamchaRed: new THREE.MeshLambertMaterial({ color: 0xd90429 }),

      // Buses
      busBlue: new THREE.MeshLambertMaterial({ color: 0x2563eb }),
      busOrange: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
      busGreen: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
      busRoof: new THREE.MeshLambertMaterial({ color: 0x334155 }),

      // Monuments
      concrete: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      waterBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7, opacity: 0.85, transparent: true }),
      lilyWhite: new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x222222 }),
      lilyGold: new THREE.MeshLambertMaterial({ color: 0xfacc15 })
    };

    this.createStorefrontTextures();
  },

  // Generate procedural canvas textures with authentic Bengali shopfront signboards
  createStorefrontTextures() {
    const makeShopCanvas = (bengaliName, engName, bgColor, fgColor) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 128;
      const ctx = c.getContext('2d');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 512, 128);

      // Border frame
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 112);

      // Bengali Name
      ctx.fillStyle = fgColor;
      ctx.font = 'bold 44px Hind Siliguri, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bengaliName, 256, 62);

      // English subtitle
      ctx.font = 'bold 22px Orbitron, sans-serif';
      ctx.fillText(engName, 256, 100);

      const tex = new THREE.CanvasTexture(c);
      return new THREE.MeshBasicMaterial({ map: tex });
    };

    this.storeTextures = {
      shwapno: makeShopCanvas('স্বপ্ন সুপারশপ', 'SHWAPNO SUPER SHOP', '#b91c1c', '#ffffff'),
      biryani: makeShopCanvas('হাজী বিরিয়ানি অ্যান্ড রেস্তোরাঁ', 'HAJI BIRYANI', '#78350f', '#facc15'),
      pharmacy: makeShopCanvas('লাজ ফার্মা ও ফার্মেসী', 'LAZZ PHARMA & MEDICINE', '#15803d', '#ffffff'),
      cha: makeShopCanvas('টং এর গরম চা ও নাস্তা', 'DHAKA CHAI CORNER', '#d97706', '#ffffff'),
      rokomari: makeShopCanvas('রকমারি বুক কর্নার', 'ROKOMARI BOOKS', '#0284c7', '#ffffff'),
      bkash: makeShopCanvas('বিকাশ ও নগদ এজেন্ট', 'BKASH & NAGAD AGENT', '#db2777', '#ffffff'),
      aarong: makeShopCanvas('আড়ং ঢাকা লাইফস্টাইল', 'AARONG DHAKA', '#831843', '#fef08a'),
      pran: makeShopCanvas('প্রাণ-আরএফএল ফ্রেশ মার্ট', 'PRAN-RFL FRESH MART', '#1e40af', '#fde047')
    };
  },

  createWheel(radius = 0.42, width = 0.28) {
    const group = new THREE.Group();
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 14);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, this.materials.rubber);
    tire.castShadow = true;
    group.add(tire);

    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, this.materials.rim);
    group.add(rim);

    return group;
  },

  // ==========================================
  // PLAYER CAR (Premio / Taxi / SUV)
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

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.45, length), paintMat);
    body.position.y = height * 0.45;
    body.castShadow = true;
    car.add(body);

    // Cabin Glass
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, height * 0.52, length * (isSuv ? 0.68 : 0.52)), this.materials.glass);
    cabin.position.set(0, height * 0.72, isSuv ? -0.2 : -0.3);
    cabin.castShadow = true;
    car.add(cabin);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.32, 0.16, 0.1);
    const leftHL = new THREE.Mesh(hlGeo, this.materials.headlight);
    leftHL.position.set(-width * 0.36, height * 0.45, length / 2 + 0.02);
    const rightHL = new THREE.Mesh(hlGeo, this.materials.headlight);
    rightHL.position.set(width * 0.36, height * 0.45, length / 2 + 0.02);
    car.add(leftHL);
    car.add(rightHL);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.32, 0.16, 0.1);
    const leftTL = new THREE.Mesh(tlGeo, this.materials.taillight);
    leftTL.position.set(-width * 0.36, height * 0.48, -length / 2 - 0.02);
    const rightTL = new THREE.Mesh(tlGeo, this.materials.taillight);
    rightTL.position.set(width * 0.36, height * 0.48, -length / 2 - 0.02);
    car.add(leftTL);
    car.add(rightTL);

    if (hasTaxiSign) {
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.3), new THREE.MeshLambertMaterial({ color: 0xffcc00, emissive: 0x664400 }));
      sign.position.set(0, height * 0.72 + height * 0.28, -0.3);
      car.add(sign);
    }

    if (hasSpoiler) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.08, 0.35), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      wing.position.set(0, height * 0.75, -length / 2 + 0.2);
      car.add(wing);
    }

    // Wheels
    const wheelR = isSuv ? 0.48 : 0.4;
    const zOffset = length * 0.32;
    const xOffset = width / 2 + 0.05;

    const flW = this.createWheel(wheelR, 0.26); flW.position.set(-xOffset, wheelR, zOffset);
    const frW = this.createWheel(wheelR, 0.26); frW.position.set(xOffset, wheelR, zOffset);
    const rlW = this.createWheel(wheelR, 0.26); rlW.position.set(-xOffset, wheelR, -zOffset);
    const rrW = this.createWheel(wheelR, 0.26); rrW.position.set(xOffset, wheelR, -zOffset);

    car.add(flW); car.add(frW); car.add(rlW); car.add(rrW);
    car.wheels = [flW, frW, rlW, rrW];
    car.frontWheels = [flW, frW];

    return car;
  },

  // ==========================================
  // GREEN CNG AUTO-RICKSHAW
  // ==========================================
  createCngModel(isPlayer = false) {
    this.initMaterials();
    const cng = new THREE.Group();
    const w = 1.45, h = 1.7, l = 2.8;

    const bodyMat = isPlayer ? new THREE.MeshStandardMaterial({ color: 0x00e676 }) : this.materials.cngGreen;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.45, l * 0.85), bodyMat);
    body.position.set(0, h * 0.45, -0.1);
    cng.add(body);

    const roofGeo = new THREE.CylinderGeometry(w * 0.52, w * 0.52, l * 0.7, 10, 1, false, 0, Math.PI);
    roofGeo.rotateZ(Math.PI / 2);
    roofGeo.rotateY(Math.PI / 2);
    const roof = new THREE.Mesh(roofGeo, this.materials.cngBlackCanvas);
    roof.position.set(0, h * 0.75, -0.2);
    cng.add(roof);

    const cage = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, h * 0.45, l * 0.7), new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true }));
    cage.position.set(0, h * 0.7, -0.2);
    cng.add(cage);

    const wheelR = 0.34;
    const fW = this.createWheel(wheelR, 0.2); fW.position.set(0, wheelR, l * 0.38);
    const rlW = this.createWheel(wheelR, 0.22); rlW.position.set(-w / 2 - 0.05, wheelR, -l * 0.25);
    const rrW = this.createWheel(wheelR, 0.22); rrW.position.set(w / 2 + 0.05, wheelR, -l * 0.25);

    cng.add(fW); cng.add(rlW); cng.add(rrW);
    cng.wheels = [fW, rlW, rrW];
    cng.frontWheels = [fW];

    return cng;
  },

  // ==========================================
  // DELIVERY MOTORBIKE (Pathao / Foodpanda Bike)
  // ==========================================
  createMotorbikeModel(isPathao = true) {
    this.initMaterials();
    const bike = new THREE.Group();

    // Bike Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.8), this.materials.bikeRed);
    frame.position.set(0, 0.55, 0);
    bike.add(frame);

    // Fuel Tank & Handlebars
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.6), this.materials.bikeRed);
    tank.position.set(0, 0.85, 0.3);
    bike.add(tank);

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), this.materials.chrome);
    bar.rotateZ(Math.PI / 2);
    bar.position.set(0, 1.05, 0.55);
    bike.add(bar);

    // Front & Rear Wheels
    const wR = 0.36;
    const fW = this.createWheel(wR, 0.12); fW.position.set(0, wR, 0.85);
    const rW = this.createWheel(wR, 0.14); rW.position.set(0, wR, -0.75);
    bike.add(fW); bike.add(rW);
    bike.wheels = [fW, rW];

    // Rider (Human)
    const rider = new THREE.Group();
    // Body & Helmet
    const rBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.65, 8), this.materials.shirtBlue);
    rBody.position.set(0, 1.15, 0);
    rider.add(rBody);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), isPathao ? this.materials.pathaoGreen : this.materials.foodpandaPink);
    helmet.position.set(0, 1.6, 0.08);
    rider.add(helmet);

    // Delivery Box on back rack (Pathao / Foodpanda Box)
    const boxMat = isPathao ? this.materials.pathaoGreen : this.materials.foodpandaPink;
    const dBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), boxMat);
    dBox.position.set(0, 1.05, -0.55);
    rider.add(dBox);

    bike.add(rider);
    return bike;
  },

  // ==========================================
  // DHAKA LAGUNA / HUMAN HAULER (লেগুনা)
  // ==========================================
  createLagunaModel() {
    this.initMaterials();
    const laguna = new THREE.Group();

    const w = 1.8, h = 1.9, l = 4.2;

    // Blue Cabin Front
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, l * 0.4), this.materials.lagunaBlue);
    cabin.position.set(0, h * 0.45, l * 0.28);
    laguna.add(cabin);

    // Rear Covered Passenger Benches with canopy
    const rear = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, h * 0.65, l * 0.55), this.materials.cngBlackCanvas);
    rear.position.set(0, h * 0.48, -l * 0.2);
    laguna.add(rear);

    // Headlights
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.1), this.materials.headlight);
    hl.position.set(w * 0.35, 0.7, l / 2 + 0.02);
    laguna.add(hl);

    // 4 Wheels
    const wR = 0.38;
    const flW = this.createWheel(wR, 0.22); flW.position.set(-w / 2 - 0.04, wR, l * 0.25);
    const frW = this.createWheel(wR, 0.22); frW.position.set(w / 2 + 0.04, wR, l * 0.25);
    const rlW = this.createWheel(wR, 0.22); rlW.position.set(-w / 2 - 0.04, wR, -l * 0.25);
    const rrW = this.createWheel(wR, 0.22); rrW.position.set(w / 2 + 0.04, wR, -l * 0.25);

    laguna.add(flW); laguna.add(frW); laguna.add(rlW); laguna.add(rrW);
    laguna.wheels = [flW, frW, rlW, rrW];

    return laguna;
  },

  // ==========================================
  // CYCLE RICKSHAW
  // ==========================================
  createRickshawModel() {
    this.initMaterials();
    const rickshaw = new THREE.Group();

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), this.materials.rickshawWood);
    seat.position.set(0, 0.7, -0.4);
    rickshaw.add(seat);

    const hoodGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.25, 10, 1, false, 0, Math.PI);
    hoodGeo.rotateZ(Math.PI / 2);
    hoodGeo.rotateY(Math.PI / 2);
    const hood = new THREE.Mesh(hoodGeo, this.materials.rickshawPink);
    hood.position.set(0, 1.35, -0.5);
    rickshaw.add(hood);

    const pullerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8), this.materials.skinBrown);
    pullerBody.position.set(0, 1.05, 0.4);
    const pullerHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this.materials.gamchaRed);
    pullerHead.position.set(0, 1.5, 0.4);
    rickshaw.add(pullerBody);
    rickshaw.add(pullerHead);

    const rW = 0.48, fW = 0.42;
    const rlW = this.createWheel(rW, 0.12); rlW.position.set(-0.68, rW, -0.4);
    const rrW = this.createWheel(rW, 0.12); rrW.position.set(0.68, rW, -0.4);
    const fw = this.createWheel(fW, 0.1); fw.position.set(0, fW, 0.9);

    rickshaw.add(rlW); rickshaw.add(rrW); rickshaw.add(fw);
    rickshaw.wheels = [rlW, rrW, fw];
    return rickshaw;
  },

  // ==========================================
  // DHAKA LOCAL BUS (Shikhor / Balaka / Bikolpo)
  // ==========================================
  createBusModel(name = 'shikhor') {
    this.initMaterials();
    const bus = new THREE.Group();
    const w = 2.4, h = 2.8, l = 8.5;

    let paint = this.materials.busBlue;
    if (name === 'balaka') paint = this.materials.busOrange;
    if (name === 'bikolpo') paint = this.materials.busGreen;

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.75, l), paint);
    body.position.set(0, h * 0.55, 0);
    body.castShadow = true;
    bus.add(body);

    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.7, l * 0.88), this.materials.glass);
    win.position.set(0, h * 0.65, 0);
    bus.add(win);

    const wheelR = 0.55;
    const flW = this.createWheel(wheelR, 0.32); flW.position.set(-w / 2 - 0.08, wheelR, l * 0.32);
    const frW = this.createWheel(wheelR, 0.32); frW.position.set(w / 2 + 0.08, wheelR, l * 0.32);
    const rlW = this.createWheel(wheelR, 0.35); rlW.position.set(-w / 2 - 0.08, wheelR, -l * 0.28);
    const rrW = this.createWheel(wheelR, 0.35); rrW.position.set(w / 2 + 0.08, wheelR, -l * 0.28);

    bus.add(flW); bus.add(frW); bus.add(rlW); bus.add(rrW);
    bus.wheels = [flW, frW, rlW, rrW];

    return bus;
  },

  // ==========================================
  // 3D WALKING PEDESTRIANS / HUMANS (Dhakaiya)
  // ==========================================
  createPedestrianModel(type = 0) {
    this.initMaterials();
    const human = new THREE.Group();

    // Torso Clothes (Panjabi / Saree / Shirt)
    const clothes = [this.materials.panjabiWhite, this.materials.shirtBlue, this.materials.sareeRed, this.materials.sareeGreen];
    const torsoMat = clothes[type % clothes.length];

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8), torsoMat);
    torso.position.y = 1.05;
    human.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this.materials.skinBrown);
    head.position.y = 1.52;
    human.add(head);

    // Hair / Gamcha
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), (type % 2 === 0 ? this.materials.gamchaRed : this.materials.pantsDark));
    hair.position.y = 1.54;
    human.add(hair);

    // Left and Right Legs (Animatable for walking)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.7, 6);
    const leftLeg = new THREE.Mesh(legGeo, this.materials.pantsDark);
    leftLeg.position.set(-0.11, 0.35, 0);
    const rightLeg = new THREE.Mesh(legGeo, this.materials.pantsDark);
    rightLeg.position.set(0.11, 0.35, 0);

    human.add(leftLeg);
    human.add(rightLeg);
    human.leftLeg = leftLeg;
    human.rightLeg = rightLeg;

    return human;
  },

  // ==========================================
  // SHAPLA CHOTTOR MONUMENT 3D
  // ==========================================
  createShaplaMonument() {
    this.initMaterials();
    const group = new THREE.Group();

    const pool = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 1.2, 32), this.materials.concrete);
    pool.position.y = 0.6;
    group.add(pool);

    const water = new THREE.Mesh(new THREE.CircleGeometry(13.8, 32), this.materials.waterBlue);
    water.rotateX(-Math.PI / 2);
    water.position.y = 1.21;
    group.add(water);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const petalGeo = new THREE.ConeGeometry(1.6, 9, 5);
      petalGeo.rotateZ(0.4);
      const petal = new THREE.Mesh(petalGeo, this.materials.lilyWhite);
      petal.position.set(Math.cos(angle) * 3, 4.5, Math.sin(angle) * 3);
      petal.rotation.y = -angle + Math.PI / 2;
      group.add(petal);
    }

    const stamen = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 7, 12), this.materials.lilyGold);
    stamen.position.y = 4.2;
    group.add(stamen);

    return group;
  },

  // ==========================================
  // DHAKA TONG TEA STALL (টং এর দোকান)
  // ==========================================
  createTongTeaStall() {
    this.initMaterials();
    const stall = new THREE.Group();

    // Wooden counter & bench
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.2), this.materials.rickshawWood);
    counter.position.set(0, 0.5, 0);
    stall.add(counter);

    // Bench for customers
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.5), new THREE.MeshLambertMaterial({ color: 0x92400e }));
    bench.position.set(0, 0.22, 1.4);
    stall.add(bench);

    // 4 Bamboo poles
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(px, 1.2, pz);
      stall.add(pole);
    });

    // Colorful blue/red tarpaulin canopy roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.8), new THREE.MeshLambertMaterial({ color: 0x2563eb }));
    roof.position.set(0, 2.4, 0);
    roof.rotation.x = 0.08;
    stall.add(roof);

    // Aluminum Tea Kettle (কেটলি)
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.35, 10), this.materials.chrome);
    kettle.position.set(-0.6, 1.18, 0);
    stall.add(kettle);

    // Biscuit Jars
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.32, 8), this.materials.glass);
    jar.position.set(0.4, 1.16, 0);
    stall.add(jar);

    return stall;
  },

  // ==========================================
  // STREET TREES / PALMS
  // ==========================================
  createStreetTree() {
    this.initMaterials();
    const tree = new THREE.Group();

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.8, 8), new THREE.MeshLambertMaterial({ color: 0x5c4033 }));
    trunk.position.y = 1.9;
    tree.add(trunk);

    // Lush Foliage
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x166534 });
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), foliageMat);
    c1.position.y = 4.2;
    tree.add(c1);

    const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshLambertMaterial({ color: 0x15803d }));
    c2.position.set(0.5, 5.2, -0.3);
    tree.add(c2);

    return tree;
  }
};

window.Models3D = Models3D;
