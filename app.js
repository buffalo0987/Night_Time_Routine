// --- CONSTANTS & CONFIGURATION ---
const DEFAULT_USER_PIN = "5678";
const DEFAULT_ADMIN_PIN = "1234";
const CUTOFF_HOUR = 21; // 9 PM
const CUTOFF_MINUTE = 0; // 9:00 PM
const RESET_HOUR = 4; // 4:00 AM

const DEFAULT_TASKS = [
  { id: 't1', title: 'Wash face & skincare routine', completed: false, lockedOut: false },
  { id: 't2', title: 'Brush & floss teeth', completed: false, lockedOut: false },
  { id: 't3', title: 'Prepare outfit & essentials for tomorrow', completed: false, lockedOut: false },
  { id: 't4', title: '30 minutes reading / screen-free wind-down', completed: false, lockedOut: false },
  { id: 't5', title: 'Drink water & take nighttime medicine', completed: false, lockedOut: false }
];

// Weighted Odds for 1 spin:
// 1/500 (0.002) = Gold (Grand)
// 1/75 (~0.01333) = Silver (Major)
// 1/15 (~0.06667) = Bronze (Minor)
// Remainder (~0.918) = No Token (Consolation)
const SLOT_SYMBOLS = {
  GOLD: '🥇',
  SILVER: '🥈',
  BRONZE: '🥉',
  CONSOLATION: ['🌙', '⭐', '✨', '💤', '🧸', '☕']
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
    osc.frequency.setValueAtTime(200 + Math.random() * 80, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
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
      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
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
      tokens: { gold: 0, silver: 0, bronze: 0 },
      spinsRemaining: 0,
      tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
      vouchers: [], // { id, name, tier, timestamp, fulfilled, fulfilledAt }
      lastCycleDate: null,
      claimedToday: false,
      simulatedCutoff: false
    };

    if (raw) {
      try {
        this.data = Object.assign(defaultData, JSON.parse(raw));
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

// --- UI CONTROLLER & LOGIC ---
class RoutineApp {
  constructor() {
    this.activeTab = 'viewRoutine';
    this.pinBuffer = '';
    this.pinMode = 'USER'; // 'USER' or 'ADMIN'
    this.isSpinning = false;

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

    // Header & Inventory
    this.goldCount = document.getElementById('goldCount');
    this.silverCount = document.getElementById('silverCount');
    this.bronzeCount = document.getElementById('bronzeCount');
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

    // Store
    this.redeemButtons = document.querySelectorAll('.redeem-btn');

    // Lock Screen
    this.lockScreen = document.getElementById('lockScreen');
    this.lockPromptTitle = document.getElementById('lockPromptTitle');
    this.lockPromptSub = document.getElementById('lockPromptSub');
    this.pinDots = document.querySelectorAll('.pin-dot');
    this.rememberDeviceCheck = document.getElementById('rememberDeviceCheck');
    this.pinClearBtn = document.getElementById('pinClearBtn');
    this.pinDeleteBtn = document.getElementById('pinDeleteBtn');

    // Modals
    this.voucherModal = document.getElementById('voucherModal');
    this.voucherRewardName = document.getElementById('voucherRewardName');
    this.voucherTimestamp = document.getElementById('voucherTimestamp');
    this.closeVoucherBtn = document.getElementById('closeVoucherBtn');
    this.confirmVoucherBtn = document.getElementById('confirmVoucherBtn');

    this.winModal = document.getElementById('winModal');
    this.winIcon = document.getElementById('winIcon');
    this.winTitle = document.getElementById('winTitle');
    this.winDesc = document.getElementById('winDesc');
    this.closeWinBtn = document.getElementById('closeWinBtn');

    // Admin Dashboard
    this.adminSecretBtn = document.getElementById('adminSecretBtn');
    this.adminModal = document.getElementById('adminModal');
    this.closeAdminBtn = document.getElementById('closeAdminBtn');
    this.pendingVouchersList = document.getElementById('pendingVouchersList');
    this.completedVouchersList = document.getElementById('completedVouchersList');

    // Admin controls
    this.adminAddSpinBtn = document.getElementById('adminAddSpinBtn');
    this.adminAddGoldBtn = document.getElementById('adminAddGoldBtn');
    this.adminAddSilverBtn = document.getElementById('adminAddSilverBtn');
    this.adminAddBronzeBtn = document.getElementById('adminAddBronzeBtn');
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

    // Lock screen actions
    this.manualLockBtn.addEventListener('click', () => this.lockApp());
    document.querySelectorAll('.key-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', (e) => {
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

    // Store Redemptions
    this.redeemButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.getAttribute('data-tier');
        const prize = btn.getAttribute('data-prize');
        this.handleRedemption(tier, prize);
      });
    });

    // Modals
    this.closeVoucherBtn.addEventListener('click', () => this.voucherModal.classList.remove('active'));
    this.confirmVoucherBtn.addEventListener('click', () => this.voucherModal.classList.remove('active'));
    this.closeWinBtn.addEventListener('click', () => this.winModal.classList.remove('active'));

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
    this.adminAddGoldBtn.addEventListener('click', () => {
      state.data.tokens.gold += 1;
      state.save();
      this.render();
    });
    this.adminAddSilverBtn.addEventListener('click', () => {
      state.data.tokens.silver += 1;
      state.save();
      this.render();
    });
    this.adminAddBronzeBtn.addEventListener('click', () => {
      state.data.tokens.bronze += 1;
      state.save();
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
        navigator.serviceWorker.register('service-worker.js').catch(err => {
          console.log('SW registration error:', err);
        });
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
  }

  // --- TIME LOCK & DAILY CYCLE LOGIC ---
  // The daily routine cycle runs from 4:00 AM to the next day 4:00 AM.
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
      // 4:00 AM New Day Reset
      state.data.lastCycleDate = currentKey;
      state.data.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      state.data.claimedToday = false;
      state.data.simulatedCutoff = false;
      state.save();
    }
  }

  isPastCutoff(now = new Date()) {
    if (state.data.simulatedCutoff) return true;
    
    // Check if within cycle and past 9:00 PM
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // After 9:00 PM (21:00) or early morning before 4:00 AM
    if (hours > CUTOFF_HOUR || (hours === CUTOFF_HOUR && minutes >= CUTOFF_MINUTE)) {
      return true;
    }
    if (hours < RESET_HOUR) {
      return true; // Late night after midnight but before 4 AM cycle reset
    }
    return false;
  }

  checkTimeLockRules() {
    this.checkCycleReset();
    const past = this.isPastCutoff();

    // If currentTime > cutoffTime and a task is unchecked, lock it permanently for the night
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

        // Calculate time remaining until 4:00 AM reset
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
        this.cutoffBadge.textContent = 'Cutoff 9:00 PM';
        this.countdownStatusText.textContent = 'Time left for tonight:';

        // Calculate time left until 9:00 PM
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
        this.renderAdminDrawer();
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

  // --- CHECKLIST & REWARDS ---
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
      this.claimSubtitle.textContent = "Tasks were locked past 9:00 PM. Try again tomorrow at 4 AM!";
    } else if (allCompleted) {
      this.claimRewardBtn.disabled = false;
      this.claimRewardBtn.innerHTML = `<span>🎁 Claim Nightly Reward</span><span style="font-size:0.85rem; opacity:0.9;">(+5 Spins)</span>`;
      this.claimSubtitle.textContent = "All habits complete! Tap above to get your 5 spins!";
    } else {
      this.claimRewardBtn.disabled = true;
      this.claimRewardBtn.innerHTML = `<span>🎁 Claim Nightly Reward</span><span style="font-size:0.85rem; opacity:0.9;">(+5 Spins)</span>`;
      this.claimSubtitle.textContent = "Check off all tasks before 9:00 PM to claim 5 spins.";
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

  // --- SLOT MACHINE ENGINE ---
  handleSpin() {
    if (this.isSpinning || state.data.spinsRemaining <= 0) return;

    sounds.playTap();
    this.isSpinning = true;
    state.data.spinsRemaining -= 1;
    state.save();
    this.render();

    // Determine outcome based on exact specified weighted odds
    // 1 in 500 = Gold (0.002)
    // 1 in 75 = Silver (0.01333333...)
    // 1 in 15 = Bronze (0.06666666...)
    // Remainder = No Token (~0.918)
    const roll = Math.random();
    const goldThreshold = 1 / 500; // 0.002
    const silverThreshold = goldThreshold + (1 / 75); // ~0.015333
    const bronzeThreshold = silverThreshold + (1 / 15); // ~0.082

    let resultTier = null;
    let finalSymbols = [];

    if (roll < goldThreshold) {
      resultTier = 'gold';
      finalSymbols = [SLOT_SYMBOLS.GOLD, SLOT_SYMBOLS.GOLD, SLOT_SYMBOLS.GOLD];
    } else if (roll < silverThreshold) {
      resultTier = 'silver';
      finalSymbols = [SLOT_SYMBOLS.SILVER, SLOT_SYMBOLS.SILVER, SLOT_SYMBOLS.SILVER];
    } else if (roll < bronzeThreshold) {
      resultTier = 'bronze';
      finalSymbols = [SLOT_SYMBOLS.BRONZE, SLOT_SYMBOLS.BRONZE, SLOT_SYMBOLS.BRONZE];
    } else {
      // Consolation: randomized non-matching symbols
      const icons = SLOT_SYMBOLS.CONSOLATION;
      const s1 = icons[Math.floor(Math.random() * icons.length)];
      let s2 = icons[Math.floor(Math.random() * icons.length)];
      let s3 = icons[Math.floor(Math.random() * icons.length)];
      // Prevent 3-of-a-kind on consolation
      if (s1 === s2 && s2 === s3) {
        s3 = '☕';
      }
      finalSymbols = [s1, s2, s3];
    }

    this.animateReels(finalSymbols, resultTier);
  }

  animateReels(finalSymbols, resultTier) {
    const totalSteps = 22;
    const baseDuration = 1800; // 1.8s
    
    // Sound interval
    const tickInterval = setInterval(() => {
      sounds.playReelTick();
    }, 110);

    // Rapidly change symbols during spinning
    const spinInterval = setInterval(() => {
      this.strips.forEach(strip => {
        const randomSymbol = SLOT_SYMBOLS.CONSOLATION[Math.floor(Math.random() * SLOT_SYMBOLS.CONSOLATION.length)];
        strip.innerHTML = `<div class="reel-item">${randomSymbol}</div>`;
      });
    }, 70);

    // Stop reels one by one
    [0, 1, 2].forEach(index => {
      setTimeout(() => {
        // Stop specific reel
        this.strips[index].innerHTML = `<div class="reel-item">${finalSymbols[index]}</div>`;
        sounds.playTap();

        if (index === 2) {
          clearInterval(spinInterval);
          clearInterval(tickInterval);
          this.isSpinning = false;
          this.onSpinFinished(resultTier);
        }
      }, baseDuration + index * 400);
    });
  }

  onSpinFinished(resultTier) {
    this.render();

    if (resultTier) {
      sounds.playWinSound();
      if (resultTier === 'gold') {
        state.data.tokens.gold += 1;
        this.winIcon.textContent = '🥇';
        this.winTitle.textContent = 'GRAND PRIZE!';
        this.winDesc.textContent = '1 in 500 Chance! You won a Gold Token!';
      } else if (resultTier === 'silver') {
        state.data.tokens.silver += 1;
        this.winIcon.textContent = '🥈';
        this.winTitle.textContent = 'MAJOR PRIZE!';
        this.winDesc.textContent = '1 in 75 Chance! You won a Silver Token!';
      } else if (resultTier === 'bronze') {
        state.data.tokens.bronze += 1;
        this.winIcon.textContent = '🥉';
        this.winTitle.textContent = 'PRIZE WINNER!';
        this.winDesc.textContent = '1 in 15 Chance! You won a Bronze Token!';
      }
      state.save();
      this.render();
      setTimeout(() => {
        this.winModal.classList.add('active');
      }, 200);
    }
  }

  // --- REWARD STORE ---
  handleRedemption(tier, prizeName) {
    sounds.playTap();
    if (state.data.tokens[tier] < 1) return;

    // Deduct token
    state.data.tokens[tier] -= 1;

    // Create pending voucher
    const now = new Date();
    const timestampStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' - ' +
                         now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const voucher = {
      id: 'v_' + Date.now(),
      name: prizeName,
      tier: tier,
      timestamp: timestampStr,
      fulfilled: false,
      fulfilledAt: null
    };

    state.data.vouchers.unshift(voucher);
    state.save();

    sounds.playWinSound();
    this.render();

    // Show celebration voucher modal
    this.voucherRewardName.textContent = prizeName;
    this.voucherTimestamp.textContent = `Redeemed: ${timestampStr}`;
    this.voucherModal.classList.add('active');
  }

  // --- HUSBAND / ADMIN PANEL ---
  renderAdminDrawer() {
    this.pendingVouchersList.innerHTML = '';
    this.completedVouchersList.innerHTML = '';

    const pending = state.data.vouchers.filter(v => !v.fulfilled);
    const completed = state.data.vouchers.filter(v => v.fulfilled);

    if (pending.length === 0) {
      this.pendingVouchersList.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); padding:6px 0;">No pending vouchers right now.</div>`;
    } else {
      pending.forEach(v => {
        const item = document.createElement('div');
        item.className = 'voucher-item';
        item.innerHTML = `
          <div class="voucher-meta">
            <span class="voucher-item-name">${v.name}</span>
            <span class="voucher-item-time">Redeemed: ${v.timestamp}</span>
          </div>
          <button class="fulfill-btn" data-id="${v.id}">Mark Fulfilled</button>
        `;

        item.querySelector('.fulfill-btn').addEventListener('click', () => {
          v.fulfilled = true;
          v.fulfilledAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          state.save();
          sounds.playWinSound();
          this.renderAdminDrawer();
        });

        this.pendingVouchersList.appendChild(item);
      });
    }

    if (completed.length === 0) {
      this.completedVouchersList.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); padding:6px 0;">No completed history yet.</div>`;
    } else {
      completed.forEach(v => {
        const item = document.createElement('div');
        item.className = 'voucher-item';
        item.style.opacity = '0.7';
        item.innerHTML = `
          <div class="voucher-meta">
            <span class="voucher-item-name" style="text-decoration:line-through;">${v.name}</span>
            <span class="voucher-item-time">Fulfilled on ${v.fulfilledAt || 'earlier'}</span>
          </div>
          <span style="color:var(--accent-emerald); font-size:0.8rem; font-weight:700;">✓ Done</span>
        `;
        this.completedVouchersList.appendChild(item);
      });
    }
  }

  // --- GENERAL RENDER ---
  render() {
    // Balances
    this.goldCount.textContent = state.data.tokens.gold;
    this.silverCount.textContent = state.data.tokens.silver;
    this.bronzeCount.textContent = state.data.tokens.bronze;

    // Spins
    this.spinsRemaining.textContent = state.data.spinsRemaining;
    if (state.data.spinsRemaining > 0) {
      this.spinsBadge.style.display = 'block';
      this.spinsBadge.textContent = state.data.spinsRemaining;
      this.spinBtn.disabled = this.isSpinning;
    } else {
      this.spinsBadge.style.display = 'none';
      this.spinBtn.disabled = true;
    }

    // Store affordances
    this.redeemButtons.forEach(btn => {
      const tier = btn.getAttribute('data-tier');
      const canAfford = state.data.tokens[tier] >= 1;
      btn.disabled = !canAfford;
      if (canAfford) {
        btn.classList.add('can-afford');
      } else {
        btn.classList.remove('can-afford');
      }
    });

    // Routine Tasks
    this.renderTasks();
    this.updateClaimButtonState();
  }
}

// Initialize on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new RoutineApp();
});
