/**
 * Tic-Tac-Toe Pro - Game Engine, AI Logic, Points, Rewards & Supabase Auth
 */

// ============================================================================
// GAME CONFIGURATION & CONSTANTS
// ============================================================================
const WINNING_COMBINATIONS = [
    [0, 1, 2], // Horizontal top
    [3, 4, 5], // Horizontal middle
    [6, 7, 8], // Horizontal bottom
    [0, 3, 6], // Vertical left
    [1, 4, 7], // Vertical center
    [2, 5, 8], // Vertical right
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
];

const DIFFICULTY_POINTS = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0
};

const REDEEM_REWARDS = [
    { amount: 10, requiredPoints: 1000 },
    { amount: 20, requiredPoints: 2000 },
    { amount: 50, requiredPoints: 5000 },
    { amount: 100, requiredPoints: 10000 }
];

// ============================================================================
// APP & GAME STATE
// ============================================================================
const state = {
    board: Array(9).fill(''),
    currentPlayer: 'X', // 'X' is User, 'O' is AI
    isGameActive: true,
    isAiTurn: false,
    selectedDifficulty: 'easy', // 'easy' | 'medium' | 'hard'
    
    // User Points (Supports 0.5-point increments)
    points: 0.0,
    
    // Statistics
    stats: {
        totalGames: 0,
        userWins: 0,
        aiWins: 0,
        draws: 0,
        easyWins: 0,
        mediumWins: 0,
        hardWins: 0
    },

    // Pending Redemption
    pendingRedeem: null
};

// ============================================================================
// DOM ELEMENTS SELECTORS
// ============================================================================
const elements = {
    // Header & Navigation
    headerPointsVal: document.getElementById('headerPointsVal'),
    navLinks: document.querySelectorAll('.nav-link'),
    navBtnOpenAuth: document.getElementById('navBtnOpenAuth'),
    navAuthUserPill: document.getElementById('navAuthUserPill'),
    navUserEmail: document.getElementById('navUserEmail'),
    navBtnLogout: document.getElementById('navBtnLogout'),

    // Hero Section
    heroPointsDisplay: document.getElementById('heroPointsDisplay'),
    heroCashEquiv: document.getElementById('heroCashEquiv'),
    diffButtons: document.querySelectorAll('.diff-btn'),
    btnHeroPlay: document.getElementById('btnHeroPlay'),
    btnHeroRewards: document.getElementById('btnHeroRewards'),

    // Game Arena
    gameBoard: document.getElementById('gameBoard'),
    cells: document.querySelectorAll('.cell'),
    currentDiffBadge: document.getElementById('currentDiffBadge'),
    currentDiffName: document.getElementById('currentDiffName'),
    playerDisplayName: document.getElementById('playerDisplayName'),
    playerUserBox: document.getElementById('playerUserBox'),
    playerAiBox: document.getElementById('playerAiBox'),
    turnIndicator: document.getElementById('turnIndicator'),
    btnRestartGame: document.getElementById('btnRestartGame'),

    // Stats Section
    statTotalPoints: document.getElementById('statTotalPoints'),
    statTotalGames: document.getElementById('statTotalGames'),
    statUserWins: document.getElementById('statUserWins'),
    statAiWins: document.getElementById('statAiWins'),
    statDraws: document.getElementById('statDraws'),
    statEasyWins: document.getElementById('statEasyWins'),
    statMediumWins: document.getElementById('statMediumWins'),
    statHardWins: document.getElementById('statHardWins'),

    // Rewards Section
    redemptionHistoryList: document.getElementById('redemptionHistoryList'),

    // Modals
    authModal: document.getElementById('authModal'),
    btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
    authTabSignIn: document.getElementById('authTabSignIn'),
    authTabRegister: document.getElementById('authTabRegister'),
    authAlertBox: document.getElementById('authAlertBox'),
    formSignIn: document.getElementById('formSignIn'),
    signInEmail: document.getElementById('signInEmail'),
    signInPassword: document.getElementById('signInPassword'),
    formRegister: document.getElementById('formRegister'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerConfirmPassword: document.getElementById('registerConfirmPassword'),

    resultModal: document.getElementById('resultModal'),
    resultIconBadge: document.getElementById('resultIconBadge'),
    resultTitle: document.getElementById('resultTitle'),
    resultSubtitle: document.getElementById('resultSubtitle'),
    resultModalDiff: document.getElementById('resultModalDiff'),
    resultModalEarned: document.getElementById('resultModalEarned'),
    resultModalTotal: document.getElementById('resultModalTotal'),
    btnModalPlayAgain: document.getElementById('btnModalPlayAgain'),
    btnModalGoRewards: document.getElementById('btnModalGoRewards'),

    confirmRedeemModal: document.getElementById('confirmRedeemModal'),
    confirmRewardName: document.getElementById('confirmRewardName'),
    confirmPointsCost: document.getElementById('confirmPointsCost'),
    confirmPointsRemaining: document.getElementById('confirmPointsRemaining'),
    btnExecuteRedeem: document.getElementById('btnExecuteRedeem'),
    btnCancelRedeem: document.getElementById('btnCancelRedeem'),
    btnCloseConfirmModal: document.getElementById('btnCloseConfirmModal'),

    successRedeemModal: document.getElementById('successRedeemModal'),
    successRewardLabel: document.getElementById('successRewardLabel'),
    btnSuccessClose: document.getElementById('btnSuccessClose'),
    btnCloseSuccessModal: document.getElementById('btnCloseSuccessModal'),

    // Mobile Navigation Items
    mobNavItems: document.querySelectorAll('.mobile-nav-item'),

    // Confetti Canvas
    confettiCanvas: document.getElementById('confettiCanvas')
};

// ============================================================================
// AUDIO FX SYNTHESIZER (Web Audio API)
// ============================================================================
class SoundEffects {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    playMoveSound(isUser = true) {
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = isUser ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(isUser ? 520 : 330, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(isUser ? 780 : 220, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch (e) {
            // Audio context silently ignored if restricted by browser
        }
    }

    playWinSound() {
        try {
            this.init();
            if (!this.ctx) return;
            const notes = [440, 554.37, 659.25, 880];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.1 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.1);
                osc.stop(this.ctx.currentTime + idx * 0.1 + 0.25);
            });
        } catch (e) {}
    }

    playLossSound() {
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(280, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } catch (e) {}
    }
}

