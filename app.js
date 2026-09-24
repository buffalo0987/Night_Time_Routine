// --- CONSTANTS & CONFIGURATION ---
const DEFAULT_USER_PIN = "5678";
const DEFAULT_ADMIN_PIN = "1234";
const CUTOFF_HOUR = 20; // 8 PM
const CUTOFF_MINUTE = 30; // 8:30 PM
const RESET_HOUR = 4; // 4:00 AM

const DEFAULT_TASKS = [
  { id: 't1', title: 'Wash face & skincare routine', completed: false, lockedOut: false },
  { id: 't2', title: 'Brush & floss teeth', completed: false, lockedOut: false },
  { id: 't3', title: 'Prepare outfit & essentials for tomorrow', completed: false, lockedOut: false },
  { id: 't4', title: '30 minutes reading / screen-free wind-down', completed: false, lockedOut: false },
  { id: 't5', title: 'Drink water & take nighttime medicine', completed: false, lockedOut: false }
];

// Digital Boutique Catalog for Meeko & his Milk Carton House
const SHOP_ITEMS = [
  // HATS & ACCESSORIES FOR MEEKO
  {
    id: 'hat_crown',
    category: 'hats',
    name: 'Royal Golden Crown',
    icon: '👑',
    cost: 300,
    desc: 'Fit for the sweetest little prince of the house.'
  },
  {
    id: 'hat_wizard',
    category: 'hats',
    name: 'Tiny Wizard Hat',
    icon: '🧙',
    cost: 200,
    desc: 'Casts magical purr spells at bedtime.'
  },
  {
    id: 'hat_straw',
    category: 'hats',
    name: 'Strawberry Beret',
    icon: '🍓',
    cost: 180,
    desc: 'Sweet, fruity, and sits snugly right on his ears.'
  },
  {
    id: 'hat_shades',
    category: 'hats',
    name: 'Cool Cat Shades',
    icon: '🕶️',
    cost: 150,
    desc: 'Too cool for midnight naps.'
  },
  {
    id: 'hat_flowers',
    category: 'hats',
    name: 'Spring Flower Crown',
    icon: '🌸',
    cost: 140,
    desc: 'Delicate blossoms resting gently on his head.'
  },
  {
    id: 'hat_tophat',
    category: 'hats',
    name: 'Dapper Top Hat',
    icon: '🎩',
    cost: 220,
    desc: 'Complements his handsome tuxedo coat perfectly.'
  },
  {
    id: 'hat_party',
    category: 'hats',
    name: 'Celebration Party Hat',
    icon: '🎉',
    cost: 100,
    desc: 'Always ready to celebrate finishing nighttime tasks!'
  },
  {
    id: 'hat_chef',
    category: 'hats',
    name: 'Executive Chef Toque',
    icon: '👨‍🍳',
    cost: 160,
    desc: 'Head supervisor of all kitchen treats.'
  },

  // MILK CARTON HOME DECOR
  {
    id: 'decor_lights',
    category: 'decor',
    name: 'Twinkling Fairy Lights',
    icon: '💡',
    cost: 220,
    desc: 'Magical glowing string lights across his carton ceiling.'
  },
  {
    id: 'decor_tuna',
    category: 'decor',
    name: 'Fresh Tuna & Milk Feast',
    icon: '🐟',
    cost: 120,
    desc: 'Delicious gourmet feast placed inside his haven.'
  },
  {
    id: 'decor_yarn',
    category: 'decor',
    name: 'Rainbow Wool Yarn Ball',
    icon: '🧶',
    cost: 90,
    desc: 'Cozy toy for playful batting and rolling around.'
  },
  {
    id: 'decor_grass',
    category: 'decor',
    name: 'Potted Cat Grass Garden',
    icon: '🪴',
    cost: 130,
    desc: 'Fresh organic greens beside his carton entrance.'
  },
  {
    id: 'decor_tree',
    category: 'decor',
    name: 'Mini Scratching Castle',
    icon: '🎪',
    cost: 250,
    desc: 'A luxury scratching post for his royal paws.'
  },
  {
    id: 'decor_stars',
    category: 'decor',
    name: 'Glowing Midnight Stars',
    icon: '🌌',
    cost: 350,
    desc: 'Luminescent twinkling stars illuminating the ceiling.'
  }
];

// Slot Symbols & Payout Configuration
const SLOT_SYMBOLS = {
  JACKPOT: '💎',
  BIG_WIN: '⭐',
  LUCKY: '🌙',
  FILLERS: ['✨', '🐟', '🥛', '🐾', '🧶']
};

// --- AUDIO SYNTHESIS (Web Audio API) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTap() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playReelTick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220 + Math.random() * 80, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playWinSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.14, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  playMeow() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // High-pitched cute meow frequency glide: 680Hz -> 980Hz -> 620Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.32);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playPurr() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);
    osc.frequency.linearRampToValueAtTime(52, now + 0.25);
    osc.frequency.linearRampToValueAtTime(42, now + 0.5);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  playHop() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

const sounds = new SoundEffects();

// --- STATE MANAGEMENT ---
class AppState {
  constructor() {
    this.loadState();
  }

  loadState() {
    const raw = localStorage.getItem('night_routine_state');
    const defaultData = {
      userPin: DEFAULT_USER_PIN,
      adminPin: DEFAULT_ADMIN_PIN,
      rememberDevice: false,
      isUnlocked: false,
      coins: 50,
      spinsRemaining: 0,
      tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
      unlockedItems: ['hat_party'],
      equippedHat: null,
      equippedDecor: [],
      lastCycleDate: null,
      claimedToday: false,
      simulatedCutoff: false,
      petHappinessCount: 0
    };

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.tokens && typeof parsed.coins === 'undefined') {
          const goldVal = (parsed.tokens.gold || 0) * 250;
          const silverVal = (parsed.tokens.silver || 0) * 100;
          parsed.coins = goldVal + silverVal + 50;
          delete parsed.tokens;
        }
        if (!parsed.unlockedItems) parsed.unlockedItems = ['hat_party'];
        if (typeof parsed.equippedHat === 'undefined') parsed.equippedHat = null;
        if (!parsed.equippedDecor) parsed.equippedDecor = [];
        this.data = Object.assign(defaultData, parsed);
      } catch (e) {
        this.data = defaultData;
      }
    } else {
      this.data = defaultData;
    }
  }

  save() {
    localStorage.setItem('night_routine_state', JSON.stringify(this.data));
  }
}

