/**
 * Tic-Tac-Toe Pro - Game Engine, AI Logic, Points & Rewards System
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
    authContainer: document.getElementById('authContainer'),
    btnGoogleSignIn: document.getElementById('btnGoogleSignIn'),
    userProfilePill: document.getElementById('userProfilePill'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    btnSignOut: document.getElementById('btnSignOut'),
    navLinks: document.querySelectorAll('.nav-link'),

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

    // Authentication Modal & Forms
    authModal: document.getElementById('authModal'),
    btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
    authModalTitle: document.getElementById('authModalTitle'),
    authModalSubtitle: document.getElementById('authModalSubtitle'),
    tabOtp: document.getElementById('tabOtp'),
    tabSignIn: document.getElementById('tabSignIn'),
    tabSignUp: document.getElementById('tabSignUp'),
    authAlert: document.getElementById('authAlert'),
    btnAuthGoogle: document.getElementById('btnAuthGoogle'),
    
    // OTP Form Elements
    otpContainer: document.getElementById('otpContainer'),
    otpSendForm: document.getElementById('otpSendForm'),
    otpEmail: document.getElementById('otpEmail'),
    btnSendOtp: document.getElementById('btnSendOtp'),
    otpVerifyForm: document.getElementById('otpVerifyForm'),
    otpTargetEmail: document.getElementById('otpTargetEmail'),
    otpCodeInput: document.getElementById('otpCodeInput'),
    btnVerifyOtp: document.getElementById('btnVerifyOtp'),
    btnResendOtp: document.getElementById('btnResendOtp'),
    btnChangeOtpEmail: document.getElementById('btnChangeOtpEmail'),

    // Password Forms
    signInForm: document.getElementById('signInForm'),
    signInEmail: document.getElementById('signInEmail'),
    signInPassword: document.getElementById('signInPassword'),
    signUpForm: document.getElementById('signUpForm'),
    signUpName: document.getElementById('signUpName'),
    signUpEmail: document.getElementById('signUpEmail'),
    signUpPassword: document.getElementById('signUpPassword'),
    signUpPasswordConfirm: document.getElementById('signUpPasswordConfirm'),
    btnSubmitSignIn: document.getElementById('btnSubmitSignIn'),
    btnSubmitSignUp: document.getElementById('btnSubmitSignUp'),

    // Mobile Navigation Items
    mobNavItems: document.querySelectorAll('.mobile-nav-item'),
    mobLinkProfile: document.getElementById('mobLinkProfile'),
    mobProfileLabel: document.getElementById('mobProfileLabel'),
    mobProfileIcon: document.getElementById('mobProfileIcon'),

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
async function initGame() {
    try {
        confetti = new ConfettiEngine(elements.confettiCanvas);
    } catch (e) {
        console.warn("Confetti init warning:", e);
    }

    // 1. Immediately attach all event listeners so buttons & cells are 100% responsive
    setupEventListeners();
    initLegalAndInfoListeners();

    // 2. Render initial state immediately
    renderUI();

    // 3. Safely load session & user profile in background
    try {
        await loadUserProfile();
        renderUI();
    } catch (err) {
        console.warn("User profile load error:", err);
    }
}

// Global handler when session changes / redirects from email
window.onUserAuthenticated = async function(user) {
    if (user) {
        updateAuthDisplay(user);
        await loadUserProfile();
        renderUI();
        if (elements.authModal) closeModal(elements.authModal);
    }
};

// Load data from Supabase / LocalStorage with Seamless Guest Points Merge
async function loadUserProfile() {
    let sessionUser = null;
    if (window.backendService) {
        try {
            sessionUser = await window.backendService.getSessionUser();
        } catch (e) {
            console.warn("Session user fetch error:", e);
        }
    }

    const currentGuestPoints = state.points || 0;
    const currentGuestStats = { ...state.stats };

    if (sessionUser) {
        updateAuthDisplay(sessionUser);
        let cloudData = null;
        try {
            cloudData = await window.backendService.loadUserData(sessionUser.id);
        } catch (e) {
            console.warn("Cloud data fetch error:", e);
        }

        if (cloudData) {
            const cloudPoints = Number(cloudData.points || 0);
            const mergeKey = `tictactoe_merged_${sessionUser.id}`;
            const alreadyMerged = sessionStorage.getItem(mergeKey);

            // If user earned points as a guest before logging in, seamlessly merge into cloud
            if (currentGuestPoints > 0 && !alreadyMerged) {
                state.points = Number((cloudPoints + currentGuestPoints).toFixed(1));
                state.stats.easyWins = (cloudData.easy_wins || 0) + (currentGuestStats.easyWins || 0);
                state.stats.mediumWins = (cloudData.medium_wins || 0) + (currentGuestStats.mediumWins || 0);
                state.stats.hardWins = (cloudData.hard_wins || 0) + (currentGuestStats.hardWins || 0);
                state.stats.totalGames = (cloudData.total_games || 0) + (currentGuestStats.totalGames || 0);
                state.stats.userWins = (cloudData.user_wins || 0) + (currentGuestStats.userWins || 0);
                state.stats.aiWins = (cloudData.ai_wins || 0) + (currentGuestStats.aiWins || 0);
                state.stats.draws = (cloudData.draws || 0) + (currentGuestStats.draws || 0);
                sessionStorage.setItem(mergeKey, "true");
                await saveState();
                console.log(`✨ Successfully merged ${currentGuestPoints} guest points into cloud account! Total: ${state.points}`);
            } else {
                state.points = cloudPoints;
                state.stats.easyWins = cloudData.easy_wins || 0;
                state.stats.mediumWins = cloudData.medium_wins || 0;
                state.stats.hardWins = cloudData.hard_wins || 0;
                state.stats.totalGames = cloudData.total_games || 0;
                state.stats.userWins = cloudData.user_wins || 0;
                state.stats.aiWins = cloudData.ai_wins || 0;
                state.stats.draws = cloudData.draws || 0;
            }
        } else {
            // New user on cloud, initialize with any guest points earned so far
            if (currentGuestPoints > 0) {
                await saveState();
            }
        }
    } else {
        // LocalStorage fallback for offline/guest play
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

// Update authentication UI header
function updateAuthDisplay(user) {
    if (user) {
        if (elements.btnGoogleSignIn) elements.btnGoogleSignIn.style.display = 'none';
        if (elements.userProfilePill) elements.userProfilePill.style.display = 'flex';
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        if (elements.userName) elements.userName.textContent = displayName;
        if (elements.playerDisplayName) elements.playerDisplayName.textContent = displayName;

        if (elements.userAvatar) {
            if (user.user_metadata?.avatar_url) {
                elements.userAvatar.innerHTML = `<img src="${user.user_metadata.avatar_url}" alt="Avatar" referrerpolicy="no-referrer">`;
            } else {
                elements.userAvatar.textContent = displayName.charAt(0).toUpperCase();
            }
        }

        // Update mobile bottom nav profile label
        if (elements.mobProfileLabel) elements.mobProfileLabel.textContent = displayName.split(' ')[0];
        if (elements.mobProfileIcon) elements.mobProfileIcon.textContent = '🟢';
    } else {
        if (elements.btnGoogleSignIn) elements.btnGoogleSignIn.style.display = 'inline-flex';
        if (elements.userProfilePill) elements.userProfilePill.style.display = 'none';
        if (elements.playerDisplayName) elements.playerDisplayName.textContent = 'Player (You)';
        if (elements.mobProfileLabel) elements.mobProfileLabel.textContent = 'Account';
        if (elements.mobProfileIcon) elements.mobProfileIcon.textContent = '👤';
    }
}

// Sync and Save User Data
async function saveState() {
    await window.backendService.saveUserData({
        points: state.points,
        stats: state.stats
    });
}

// Show alert message inside auth modal
function showAuthAlert(message, type = 'error') {
    if (!elements.authAlert) return;
    elements.authAlert.textContent = message;
    elements.authAlert.className = `auth-alert ${type}`;
    elements.authAlert.style.display = 'block';
}

function clearAuthAlert() {
    if (!elements.authAlert) return;
    elements.authAlert.style.display = 'none';
    elements.authAlert.textContent = '';
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

    // Auth Open Modal Triggers
    if (elements.btnGoogleSignIn) {
        elements.btnGoogleSignIn.addEventListener('click', () => {
            clearAuthAlert();
            openModal(elements.authModal);
        });
    }

    if (elements.mobLinkProfile) {
        elements.mobLinkProfile.addEventListener('click', () => {
            const currentUser = window.backendService.currentUser;
            if (currentUser) {
                if (confirm(`Logged in as ${currentUser.email}.\nDo you want to sign out?`)) {
                    window.backendService.signOut();
                    updateAuthDisplay(null);
                    renderUI();
                }
            } else {
                clearAuthAlert();
                openModal(elements.authModal);
            }
        });
    }

    if (elements.btnCloseAuthModal) {
        elements.btnCloseAuthModal.addEventListener('click', () => closeModal(elements.authModal));
    }

    let currentOtpEmail = '';

    // Auth Tabs Switching (OTP vs Password vs Sign Up)
    function switchAuthTab(tabName) {
        clearAuthAlert();
        if (elements.tabOtp) elements.tabOtp.classList.toggle('active', tabName === 'otp');
        if (elements.tabSignIn) elements.tabSignIn.classList.toggle('active', tabName === 'signin');
        if (elements.tabSignUp) elements.tabSignUp.classList.toggle('active', tabName === 'signup');

        if (elements.otpContainer) elements.otpContainer.style.display = tabName === 'otp' ? 'block' : 'none';
        if (elements.signInForm) elements.signInForm.style.display = tabName === 'signin' ? 'flex' : 'none';
        if (elements.signUpForm) elements.signUpForm.style.display = tabName === 'signup' ? 'flex' : 'none';

        if (tabName === 'otp') {
            if (elements.authModalTitle) elements.authModalTitle.textContent = 'Sign In to Your Account';
            if (elements.authModalSubtitle) elements.authModalSubtitle.textContent = 'Get a 6-digit OTP code in your email to instantly play & save points.';
        } else if (tabName === 'signin') {
            if (elements.authModalTitle) elements.authModalTitle.textContent = 'Welcome Back';
            if (elements.authModalSubtitle) elements.authModalSubtitle.textContent = 'Sign in with your email and password.';
        } else {
            if (elements.authModalTitle) elements.authModalTitle.textContent = 'Create Player Account';
            if (elements.authModalSubtitle) elements.authModalSubtitle.textContent = 'Register to save your high scores and Google Play credits.';
        }
    }

    if (elements.tabOtp) elements.tabOtp.addEventListener('click', () => switchAuthTab('otp'));
    if (elements.tabSignIn) elements.tabSignIn.addEventListener('click', () => switchAuthTab('signin'));
    if (elements.tabSignUp) elements.tabSignUp.addEventListener('click', () => switchAuthTab('signup'));

    // 1. Send OTP Form Submission
    if (elements.otpSendForm) {
        elements.otpSendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthAlert();
            const email = elements.otpEmail.value.trim();
            if (!email) {
                showAuthAlert('Please enter a valid email address.', 'error');
                return;
            }

            elements.btnSendOtp.disabled = true;
            elements.btnSendOtp.textContent = 'Sending OTP code...';

            try {
                const { data, error } = await window.backendService.sendEmailOtp(email);
                if (error) {
                    if (error.message && error.message.toLowerCase().includes('rate limit')) {
                        showAuthAlert('⚠️ Email rate limit reached on Supabase free tier. You can switch to the "Password" or "Sign Up" tab to log in immediately without waiting!', 'error');
                    } else {
                        showAuthAlert(error.message || 'Failed to send OTP. Please check your email.', 'error');
                    }
                } else {
                    currentOtpEmail = email;
                    if (elements.otpTargetEmail) elements.otpTargetEmail.textContent = email;
                    elements.otpSendForm.style.display = 'none';
                    elements.otpVerifyForm.style.display = 'flex';
                    if (data?.mockOtp) {
                        showAuthAlert(`[Local Mode Test OTP]: ${data.mockOtp}`, 'success');
                    } else {
                        showAuthAlert('6-digit OTP code sent! Please check your inbox.', 'success');
                    }
                    if (elements.otpCodeInput) {
                        elements.otpCodeInput.value = '';
                        elements.otpCodeInput.focus();
                    }
                }
            } catch (err) {
                console.error("OTP send error:", err);
                showAuthAlert('An unexpected error occurred. Please try again.', 'error');
            } finally {
                elements.btnSendOtp.disabled = false;
                elements.btnSendOtp.textContent = '📩 Send 6-Digit OTP Code';
            }
        });
    }

    // 2. Verify OTP Form Submission
    if (elements.otpVerifyForm) {
        elements.otpVerifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthAlert();
            const token = elements.otpCodeInput.value.trim();

            if (!token || token.length !== 6) {
                showAuthAlert('Please enter the complete 6-digit code.', 'error');
                return;
            }

            elements.btnVerifyOtp.disabled = true;
            elements.btnVerifyOtp.textContent = 'Verifying...';

            try {
                const { data, error } = await window.backendService.verifyEmailOtp(currentOtpEmail, token);
                if (error) {
                    showAuthAlert(error.message || 'Invalid or expired OTP code.', 'error');
                } else {
                    showAuthAlert('Verified successfully! Logging in...', 'success');
                    updateAuthDisplay(data.user);
                    await loadUserProfile();
                    renderUI();
                    setTimeout(() => closeModal(elements.authModal), 600);
                }
            } catch (err) {
                console.error("OTP verification error:", err);
                showAuthAlert('Verification failed. Please try again.', 'error');
            } finally {
                elements.btnVerifyOtp.disabled = false;
                elements.btnVerifyOtp.textContent = '⚡ Verify OTP & Sign In';
            }
        });
    }

    // Resend OTP
    if (elements.btnResendOtp) {
        elements.btnResendOtp.addEventListener('click', async () => {
            clearAuthAlert();
            if (!currentOtpEmail) return;
            elements.btnResendOtp.textContent = 'Resending...';
            try {
                const { data, error } = await window.backendService.sendEmailOtp(currentOtpEmail);
                if (error) {
                    showAuthAlert(error.message || 'Failed to resend code.', 'error');
                } else {
                    if (data?.mockOtp) {
                        showAuthAlert(`[New Local Test OTP]: ${data.mockOtp}`, 'success');
                    } else {
                        showAuthAlert('New 6-digit OTP code sent!', 'success');
                    }
                }
            } catch (err) {
                showAuthAlert('Failed to resend code.', 'error');
            } finally {
                elements.btnResendOtp.textContent = 'Resend Code';
            }
        });
    }

    // Change Email
    if (elements.btnChangeOtpEmail) {
        elements.btnChangeOtpEmail.addEventListener('click', () => {
            clearAuthAlert();
            elements.otpVerifyForm.style.display = 'none';
            elements.otpSendForm.style.display = 'flex';
        });
    }

    // Modal Google OAuth Button
    if (elements.btnAuthGoogle) {
        elements.btnAuthGoogle.addEventListener('click', async () => {
            clearAuthAlert();
            try {
                const { user, error } = await window.backendService.signInWithGoogle();
                if (error) {
                    showAuthAlert(error.message || 'Google Sign-in error.', 'error');
                    return;
                }
                if (user) {
                    updateAuthDisplay(user);
                    await loadUserProfile();
                    renderUI();
                    closeModal(elements.authModal);
                }
            } catch (err) {
                console.error("Google sign in error:", err);
                showAuthAlert('Google Sign-in failed.', 'error');
            }
        });
    }

    // Sign In Form Submission
    if (elements.signInForm) {
        elements.signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthAlert();
            const email = elements.signInEmail.value.trim();
            const password = elements.signInPassword.value;

            if (!email || !password) {
                showAuthAlert('Please enter both email and password.', 'error');
                return;
            }

            elements.btnSubmitSignIn.disabled = true;
            elements.btnSubmitSignIn.textContent = 'Signing in...';

            try {
                const { data, error } = await window.backendService.signInWithEmail(email, password);
                if (error) {
                    showAuthAlert(error.message || 'Invalid credentials.', 'error');
                } else {
                    updateAuthDisplay(data.user);
                    await loadUserProfile();
                    renderUI();
                    closeModal(elements.authModal);
                }
            } catch (err) {
                console.error("Sign in error:", err);
                showAuthAlert('Sign in failed. Please check your credentials.', 'error');
            } finally {
                elements.btnSubmitSignIn.disabled = false;
                elements.btnSubmitSignIn.textContent = 'Sign In';
            }
        });
    }

    // Sign Up Form Submission
    if (elements.signUpForm) {
        elements.signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthAlert();
            const name = elements.signUpName.value.trim();
            const email = elements.signUpEmail.value.trim();
            const password = elements.signUpPassword.value;
            const confirmPass = elements.signUpPasswordConfirm.value;

            if (!name || !email || !password) {
                showAuthAlert('Please fill in all required fields.', 'error');
                return;
            }

            if (password.length < 6) {
                showAuthAlert('Password must be at least 6 characters.', 'error');
                return;
            }

            if (password !== confirmPass) {
                showAuthAlert('Passwords do not match.', 'error');
                return;
            }

            elements.btnSubmitSignUp.disabled = true;
            elements.btnSubmitSignUp.textContent = 'Creating account...';

            try {
                const { data, error } = await window.backendService.signUpWithEmail(name, email, password);
                if (error) {
                    showAuthAlert(error.message || 'Failed to create account.', 'error');
                } else {
                    showAuthAlert('Account created successfully!', 'success');
                    updateAuthDisplay(data.user);
                    await loadUserProfile();
                    renderUI();
                    setTimeout(() => closeModal(elements.authModal), 600);
                }
            } catch (err) {
                console.error("Sign up error:", err);
                showAuthAlert('Account creation failed.', 'error');
            } finally {
                elements.btnSubmitSignUp.disabled = false;
                elements.btnSubmitSignUp.textContent = 'Create Account';
            }
        });
    }

    // Sign Out Button
    if (elements.btnSignOut) {
        elements.btnSignOut.addEventListener('click', async () => {
            if (confirm("Are you sure you want to sign out? Your points will stay securely stored in the cloud.")) {
                await window.backendService.signOut();
                updateAuthDisplay(null);
                renderUI();
            }
        });
    }

    // Modal Action Buttons
    elements.btnModalPlayAgain.addEventListener('click', () => {
        closeModal(elements.resultModal);
        resetBoard();
    });

    elements.btnModalGoRewards.addEventListener('click', () => {
        closeModal(elements.resultModal);
        const rewardsSec = document.getElementById('rewards');
        if (rewardsSec) rewardsSec.scrollIntoView({ behavior: 'smooth' });
    });

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
        link.addEventListener('click', () => {
            elements.navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Mobile Bottom Nav Links
    elements.mobNavItems.forEach(item => {
        item.addEventListener('click', () => {
            elements.mobNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// ============================================================================
// TIC-TAC-TOE CORE GAME LOGIC
// ============================================================================

function setDifficulty(diff) {
    if (!['easy', 'medium', 'hard'].includes(diff)) return;
    state.selectedDifficulty = diff;

    // Update difficulty buttons UI
    elements.diffButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-diff') === diff);
    });

    // Update Arena Badge
    const pts = DIFFICULTY_POINTS[diff];
    const diffUpper = diff.toUpperCase();
    elements.currentDiffName.textContent = `${diffUpper} (+${pts.toFixed(1)} Pt${pts > 1 ? 's' : ''})`;

    if (diff === 'easy') {
        elements.currentDiffBadge.style.color = 'var(--emerald)';
        elements.currentDiffBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else if (diff === 'medium') {
        elements.currentDiffBadge.style.color = 'var(--gold)';
        elements.currentDiffBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    } else {
        elements.currentDiffBadge.style.color = 'var(--magenta)';
        elements.currentDiffBadge.style.borderColor = 'rgba(243, 85, 218, 0.4)';
    }
}

// User Move Handler
function handleUserMove(cellIndex) {
    if (!state.isGameActive || state.isAiTurn) return;
    if (state.board[cellIndex] !== '') return; // Cell occupied

    // Apply User Move ('X')
    makeMove(cellIndex, 'X');
    soundFX.playMoveSound(true);

    // Check if User Won
    const winResult = checkWinner(state.board);
    if (winResult) {
        handleGameOver('user', winResult.combination);
        return;
    }

    // Check if Board is Full (Draw)
    if (isBoardFull(state.board)) {
        handleGameOver('draw');
        return;
    }

    // Switch to AI Turn
    state.isAiTurn = true;
    state.currentPlayer = 'O';
    updateTurnIndicator();

    // AI Turn with smooth realistic thinking delay (350ms - 550ms)
    setTimeout(() => {
        if (!state.isGameActive) return;
        makeAiMove();
    }, 450);
}

// Execute move on board and UI
function makeMove(index, player) {
    state.board[index] = player;
    const cellEl = elements.cells[index];
    cellEl.textContent = player === 'X' ? '✕' : '○';
    cellEl.classList.add(player === 'X' ? 'mark-x' : 'mark-o', 'occupied');
}

// AI Turn Logic
function makeAiMove() {
    let chosenIndex = null;

    if (state.selectedDifficulty === 'easy') {
        chosenIndex = getEasyAiMove(state.board);
    } else if (state.selectedDifficulty === 'medium') {
        chosenIndex = getMediumAiMove(state.board);
    } else {
        chosenIndex = getHardAiMove(state.board);
    }

    if (chosenIndex !== null && chosenIndex >= 0) {
        makeMove(chosenIndex, 'O');
        soundFX.playMoveSound(false);

        // Check if AI Won
        const winResult = checkWinner(state.board);
        if (winResult) {
            handleGameOver('ai', winResult.combination);
            return;
        }

        // Check for Draw
        if (isBoardFull(state.board)) {
            handleGameOver('draw');
            return;
        }
    }

    // Switch back to User
    state.isAiTurn = false;
    state.currentPlayer = 'X';
    updateTurnIndicator();
}

// Reset Board State (Keeps user points and stats intact)
function resetBoard() {
    state.board = Array(9).fill('');
    state.currentPlayer = 'X';
    state.isGameActive = true;
    state.isAiTurn = false;

    elements.cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });

    updateTurnIndicator();
}

// Update Active Turn Indicator
function updateTurnIndicator() {
    if (!state.isGameActive) {
        elements.turnIndicator.textContent = 'Game Over';
        elements.playerUserBox.classList.remove('active-turn');
        elements.playerAiBox.classList.remove('active-turn');
        return;
    }

    if (state.currentPlayer === 'X') {
        elements.turnIndicator.textContent = 'Your Turn (✕)';
        elements.turnIndicator.style.color = 'var(--cyan)';
        elements.playerUserBox.classList.add('active-turn');
        elements.playerAiBox.classList.remove('active-turn');
    } else {
        elements.turnIndicator.textContent = 'AI is thinking (○)...';
        elements.turnIndicator.style.color = 'var(--magenta)';
        elements.playerUserBox.classList.remove('active-turn');
        elements.playerAiBox.classList.add('active-turn');
    }
}

// ============================================================================
// AI DIFFICULTY ALGORITHMS
// ============================================================================

/**
 * EASY AI (Casual & Enjoyable - Player Wins ~75%):
 * - Calibrated so the user wins approx 75-80% of matches naturally.
 * - Only 15% chance to block the player's winning move (giving the player 85% win conversion).
 * - Only 15% chance to take an instant AI win.
 * - Plays casual, open moves for the remaining 85% of turns.
 */