const soundFX = new SoundEffects();

// ============================================================================
// CONFETTI PARTICLES CELEBRATION
// ============================================================================
class ConfettiEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.particles = [];
        this.animationId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    trigger() {
        if (!this.ctx) return;
        this.particles = [];
        const colors = ['#00f2fe', '#f355da', '#f59e0b', '#10b981', '#ffffff', '#3b82f6'];
        for (let i = 0; i < 90; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                w: Math.random() * 8 + 4,
                h: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 18,
                gravity: 0.35,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.render();
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeCount = 0;
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.009;

            if (p.opacity > 0 && p.y < this.canvas.height) {
                activeCount++;
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.globalAlpha = Math.max(0, p.opacity);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                this.ctx.restore();
            }
        });

        if (activeCount > 0) {
            this.animationId = requestAnimationFrame(() => this.render());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

let confetti = null;

// ============================================================================
// GAME INITIALIZATION & LIFECYCLE
// ============================================================================
function initGame() {
    try {
        confetti = new ConfettiEngine(elements.confettiCanvas);
    } catch (e) {
        console.warn("Confetti init warning:", e);
    }

    // 1. Initialize Authentication & Cloud Sync
    initAuth();

    // 2. Load saved points and stats from Cloud / LocalStorage
    loadUserProfile();

    // 3. Attach all UI and game event listeners
    setupEventListeners();
    initLegalAndInfoListeners();

    // 4. Render initial state
    renderUI();
}

// ============================================================================
// AUTHENTICATION SYSTEM (EMAIL + PASSWORD ONLY)
// ============================================================================
function initAuth() {
    // Check initial auth state & listen for changes
    if (window.backendService) {
        window.backendService.onAuthChange((user) => {
            updateAuthHeader(user);
            loadUserProfile();
        });
    }

    // Auth Open & Close
    if (elements.navBtnOpenAuth) {
        elements.navBtnOpenAuth.addEventListener('click', () => {
            showAuthAlert('', '');
            openModal(elements.authModal);
        });
    }

    if (elements.btnCloseAuthModal) {
        elements.btnCloseAuthModal.addEventListener('click', () => {
            closeModal(elements.authModal);
        });
    }

    // Auth Tabs Switcher
    if (elements.authTabSignIn && elements.authTabRegister) {
        elements.authTabSignIn.addEventListener('click', () => {
            elements.authTabSignIn.classList.add('active');
            elements.authTabRegister.classList.remove('active');
            if (elements.formSignIn) elements.formSignIn.style.display = 'flex';
            if (elements.formRegister) elements.formRegister.style.display = 'none';
            showAuthAlert('', '');
        });

        elements.authTabRegister.addEventListener('click', () => {
            elements.authTabRegister.classList.add('active');
            elements.authTabSignIn.classList.remove('active');
            if (elements.formRegister) elements.formRegister.style.display = 'flex';
            if (elements.formSignIn) elements.formSignIn.style.display = 'none';
            showAuthAlert('', '');
        });
    }

    // Sign In Form Submit
    if (elements.formSignIn) {
        elements.formSignIn.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = elements.signInEmail.value.trim();
            const password = elements.signInPassword.value;
            const submitBtn = document.getElementById('btnSubmitSignIn');

            if (!email || !password) {
                showAuthAlert('Please fill in both email and password.', 'error');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Verifying...</span>';
            }

            try {
                if (window.backendService) {
                    await window.backendService.signIn(email, password);
                    showAuthAlert('✅ Successfully signed in! Loading your data...', 'success');
                    setTimeout(() => {
                        closeModal(elements.authModal);
                        if (elements.formSignIn) elements.formSignIn.reset();
                    }, 800);
                } else {
                    showAuthAlert('Database service not connected.', 'error');
                }
            } catch (err) {
                console.error("Sign In Error:", err);
                const msg = err.message || 'Invalid email or password.';
                showAuthAlert(`⚠️ ${msg}`, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Sign In</span>';
                }
            }
        });
    }

    // Register Form Submit
    if (elements.formRegister) {
        elements.formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = elements.registerEmail.value.trim();
            const password = elements.registerPassword.value;
            const confirmPassword = elements.registerConfirmPassword.value;
            const submitBtn = document.getElementById('btnSubmitRegister');

            if (!email || !password || !confirmPassword) {
                showAuthAlert('Please complete all registration fields.', 'error');
                return;
            }

            if (password.length < 6) {
                showAuthAlert('Password must be at least 6 characters long.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showAuthAlert('Passwords do not match. Please retype carefully.', 'error');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Creating Account...</span>';
            }

            try {
                if (window.backendService) {
                    await window.backendService.signUp(email, password);
                    showAuthAlert('✅ Account created successfully! Synced wallet.', 'success');
                    setTimeout(() => {
                        closeModal(elements.authModal);
                        if (elements.formRegister) elements.formRegister.reset();
                    }, 1000);
                } else {
                    showAuthAlert('Database service not connected.', 'error');
                }
            } catch (err) {
                console.error("Registration Error:", err);
                const msg = err.message || 'Registration failed. Try a different email.';
                showAuthAlert(`⚠️ ${msg}`, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Create Free Account</span>';
                }
            }
        });
    }

    // Logout Button Click
    if (elements.navBtnLogout) {
        elements.navBtnLogout.addEventListener('click', async () => {
            if (window.backendService) {
                await window.backendService.signOut();
            }
            updateAuthHeader(null);
            renderUI();
        });
    }
}

