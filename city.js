/**
 * DHAKA CITY RUSH - CITY MAP & GRID GENERATOR
 * Generates an authentic multi-block Dhaka road network with avenues, cross-streets,
 * roundabouts (Shapla Chottor), Metro Rail viaduct, and extruded 3D buildings.
 */

const CityMap = {
  // World dimensions
  WORLD_SIZE: 3200,
  LANE_WIDTH: 70,

  // Avenues (North - South)
  avenues: [
    { id: 'mirpur', name: 'MIRPUR ROAD', bangla: 'মিরপুর রোড', x: 400, width: 220, lanes: 4, hasMetro: false },
    { id: 'nazrul', name: 'KAZI NAZRUL ISLAM AVE', bangla: 'কাজী নজরুল ইসলাম এভিনিউ', x: 1200, width: 260, lanes: 4, hasMetro: true },
    { id: 'satmasjid', name: 'SATMASJID ROAD', bangla: 'সাতমসজিদ রোড', x: 2000, width: 220, lanes: 4, hasMetro: false },
    { id: 'gulshan', name: 'GULSHAN AVENUE', bangla: 'গুলশান এভিনিউ', x: 2800, width: 240, lanes: 4, hasMetro: false }
  ],

  // Cross Streets (East - West)
  streets: [
    { id: 'airport_conn', name: 'AIRPORT CONNECTING RD', bangla: 'বিমানবন্দর রোড', y: 400, width: 220, lanes: 4 },
    { id: 'panthapath', name: 'PANTHAPATH', bangla: 'পান্থপথ', y: 1200, width: 220, lanes: 4 },
    { id: 'dhanmondi27', name: 'DHANMONDI ROAD 27', bangla: 'ধানমন্ডি ২৭', y: 2000, width: 220, lanes: 4 },
    { id: 'old_dhaka', name: 'OLD DHAKA HERITAGE WAY', bangla: 'পুরান ঢাকা সড়ক', y: 2800, width: 200, lanes: 3 }
  ],

  // Roundabouts
  roundabouts: [
    { name: 'SHAPLA CHOTTOR', bangla: 'শাপলা চত্বর', x: 1200, y: 2000, radius: 110, hasFountain: true }
  ],

  // Buildings & City Blocks
  blocks: [],
  buildings: [],
  props: [],
  trafficNodes: [],
  destinations: [],

  init() {
    this.generateBlocksAndBuildings();
    this.generateRoadsideProps();
    this.generateTrafficWaypoints();
    this.generateDestinations();
  },

  // Generate city blocks between avenues and streets
  generateBlocksAndBuildings() {
    this.buildings = [];
    this.blocks = [];

    const aveX = [0, ...this.avenues.map(a => a.x), this.WORLD_SIZE];
    const strY = [0, ...this.streets.map(s => s.y), this.WORLD_SIZE];

    for (let i = 0; i < aveX.length - 1; i++) {
      for (let j = 0; j < strY.length - 1; j++) {
        const left = aveX[i] + (i === 0 ? 40 : 130);
        const right = aveX[i + 1] - (i + 1 === aveX.length - 1 ? 40 : 130);
        const top = strY[j] + (j === 0 ? 40 : 130);
        const bottom = strY[j + 1] - (j + 1 === strY.length - 1 ? 40 : 130);

        const blockW = right - left;
        const blockH = bottom - top;

        if (blockW > 120 && blockH > 120) {
          this.blocks.push({ x: left, y: top, w: blockW, h: blockH });
          this.populateBlockWithBuildings(left, top, blockW, blockH, i, j);
        }
      }
    }
  },

  populateBlockWithBuildings(bx, by, bw, bh, col, row) {
    const pad = 15;
    const subCols = Math.max(1, Math.floor(bw / 160));
    const subRows = Math.max(1, Math.floor(bh / 160));
    const cellW = (bw - pad * 2) / subCols;
    const cellH = (bh - pad * 2) / subRows;

    const bldColors = [
      { wall: '#334155', roof: '#475569', trim: '#00f0ff' }, // modern cyan corporate
      { wall: '#78350f', roof: '#92400e', trim: '#fbbf24' }, // Old Dhaka warm brick
      { wall: '#1e293b', roof: '#0f172a', trim: '#ff0055' }, // neon nightlife tower
      { wall: '#15803d', roof: '#166534', trim: '#86efac' }, // eco plaza
      { wall: '#6b21a8', roof: '#581c87', trim: '#d8b4fe' }, // Gulshan glass tower
      { wall: '#b45309', roof: '#d97706', trim: '#fef08a' }  // shopping complex
    ];

    const billboardTexts = ['বিকাশ', 'রকমারি', 'প্রাণ', 'গ্রামীণফোন', 'বাংলালিংক', 'দারাজ', 'পাঠাও'];

    for (let c = 0; c < subCols; c++) {
      for (let r = 0; r < subRows; r++) {
        const x = bx + pad + c * cellW + 8;
        const y = by + pad + r * cellH + 8;
        const w = cellW - 16;
        const h = cellH - 16;
        const height3D = 35 + ((c + r * 3) % 5) * 18; // 35 to 110 units height for 2.5D parallax
        const theme = bldColors[(col + row * 2 + c + r) % bldColors.length];

        const hasBillboard = (c + r) % 3 === 0;
        const billboard = hasBillboard ? billboardTexts[(c * 3 + r) % billboardTexts.length] : null;

        this.buildings.push({
          x, y, w, h,
          height3D,
          theme,
          billboard,
          hasWaterTank: (c + r) % 2 === 0
        });
      }
    }
  },

  generateRoadsideProps() {
    this.props = [];

    // Metro Rail concrete pillars along Kazi Nazrul Islam Ave (x = 1200)
    const nazrul = this.avenues.find(a => a.id === 'nazrul');
    if (nazrul) {
      for (let y = 100; y < this.WORLD_SIZE - 100; y += 140) {
        // Skip intersections
        const isNearIntersection = this.streets.some(s => Math.abs(s.y - y) < 130);
        if (!isNearIntersection) {
          this.props.push({
            type: 'metro_pillar',
            x: nazrul.x,
            y: y,
            w: 34,
            h: 34
          });
        }
      }
    }

    // Tong-er Cha Dokan (roadside tea stalls) at street corners
    this.blocks.forEach((b, idx) => {
      // Place tea stalls on block corners facing streets
      if (idx % 2 === 0) {
        this.props.push({
          type: 'cha_dokan',
          x: b.x + 20,
          y: b.y + 20,
          w: 36,
          h: 36,
          name: 'টং এর চা'
        });
      }
      if (idx % 3 === 0) {
        this.props.push({
          type: 'dab_cart',
          x: b.x + b.w - 25,
          y: b.y + b.h - 25,
          w: 28,
          h: 28,
          name: 'ডাব বিক্রেতা'
        });
      }
    });
  },

  // Traffic navigation nodes along streets
  generateTrafficWaypoints() {
    this.trafficNodes = [];

    // Avenues: vertical paths
    this.avenues.forEach(ave => {
      // Lane 1: heading South (angle = PI/2)
      // Lane 2: heading North (angle = -PI/2)
      this.trafficNodes.push({
        type: 'avenue',
        id: ave.id,
        x1: ave.x - 45,
        y1: 50,
        x2: ave.x - 45,
        y2: this.WORLD_SIZE - 50,
        angle: Math.PI / 2
      });
      this.trafficNodes.push({
        type: 'avenue',
        id: ave.id,
        x1: ave.x + 45,
        y1: this.WORLD_SIZE - 50,
        x2: ave.x + 45,
        y2: 50,
        angle: -Math.PI / 2
      });
    });

    // Streets: horizontal paths
    this.streets.forEach(str => {
      // Lane 1: heading East (angle = 0)
      // Lane 2: heading West (angle = PI)
      this.trafficNodes.push({
        type: 'street',
        id: str.id,
        x1: 50,
        y1: str.y - 45,
        x2: this.WORLD_SIZE - 50,
        y2: str.y - 45,
        angle: 0
      });
      this.trafficNodes.push({
        type: 'street',
        id: str.id,
        x1: this.WORLD_SIZE - 50,
        y1: str.y + 45,
        x2: 50,
        y2: str.y + 45,
        angle: Math.PI
      });
    });
  },

  generateDestinations() {
    this.destinations = [
      { name: 'FARMGATE METRO STATION', bangla: 'ফার্মগেট মেট্রো', x: 1200, y: 1100, reward: 500 },
      { name: 'DHANMONDI 27 CHAI HUB', bangla: 'ধানমন্ডি ২৭ আড্ডা', x: 2000, y: 1900, reward: 600 },
      { name: 'GULSHAN PINK CITY', bangla: 'গুলশান পিংক সিটি', x: 2800, y: 1300, reward: 750 },
      { name: 'SHAPLA CHOTTOR FOUNTAIN', bangla: 'শাপলা চত্বর ফোয়ারা', x: 1200, y: 2150, reward: 700 },
      { name: 'OLD DHAKA BIRYANI LANE', bangla: 'পুরান ঢাকা বিরিয়ানি', x: 600, y: 2800, reward: 850 },
      { name: 'AIRPORT ROAD FLYOVER', bangla: 'বিমানবন্দর ফ্লাইওভার', x: 2000, y: 400, reward: 650 }
    ];
  },

  // Identify what street or block the player is currently on
  getStreetAt(x, y) {
    // Check roundabouts
    for (const r of this.roundabouts) {
      const dist = Math.hypot(x - r.x, y - r.y);
      if (dist < r.radius + 40) {
        return { name: r.name, bangla: r.bangla, isRoundabout: true };
      }
    }

    // Check avenues
    for (const ave of this.avenues) {
      if (Math.abs(x - ave.x) <= ave.width / 2) {
        return { name: ave.name, bangla: ave.bangla, isAvenue: true };
      }
    }

    // Check streets
    for (const str of this.streets) {
      if (Math.abs(y - str.y) <= str.width / 2) {
        return { name: str.name, bangla: str.bangla, isStreet: true };
      }
    }

    return { name: 'DHAKA RESIDENTIAL BLOCK', bangla: 'আবাসিক এলাকা', isBlock: true };
  },

  // Check collision with buildings
  checkBuildingCollision(cx, cy, radius = 24) {
    for (const b of this.buildings) {
      // Circle vs AABB
      const closestX = Math.max(b.x, Math.min(cx, b.x + b.w));
      const closestY = Math.max(b.y, Math.min(cy, b.y + b.h));
      const distX = cx - closestX;
      const distY = cy - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq < radius * radius) {
        return {
          collided: true,
          building: b,
          normalX: distX !== 0 ? Math.sign(distX) : 0,
          normalY: distY !== 0 ? Math.sign(distY) : 0
        };
      }
    }

    // Center fountain of Shapla Chottor
    for (const r of this.roundabouts) {
      const dist = Math.hypot(cx - r.x, cy - r.y);
      if (dist < 45) { // fountain core
        return {
          collided: true,
          normalX: (cx - r.x) / dist,
          normalY: (cy - r.y) / dist
        };
      }
    }

    return { collided: false };
  }
};

window.CityMap = CityMap;