const state = new AppState();

// --- MEEKO REALISTIC SVG TEMPLATE GENERATOR ---
function getMeekoSVG(facing = 'right', isWalking = false) {
  const scaleX = facing === 'left' ? -1 : 1;
  const translateX = facing === 'left' ? -200 : 0;
  const flip = `transform="translate(${translateX}, 0) scale(${scaleX}, 1)"`;
  
  const pawOffset1 = isWalking ? 12 : 0;
  const pawOffset2 = isWalking ? -12 : 0;
  
  const tailAnim = isWalking 
    ? `<animateTransform attributeName="transform" type="rotate" values="-15 150 150; 25 150 150; -15 150 150" dur="0.8s" repeatCount="indefinite"/>` 
    : `<animateTransform attributeName="transform" type="rotate" values="0 150 150; 5 150 150; 0 150 150" dur="3s" repeatCount="indefinite"/>`;

  const breatheAnim = isWalking 
    ? `` 
    : `<animateTransform attributeName="transform" type="scale" values="1 1; 1.02 1.02; 1 1" dur="2.5s" repeatCount="indefinite" additive="sum"/>`;

  return `
  <svg class="meeko-svg-art" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Premium 2D Art Filters -->
      <filter id="softFur" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="8" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.35" />
      </filter>

      <!-- Deep Vector Gradients -->
      <radialGradient id="tuxedoBody" cx="30%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#3b3d45"/>
        <stop offset="50%" stop-color="#18191f"/>
        <stop offset="100%" stop-color="#0a0a0c"/>
      </radialGradient>
      
      <linearGradient id="whiteFurGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="85%" stop-color="#e2e8f0"/>
        <stop offset="100%" stop-color="#94a3b8"/>
      </linearGradient>

      <!-- Meeko's Captivating Hazel-Green Eyes -->
      <radialGradient id="eyeGradient" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#eaff8f"/>
        <stop offset="40%" stop-color="#84cc16"/>
        <stop offset="80%" stop-color="#3f6212"/>
        <stop offset="100%" stop-color="#14532d"/>
      </radialGradient>

      <!-- Metallic Accents -->
      <linearGradient id="goldBell" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="40%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#713f12"/>
      </linearGradient>

      <linearGradient id="diamondShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="#bae6fd"/>
        <stop offset="70%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>

    <g ${flip}>
      <!-- FLOOR SHADOW -->
      <ellipse cx="100" cy="190" rx="60" ry="12" fill="#0f172a" opacity="0.3" filter="blur(4px)" />

      <!-- TAIL -->
      <g>
        ${tailAnim}
        <path d="M 125 155 C 160 150, 180 110, 175 60 C 173 35, 155 10, 140 10 C 130 10, 125 20, 130 35 C 145 65, 145 100, 135 125 C 125 145, 110 150, 125 155 Z" 
              fill="url(#tuxedoBody)" filter="url(#softFur)" />
      </g>

      <!-- HINDQUARTERS -->
      <path d="M 80 120 C 130 110, 160 140, 150 180 C 145 195, 110 195, 100 180 C 95 160, 80 140, 80 120 Z" fill="url(#tuxedoBody)" filter="url(#softFur)" />
      <!-- Back Paw -->
      <path d="M 125 180 C 140 178, 150 185, 150 192 C 150 198, 135 200, 125 195 Z" fill="url(#whiteFurGrad)" />

      <!-- TORSO & CHEST -->
      <g>
        ${breatheAnim}
        <path d="M 60 90 C 110 80, 130 130, 110 180 C 90 190, 50 180, 45 130 C 40 90, 60 90, 60 90 Z" fill="url(#tuxedoBody)" filter="url(#softFur)" />
        
        <!-- WHITE BIB -->
        <path d="M 65 100 C 85 105, 105 120, 105 145 C 105 170, 85 185, 65 175 C 50 160, 55 120, 65 100 Z" fill="url(#whiteFurGrad)" filter="url(#softFur)" />
      </g>

      <!-- FRONT LEGS -->
      <g transform="translate(${pawOffset2}, 0)">
        <path d="M 90 140 C 95 160, 100 180, 95 190 C 90 200, 75 195, 75 185 C 75 170, 80 150, 90 140 Z" fill="url(#tuxedoBody)" />
        <ellipse cx="85" cy="192" rx="12" ry="8" fill="url(#whiteFurGrad)" />
      </g>
      
      <g transform="translate(${pawOffset1}, 0)">
        <path d="M 65 140 C 70 165, 70 180, 65 192 C 60 200, 45 195, 45 185 C 45 170, 55 150, 65 140 Z" fill="url(#whiteFurGrad)" filter="url(#softFur)" />
        <path d="M 42 190 C 42 182, 68 182, 68 190 C 68 198, 42 198, 42 190 Z" fill="url(#whiteFurGrad)" />
        <line x1="50" y1="188" x2="50" y2="195" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="58" y1="188" x2="58" y2="195" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
      </g>

      <!-- HEAD & FACE -->
      <g filter="url(#dropShadow)">
        <!-- Skull -->
        <path d="M 40 70 C 40 40, 100 40, 100 70 C 110 90, 90 120, 70 120 C 50 120, 30 90, 40 70 Z" fill="url(#tuxedoBody)" filter="url(#softFur)" />

        <!-- Right Ear -->
        <path d="M 85 50 C 95 30, 115 15, 115 15 C 115 15, 110 35, 95 55 Z" fill="url(#tuxedoBody)" />
        <path d="M 88 48 C 95 35, 108 22, 108 22 C 108 22, 105 35, 95 50 Z" fill="#fbcfe8" opacity="0.8" />
        
        <!-- Left Ear (Notched) -->
        <path d="M 55 50 C 45 30, 30 15, 30 15 C 35 15, 40 22, 45 22 C 50 18, 55 25, 55 25 C 55 35, 65 55, 65 55 Z" fill="url(#tuxedoBody)" />
        <path d="M 52 48 C 45 35, 38 22, 38 22 C 45 22, 50 28, 50 28 C 50 35, 58 50, 58 50 Z" fill="#fbcfe8" opacity="0.8" />

        <!-- White Muzzle/Blaze -->
        <path d="M 70 45 C 55 60, 40 70, 45 90 C 45 105, 60 115, 70 115 C 80 115, 95 105, 95 90 C 100 70, 85 60, 70 45 Z" fill="url(#whiteFurGrad)" filter="url(#softFur)" />

        <!-- Eyes -->
        <!-- Left Eye -->
        <g transform="translate(52, 72)">
          <path d="M 0 5 C 5 0, 15 0, 20 5 C 20 12, 10 15, 0 5 Z" fill="url(#eyeGradient)" />
          <ellipse cx="10" cy="5" rx="3.5" ry="6" fill="#020617" />
          <circle cx="7" cy="3" r="2" fill="#ffffff" />
          <circle cx="12" cy="7" r="0.8" fill="#ffffff" opacity="0.6" />
          <path d="M -2 5 C 5 -2, 17 -2, 22 5" stroke="#020617" stroke-width="2" fill="none" stroke-linecap="round" />
        </g>
        
        <!-- Right Eye -->
        <g transform="translate(78, 72)">
          <path d="M 0 5 C 5 0, 15 0, 20 5 C 20 12, 10 15, 0 5 Z" fill="url(#eyeGradient)" />
          <ellipse cx="10" cy="5" rx="3.5" ry="6" fill="#020617" />
          <circle cx="7" cy="3" r="2" fill="#ffffff" />
          <circle cx="12" cy="7" r="0.8" fill="#ffffff" opacity="0.6" />
          <path d="M -2 5 C 5 -2, 17 -2, 22 5" stroke="#020617" stroke-width="2" fill="none" stroke-linecap="round" />
        </g>

        <!-- Nose with Spot -->
        <path d="M 66 92 C 68 89, 72 89, 74 92 C 75 94, 72 97, 70 98 C 68 97, 65 94, 66 92 Z" fill="#f43f5e" />
        <path d="M 68 91 C 70 90, 72 90, 71 92 C 70 93, 68 93, 68 91 Z" fill="#020617" />

        <!-- Mouth & Chin -->
        <path d="M 64 100 C 68 104, 72 104, 76 100" stroke="#64748b" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M 68 104 C 70 108, 70 108, 72 104 Z" fill="#fecdd3" opacity="0.8" />

        <!-- Whiskers -->
        <g stroke="#ffffff" stroke-width="1" opacity="0.75" stroke-linecap="round" filter="url(#dropShadow)">
          <line x1="55" y1="95" x2="25" y2="85" />
          <line x1="55" y1="98" x2="20" y2="98" />
          <line x1="57" y1="101" x2="28" y2="110" />
          <line x1="85" y1="95" x2="115" y2="85" />
          <line x1="85" y1="98" x2="120" y2="98" />
          <line x1="83" y1="101" x2="112" y2="110" />
        </g>
      </g>

      <!-- COLLAR & TAG -->
      <g filter="url(#dropShadow)">
        <path d="M 45 110 C 60 122, 80 122, 95 110 C 95 116, 80 128, 45 116 Z" fill="#1d4ed8" />
        <path d="M 45 110 C 60 122, 80 122, 95 110" stroke="#1e3a8a" stroke-width="2" fill="none" />
        
        <circle cx="70" cy="120" r="7" fill="url(#goldBell)" />
        <line x1="64" y1="120" x2="76" y2="120" stroke="#854d0e" stroke-width="1" />
        <circle cx="70" cy="123" r="1.5" fill="#422006" />

        <polygon points="70,128 75,134 70,140 65,134" fill="url(#diamondShine)" stroke="#38bdf8" stroke-width="1" />
      </g>
    </g>
  </svg>
  `;
}