function updateAuthHeader(user) {
    if (user && user.email) {
        if (elements.navBtnOpenAuth) elements.navBtnOpenAuth.style.display = 'none';
        if (elements.navAuthUserPill) elements.navAuthUserPill.style.display = 'inline-flex';
        if (elements.navUserEmail) elements.navUserEmail.textContent = user.email;
        if (elements.playerDisplayName) {
            elements.playerDisplayName.textContent = user.email.split('@')[0];
        }
    } else {
        if (elements.navBtnOpenAuth) elements.navBtnOpenAuth.style.display = 'inline-flex';
        if (elements.navAuthUserPill) elements.navAuthUserPill.style.display = 'none';
        if (elements.playerDisplayName) {
            elements.playerDisplayName.textContent = 'Player (Guest)';
        }
    }
}

function showAuthAlert(message, type = 'error') {
    if (!elements.authAlertBox) return;
    if (!message) {
        elements.authAlertBox.style.display = 'none';
        return;
    }

    elements.authAlertBox.style.display = 'block';
    if (type === 'success') {
        elements.authAlertBox.style.background = 'rgba(16, 185, 129, 0.15)';
        elements.authAlertBox.style.color = '#6ee7b7';
        elements.authAlertBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    } else {
        elements.authAlertBox.style.background = 'rgba(239, 68, 68, 0.15)';
        elements.authAlertBox.style.color = '#fca5a5';
        elements.authAlertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    }
    elements.authAlertBox.textContent = message;
}

// Load points and stats directly with Cloud Sync
async function loadUserProfile() {
    if (window.backendService) {
        try {
            const data = await window.backendService.loadUserData();
            if (data) {
                state.points = Number(data.points || 0);
                state.stats = Object.assign(state.stats, data.stats || {});
                renderUI();
            }
        } catch (e) {
            console.warn("User profile background load error:", e);
        }
    } else {
        try {
            const localData = localStorage.getItem("tictactoe_game_data");
            if (localData) {
                const parsed = JSON.parse(localData);
                state.points = Number(parsed.points || 0);
                state.stats = Object.assign(state.stats, parsed.stats || {});
            }
        } catch (e) {
            console.warn("LocalStorage parse error:", e);
        }
    }
}

