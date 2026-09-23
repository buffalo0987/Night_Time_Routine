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
  // Generates an anatomically authentic SVG cat with Meeko's distinctive markings:
  // - True tuxedo black cap over ears & cheek sides
  // - Asymmetrical clipped/notched left ear
  // - Heart/triangle black spot on his pink nose
  // - Soft white blaze down muzzle & full white chest bib
  // - Olive green almond eyes with reflections
  // - Seamlessly articulated tail curving up from the lumbar base
  // - Royal blue collar with bell & diamond tag
  const flip = facing === 'left' ? 'transform="scale(-1, 1) translate(-200, 0)"' : '';
  const legOffset1 = isWalking ? '10' : '0';
  const legOffset2 = isWalking ? '-10' : '0';

  return `
  <svg class="meeko-svg-art" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Olive Hazel Cat Eye Gradient -->
      <radialGradient id="meekoEyeGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#d9f99d"/>
        <stop offset="35%" stop-color="#84cc16"/>
        <stop offset="80%" stop-color="#4d7c0f"/>
        <stop offset="100%" stop-color="#14532d"/>
      </radialGradient>
      <!-- Tuxedo Fur Soft Shading -->
      <linearGradient id="furShade" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2a2c35"/>
        <stop offset="40%" stop-color="#18191f"/>
        <stop offset="100%" stop-color="#0f1013"/>
      </linearGradient>
      <!-- Soft Inner Ear Pink -->
      <linearGradient id="innerEarGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#fda4af"/>
        <stop offset="100%" stop-color="#fecdd3"/>
      </linearGradient>
      <!-- White fur soft gradient -->
      <linearGradient id="whiteFur" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="90%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
    </defs>

    <g ${flip}>
      <!-- TAIL (Seamlessly integrated into lower spine/rump) -->
      <g class="cat-tail-group">
        <path d="M 132 150 C 158 140, 175 110, 168 70 C 165 50, 150 25, 142 18 C 137 14, 131 18, 134 26 C 142 42, 148 68, 144 95 C 140 120, 126 138, 118 152 Z" 
              fill="url(#furShade)"/>
      </g>

      <!-- HINDQUARTERS & BODY -->
      <ellipse cx="110" cy="148" rx="46" ry="42" fill="url(#furShade)"/>
      
      <!-- Back spine silver/white streak -->
      <path d="M 125 125 Q 120 145 128 160" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-linecap="round" fill="none"/>

      <!-- HIND PAW -->
      <ellipse cx="138" cy="186" rx="14" ry="10" fill="url(#whiteFur)"/>

      <!-- FORE CHEST & FRONT BODY -->
      <ellipse cx="88" cy="138" rx="40" ry="46" fill="url(#furShade)"/>

      <!-- WHITE CHEST BIB -->
      <path d="M 68 106 C 75 106, 92 115, 105 110 C 114 125, 115 158, 98 178 C 84 184, 68 180, 62 165 C 56 142, 58 118, 68 106 Z" 
            fill="url(#whiteFur)"/>

      <!-- FRONT LEGS & MITTENS -->
      <!-- Back front leg -->
      <g transform="translate(${legOffset2}, 0)">
        <path d="M 94 145 L 98 184 L 110 184 L 106 145 Z" fill="url(#furShade)"/>
        <ellipse cx="106" cy="188" rx="12" ry="8" fill="url(#whiteFur)"/>
      </g>
      <!-- Main front leg -->
      <g transform="translate(${legOffset1}, 0)">
        <path d="M 70 140 L 70 185 L 86 185 L 84 140 Z" fill="url(#whiteFur)"/>
        <ellipse cx="78" cy="188" rx="13" ry="9" fill="url(#whiteFur)"/>
        <line x1="75" y1="184" x2="75" y2="191" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="81" y1="184" x2="81" y2="191" stroke="#cbd5e1" stroke-width="1.5"/>
      </g>

      <!-- CAT HEAD -->
      <g class="cat-head-group">
        <!-- Skull Base -->
        <ellipse cx="76" cy="82" rx="44" ry="38" fill="url(#furShade)"/>

        <!-- RIGHT EAR -->
        <polygon points="90,56 112,18 78,44" fill="url(#furShade)"/>
        <polygon points="90,53 106,25 82,46" fill="url(#innerEarGrad)"/>
        <!-- Inner ear fur tufts -->
        <path d="M 82 48 Q 92 38 98 42" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.8"/>

        <!-- LEFT EAR (With Meeko's distinctive clipped/tipped notch!) -->
        <path d="M 64,55 L 42,22 L 48,22 L 53,28 L 56,22 L 72,46 Z" fill="url(#furShade)"/>
        <polygon points="62,52 48,28 66,46" fill="url(#innerEarGrad)"/>
        <path d="M 66 48 Q 58 38 52 42" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.8"/>

        <!-- TUXEDO WHITE FACE BLAZE & CHEEKS -->
        <path d="M 76,48 Q 72,62 66,74 C 54,78 48,88 50,98 C 52,108 64,114 76,114 C 88,114 100,108 102,98 C 104,88 98,78 86,74 Q 80,62 76,48 Z" 
              fill="url(#whiteFur)"/>

        <!-- EYES (Hazel / Olive Green with Pupil Depth) -->
        <!-- Left Eye -->
        <ellipse cx="62" cy="78" rx="9" ry="11" fill="url(#meekoEyeGrad)"/>
        <ellipse cx="62" cy="78" rx="4" ry="8" fill="#09090b"/>
        <circle cx="60" cy="75" r="2.8" fill="#ffffff"/>
        <circle cx="64" cy="82" r="1.4" fill="#ffffff" opacity="0.7"/>

        <!-- Right Eye -->
        <ellipse cx="90" cy="78" rx="9" ry="11" fill="url(#meekoEyeGrad)"/>
        <ellipse cx="90" cy="78" rx="4" ry="8" fill="#09090b"/>
        <circle cx="88" cy="75" r="2.8" fill="#ffffff"/>
        <circle cx="92" cy="82" r="1.4" fill="#ffffff" opacity="0.7"/>

        <!-- MEEKO'S DISTINCTIVE BLACK NOSE SPOT -->
        <path d="M 71,91 C 71,88 81,88 81,91 C 81,94 77,97 76,98 C 75,97 71,94 71,91 Z" fill="#18191f"/>

        <!-- MOUTH & SWEET PINK CHIN -->
        <path d="M 71,99 Q 76,103 81,99" stroke="#71717a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <ellipse cx="76" cy="106" rx="5" ry="3" fill="#fecdd3" opacity="0.7"/>

        <!-- REALISTIC WHISKERS -->
        <g stroke="#ffffff" stroke-width="1.2" opacity="0.85" stroke-linecap="round">
          <!-- Left whiskers -->
          <line x1="60" y1="94" x2="30" y2="90"/>
          <line x1="60" y1="97" x2="28" y2="101"/>
          <line x1="62" y1="100" x2="34" y2="110"/>
          <!-- Right whiskers -->
          <line x1="92" y1="94" x2="122" y2="90"/>
          <line x1="92" y1="97" x2="124" y2="101"/>
          <line x1="90" y1="100" x2="118" y2="110"/>
        </g>

        <!-- ROYAL BLUE COLLAR WITH BELL & TAG -->
        <path d="M 52,108 Q 76,122 100,108 L 102,115 Q 76,129 50,115 Z" fill="#2563eb" stroke="#1d4ed8" stroke-width="1"/>
        <!-- Golden Bell -->
        <circle cx="76" cy="122" r="6" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
        <circle cx="76" cy="123" r="1.5" fill="#713f12"/>
        <!-- Hanging ID Tag -->
        <polygon points="76,127 80,133 76,138 72,133" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.8"/>
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