// --- UI CONTROLLER & LOGIC ---
class RoutineApp {
  constructor() {
    this.activeTab = 'viewRoutine';
    this.activeShopCategory = 'hats';
    this.meekoScene = 'outside'; // 'outside' or 'inside'
    this.pinBuffer = '';
    this.pinMode = 'USER';
    this.isSpinning = false;
    this.isWandering = false;
    this.patrolTimer = null;
    this.meekoFacing = 'right';

    this.cacheDOMElements();
    this.bindEvents();
    this.initServiceWorker();
    this.checkCycleReset();
    this.checkLockScreen();
    this.render();
    this.startTimer();
  }

  cacheDOMElements() {
    // Navigation
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.viewSections = document.querySelectorAll('.view-section');

    // Header & Balance
    this.coinCount = document.getElementById('coinCount');
    this.countdownTimer = document.getElementById('countdownTimer');
    this.countdownStatusText = document.getElementById('countdownStatusText');
    this.countdownCard = document.getElementById('countdownCard');
    this.cutoffBadge = document.getElementById('cutoffBadge');
    this.manualLockBtn = document.getElementById('manualLockBtn');

    // Checklist
    this.tasksList = document.getElementById('tasksList');
    this.claimRewardBtn = document.getElementById('claimRewardBtn');
    this.claimSubtitle = document.getElementById('claimSubtitle');

    // Slots
    this.spinsRemaining = document.getElementById('spinsRemaining');
    this.spinsBadge = document.getElementById('spinsBadge');
    this.spinBtn = document.getElementById('spinBtn');
    this.strips = [
      document.getElementById('strip0'),
      document.getElementById('strip1'),
      document.getElementById('strip2')
    ];

    // Meeko Haven & Two-Stage World Elements
    this.meekoWorld = document.getElementById('meekoWorld');
    this.sceneOutside = document.getElementById('sceneOutside');
    this.sceneInside = document.getElementById('sceneInside');
    this.enterCartonBtn = document.getElementById('enterCartonBtn');
    this.exitCartonBtn = document.getElementById('exitCartonBtn');
    this.outsideMeeko = document.getElementById('outsideMeeko');
    this.insideMeeko = document.getElementById('insideMeeko');
    this.outsideHatSlot = document.getElementById('outsideHatSlot');
    this.insideHatSlot = document.getElementById('insideHatSlot');
    this.outsideMeekoArt = document.getElementById('outsideMeekoArt');
    this.insideMeekoArt = document.getElementById('insideMeekoArt');
    this.outsideCartonHouse = document.getElementById('outsideCartonHouse');
    this.insideThoughtBubble = document.getElementById('insideThoughtBubble');
    this.thoughtText = document.getElementById('thoughtText');
    this.heartsLayerOutside = document.getElementById('heartsLayerOutside');
    this.heartsLayerInside = document.getElementById('heartsLayerInside');

    // Inside Decor Elements
    this.insideFairyLights = document.getElementById('insideFairyLights');
    this.insideTunaFeast = document.getElementById('insideTunaFeast');
    this.insideYarnToy = document.getElementById('insideYarnToy');
    this.insideScratcher = document.getElementById('insideScratcher');
    this.insideCatGrass = document.getElementById('insideCatGrass');
    this.insideCeilingStars = document.getElementById('insideCeilingStars');

    // Pet Status Bar
    this.petStatusText = document.getElementById('petStatusText');
    this.petEmoji = document.getElementById('petEmoji');
    this.petMeekoBtn = document.getElementById('petMeekoBtn');

    // Boutique & Shop
    this.shopGrid = document.getElementById('shopGrid');
    this.tabHatsBtn = document.getElementById('tabHatsBtn');
    this.tabDecorBtn = document.getElementById('tabDecorBtn');

    // Lock Screen
    this.lockScreen = document.getElementById('lockScreen');
    this.lockPromptTitle = document.getElementById('lockPromptTitle');
    this.lockPromptSub = document.getElementById('lockPromptSub');
    this.pinDots = document.querySelectorAll('.pin-dot');
    this.rememberDeviceCheck = document.getElementById('rememberDeviceCheck');
    this.pinClearBtn = document.getElementById('pinClearBtn');
    this.pinDeleteBtn = document.getElementById('pinDeleteBtn');

    // Modals
    this.winModal = document.getElementById('winModal');
    this.winIcon = document.getElementById('winIcon');
    this.winTitle = document.getElementById('winTitle');
    this.winDesc = document.getElementById('winDesc');
    this.closeWinBtn = document.getElementById('closeWinBtn');

    this.itemModal = document.getElementById('itemModal');
    this.itemModalIcon = document.getElementById('itemModalIcon');
    this.itemModalTitle = document.getElementById('itemModalTitle');
    this.itemModalDesc = document.getElementById('itemModalDesc');
    this.closeItemModalBtn = document.getElementById('closeItemModalBtn');

    // Admin Dashboard
    this.adminSecretBtn = document.getElementById('adminSecretBtn');
    this.adminModal = document.getElementById('adminModal');
    this.closeAdminBtn = document.getElementById('closeAdminBtn');

    // Admin controls
    this.adminAddSpinBtn = document.getElementById('adminAddSpinBtn');
    this.adminAdd50CoinsBtn = document.getElementById('adminAdd50CoinsBtn');
    this.adminAdd200CoinsBtn = document.getElementById('adminAdd200CoinsBtn');
    this.adminUnlockAllItemsBtn = document.getElementById('adminUnlockAllItemsBtn');
    this.adminUnlockTasksBtn = document.getElementById('adminUnlockTasksBtn');
    this.adminCompleteTasksBtn = document.getElementById('adminCompleteTasksBtn');
    this.adminResetRoutineBtn = document.getElementById('adminResetRoutineBtn');
    this.adminSimulateCutoffBtn = document.getElementById('adminSimulateCutoffBtn');
  }