// Sync and Save User Data locally & to Cloud database
async function saveState() {
    if (window.backendService) {
        await window.backendService.saveUserData({
            points: state.points,
            stats: state.stats
        });
    } else {
        try {
            localStorage.setItem("tictactoe_game_data", JSON.stringify({
                points: state.points,
                stats: state.stats
            }));
        } catch (e) {
            console.warn("LocalStorage save error:", e);
        }
    }
}

// ============================================================================
// MOBILE & DESKTOP MULTI-VIEW NAVIGATION CONTROLLER
// ============================================================================
function switchView(viewName) {
    if (!viewName) return;

    // Normalization for aliases
    if (viewName === 'home' || viewName === 'play') viewName = 'game';
    if (viewName === 'instructions') viewName = 'rules';
    if (viewName === 'contact') viewName = 'about';

    // 1. Update active app view container
    const appViews = document.querySelectorAll('.app-view');
    const targetView = document.querySelector(`.app-view[data-view="${viewName}"]`);

    if (targetView) {
        appViews.forEach(v => v.classList.remove('active-view'));
        targetView.classList.add('active-view');
    }

    // 2. Update Bottom Nav Active Indicator
    const bottomNavItems = document.querySelectorAll('.mobile-nav-item');
    bottomNavItems.forEach(item => {
        const tab = item.getAttribute('data-tab');
        item.classList.toggle('active', tab === viewName);
    });

    // 3. Update Desktop Navbar Links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href')?.replace('#', '');
        const isMatch = (href === viewName) ||
                        (href === 'home' && viewName === 'game') ||
                        (href === 'instructions' && viewName === 'rules') ||
                        (href === 'contact' && viewName === 'about');
        link.classList.toggle('active', isMatch);
    });

    // 4. Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================
function setupEventListeners() {
    // Cell clicks
    elements.cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = parseInt(cell.getAttribute('data-index'), 10);
            handleUserMove(index);
        });
    });

    // Reset Game button
    elements.btnRestartGame.addEventListener('click', resetBoard);

    // Difficulty buttons (Hero & switcher)
    elements.diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const diff = btn.getAttribute('data-diff');
            setDifficulty(diff);
        });
    });

    // Modal Action Buttons
    elements.btnModalPlayAgain.addEventListener('click', () => {
        closeModal(elements.resultModal);
        resetBoard();
    });

    elements.btnModalGoRewards.addEventListener('click', () => {
        closeModal(elements.resultModal);
        switchView('rewards');
        const rewardsSec = document.getElementById('rewards');
        if (rewardsSec && window.innerWidth > 768) {
            rewardsSec.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Hero buttons & CTA view switching
    if (elements.btnHeroPlay) {
        elements.btnHeroPlay.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                switchView('game');
                const gameSec = document.getElementById('game');
                if (gameSec) gameSec.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (elements.btnHeroRewards) {
        elements.btnHeroRewards.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                switchView('rewards');
            }
        });
    }

    // Header Live Points Pill -> Opens Rewards Tab
    const headerPointsPill = document.getElementById('headerPointsPill');
    if (headerPointsPill) {
        headerPointsPill.style.cursor = 'pointer';
        headerPointsPill.addEventListener('click', () => {
            switchView('rewards');
        });
    }

    // Nav Logo -> Returns to Game View
    const navLogo = document.getElementById('navLogo');
    if (navLogo) {
        navLogo.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                switchView('game');
            }
        });
    }

    // Reward Redeem Buttons
    REDEEM_REWARDS.forEach(reward => {
        const btn = document.getElementById(`btnRedeem${reward.amount}`);
        if (btn) {
            btn.addEventListener('click', () => promptRedemption(reward));
        }
    });

    // Redeem Modal Actions
    elements.btnExecuteRedeem.addEventListener('click', executeRedemption);
    elements.btnCancelRedeem.addEventListener('click', () => closeModal(elements.confirmRedeemModal));
    elements.btnCloseConfirmModal.addEventListener('click', () => closeModal(elements.confirmRedeemModal));
    elements.btnSuccessClose.addEventListener('click', () => closeModal(elements.successRedeemModal));
    elements.btnCloseSuccessModal.addEventListener('click', () => closeModal(elements.successRedeemModal));

    // Desktop Nav Links
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href')?.replace('#', '');
            if (target && window.innerWidth <= 768) {
                e.preventDefault();
                switchView(target);
            } else {
                elements.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Mobile Bottom Nav Items
    elements.mobNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            switchView(targetTab);
        });
    });

    // Footer In-View Links
    document.querySelectorAll('.footer-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const tab = link.getAttribute('data-tab');
            if (tab) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    switchView(tab);
                }
            }
        });
    });
}