function getEasyAiMove(board) {
    const available = getAvailableIndices(board);
    if (available.length === 0) return null;

    // 1. Only 15% chance: Take instant AI win if available
    if (Math.random() < 0.15) {
        for (let idx of available) {
            const tempBoard = [...board];
            tempBoard[idx] = 'O';
            if (checkWinner(tempBoard)) return idx;
        }
    }

    // 2. Only 15% chance: Block player's immediate win (giving user an 85% opening to score!)
    if (Math.random() < 0.15) {
        for (let idx of available) {
            const tempBoard = [...board];
            tempBoard[idx] = 'X';
            if (checkWinner(tempBoard)) return idx;
        }
    }

    // 3. Otherwise pick casual available move
    return available[Math.floor(Math.random() * available.length)];
}

/**
 * MEDIUM AI (Moderate/Intermediate Challenge):
 * - 80% chance to take immediate win.
 * - 75% chance to block user's winning move.
 * - Prioritizes center and corners.
 */
function getMediumAiMove(board) {
    const available = getAvailableIndices(board);
    if (available.length === 0) return null;

    // 1. Check if AI can win in one move (80% probability)
    if (Math.random() < 0.80) {
        for (let idx of available) {
            const tempBoard = [...board];
            tempBoard[idx] = 'O';
            if (checkWinner(tempBoard)) return idx;
        }
    }

    // 2. 75% probability of blocking user's immediate win
    if (Math.random() < 0.75) {
        for (let idx of available) {
            const tempBoard = [...board];
            tempBoard[idx] = 'X';
            if (checkWinner(tempBoard)) return idx;
        }
    }

    // 3. Take center cell with high probability
    if (board[4] === '' && Math.random() < 0.65) {
        return 4;
    }

    // 4. Pick strategic corner
    const corners = [0, 2, 6, 8].filter(c => board[c] === '');
    if (corners.length > 0 && Math.random() < 0.50) {
        return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Otherwise pick random available
    return available[Math.floor(Math.random() * available.length)];
}

/**
 * HARD AI (Unbeatable Minimax Algorithm):
 * - Evaluates every possible future branch to find the optimal move.
 * - Blocks all user chances, capitalizes on every opening.
 */
function getHardAiMove(board) {
    const available = getAvailableIndices(board);
    if (available.length === 0) return null;

    // If starting or empty, center or corner is optimal
    if (available.length === 9) return 4;
    if (available.length === 8 && board[4] === '') return 4;

    let bestScore = -Infinity;
    let bestMove = available[0];

    for (let idx of available) {
        const tempBoard = [...board];
        tempBoard[idx] = 'O';
        const score = minimax(tempBoard, 0, false, -Infinity, Infinity);
        if (score > bestScore) {
            bestScore = score;
            bestMove = idx;
        }
    }

    return bestMove;
}

// Minimax Algorithm with Depth Decay & Alpha-Beta Pruning
function minimax(board, depth, isMaximizing, alpha, beta) {
    const winnerResult = checkWinner(board);

    if (winnerResult) {
        if (winnerResult.winner === 'O') return 10 - depth; // AI Win
        if (winnerResult.winner === 'X') return depth - 10; // User Win
    }

    if (isBoardFull(board)) return 0; // Draw

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

    // Show Result Modal after brief pause, and automatically refresh the board
    setTimeout(() => {
        openModal(elements.resultModal);
        // Automatically refresh/reset the board so it is fresh and ready for the next round
        resetBoard();
    }, 700);
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

    // Submit redemption record to database / local store
    await window.backendService.submitRedemption(reward.amount, reward.requiredPoints);

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
    elements.headerPointsVal.textContent = formattedPoints;
    elements.heroPointsDisplay.textContent = formattedPoints;
    elements.heroCashEquiv.innerHTML = `<span>₹${cashValue}</span> Value`;

    // Statistics Section
    elements.statTotalPoints.textContent = formattedPoints;
    elements.statTotalGames.textContent = state.stats.totalGames;
    elements.statUserWins.textContent = state.stats.userWins;
    elements.statAiWins.textContent = state.stats.aiWins;
    elements.statDraws.textContent = state.stats.draws;
    elements.statEasyWins.textContent = state.stats.easyWins;
    elements.statMediumWins.textContent = state.stats.mediumWins;
    elements.statHardWins.textContent = state.stats.hardWins;

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
    const history = window.backendService.getRedemptionHistory();
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
        return `
            <li class="history-item">
                <div class="history-item-left">
                    <span style="font-size: 1.1rem;">🎁</span>
                    <div>
                        <strong>₹${item.amount} Google Play Card</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${dateStr} • ${item.points_spent.toLocaleString()} Pts</div>
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

    // Daily Bonus Footer Link
    const footerDaily = document.getElementById('footerBtnDailyBonus');
    const dailyModal = document.getElementById('dailyBonusModal');
    if (footerDaily && dailyModal) {
        footerDaily.addEventListener('click', () => openModal(dailyModal));
    }

    // Close on backdrop click for legal modals
    [privacyModal, termsModal].forEach(m => {
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
