/**
 * DHAKA CITY RUSH - SPRITE GENERATOR (Top-Down & City Grid)
 * Procedural top-down Dhaka vehicles, rickshaws, CNGs, buses, and city props.
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
    this.arcTo(x, y + w, y, r);
    this.closePath();
    return this;
  };
}

const Sprites = {
  cache: {},

  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  },

  init() {
    this.generateTopDownPlayerCars();
    this.generateTopDownTraffic();
    this.generateTopDownProps();
  },

  // ==========================================
  // TOP-DOWN CAR GENERATOR (Rendered facing UP, angle = -PI/2 or 0)
  // Let's standardise facing angle = 0 (pointing RIGHT / East)
  // ==========================================
  renderTopDownCar(config) {
    const w = config.length || 68;
    const h = config.width || 34;
    const c = this.createCanvas(w + 20, h + 20);
    const ctx = c.getContext('2d');
    const ox = 10;
    const oy = 10;

    // Soft drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(ox + 2, oy + 4, w, h, 8);
    ctx.fill();

    // Wheels (4 tires)
    ctx.fillStyle = '#111';
    ctx.fillRect(ox + 10, oy - 2, 14, 5);
    ctx.fillRect(ox + 10, oy + h - 3, 14, 5);
    ctx.fillRect(ox + w - 22, oy - 2, 14, 5);
    ctx.fillRect(ox + w - 22, oy + h - 3, 14, 5);

    // Car Main Body
    ctx.fillStyle = config.bodyColor;
    ctx.beginPath();
    ctx.roundRect(ox, oy, w, h, 8);
    ctx.fill();

    // Hood / Front curve accent
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(ox + w - 20, oy + 3, 18, h - 6);

    // Windshield & Rear glass
    ctx.fillStyle = config.glassColor || '#1e293b';
    // Front windshield
    ctx.beginPath();
    ctx.moveTo(ox + w - 22, oy + 4);
    ctx.lineTo(ox + w - 27, oy + 4);
    ctx.lineTo(ox + w - 27, oy + h - 4);
    ctx.lineTo(ox + w - 22, oy + h - 4);
    ctx.closePath();
    ctx.fill();

    // Rear windshield
    ctx.fillRect(ox + 14, oy + 4, 6, h - 8);

    // Roof
    ctx.fillStyle = config.roofColor || config.bodyColor;
    ctx.fillRect(ox + 20, oy + 4, w - 47, h - 8);

    // Side windows
    ctx.fillStyle = config.glassColor || '#1e293b';
    ctx.fillRect(ox + 22, oy + 3, w - 50, 2);
    ctx.fillRect(ox + 22, oy + h - 5, w - 50, 2);

    // Headlights (Twin white / cyan beams)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + w - 3, oy + 4, 3, 6);
    ctx.fillRect(ox + w - 3, oy + h - 10, 3, 6);

    // Taillights (Red)
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(ox, oy + 4, 3, 7);
    ctx.fillRect(ox, oy + h - 11, 3, 7);

    // Taxi Roof Sign
    if (config.hasTaxiSign) {
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(ox + w / 2 - 8, oy + h / 2 - 5, 16, 10);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TAXI', ox + w / 2, oy + h / 2 + 3);
    }

    // Spoiler
    if (config.hasSpoiler) {
      ctx.fillStyle = '#111';
      ctx.fillRect(ox + 2, oy + 2, 4, h - 4);
    }

    return c;
  },

  generateTopDownPlayerCars() {
    // 1. Toyota Premio (White)
    this.cache['player_premio'] = this.renderTopDownCar({
      bodyColor: '#f8fafc',
      roofColor: '#e2e8f0',
      glassColor: '#0f172a',
      length: 70,
      width: 34,
      hasSpoiler: true
    });

    // 2. Dhaka Yellow Cab
    this.cache['player_taxi'] = this.renderTopDownCar({
      bodyColor: '#ffb703',
      roofColor: '#18181b',
      glassColor: '#020617',
      length: 68,
      width: 34,
      hasTaxiSign: true
    });

    // 3. Black VIP SUV (Prado)
    this.cache['player_suv'] = this.renderTopDownCar({
      bodyColor: '#18181b',
      roofColor: '#09090b',
      glassColor: '#000000',
      length: 76,
      width: 38
    });

    // 4. Tuned Turbo CNG (3-Wheeler)
    this.cache['player_cng'] = this.renderTopDownCng(true);
  },

  // ==========================================
  // TOP-DOWN CNG AUTO-RICKSHAW
  // ==========================================
  renderTopDownCng(isPlayer = false) {
    const w = 50;
    const h = 30;
    const c = this.createCanvas(w + 16, h + 16);
    const ctx = c.getContext('2d');
    const ox = 8;
    const oy = 8;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(ox + 2, oy + 3, w, h, 6);
    ctx.fill();

    // Wheels: 1 front wheel in center, 2 rear wheels
    ctx.fillStyle = '#111';
    // Front wheel
    ctx.fillRect(ox + w - 8, oy + h / 2 - 3, 8, 6);
    // Rear wheels
    ctx.fillRect(ox + 8, oy - 2, 10, 4);
    ctx.fillRect(ox + 8, oy + h - 2, 10, 4);

    // Green Body Frame
    ctx.fillStyle = isPlayer ? '#00e676' : '#009944';
    ctx.beginPath();
    ctx.moveTo(ox, oy + 4);
    ctx.lineTo(ox + w - 16, oy + 2);
    ctx.lineTo(ox + w - 4, oy + h / 2);
    ctx.lineTo(ox + w - 16, oy + h - 2);
    ctx.lineTo(ox, oy + h - 4);
    ctx.closePath();
    ctx.fill();

    // Black Canvas Curved Roof
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(ox + 4, oy + 4, w - 22, h - 8, 4);
    ctx.fill();

    // Yellow Security Mesh Cage Trim
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox + 6, oy + 5, w - 24, h - 10);

    // Taillights & Headlight
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(ox, oy + 4, 3, 5);
    ctx.fillRect(ox, oy + h - 9, 3, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + w - 3, oy + h / 2 - 3, 3, 6);

    return c;
  },

  // ==========================================
  // TOP-DOWN CYCLE RICKSHAW
  // ==========================================
  renderTopDownRickshaw() {
    const w = 48;
    const h = 28;
    const c = this.createCanvas(w + 16, h + 16);
    const ctx = c.getContext('2d');
    const ox = 8;
    const oy = 8;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(ox + w / 2, oy + h / 2 + 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2 Large Rear Wheels
    ctx.fillStyle = '#333';
    ctx.fillRect(ox + 6, oy - 2, 12, 4);
    ctx.fillRect(ox + 6, oy + h - 2, 12, 4);

    // Front single bicycle wheel
    ctx.fillRect(ox + w - 10, oy + h / 2 - 2, 10, 4);

    // Wooden passenger seat base
    ctx.fillStyle = '#008080';
    ctx.fillRect(ox + 4, oy + 4, 22, h - 8);

    // Colorful Rickshaw Hood (হুড)
    ctx.fillStyle = '#ff1493'; // Deep Pink
    ctx.beginPath();
    ctx.roundRect(ox + 2, oy + 3, 16, h - 6, 6);
    ctx.fill();

    // Decorative Yellow stripe
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(ox + 6, oy + 5, 4, h - 10);

    // Rickshaw Puller (মাথায় লাল গামছা)
    ctx.fillStyle = '#334155'; // T-shirt
    ctx.beginPath();
    ctx.arc(ox + 28, oy + h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    // Red Gamcha (গামছা)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ox + 28, oy + h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    return c;
  },

  // ==========================================
  // TOP-DOWN DHAKA LOCAL BUS
  // ==========================================
  renderTopDownBus(name, color1, color2) {
    const w = 110;
    const h = 42;
    const c = this.createCanvas(w + 20, h + 20);
    const ctx = c.getContext('2d');
    const ox = 10;
    const oy = 10;

    // Heavy shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(ox + 3, oy + 4, w, h, 6);
    ctx.fill();

    // Dual Rear & Front Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(ox + 16, oy - 3, 16, 5);
    ctx.fillRect(ox + 16, oy + h - 2, 16, 5);
    ctx.fillRect(ox + w - 28, oy - 3, 16, 5);
    ctx.fillRect(ox + w - 28, oy + h - 2, 16, 5);

    // Bus Main Body
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.roundRect(ox, oy, w, h, 6);
    ctx.fill();

    // Decorative Center Roof Band
    ctx.fillStyle = color2;
    ctx.fillRect(ox + 10, oy + 4, w - 20, h - 8);

    // Front Windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + w - 12, oy + 4, 9, h - 8);

    // Passenger Roof Hatches / AC Vents
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(ox + 25, oy + h / 2 - 5, 14, 10);
    ctx.fillRect(ox + 55, oy + h / 2 - 5, 14, 10);

    // Bus Name on Roof in Bengali
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Hind Siliguri, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, ox + w / 2, oy + h / 2 + 3);

    // Headlights & Taillights
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(ox + w - 2, oy + 3, 2, 8);
    ctx.fillRect(ox + w - 2, oy + h - 11, 2, 8);

    ctx.fillStyle = '#ff0033';
    ctx.fillRect(ox, oy + 3, 2, 8);
    ctx.fillRect(ox, oy + h - 11, 2, 8);

    return c;
  },

  // ==========================================
  // TOP-DOWN PROPS & LANDMARKS
  // ==========================================
  generateTopDownProps() {
    // 1. Metro Rail Pillar
    const pillar = this.createCanvas(34, 34);
    const pCtx = pillar.getContext('2d');
    pCtx.fillStyle = '#475569';
    pCtx.beginPath();
    pCtx.arc(17, 17, 15, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.fillStyle = '#64748b';
    pCtx.beginPath();
    pCtx.arc(17, 17, 10, 0, Math.PI * 2);
    pCtx.fill();
    this.cache['prop_metro_pillar'] = pillar;

    // 2. Tong Cha Dokan
    const cha = this.createCanvas(38, 38);
    const chCtx = cha.getContext('2d');
    chCtx.fillStyle = '#92400e';
    chCtx.fillRect(4, 4, 30, 30);
    chCtx.fillStyle = '#dc2626'; // red roof / kettle
    chCtx.beginPath();
    chCtx.arc(19, 19, 9, 0, Math.PI * 2);
    chCtx.fill();
    this.cache['prop_cha_dokan'] = cha;

    // 3. Shapla Chottor Water Lily Sculpture (Roundabout center)
    const shapla = this.createCanvas(90, 90);
    const sCtx = shapla.getContext('2d');
    // Blue water pool
    sCtx.fillStyle = '#0284c7';
    sCtx.beginPath();
    sCtx.arc(45, 45, 42, 0, Math.PI * 2);
    sCtx.fill();
    // Water ripple ring
    sCtx.strokeStyle = '#38bdf8';
    sCtx.lineWidth = 3;
    sCtx.beginPath();
    sCtx.arc(45, 45, 34, 0, Math.PI * 2);
    sCtx.stroke();
    // Giant White / Pink Water Lily petals (শাপলা পাপড়ি)
    sCtx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      sCtx.save();
      sCtx.translate(45, 45);
      sCtx.rotate(angle);
      sCtx.beginPath();
      sCtx.ellipse(18, 0, 14, 6, 0, 0, Math.PI * 2);
      sCtx.fill();
      sCtx.restore();
    }
    // Yellow core
    sCtx.fillStyle = '#facc15';
    sCtx.beginPath();
    sCtx.arc(45, 45, 7, 0, Math.PI * 2);
    sCtx.fill();
    this.cache['prop_shapla'] = shapla;

    // 4. Collectible Hot Chai Cup
    const chaiCup = this.createCanvas(40, 40);
    const ccCtx = chaiCup.getContext('2d');
    ccCtx.fillStyle = 'rgba(255, 204, 0, 0.4)';
    ccCtx.beginPath();
    ccCtx.arc(20, 20, 18, 0, Math.PI * 2);
    ccCtx.fill();
    ccCtx.fillStyle = '#ffcc00';
    ccCtx.beginPath();
    ccCtx.arc(20, 20, 13, 0, Math.PI * 2);
    ccCtx.fill();
    ccCtx.fillStyle = '#78350f';
    ccCtx.beginPath();
    ccCtx.arc(20, 20, 8, 0, Math.PI * 2);
    ccCtx.fill();
    this.cache['pickup_chai'] = chaiCup;

    // 5. Waypoint Destination Beacon (Glowing GPS ring)
    const beacon = this.createCanvas(60, 60);
    const bCtx = beacon.getContext('2d');
    bCtx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    bCtx.beginPath();
    bCtx.arc(30, 30, 26, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.strokeStyle = '#00f0ff';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.arc(30, 30, 18, 0, Math.PI * 2);
    bCtx.stroke();
    bCtx.fillStyle = '#ffcc00';
    bCtx.beginPath();
    bCtx.arc(30, 30, 8, 0, Math.PI * 2);
    bCtx.fill();
    this.cache['waypoint_beacon'] = beacon;
  },

  generateTopDownTraffic() {
    this.cache['traffic_rickshaw'] = this.renderTopDownRickshaw();
    this.cache['traffic_cng'] = this.renderTopDownCng(false);
    this.cache['traffic_bus_shikhor'] = this.renderTopDownBus('শিকড় পরিবহন', '#2563eb', '#1d4ed8');
    this.cache['traffic_bus_balaka'] = this.renderTopDownBus('বলাকা এক্সপ্রেস', '#f97316', '#c2410c');
    this.cache['traffic_bus_bikolpo'] = this.renderTopDownBus('বিকল্প অটো সার্ভিস', '#16a34a', '#15803d');
  }
};

window.Sprites = Sprites;