// ============================================================================
// GAME LOGIC & BOARD OPERATIONS
// ============================================================================

function setDifficulty(difficulty) {
    if (!['easy', 'medium', 'hard'].includes(difficulty)) return;
    state.selectedDifficulty = difficulty;

    // Update Difficulty Buttons active state
    elements.diffButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-diff') === difficulty);
    });

    // Update Arena Badge
    const points = DIFFICULTY_POINTS[difficulty];
    const diffUpper = difficulty.toUpperCase();
    if (elements.currentDiffName) {
        elements.currentDiffName.textContent = `${diffUpper} (+${points.toFixed(1)} Pt${points > 1 ? 's' : ''})`;
    }

    if (elements.currentDiffBadge) {
        elements.currentDiffBadge.className = 'current-diff-badge';
        if (difficulty === 'easy') elements.currentDiffBadge.classList.add('badge-diff-easy');
        else if (difficulty === 'medium') elements.currentDiffBadge.classList.add('badge-diff-medium');
        else if (difficulty === 'hard') elements.currentDiffBadge.classList.add('badge-diff-hard');
    }

    resetBoard();
}

function resetBoard() {
    state.board = Array(9).fill('');
    state.currentPlayer = 'X';
    state.isGameActive = true;
    state.isAiTurn = false;

    // Reset cell visuals
    elements.cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
        cell.removeAttribute('disabled');
    });

    updateTurnIndicator();
}

function handleUserMove(index) {
    if (!state.isGameActive || state.isAiTurn || state.board[index] !== '') {
        return;
    }

    // Place Player Move
    makeMove(index, 'X');
    soundFX.playMoveSound(true);

    const winInfo = checkWinner(state.board);
    if (winInfo) {
        handleGameOver('user', winInfo.combination);
        return;
    }

    if (isBoardFull(state.board)) {
        handleGameOver('draw');
        return;
    }

    // Pass turn to AI
    state.isAiTurn = true;
    state.currentPlayer = 'O';
    updateTurnIndicator();

    // AI Bot Thinking Latency (400ms - 750ms for realistic pacing)
    const latency = Math.floor(Math.random() * 350) + 400;
    setTimeout(() => {
        if (!state.isGameActive) return;
        makeAiMove();
    }, latency);
}

function makeMove(index, player) {
    state.board[index] = player;
    const cell = elements.cells[index];
    cell.textContent = player === 'X' ? '✕' : '○';
    cell.classList.add(player === 'X' ? 'cell-x' : 'cell-o');
    cell.setAttribute('disabled', 'true');
}

function updateTurnIndicator() {
    if (!state.isGameActive) {
        elements.playerUserBox.classList.remove('active-turn');
        elements.playerAiBox.classList.remove('active-turn');
        elements.turnIndicator.textContent = 'Game Over';
        return;
    }

    if (state.currentPlayer === 'X') {
        elements.playerUserBox.classList.add('active-turn');
        elements.playerAiBox.classList.remove('active-turn');
        elements.turnIndicator.textContent = 'Your Turn (✕)';
        elements.turnIndicator.style.color = 'var(--cyan)';
    } else {
        elements.playerUserBox.classList.remove('active-turn');
        elements.playerAiBox.classList.add('active-turn');
        elements.turnIndicator.textContent = 'AI Thinking (○)...';
        elements.turnIndicator.style.color = 'var(--magenta)';
    }
}

// ============================================================================
// AI BOT STRATEGY ENGINES (Easy, Medium, Hard Minimax)
// ============================================================================

function makeAiMove() {
    let moveIndex;

    switch (state.selectedDifficulty) {
        case 'easy':
            moveIndex = getEasyAiMove();
            break;
        case 'medium':
            moveIndex = getMediumAiMove();
            break;
        case 'hard':
            moveIndex = getHardAiMove();
            break;
        default:
            moveIndex = getEasyAiMove();
    }

    if (moveIndex !== undefined && moveIndex !== -1) {
        makeMove(moveIndex, 'O');
        soundFX.playMoveSound(false);

        const winInfo = checkWinner(state.board);
        if (winInfo) {
            handleGameOver('ai', winInfo.combination);
            return;
        }

        if (isBoardFull(state.board)) {
            handleGameOver('draw');
            return;
        }

        // Pass turn back to User
        state.isAiTurn = false;
        state.currentPlayer = 'X';
        updateTurnIndicator();
    }
}

// 1. Easy AI: Simple Random Heuristic
function getEasyAiMove() {
    const available = getAvailableIndices(state.board);
    if (available.length === 0) return -1;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
}