  bindEvents() {
    // Navigation Tabs
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playTap();
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // Checklist Claim
    this.claimRewardBtn.addEventListener('click', () => this.handleClaimReward());

    // Slot Spin
    this.spinBtn.addEventListener('click', () => this.handleSpin());

    // Two-Stage Milk Carton Transition Actions
    this.enterCartonBtn.addEventListener('click', () => this.enterMilkCartonAnimation());
    this.outsideCartonHouse.addEventListener('click', () => this.enterMilkCartonAnimation());
    this.exitCartonBtn.addEventListener('click', () => this.exitMilkCarton());

    // Pet Meeko Interactions
    this.outsideMeeko.addEventListener('click', () => this.petMeeko('outside'));
    this.insideMeeko.addEventListener('click', () => this.petMeeko('inside'));
    this.petMeekoBtn.addEventListener('click', () => this.petMeeko(this.meekoScene));

    // Shop Category Tabs
    this.tabHatsBtn.addEventListener('click', () => {
      sounds.playTap();
      this.activeShopCategory = 'hats';
      this.tabHatsBtn.classList.add('active');
      this.tabDecorBtn.classList.remove('active');
      this.renderShop();
    });
    this.tabDecorBtn.addEventListener('click', () => {
      sounds.playTap();
      this.activeShopCategory = 'decor';
      this.tabDecorBtn.classList.add('active');
      this.tabHatsBtn.classList.remove('active');
      this.renderShop();
    });

    // Lock screen actions
    this.manualLockBtn.addEventListener('click', () => this.lockApp());
    document.querySelectorAll('.key-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playTap();
        this.handlePinInput(btn.getAttribute('data-num'));
      });
    });
    this.pinClearBtn.addEventListener('click', () => {
      sounds.playTap();
      this.clearPin();
    });
    this.pinDeleteBtn.addEventListener('click', () => {
      sounds.playTap();
      this.deletePin();
    });

    // Modals
    this.closeWinBtn.addEventListener('click', () => this.winModal.classList.remove('active'));
    this.closeItemModalBtn.addEventListener('click', () => this.itemModal.classList.remove('active'));

    // Admin trigger
    this.adminSecretBtn.addEventListener('click', () => {
      sounds.playTap();
      this.promptAdminPin();
    });
    this.closeAdminBtn.addEventListener('click', () => this.adminModal.classList.remove('active'));

    // Admin Overrides
    this.adminAddSpinBtn.addEventListener('click', () => {
      state.data.spinsRemaining += 5;
      state.save();
      this.render();
    });
    this.adminAdd50CoinsBtn.addEventListener('click', () => {
      state.data.coins += 50;
      state.save();
      this.render();
    });
    this.adminAdd200CoinsBtn.addEventListener('click', () => {
      state.data.coins += 200;
      state.save();
      this.render();
    });
    this.adminUnlockAllItemsBtn.addEventListener('click', () => {
      state.data.unlockedItems = SHOP_ITEMS.map(i => i.id);
      state.save();
      sounds.playWinSound();
      this.render();
    });
    this.adminUnlockTasksBtn.addEventListener('click', () => {
      state.data.tasks.forEach(t => t.lockedOut = false);
      state.data.simulatedCutoff = false;
      state.save();
      this.render();
    });
    this.adminCompleteTasksBtn.addEventListener('click', () => {
      state.data.tasks.forEach(t => {
        t.completed = true;
        t.lockedOut = false;
      });
      state.save();
      this.render();
    });
    this.adminResetRoutineBtn.addEventListener('click', () => {
      state.data.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      state.data.claimedToday = false;
      state.data.simulatedCutoff = false;
      state.save();
      this.render();
    });
    this.adminSimulateCutoffBtn.addEventListener('click', () => {
      state.data.simulatedCutoff = !state.data.simulatedCutoff;
      state.save();
      this.checkTimeLockRules();
      this.render();
    });
  }

  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then((registration) => {
          registration.update();
        }).catch(err => {
          console.log('SW registration error:', err);
        });
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.serviceWorker.controller) {
          navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) reg.update();
          });
        }
      });
    }
  }

  // --- TAB NAVIGATION ---
  switchTab(tabId) {
    this.activeTab = tabId;
    this.tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.viewSections.forEach(sec => {
      if (sec.id === tabId) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    if (tabId === 'viewMeeko') {
      sounds.playMeow();
      if (this.meekoScene === 'inside') {
        this.startInsidePatrol();
      }
    } else {
      this.stopInsidePatrol();
    }
  }

  // --- TWO-STAGE MILK CARTON TRANSITION ANIMATION ---
  enterMilkCartonAnimation() {
    sounds.playTap();
    // Play Meeko walking toward the carton door
    this.outsideMeeko.classList.add('entering-carton');
    this.outsideMeeko.classList.add('facing-left');
    this.outsideMeeko.classList.remove('facing-right');
    this.outsideMeekoArt.innerHTML = getMeekoSVG('left', true);

    setTimeout(() => {
      sounds.playHop();
    }, 600);

    setTimeout(() => {
      // Zoom into interior scene
      this.sceneOutside.classList.remove('active');
      this.sceneInside.classList.add('active');
      this.meekoScene = 'inside';
      this.outsideMeeko.classList.remove('entering-carton');
      this.outsideMeeko.classList.remove('facing-left');
      this.outsideMeeko.classList.add('facing-right');
      this.outsideMeekoArt.innerHTML = getMeekoSVG('right', false);

      sounds.playMeow();
      this.startInsidePatrol();
      this.showThoughtBubble("Ah, my cozy milk carton haven! ✨");
    }, 1100);
  }

  exitMilkCarton() {
    sounds.playTap();
    this.stopInsidePatrol();
    this.sceneInside.classList.remove('active');
    this.sceneOutside.classList.add('active');
    this.meekoScene = 'outside';
    sounds.playMeow();
    this.outsideMeeko.classList.remove('facing-left');
    this.outsideMeeko.classList.add('facing-right');
    this.outsideMeekoArt.innerHTML = getMeekoSVG('right', false);
    this.petStatusText.textContent = "Meeko is relaxing on the porch rug!";
  }

  // --- INSIDE PATROL & WANDERING BEHAVIOR ---
  startInsidePatrol() {
    this.stopInsidePatrol();
    this.isWandering = true;

    const waypoints = [
      { left: '30px', facing: 'left', thought: "Checking my gourmet tuna feast... 🐟" },
      { left: '110px', facing: 'right', thought: "Testing the cloud cushion... 10/10 cozy! ☁️" },
      { left: '170px', facing: 'right', thought: "Batting at my rainbow yarn ball! 🧶" },
      { left: '210px', facing: 'right', thought: "My scratching castle is perfection! 🎪" },
      { left: '60px', facing: 'left', thought: "Admiring my twinkling fairy lights! ✨" }
    ];

    let currentWaypointIdx = 0;

    const stepPatrol = () => {
      if (!this.isWandering || this.meekoScene !== 'inside') return;

      const wp = waypoints[currentWaypointIdx];
      currentWaypointIdx = (currentWaypointIdx + 1) % waypoints.length;

      // Start walk animation
      this.insideMeeko.style.transition = 'left 2.6s ease-in-out';
      this.insideMeeko.style.left = wp.left;
      this.insideMeeko.classList.toggle('facing-left', wp.facing === 'left');
      this.insideMeeko.classList.toggle('facing-right', wp.facing !== 'left');
      this.insideMeekoArt.innerHTML = getMeekoSVG(wp.facing, true);
      sounds.playReelTick();

      // Arrived at destination
      setTimeout(() => {
        if (!this.isWandering || this.meekoScene !== 'inside') return;
        this.insideMeekoArt.innerHTML = getMeekoSVG(wp.facing, false);
        this.showThoughtBubble(wp.thought);
        sounds.playPurr();
      }, 2600);
    };

    stepPatrol();
    this.patrolTimer = setInterval(stepPatrol, 6500);
  }

  stopInsidePatrol() {
    this.isWandering = false;
    if (this.patrolTimer) {
      clearInterval(this.patrolTimer);
      this.patrolTimer = null;
    }
  }

  showThoughtBubble(text) {
    this.thoughtText.textContent = text;
    this.insideThoughtBubble.classList.add('visible');
    setTimeout(() => {
      this.insideThoughtBubble.classList.remove('visible');
    }, 3800);
  }

  // --- TIME LOCK & DAILY CYCLE LOGIC ---
  getCurrentCycleKey(now = new Date()) {
    const cycleDate = new Date(now);
    if (cycleDate.getHours() < RESET_HOUR) {
      cycleDate.setDate(cycleDate.getDate() - 1);
    }
    return `${cycleDate.getFullYear()}-${cycleDate.getMonth() + 1}-${cycleDate.getDate()}`;
  }

  checkCycleReset() {
    const currentKey = this.getCurrentCycleKey();
    if (state.data.lastCycleDate !== currentKey) {
      state.data.lastCycleDate = currentKey;
      state.data.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      state.data.claimedToday = false;
      state.data.simulatedCutoff = false;
      state.save();
    }
  }

  isPastCutoff(now = new Date()) {
    if (state.data.simulatedCutoff) return true;
    
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours > CUTOFF_HOUR || (hours === CUTOFF_HOUR && minutes >= CUTOFF_MINUTE)) {
      return true;
    }
    if (hours < RESET_HOUR) {
      return true;
    }
    return false;
  }

  checkTimeLockRules() {
    this.checkCycleReset();
    const past = this.isPastCutoff();

    let changed = false;
    state.data.tasks.forEach(task => {
      if (past && !task.completed && !task.lockedOut) {
        task.lockedOut = true;
        changed = true;
      }
    });

    if (changed) {
      state.save();
    }
  }

  startTimer() {
    const updateCountdown = () => {
      this.checkTimeLockRules();
      const now = new Date();
      const past = this.isPastCutoff(now);

      if (past) {
        this.countdownCard.classList.add('locked');
        this.cutoffBadge.classList.add('locked');
        this.cutoffBadge.textContent = 'Locked Out';
        this.countdownStatusText.textContent = 'Cutoff passed for tonight:';

        const resetTime = new Date(now);
        if (now.getHours() >= RESET_HOUR) {
          resetTime.setDate(resetTime.getDate() + 1);
        }
        resetTime.setHours(RESET_HOUR, 0, 0, 0);

        const diffMs = resetTime - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

        this.countdownTimer.textContent = `Resets in ${diffHrs}h ${diffMins}m ${diffSecs}s (4 AM)`;
      } else {
        this.countdownCard.classList.remove('locked');
        this.cutoffBadge.classList.remove('locked');
        this.cutoffBadge.textContent = 'Cutoff 8:30 PM';
        this.countdownStatusText.textContent = 'Time left for tonight:';

        const cutoffTime = new Date(now);
        cutoffTime.setHours(CUTOFF_HOUR, CUTOFF_MINUTE, 0, 0);

        const diffMs = cutoffTime - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

        this.countdownTimer.textContent = `${diffHrs}h ${diffMins}m ${diffSecs}s remaining`;
      }

      this.updateClaimButtonState();
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // --- PIN / SECURITY ---
  checkLockScreen() {
    this.rememberDeviceCheck.checked = state.data.rememberDevice;
    if (!state.data.rememberDevice || !state.data.isUnlocked) {
      this.showPinScreen('USER');
    } else {
      this.lockScreen.style.display = 'none';
    }
  }

  showPinScreen(mode = 'USER') {
    this.pinMode = mode;
    this.pinBuffer = '';
    this.updatePinDots();
    
    if (mode === 'USER') {
      this.lockPromptTitle.textContent = 'Enter Passcode';
      this.lockPromptSub.textContent = 'Unlock your nighttime routine';
      this.rememberDeviceCheck.parentElement.style.display = 'flex';
    } else {
      this.lockPromptTitle.textContent = 'Husband Admin';
      this.lockPromptSub.textContent = 'Enter Admin PIN to access dashboard';
      this.rememberDeviceCheck.parentElement.style.display = 'none';
    }

    this.lockScreen.style.display = 'flex';
  }

  promptAdminPin() {
    this.showPinScreen('ADMIN');
  }

  lockApp() {
    sounds.playTap();
    state.data.isUnlocked = false;
    state.save();
    this.showPinScreen('USER');
  }

  handlePinInput(digit) {
    if (this.pinBuffer.length < 4) {
      this.pinBuffer += digit;
      this.updatePinDots();

      if (this.pinBuffer.length === 4) {
        setTimeout(() => this.verifyPin(), 120);
      }
    }
  }

  deletePin() {
    if (this.pinBuffer.length > 0) {
      this.pinBuffer = this.pinBuffer.slice(0, -1);
      this.updatePinDots();
    }
  }

  clearPin() {
    this.pinBuffer = '';
    this.updatePinDots();
  }

  updatePinDots() {
    this.pinDots.forEach((dot, idx) => {
      if (idx < this.pinBuffer.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  verifyPin() {
    if (this.pinMode === 'USER') {
      if (this.pinBuffer === state.data.userPin) {
        state.data.isUnlocked = true;
        state.data.rememberDevice = this.rememberDeviceCheck.checked;
        state.save();
        this.lockScreen.style.display = 'none';
        sounds.playWinSound();
      } else {
        this.shakePinKeypad();
      }
    } else if (this.pinMode === 'ADMIN') {
      if (this.pinBuffer === state.data.adminPin) {
        this.lockScreen.style.display = 'none';
        this.adminModal.classList.add('active');
        sounds.playWinSound();
      } else {
        this.shakePinKeypad();
      }
    }
  }

  shakePinKeypad() {
    const dotsContainer = document.querySelector('.pin-dots');
    dotsContainer.style.transform = 'translateX(10px)';
    setTimeout(() => dotsContainer.style.transform = 'translateX(-10px)', 80);
    setTimeout(() => dotsContainer.style.transform = 'translateX(8px)', 160);
    setTimeout(() => {
      dotsContainer.style.transform = 'translateX(0)';
      this.clearPin();
    }, 240);
  }

  // --- CHECKLIST & ROUTINE ---
  renderTasks() {
    this.tasksList.innerHTML = '';
    state.data.tasks.forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card ${task.completed ? 'completed' : ''} ${task.lockedOut ? 'locked-out' : ''}`;
      
      let statusIcon = '';
      if (task.lockedOut) {
        statusIcon = '🔒';
      } else if (task.completed) {
        statusIcon = '✨';
      }

      card.innerHTML = `
        <div class="task-left">
          <div class="checkbox-visual">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <span class="task-title">${task.title}</span>
        </div>
        <div class="task-status-indicator">${statusIcon}</div>
      `;

      card.addEventListener('click', () => {
        if (task.lockedOut) return;
        sounds.playTap();
        task.completed = !task.completed;
        state.save();
        this.render();
      });

      this.tasksList.appendChild(card);
    });
  }

  updateClaimButtonState() {
    const anyLockedOut = state.data.tasks.some(t => t.lockedOut);
    const allCompleted = state.data.tasks.every(t => t.completed);
    const alreadyClaimed = state.data.claimedToday;

    if (alreadyClaimed) {
      this.claimRewardBtn.disabled = true;
      this.claimRewardBtn.innerHTML = `<span>✅ Reward Claimed Tonight</span>`;
      this.claimSubtitle.textContent = "You received 5 spins for completing your routine!";
    } else if (anyLockedOut) {
      this.claimRewardBtn.disabled = true;
      this.claimRewardBtn.innerHTML = `<span>🔒 Routine Incomplete</span>`;
      this.claimSubtitle.textContent = "Tasks were locked past 8:30 PM. Try again tomorrow at 4 AM!";
    } else if (allCompleted) {
      this.claimRewardBtn.disabled = false;
      this.claimRewardBtn.innerHTML = `<span>🎁 Claim Nightly Reward</span><span style="font-size:0.85rem; opacity:0.9;">(+5 Spins)</span>`;
      this.claimSubtitle.textContent = "All habits complete! Tap above to get your 5 spins!";
    } else {
      this.claimRewardBtn.disabled = true;
      this.claimRewardBtn.innerHTML = `<span>🎁 Claim Nightly Reward</span><span style="font-size:0.85rem; opacity:0.9;">(+5 Spins)</span>`;
      this.claimSubtitle.textContent = "Check off all tasks before 8:30 PM to claim 5 spins.";
    }
  }

  handleClaimReward() {
    if (state.data.claimedToday) return;
    sounds.playWinSound();
    state.data.claimedToday = true;
    state.data.spinsRemaining += 5;
    state.save();

    this.render();
    this.switchTab('viewSlots');

    this.winIcon.textContent = '🎰';
    this.winTitle.textContent = 'Routine Complete!';
    this.winDesc.textContent = 'You earned 5 spins for the Midnight Slot Machine!';
    this.winModal.classList.add('active');
  }

  // --- SLOT MACHINE ENGINE (GUARANTEED STOP & EXACT ODDS) ---
  handleSpin() {
    if (this.isSpinning || state.data.spinsRemaining <= 0) return;

    sounds.playTap();
    this.isSpinning = true;
    state.data.spinsRemaining -= 1;
    state.save();
    this.render();

    const roll = Math.random();
    const jackpotThreshold = 1 / 100; // 0.01
    const bigWinThreshold = jackpotThreshold + (1 / 20); // 0.06
    const luckyThreshold = bigWinThreshold + (1 / 5); // 0.26

    let winData = null;
    let finalSymbols = [];

    if (roll < jackpotThreshold) {
      winData = { coins: 250, title: 'JACKPOT!', desc: '1 in 100 Chance! You won 250 Coins for Meeko!', icon: '💎' };
      finalSymbols = [SLOT_SYMBOLS.JACKPOT, SLOT_SYMBOLS.JACKPOT, SLOT_SYMBOLS.JACKPOT];
    } else if (roll < bigWinThreshold) {
      winData = { coins: 50, title: 'BIG WIN!', desc: '3 Stars! You won 50 Coins for Meeko!', icon: '⭐' };
      finalSymbols = [SLOT_SYMBOLS.BIG_WIN, SLOT_SYMBOLS.BIG_WIN, SLOT_SYMBOLS.BIG_WIN];
    } else if (roll < luckyThreshold) {
      winData = { coins: 20, title: 'LUCKY DROP!', desc: '3 Moons! You won 20 Coins for Meeko!', icon: '🌙' };
      finalSymbols = [SLOT_SYMBOLS.LUCKY, SLOT_SYMBOLS.LUCKY, SLOT_SYMBOLS.LUCKY];
    } else {
      const pool = [SLOT_SYMBOLS.JACKPOT, SLOT_SYMBOLS.BIG_WIN, SLOT_SYMBOLS.LUCKY, ...SLOT_SYMBOLS.FILLERS];
      const s1 = pool[Math.floor(Math.random() * pool.length)];
      let s2 = pool[Math.floor(Math.random() * pool.length)];
      let s3 = pool[Math.floor(Math.random() * pool.length)];
      if (s1 === s2 && s2 === s3) {
        s3 = '☕';
      }
      finalSymbols = [s1, s2, s3];
    }

    this.animateReels(finalSymbols, winData);
  }

  animateReels(finalSymbols, winData) {
    const baseDuration = 1600;
    let stoppedReels = [false, false, false];
    
    const tickInterval = setInterval(() => {
      sounds.playReelTick();
    }, 110);

    const pool = [SLOT_SYMBOLS.JACKPOT, SLOT_SYMBOLS.BIG_WIN, SLOT_SYMBOLS.LUCKY, ...SLOT_SYMBOLS.FILLERS];
    
    const spinInterval = setInterval(() => {
      [0, 1, 2].forEach(idx => {
        if (!stoppedReels[idx]) {
          const randomSymbol = pool[Math.floor(Math.random() * pool.length)];
          this.strips[idx].innerHTML = `<div class="reel-item">${randomSymbol}</div>`;
        }
      });
    }, 70);

    [0, 1, 2].forEach(index => {
      setTimeout(() => {
        stoppedReels[index] = true;
        this.strips[index].innerHTML = `<div class="reel-item">${finalSymbols[index]}</div>`;
        sounds.playTap();

        if (index === 2) {
          clearInterval(spinInterval);
          clearInterval(tickInterval);
          this.isSpinning = false;
          this.onSpinFinished(winData, finalSymbols);
        }
      }, baseDuration + index * 420);
    });
  }

  onSpinFinished(winData, finalSymbols) {
    this.coinCount.textContent = `${state.data.coins} Coins`;
    this.spinsRemaining.textContent = state.data.spinsRemaining;
    if (state.data.spinsRemaining > 0) {
      this.spinsBadge.style.display = 'block';
      this.spinsBadge.textContent = state.data.spinsRemaining;
      this.spinBtn.disabled = false;
    } else {
      this.spinsBadge.style.display = 'none';
      this.spinBtn.disabled = true;
    }

    if (winData) {
      sounds.playWinSound();
      state.data.coins += winData.coins;
      state.save();
      this.coinCount.textContent = `${state.data.coins} Coins`;

      this.winIcon.textContent = winData.icon;
      this.winTitle.textContent = winData.title;
      this.winDesc.textContent = winData.desc;

      setTimeout(() => {
        this.winModal.classList.add('active');
      }, 250);
    }
  }

  // --- PETTING INTERACTIONS ---
  petMeeko(scene = 'outside') {
    sounds.playMeow();
    setTimeout(() => sounds.playPurr(), 180);

    state.data.petHappinessCount += 1;
    state.save();

    const targetMeeko = scene === 'inside' ? this.insideMeeko : this.outsideMeeko;
    const targetLayer = scene === 'inside' ? this.heartsLayerInside : this.heartsLayerOutside;

    targetMeeko.classList.add('purring');
    setTimeout(() => targetMeeko.classList.remove('purring'), 800);

    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    const emojis = ['💖', '✨', '🐾', '💕', '⭐'];
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left = (40 + Math.random() * 40) + '%';
    heart.style.bottom = (40 + Math.random() * 20) + '%';
    targetLayer.appendChild(heart);

    setTimeout(() => heart.remove(), 1400);

    const purrQuotes = [
      "Meeko is purring loudly! *purrrr*",
      "Meeko rubs his cheek against your hand! 💕",
      "Meeko slow-blinks affectionately at you!",
      "Meeko stretches his royal paws! ✨",
      "Meeko loves his plush milk carton bed! 🥛"
    ];
    this.petStatusText.textContent = purrQuotes[Math.floor(Math.random() * purrQuotes.length)];
  }

  // --- RENDER MEEKO'S TWO-STAGE HAVEN ---
  renderMeekoRoom() {
    // 1. Render Meeko's high-fidelity SVG art
    if (!this.outsideMeekoArt.hasChildNodes()) {
      this.outsideMeekoArt.innerHTML = getMeekoSVG('right', false);
    }
    if (!this.insideMeekoArt.hasChildNodes()) {
      this.insideMeekoArt.innerHTML = getMeekoSVG('right', false);
    }

    // 2. Render Snug Headwear
    const hatItem = SHOP_ITEMS.find(i => i.id === state.data.equippedHat);
    if (hatItem) {
      this.outsideHatSlot.textContent = hatItem.icon;
      this.outsideHatSlot.style.display = 'block';
      this.insideHatSlot.textContent = hatItem.icon;
      this.insideHatSlot.style.display = 'block';
    } else {
      this.outsideHatSlot.style.display = 'none';
      this.insideHatSlot.style.display = 'none';
    }

    // 3. Render Inside Carton Decor
    const decor = state.data.equippedDecor || [];
    this.insideFairyLights.classList.toggle('active', decor.includes('decor_lights'));
    this.insideTunaFeast.classList.toggle('active', decor.includes('decor_tuna'));
    this.insideYarnToy.classList.toggle('active', decor.includes('decor_yarn'));
    this.insideScratcher.classList.toggle('active', decor.includes('decor_tree'));
    this.insideCatGrass.classList.toggle('active', decor.includes('decor_grass'));
    this.insideCeilingStars.classList.toggle('active', decor.includes('decor_stars'));
  }

  // --- MEEKO'S BOUTIQUE & SHOP ---
  renderShop() {
    this.shopGrid.innerHTML = '';
    const filteredItems = SHOP_ITEMS.filter(i => i.category === this.activeShopCategory);

    filteredItems.forEach(item => {
      const isUnlocked = state.data.unlockedItems.includes(item.id);
      const isEquipped = (item.category === 'hats' && state.data.equippedHat === item.id) ||
                         (item.category === 'decor' && state.data.equippedDecor.includes(item.id));
      const canAfford = state.data.coins >= item.cost;

      const card = document.createElement('div');
      card.className = `shop-item-card glass-panel ${isEquipped ? 'equipped' : ''}`;

      let actionBtnHTML = '';
      if (!isUnlocked) {
        actionBtnHTML = `
          <button class="shop-action-btn buy" ${canAfford ? '' : 'disabled'}>
            🪙 ${item.cost}
          </button>
        `;
      } else if (isEquipped) {
        actionBtnHTML = `<button class="shop-action-btn unequip">Unequip</button>`;
      } else {
        actionBtnHTML = `<button class="shop-action-btn equip">Equip</button>`;
      }

      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
        ${actionBtnHTML}
      `;

      const btn = card.querySelector('.shop-action-btn');
      btn.addEventListener('click', () => {
        if (!isUnlocked) {
          this.buyShopItem(item);
        } else if (isEquipped) {
          this.unequipShopItem(item);
        } else {
          this.equipShopItem(item);
        }
      });

      this.shopGrid.appendChild(card);
    });
  }

  buyShopItem(item) {
    if (state.data.coins < item.cost) return;
    sounds.playWinSound();

    state.data.coins -= item.cost;
    state.data.unlockedItems.push(item.id);

    if (item.category === 'hats') {
      state.data.equippedHat = item.id;
    } else {
      if (!state.data.equippedDecor.includes(item.id)) {
        state.data.equippedDecor.push(item.id);
      }
    }

    state.save();
    this.render();

    this.itemModalIcon.textContent = item.icon;
    this.itemModalTitle.textContent = `Unlocked: ${item.name}!`;
    this.itemModalDesc.textContent = item.desc;
    this.itemModal.classList.add('active');
  }

  equipShopItem(item) {
    sounds.playTap();
    if (item.category === 'hats') {
      state.data.equippedHat = item.id;
    } else {
      if (!state.data.equippedDecor.includes(item.id)) {
        state.data.equippedDecor.push(item.id);
      }
    }
    state.save();
    this.render();
  }

  unequipShopItem(item) {
    sounds.playTap();
    if (item.category === 'hats') {
      if (state.data.equippedHat === item.id) {
        state.data.equippedHat = null;
      }
    } else {
      state.data.equippedDecor = state.data.equippedDecor.filter(id => id !== item.id);
    }
    state.save();
    this.render();
  }

  // --- GENERAL RENDER ---
  render() {
    this.coinCount.textContent = `${state.data.coins} Coins`;

    this.spinsRemaining.textContent = state.data.spinsRemaining;
    if (state.data.spinsRemaining > 0) {
      this.spinsBadge.style.display = 'block';
      this.spinsBadge.textContent = state.data.spinsRemaining;
      this.spinBtn.disabled = this.isSpinning;
    } else {
      this.spinsBadge.style.display = 'none';
      this.spinBtn.disabled = true;
    }

    this.renderTasks();
    this.updateClaimButtonState();
    this.renderMeekoRoom();
    this.renderShop();
  }
}

// Initialize on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new RoutineApp();
});
