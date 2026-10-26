/**
 * DHAKA STREET RUSH - SPRITE GENERATOR
 * Procedural Dhaka vehicle sprites, rickshaws, CNGs, buses, and roadside landmarks
 * Cached to offscreen canvases for blazing 60FPS performance.
 */

// Canvas roundRect Polyfill for universal browser compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    if (!radii) radii = 0;
    const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

const Sprites = {
  cache: {},

  // Helper to create an offscreen canvas
  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  },

  init() {
    this.generatePlayerCars();
    this.generateTraffic();
    this.generateRoadsideProps();
    this.generateMetroTrain();
  },

  // ==========================================
  // PLAYER CARS
  // ==========================================
  generatePlayerCars() {
    // 1. White Toyota Premio
    this.cache['player_premio'] = this.renderCar({
      bodyColor: '#f0f4f8',
      roofColor: '#d9e2ec',
      glassColor: '#1e293b',
      tailColor: '#ff0033',
      width: 140,
      height: 75,
      type: 'sedan',
      spoiler: true,
      hasNeon: true
    });

    // 2. Yellow Dhaka Taxi
    this.cache['player_taxi'] = this.renderCar({
      bodyColor: '#ffb703',
      roofColor: '#111111',
      glassColor: '#0f172a',
      tailColor: '#ff0033',
      width: 140,
      height: 75,
      type: 'taxi',
      hasTaxiSign: true
    });

    // 3. Black VIP SUV (Prado)
    this.cache['player_suv'] = this.renderCar({
      bodyColor: '#1a1d24',
      roofColor: '#0d0f12',
      glassColor: '#05070a',
      tailColor: '#ff1a1a',
      width: 155,
      height: 90,
      type: 'suv',
      bullbar: true
    });

    // 4. Tuned Dhaka Green CNG (Nitro Beast)
    this.cache['player_cng'] = this.renderCngSprite(true);
  },

  renderCar(config) {
    const c = this.createCanvas(config.width + 40, config.height + 40);
    const ctx = c.getContext('2d');
    const ox = 20;
    const oy = 10;
    const w = config.width;
    const h = config.height;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(ox + w / 2, oy + h + 5, w * 0.52, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Underglow neon if enabled
    if (config.hasNeon) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
    }

    // Rear tires
    ctx.fillStyle = '#111';
    ctx.fillRect(ox + 8, oy + h - 18, 22, 24);
    ctx.fillRect(ox + w - 30, oy + h - 18, 22, 24);

    // Car lower body / bumper
    ctx.fillStyle = config.bodyColor;
    ctx.beginPath();
    ctx.roundRect(ox + 10, oy + h * 0.42, w - 20, h * 0.52, 10);
    ctx.fill();

    // Bumper diffuser / bottom trim
    ctx.fillStyle = '#222';
    ctx.fillRect(ox + 16, oy + h * 0.82, w - 32, 10);

    // Exhaust pipes
    ctx.fillStyle = '#bbb';
    ctx.fillRect(ox + 22, oy + h * 0.88, 10, 6);
    ctx.fillRect(ox + 36, oy + h * 0.88, 10, 6);

    // Roof & Cabin
    ctx.fillStyle = config.roofColor || config.bodyColor;
    ctx.beginPath();
    ctx.moveTo(ox + 25, oy + h * 0.45);
    ctx.lineTo(ox + 35, oy + 4);
    ctx.lineTo(ox + w - 35, oy + 4);
    ctx.lineTo(ox + w - 25, oy + h * 0.45);
    ctx.closePath();
    ctx.fill();

    // Rear Glass Windshield
    ctx.fillStyle = config.glassColor || '#1e293b';
    ctx.beginPath();
    ctx.moveTo(ox + 30, oy + h * 0.42);
    ctx.lineTo(ox + 38, oy + 8);
    ctx.lineTo(ox + w - 38, oy + 8);
    ctx.lineTo(ox + w - 30, oy + h * 0.42);
    ctx.closePath();
    ctx.fill();

    // Glass reflection
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox + 46, oy + 12);
    ctx.lineTo(ox + 40, oy + h * 0.38);
    ctx.stroke();

    // Taillights
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 12;
    ctx.fillStyle = config.tailColor || '#ff0033';
    // Left taillight
    ctx.fillRect(ox + 14, oy + h * 0.46, 26, 14);
    // Right taillight
    ctx.fillRect(ox + w - 40, oy + h * 0.46, 26, 14);

    // Inner amber turn lights
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(ox + 28, oy + h * 0.48, 8, 10);
    ctx.fillRect(ox + w - 36, oy + h * 0.48, 8, 10);

    // License Plate (Dhaka Metro)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(ox + w / 2 - 24, oy + h * 0.65, 48, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Hind Siliguri, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ঢাকা মেট্রো-গ', ox + w / 2, oy + h * 0.65 + 11);

    // Taxi Roof Sign
    if (config.hasTaxiSign) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(ox + w / 2 - 18, oy - 8, 36, 12);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 8px Orbitron, sans-serif';
      ctx.fillText('TAXI', ox + w / 2, oy);
    }

    // Spoiler
    if (config.spoiler) {
      ctx.fillStyle = '#111';
      ctx.fillRect(ox + 18, oy + h * 0.36, w - 36, 6);
      ctx.fillRect(ox + 28, oy + h * 0.36, 6, 8);
      ctx.fillRect(ox + w - 34, oy + h * 0.36, 6, 8);
    }

    return c;
  },

  // ==========================================
  // DHAKA RICKSHAW
  // ==========================================
  renderRickshawSprite() {
    const c = this.createCanvas(120, 130);
    const ctx = c.getContext('2d');
    const ox = 10;
    const oy = 10;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(ox + 50, oy + 112, 42, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear Two Wheels
    ctx.fillStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#888';
    // Left wheel
    ctx.fillRect(ox + 6, oy + 65, 8, 48);
    // Right wheel
    ctx.fillRect(ox + 86, oy + 65, 8, 48);

    // Rickshaw Body / Wooden Frame
    ctx.fillStyle = '#008080';
    ctx.fillRect(ox + 18, oy + 60, 64, 30);

    // Iconic Rickshaw Art Back Plate (পেইন্টিং প্লেট)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(ox + 22, oy + 62, 56, 24);
    // Art pattern inside (Flower / Peacock motif)
    ctx.fillStyle = '#e6005c';
    ctx.beginPath();
    ctx.arc(ox + 50, oy + 74, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.arc(ox + 50, oy + 74, 5, 0, Math.PI * 2);
    ctx.fill();

    // Ornate tassels / fringes hanging down
    ctx.fillStyle = '#ff0055';
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(ox + 24 + i * 8, oy + 88, 4, 8);
    }

    // High Colorful Rickshaw Hood (হুড)
    ctx.fillStyle = '#ff1493'; // Deep Pink hood
    ctx.beginPath();
    ctx.moveTo(ox + 16, oy + 58);
    ctx.quadraticCurveTo(ox + 50, oy - 2, ox + 84, oy + 58);
    ctx.closePath();
    ctx.fill();

    // Decorative Yellow & Green stripes on hood
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ox + 50, oy + 32, 28, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();

    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ox + 50, oy + 32, 20, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();

    // Rickshaw Puller (মাথার গামছা ও পিঠ)
    ctx.fillStyle = '#2b394a'; // T-shirt
    ctx.beginPath();
    ctx.roundRect(ox + 42, oy + 42, 16, 20, 4);
    ctx.fill();
    // Red Gamcha (গামছা) tied on head
    ctx.fillStyle = '#d90429';
    ctx.beginPath();
    ctx.arc(ox + 50, oy + 36, 8, 0, Math.PI * 2);
    ctx.fill();

    return c;
  },

  // ==========================================
  // DHAKA CNG AUTO-RICKSHAW
  // ==========================================
  renderCngSprite(isPlayer = false) {
    const c = this.createCanvas(130, 120);
    const ctx = c.getContext('2d');
    const ox = 15;
    const oy = 10;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(ox + 50, oy + 98, 46, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wide rear wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(ox + 4, oy + 65, 12, 32);
    ctx.fillRect(ox + 84, oy + 65, 12, 32);

    // Green Metallic Body
    ctx.fillStyle = isPlayer ? '#00e676' : '#009944';
    ctx.beginPath();
    ctx.roundRect(ox + 14, oy + 40, 72, 50, 10);
    ctx.fill();

    // Black Canvas Curved Top Roof
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(ox + 16, oy + 42);
    ctx.quadraticCurveTo(ox + 50, oy + 6, ox + 84, oy + 42);
    ctx.closePath();
    ctx.fill();

    // Yellow Protective Wire Mesh Grid (Security cage)
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 1.5;
    for (let x = ox + 22; x <= ox + 78; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, oy + 28);
      ctx.lineTo(x, oy + 54);
      ctx.stroke();
    }
    for (let y = oy + 32; y <= oy + 50; y += 6) {
      ctx.beginPath();
      ctx.moveTo(ox + 20, y);
      ctx.lineTo(ox + 80, y);
      ctx.stroke();
    }

    // Taillights
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(ox + 18, oy + 70, 12, 10);
    ctx.fillRect(ox + 70, oy + 70, 12, 10);

    // CNG License Plate
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ox + 35, oy + 72, 30, 14);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 7px Hind Siliguri, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ঢাকা-থ', ox + 50, oy + 82);

    // Nitro exhausts if player
    if (isPlayer) {
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(ox + 22, oy + 86, 8, 6);
      ctx.fillRect(ox + 70, oy + 86, 8, 6);
    }

    return c;
  },

  // ==========================================
  // DHAKA LOCAL BUS (Shikhor / Balaka / Bikolpo)
  // ==========================================
  renderBusSprite(name, color1, color2) {
    const c = this.createCanvas(180, 190);
    const ctx = c.getContext('2d');
    const ox = 15;
    const oy = 10;
    const w = 150;
    const h = 160;

    // Heavy shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(ox + w / 2, oy + h + 2, w * 0.48, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual Rear Tires
    ctx.fillStyle = '#111';
    ctx.fillRect(ox + 12, oy + h - 35, 20, 36);
    ctx.fillRect(ox + w - 32, oy + h - 35, 20, 36);

    // Bus Main Body
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.roundRect(ox + 16, oy + 10, w - 32, h - 22, 12);
    ctx.fill();

    // Colorful Bottom Band / Slogan area
    ctx.fillStyle = color2;
    ctx.fillRect(ox + 16, oy + h * 0.62, w - 32, h * 0.24);

    // Heavy Metal Rear Bumper (dented & welded!)
    ctx.fillStyle = '#374151';
    ctx.fillRect(ox + 12, oy + h - 22, w - 24, 16);
    // Bumper hazard warning stripes (Black and yellow)
    for (let i = ox + 18; i < ox + w - 24; i += 16) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(i, oy + h - 20);
      ctx.lineTo(i + 8, oy + h - 20);
      ctx.lineTo(i + 2, oy + h - 8);
      ctx.lineTo(i - 6, oy + h - 8);
      ctx.fill();
    }

    // Rear Windows
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(ox + 28, oy + 25, 46, 44, 6);
    ctx.roundRect(ox + 78, oy + 25, 46, 44, 6);
    ctx.fill();

    // Passengers inside window silhouettes
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(ox + 45, oy + 46, 10, 0, Math.PI * 2);
    ctx.arc(ox + 105, oy + 44, 11, 0, Math.PI * 2);
    ctx.fill();

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(ox + 22, oy + h * 0.72, 16, 22);
    ctx.fillRect(ox + w - 38, oy + h * 0.72, 16, 22);

    // Amber indicators
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(ox + 22, oy + h * 0.72 + 22, 16, 8);
    ctx.fillRect(ox + w - 38, oy + h * 0.72 + 22, 16, 8);

    // Bus Route / Name Plaque
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 35, oy + h * 0.54, w - 70, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Hind Siliguri, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, ox + w / 2, oy + h * 0.54 + 13);

    // Iconic Bengali Slogan on Bus Bumper
    const slogans = ['১০০ হাত দূরে থাকুন', 'দূরত্ব বজায় রাখুন', 'দিল দিলে দিল পাবেন', 'আল্লাহ ভরসা'];
    const slogan = slogans[Math.floor(Math.random() * slogans.length)];
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px Hind Siliguri, sans-serif';
    ctx.fillText(slogan, ox + w / 2, oy + h * 0.76);

    // Rear Roof Exhaust Pipe puffing a little soot
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(ox + w - 34, oy + 4, 8, 12);

    return c;
  },

  // ==========================================
  // BLACK VIP POLICE SUV WITH SIREN
  // ==========================================
  renderVipPoliceSprite() {
    const c = this.createCanvas(170, 110);
    const ctx = c.getContext('2d');
    const ox = 20;
    const oy = 15;
    const w = 130;
    const h = 75;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(ox + w / 2, oy + h + 6, w * 0.5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(ox + 6, oy + h - 18, 20, 24);
    ctx.fillRect(ox + w - 26, oy + h - 18, 20, 24);

    // Body
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(ox + 8, oy + 26, w - 16, h - 24, 8);
    ctx.fill();

    // Dark tinted rear glass
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(ox + 22, oy + 26);
    ctx.lineTo(ox + 28, oy + 6);
    ctx.lineTo(ox + w - 28, oy + 6);
    ctx.lineTo(ox + w - 22, oy + 26);
    ctx.closePath();
    ctx.fill();

    // Taillights
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(ox + 12, oy + 32, 18, 14);
    ctx.fillRect(ox + w - 30, oy + 32, 18, 14);

    // Roof Police Strobe Bar (Red & Blue)
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(ox + w / 2 - 20, oy - 2, 18, 8);
    ctx.fillStyle = '#0066ff';
    ctx.fillRect(ox + w / 2 + 2, oy - 2, 18, 8);

    // Chrome Emblem
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', ox + w / 2, oy + 42);

    return c;
  },

  // ==========================================
  // ROADSIDE PROPS & LANDMARKS
  // ==========================================
  generateRoadsideProps() {
    // 1. Dhaka Tong-er Cha Dokan ( roadside tea stall )
    const teaCanvas = this.createCanvas(140, 140);
    const tCtx = teaCanvas.getContext('2d');
    
    // Wooden stall structure
    tCtx.fillStyle = '#78350f';
    tCtx.fillRect(20, 50, 100, 60);

    // Corrugated tin roof
    tCtx.fillStyle = '#94a3b8';
    tCtx.beginPath();
    tCtx.moveTo(10, 50);
    tCtx.lineTo(70, 20);
    tCtx.lineTo(130, 50);
    tCtx.closePath();
    tCtx.fill();

    // Big Red Boiling Kettle (কেটলি)
    tCtx.fillStyle = '#dc2626';
    tCtx.beginPath();
    tCtx.arc(50, 68, 12, 0, Math.PI * 2);
    tCtx.fill();
    // Kettle spout
    tCtx.strokeStyle = '#dc2626';
    tCtx.lineWidth = 4;
    tCtx.beginPath();
    tCtx.moveTo(40, 68);
    tCtx.lineTo(32, 60);
    tCtx.stroke();

    // Condensed milk cans stack & biscuit jars
    tCtx.fillStyle = '#38bdf8';
    tCtx.fillRect(72, 60, 12, 14);
    tCtx.fillRect(86, 60, 12, 14);

    // Banana bunch hanging
    tCtx.fillStyle = '#facc15';
    for (let i = 0; i < 4; i++) {
      tCtx.beginPath();
      tCtx.arc(106 + i * 3, 52 + i * 2, 5, 0, Math.PI * 2);
      tCtx.fill();
    }

    // Bengali Signboard "রং চা / দুধ চা"
    tCtx.fillStyle = '#ef4444';
    tCtx.fillRect(35, 90, 70, 18);
    tCtx.fillStyle = '#ffffff';
    tCtx.font = 'bold 10px Hind Siliguri, sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('টং এর চা স্টল', 70, 103);

    this.cache['prop_cha_dokan'] = teaCanvas;

    // 2. Metro Rail Concrete Pillar (Dhaka MRT Line 6)
    const pillarCanvas = this.createCanvas(120, 320);
    const pCtx = pillarCanvas.getContext('2d');
    // Massive concrete pillar
    pCtx.fillStyle = '#64748b';
    pCtx.fillRect(40, 0, 40, 320);
    // Concrete joints & texture
    pCtx.fillStyle = '#475569';
    pCtx.fillRect(38, 70, 44, 10);
    pCtx.fillRect(38, 160, 44, 10);
    pCtx.fillRect(38, 250, 44, 10);

    // Pillar number & logo
    pCtx.fillStyle = '#059669';
    pCtx.fillRect(42, 180, 36, 26);
    pCtx.fillStyle = '#ffffff';
    pCtx.font = 'bold 9px Orbitron, sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText('MRT-6', 60, 197);

    this.cache['prop_metro_pillar'] = pillarCanvas;

    // 3. Dhaka Green Coconut (ডাব) Cart
    const dabCanvas = this.createCanvas(100, 90);
    const dCtx = dabCanvas.getContext('2d');
    dCtx.fillStyle = '#a16207'; // wooden cart
    dCtx.fillRect(15, 45, 70, 25);
    // Cart wheels
    dCtx.fillStyle = '#111';
    dCtx.beginPath();
    dCtx.arc(30, 75, 10, 0, Math.PI * 2);
    dCtx.arc(70, 75, 10, 0, Math.PI * 2);
    dCtx.fill();
    // Green coconuts mound
    dCtx.fillStyle = '#22c55e';
    for (let i = 0; i < 9; i++) {
      dCtx.beginPath();
      dCtx.arc(28 + (i % 5) * 11, 40 - Math.floor(i / 5) * 9, 7, 0, Math.PI * 2);
      dCtx.fill();
    }
    this.cache['prop_dab_cart'] = dabCanvas;

    // 4. Dhaka Street Signboard (হাতিরঝিল / গুলশান / বিমানবন্দর)
    const makeSign = (nameBangla, nameEng) => {
      const sCanvas = this.createCanvas(160, 130);
      const sCtx = sCanvas.getContext('2d');
      // Metal pole
      sCtx.fillStyle = '#475569';
      sCtx.fillRect(75, 60, 10, 70);
      // Green Highway Board
      sCtx.fillStyle = '#15803d';
      sCtx.strokeStyle = '#ffffff';
      sCtx.lineWidth = 3;
      sCtx.roundRect(10, 10, 140, 52, 6);
      sCtx.fill();
      sCtx.stroke();

      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 14px Hind Siliguri, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText(nameBangla, 80, 32);

      sCtx.font = 'bold 10px Orbitron, sans-serif';
      sCtx.fillText(nameEng, 80, 48);

      return sCanvas;
    };

    this.cache['sign_hatirjheel'] = makeSign('হাতিরঝিল', 'HATIRJHEEL EXP');
    this.cache['sign_farmgate'] = makeSign('ফার্মগেট', 'FARMGATE');
    this.cache['sign_airport'] = makeSign('বিমানবন্দর', 'AIRPORT ROAD');

    // 5. Roadside Tree / Palm
    const treeCanvas = this.createCanvas(120, 200);
    const trCtx = treeCanvas.getContext('2d');
    trCtx.fillStyle = '#5c4033';
    trCtx.fillRect(52, 90, 16, 110);
    trCtx.fillStyle = '#15803d';
    trCtx.beginPath();
    trCtx.arc(60, 80, 45, 0, Math.PI * 2);
    trCtx.arc(40, 60, 35, 0, Math.PI * 2);
    trCtx.arc(80, 60, 35, 0, Math.PI * 2);
    trCtx.fill();
    this.cache['prop_tree'] = treeCanvas;

    // 6. Bonus Pickup Item: "Doodh Cha & Singara"
    const chaiBonusCanvas = this.createCanvas(60, 60);
    const cbCtx = chaiBonusCanvas.getContext('2d');
    // Golden glow circle
    cbCtx.fillStyle = 'rgba(255, 204, 0, 0.4)';
    cbCtx.beginPath();
    cbCtx.arc(30, 30, 26, 0, Math.PI * 2);
    cbCtx.fill();
    cbCtx.fillStyle = '#ffcc00';
    cbCtx.beginPath();
    cbCtx.arc(30, 30, 20, 0, Math.PI * 2);
    cbCtx.fill();

    // Hot tea cup inside
    cbCtx.fillStyle = '#fff';
    cbCtx.fillRect(20, 22, 20, 16);
    cbCtx.fillStyle = '#78350f'; // tea
    cbCtx.fillRect(22, 24, 16, 4);
    // Steam
    cbCtx.strokeStyle = 'rgba(255,255,255,0.8)';
    cbCtx.lineWidth = 2;
    cbCtx.beginPath();
    cbCtx.moveTo(25, 20);
    cbCtx.quadraticCurveTo(23, 14, 27, 8);
    cbCtx.moveTo(33, 20);
    cbCtx.quadraticCurveTo(36, 14, 32, 8);
    cbCtx.stroke();
    this.cache['pickup_chai'] = chaiBonusCanvas;
  },

  // ==========================================
  // METRO RAIL OVERHEAD TRAIN
  // ==========================================
  generateMetroTrain() {
    const c = this.createCanvas(500, 65);
    const ctx = c.getContext('2d');

    // Metro train silver/white streamlined carriages
    ctx.fillStyle = '#e2e8f0';
    ctx.roundRect(10, 10, 480, 45, 10);
    ctx.fill();

    // Red & Green Bangladeshi flag stripe along train
    ctx.fillStyle = '#15803d';
    ctx.fillRect(10, 28, 480, 7);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 35, 480, 5);

    // Carriage Windows
    ctx.fillStyle = '#0f172a';
    for (let x = 25; x < 470; x += 35) {
      ctx.roundRect(x, 16, 24, 14, 3);
      ctx.fill();
    }

    // Cab front windshield
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(460, 16);
    ctx.lineTo(485, 28);
    ctx.lineTo(485, 45);
    ctx.lineTo(460, 45);
    ctx.closePath();
    ctx.fill();

    // MRT Headlight
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(482, 38, 4, 0, Math.PI * 2);
    ctx.fill();

    this.cache['metro_train'] = c;
  },

  // Generate traffic variants
  generateTraffic() {
    this.cache['traffic_rickshaw'] = this.renderRickshawSprite();
    this.cache['traffic_cng'] = this.renderCngSprite(false);
    this.cache['traffic_bus_shikhor'] = this.renderBusSprite('শিকড় পরিবহন', '#3b82f6', '#1d4ed8');
    this.cache['traffic_bus_balaka'] = this.renderBusSprite('বলাকা এক্সপ্রেস', '#f97316', '#c2410c');
    this.cache['traffic_bus_bikolpo'] = this.renderBusSprite('বিকল্প অটো সার্ভিস', '#22c55e', '#15803d');
    this.cache['traffic_police'] = this.renderVipPoliceSprite();
  }
};

window.Sprites = Sprites;