// 2. Medium AI: Rule-based Heuristic (Wins if possible, blocks if necessary, otherwise smart move)
function getMediumAiMove() {
    const available = getAvailableIndices(state.board);
    if (available.length === 0) return -1;

    // Check if AI can win on this turn
    for (let idx of available) {
        state.board[idx] = 'O';
        if (checkWinner(state.board)) {
            state.board[idx] = '';
            return idx;
        }
        state.board[idx] = '';
    }

    // Check if User can win on their next turn and block them
    for (let idx of available) {
        state.board[idx] = 'X';
        if (checkWinner(state.board)) {
            state.board[idx] = '';
            return idx;
        }
        state.board[idx] = '';
    }

    // 40% chance of picking optimal move, 60% random
    if (Math.random() > 0.4) {
        // Take center if available
        if (state.board[4] === '') return 4;
        // Take random corner
        const corners = [0, 2, 6, 8].filter(c => state.board[c] === '');
        if (corners.length > 0) {
            return corners[Math.floor(Math.random() * corners.length)];
        }
    }

    return getEasyAiMove();
}

// 3. Hard AI: Unbeatable Minimax Algorithm with Alpha-Beta Pruning
function getHardAiMove() {
    const available = getAvailableIndices(state.board);
    if (available.length === 0) return -1;

    // If whole board is empty, open on corner for speed & variety
    if (available.length === 9) {
        const corners = [0, 2, 6, 8];
        return corners[Math.floor(Math.random() * corners.length)];
    }

    let bestScore = -Infinity;
    let bestMove = available[0];

    for (let idx of available) {
        state.board[idx] = 'O';
        const score = minimax(state.board, 0, false, -Infinity, Infinity);
        state.board[idx] = '';

        if (score > bestScore) {
            bestScore = score;
            bestMove = idx;
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing, alpha, beta) {
    const winInfo = checkWinner(board);
    if (winInfo) {
        return winInfo.winner === 'O' ? (10 - depth) : (depth - 10);
    }
    if (isBoardFull(board)) {
        return 0;
    }

    const available = getAvailableIndices(board);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let idx of available) {
            board[idx] = 'O';
            const evaluation = minimax(board, depth + 1, false, alpha, beta);
            board[idx] = '';
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let idx of available) {
            board[idx] = 'X';
            const evaluation = minimax(board, depth + 1, true, alpha, beta);
            board[idx] = '';
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Helpers
function getAvailableIndices(board) {
    const indices = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') indices.push(i);
    }
    return indices;
}

function isBoardFull(board) {
    return board.every(cell => cell !== '');
}

function checkWinner(board) {
    for (let combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], combination: combo };
        }
    }
    return null;
}

// ============================================================================
// GAME RESULT & POINTS CALCULATION
// ============================================================================

function handleGameOver(result, winningCombination = null) {
    state.isGameActive = false;
    state.stats.totalGames++;

    // Highlight Winning Cells
    if (winningCombination) {
        winningCombination.forEach(idx => {
            elements.cells[idx].classList.add('win-cell');
        });
    }

    let pointsEarned = 0.0;
    const diff = state.selectedDifficulty;
    const diffName = diff.charAt(0).toUpperCase() + diff.slice(1);

    if (result === 'user') {
        pointsEarned = DIFFICULTY_POINTS[diff];
        state.points = Number((state.points + pointsEarned).toFixed(1));
        state.stats.userWins++;

        if (diff === 'easy') state.stats.easyWins++;
        else if (diff === 'medium') state.stats.mediumWins++;
        else if (diff === 'hard') state.stats.hardWins++;

        soundFX.playWinSound();
        if (confetti) confetti.trigger();

        // Modal Presentation
        elements.resultIconBadge.className = 'modal-icon-badge badge-win';
        elements.resultIconBadge.textContent = '🏆';
        elements.resultTitle.textContent = 'You Won!';
        elements.resultSubtitle.textContent = 'Outstanding moves! Your victory points have been credited.';
        elements.resultModalEarned.textContent = `+${pointsEarned.toFixed(1)} Pt${pointsEarned > 1 ? 's' : ''}`;
        elements.resultModalEarned.style.color = 'var(--emerald)';
    } else if (result === 'ai') {
        state.stats.aiWins++;
        soundFX.playLossSound();

        elements.resultIconBadge.className = 'modal-icon-badge badge-lose';
        elements.resultIconBadge.textContent = '🤖';
        elements.resultTitle.textContent = 'AI Won!';
        elements.resultSubtitle.textContent = 'The AI outplayed this round. Try again to claim your points!';
        elements.resultModalEarned.textContent = '0 Pts';
        elements.resultModalEarned.style.color = 'var(--text-muted)';
    } else {
        state.stats.draws++;

        elements.resultIconBadge.className = 'modal-icon-badge badge-draw';
        elements.resultIconBadge.textContent = '🤝';
        elements.resultTitle.textContent = "It's a Draw!";
        elements.resultSubtitle.textContent = 'Evenly matched! No points awarded for draws.';
        elements.resultModalEarned.textContent = '0 Pts';
        elements.resultModalEarned.style.color = 'var(--text-muted)';
    }

    elements.resultModalDiff.textContent = diffName;
    elements.resultModalTotal.textContent = `${state.points.toFixed(1)} Pts`;

    // Save state to Cloud / Local
    saveState();

    // Re-render UI
    renderUI();
    updateTurnIndicator();

    // Show Post-Game Ad Intermission Break (AdSense) before Result Modal
    setTimeout(() => {
        if (window.adsManager && typeof window.adsManager.triggerPostGameAd === 'function') {
            window.adsManager.triggerPostGameAd(() => {
                openModal(elements.resultModal);
                resetBoard();
            });
        } else {
            openModal(elements.resultModal);
            resetBoard();
        }
    }, 600);
}

// ============================================================================
// REWARDS & REDEMPTION SYSTEM (100 Points = ₹1 INR)
// ============================================================================

function promptRedemption(reward) {
    if (state.points < reward.requiredPoints) return;

    state.pendingRedeem = reward;
    elements.confirmRewardName.textContent = `Google Play ₹${reward.amount}`;
    elements.confirmPointsCost.textContent = `-${reward.requiredPoints.toLocaleString()} Pts`;
    const remaining = Math.max(0, state.points - reward.requiredPoints);
    elements.confirmPointsRemaining.textContent = `${remaining.toFixed(1)} Pts`;

    openModal(elements.confirmRedeemModal);
}

async function executeRedemption() {
    if (!state.pendingRedeem) return;
    const reward = state.pendingRedeem;

    if (state.points < reward.requiredPoints) {
        closeModal(elements.confirmRedeemModal);
        return;
    }

    // Deduct points
    state.points = Number((state.points - reward.requiredPoints).toFixed(1));

    // Submit redemption record locally & to Cloud database
    if (window.backendService) {
        await window.backendService.submitRedemption(reward.amount, reward.requiredPoints);
    } else {
        try {
            const history = JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
            history.unshift({
                id: 'rd_' + Date.now(),
                amount: reward.amount,
                points_spent: reward.requiredPoints,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem("tictactoe_redemptions", JSON.stringify(history));
        } catch (e) {
            console.warn("Redemption store error:", e);
        }
    }

    // Save updated user data
    await saveState();

    // Close confirm modal and open success modal
    closeModal(elements.confirmRedeemModal);
    elements.successRewardLabel.textContent = `₹${reward.amount} Google Play Reward`;
    openModal(elements.successRedeemModal);

    state.pendingRedeem = null;
    renderUI();
}

// ============================================================================
// UI RENDERING & SYNCHRONIZATION
// ============================================================================

function renderUI() {
    const formattedPoints = state.points.toFixed(1);
    const cashValue = (state.points / 100).toFixed(2);

    // Points in Header & Hero
    if (elements.headerPointsVal) elements.headerPointsVal.textContent = formattedPoints;
    if (elements.heroPointsDisplay) elements.heroPointsDisplay.textContent = formattedPoints;
    if (elements.heroCashEquiv) elements.heroCashEquiv.innerHTML = `<span>₹${cashValue}</span> Value`;

    // Statistics Section
    if (elements.statTotalPoints) elements.statTotalPoints.textContent = formattedPoints;
    if (elements.statTotalGames) elements.statTotalGames.textContent = state.stats.totalGames;
    if (elements.statUserWins) elements.statUserWins.textContent = state.stats.userWins;
    if (elements.statAiWins) elements.statAiWins.textContent = state.stats.aiWins;
    if (elements.statDraws) elements.statDraws.textContent = state.stats.draws;
    if (elements.statEasyWins) elements.statEasyWins.textContent = state.stats.easyWins;
    if (elements.statMediumWins) elements.statMediumWins.textContent = state.stats.mediumWins;
    if (elements.statHardWins) elements.statHardWins.textContent = state.stats.hardWins;

    // Update Reward Cards (Progress Bar, Status Tag, Button State)
    REDEEM_REWARDS.forEach(reward => {
        const amt = reward.amount;
        const req = reward.requiredPoints;
        const progBar = document.getElementById(`progBar${amt}`);
        const statusTag = document.getElementById(`statusTag${amt}`);
        const btnRedeem = document.getElementById(`btnRedeem${amt}`);

        const percentage = Math.min(100, (state.points / req) * 100);
        if (progBar) progBar.style.width = `${percentage}%`;

        if (state.points >= req) {
            if (statusTag) {
                statusTag.className = 'reward-status-tag status-eligible';
                statusTag.textContent = 'Eligible to Redeem';
            }
            if (btnRedeem) {
                btnRedeem.disabled = false;
            }
        } else {
            if (statusTag) {
                statusTag.className = 'reward-status-tag status-locked';
                statusTag.textContent = 'Points Needed';
            }
            if (btnRedeem) {
                btnRedeem.disabled = true;
            }
        }
    });

    // Render Redemption History
    renderRedemptionHistory();
}

function renderRedemptionHistory() {
    let history = [];
    if (window.backendService) {
        history = window.backendService.getRedemptionHistory();
    } else {
        try {
            history = JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
        } catch (e) {
            history = [];
        }
    }

    if (!elements.redemptionHistoryList) return;

    if (!history || history.length === 0) {
        elements.redemptionHistoryList.innerHTML = `
            <li class="history-empty">No redemptions submitted yet. Earn points and redeem your first reward!</li>
        `;
        return;
    }

    elements.redemptionHistoryList.innerHTML = history.slice(0, 10).map(item => {
        const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const pts = item.points_spent || item.required_points || 0;
        return `
            <li class="history-item">
                <div class="history-item-left">
                    <span style="font-size: 1.1rem;">🎁</span>
                    <div>
                        <strong>₹${item.amount} Google Play Card</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${dateStr} • ${pts.toLocaleString()} Pts</div>
                    </div>
                </div>
                <span class="history-badge">Under Processing</span>
            </li>
        `;
    }).join('');
}

// Modal Helpers
function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
}

function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
}

// ============================================================================
// CONTACT FORM & FAQ CONTROLLERS
// ============================================================================
window.handleContactSubmit = function() {
    const name = document.getElementById('contactName')?.value.trim();
    const email = document.getElementById('contactEmail')?.value.trim();
    const subject = document.getElementById('contactSubject')?.value.trim();
    const message = document.getElementById('contactMessage')?.value.trim();
    const alertBox = document.getElementById('contactFormAlert');
    const submitBtn = document.getElementById('btnSubmitContact');

    if (!name || !email || !subject || !message) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
            alertBox.style.color = '#fca5a5';
            alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            alertBox.innerHTML = '⚠️ Please complete all required fields.';
        }
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = 'rgba(16, 185, 129, 0.15)';
        alertBox.style.color = '#6ee7b7';
        alertBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        alertBox.innerHTML = `✅ Thank you, <strong>${name}</strong>! Your message regarding "<em>${subject}</em>" has been received. Our team will email you at <strong>${email}</strong> within 24 hours.`;
    }

    // Reset form
    document.getElementById('contactForm')?.reset();
    setTimeout(() => {
        if (submitBtn) submitBtn.disabled = false;
    }, 2000);
};

function initLegalAndInfoListeners() {
    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // Privacy Policy Modal
    const privacyModal = document.getElementById('privacyModal');
    const btnPrivacy = document.getElementById('footerBtnPrivacy');
    const btnClosePrivacy = document.getElementById('btnClosePrivacyModal');
    const btnAcceptPrivacy = document.getElementById('btnAcceptPrivacy');

    if (btnPrivacy) btnPrivacy.addEventListener('click', () => openModal(privacyModal));
    if (btnClosePrivacy) btnClosePrivacy.addEventListener('click', () => closeModal(privacyModal));
    if (btnAcceptPrivacy) btnAcceptPrivacy.addEventListener('click', () => closeModal(privacyModal));

    // Terms of Service Modal
    const termsModal = document.getElementById('termsModal');
    const btnTerms = document.getElementById('footerBtnTerms');
    const btnFairPlay = document.getElementById('footerBtnFairPlay');
    const btnCloseTerms = document.getElementById('btnCloseTermsModal');
    const btnAcceptTerms = document.getElementById('btnAcceptTerms');

    if (btnTerms) btnTerms.addEventListener('click', () => openModal(termsModal));
    if (btnFairPlay) btnFairPlay.addEventListener('click', () => openModal(termsModal));
    if (btnCloseTerms) btnCloseTerms.addEventListener('click', () => closeModal(termsModal));
    if (btnAcceptTerms) btnAcceptTerms.addEventListener('click', () => closeModal(termsModal));

    // Close on backdrop click for legal & auth modals
    [privacyModal, termsModal, elements.authModal].forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) closeModal(m);
            });
        }
    });
}

// ============================================================================
// START APPLICATION
// ============================================================================
document.addEventListener('DOMContentLoaded', initGame);
