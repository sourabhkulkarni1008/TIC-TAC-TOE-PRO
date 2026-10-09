/**
 * Supabase & Cloud Backend Client for Tic-Tac-Toe Pro (v5.0)
 * Architecture:
 * - Dual Engine: Supabase JS Client v2 + Zero-Dependency REST API Fallback
 * - Render Node.js Backend API Integration (https://tic-tac-toe-pro-o2km.onrender.com)
 * - Persistent Cloud Sessions & Offline-First Local Storage Fallback
 * - Real-time Wallet Points & Leaderboard Sync
 */

const SUPABASE_CONFIG = {
    url: "https://pwbokhuhhvjllunmotlf.supabase.co",
    anonKey: "sb_publishable_8Mz4FDbiPVCuroGHObMAhA_qbZDOOet"
};

const RENDER_BACKEND_URL = "https://tic-tac-toe-pro-o2km.onrender.com";

class BackendService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.sessionToken = null;
        this.isSyncing = false;
        this.authListeners = [];
        this.isReady = false;

        this.init();
    }

    async init() {
        // 1. Try to initialize Supabase JS SDK if available
        this.initSupabaseSDK();

        // 2. If SDK not yet loaded, wait and retry or load CDN dynamically
        if (!this.supabase) {
            await this.ensureSupabaseLoaded();
        }

        // 3. Restore persisted session (from SDK or LocalStorage)
        await this.restoreSession();

        this.isReady = true;
        console.log("🚀 BackendService initialized. Database ready:", !!this.supabase || !!this.sessionToken);
    }

    initSupabaseSDK() {
        try {
            const supabaseLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
            if (supabaseLib && typeof supabaseLib.createClient === 'function') {
                this.supabase = supabaseLib.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: false
                    }
                });

                this.supabase.auth.onAuthStateChange((event, session) => {
                    this.currentUser = session?.user || null;
                    this.sessionToken = session?.access_token || null;
                    if (this.currentUser) {
                        localStorage.setItem("tictactoe_session_user", JSON.stringify(this.currentUser));
                        if (this.sessionToken) localStorage.setItem("tictactoe_session_token", this.sessionToken);
                    } else {
                        localStorage.removeItem("tictactoe_session_user");
                        localStorage.removeItem("tictactoe_session_token");
                    }
                    console.log(`🔐 Auth Event: ${event} | User: ${this.currentUser?.email || 'Guest'}`);
                    this.notifyAuthListeners(this.currentUser);
                });
                return true;
            }
        } catch (e) {
            console.warn("Supabase SDK init notice:", e);
        }
        return false;
    }

    async ensureSupabaseLoaded() {
        if (this.supabase) return true;

        return new Promise((resolve) => {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (this.initSupabaseSDK() || attempts > 15) {
                    clearInterval(interval);
                    resolve(!!this.supabase);
                }
            }, 200);
        });
    }

    async restoreSession() {
        if (this.supabase) {
            try {
                const { data: { session } } = await this.supabase.auth.getSession();
                if (session && session.user) {
                    this.currentUser = session.user;
                    this.sessionToken = session.access_token;
                    this.notifyAuthListeners(this.currentUser);
                    return this.currentUser;
                }
            } catch (e) {
                console.warn("SDK session restore check:", e);
            }
        }

        // Fallback: restore from localStorage
        try {
            const savedUser = localStorage.getItem("tictactoe_session_user");
            const savedToken = localStorage.getItem("tictactoe_session_token");
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.sessionToken = savedToken || null;
                this.notifyAuthListeners(this.currentUser);
                return this.currentUser;
            }
        } catch (e) {
            console.warn("LocalStorage session restore check:", e);
        }

        this.currentUser = null;
        this.notifyAuthListeners(null);
        return null;
    }

    onAuthChange(callback) {
        if (typeof callback === 'function') {
            this.authListeners.push(callback);
            callback(this.currentUser);
        }
    }

    notifyAuthListeners(user) {
        this.authListeners.forEach(cb => {
            try { cb(user); } catch (e) { console.error(e); }
        });
    }

    // -------------------------------------------------------------
    // AUTHENTICATION: Direct SignUp (Create Account)
    // -------------------------------------------------------------
    async signUp(email, password) {
        const cleanEmail = email.trim().toLowerCase();

        // Strategy A: Via Supabase SDK
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase.auth.signUp({
                    email: cleanEmail,
                    password: password
                });

                if (error) {
                    // Check if already registered
                    if (error.message.includes("User already registered")) {
                        throw new Error("This email is already registered. Please click 'Sign In' instead.");
                    }
                    throw error;
                }

                if (data?.user) {
                    this.currentUser = data.user;
                    this.sessionToken = data.session?.access_token || null;
                    localStorage.setItem("tictactoe_session_user", JSON.stringify(this.currentUser));
                    if (this.sessionToken) localStorage.setItem("tictactoe_session_token", this.sessionToken);
                    this.notifyAuthListeners(this.currentUser);
                    return { user: this.currentUser, session: data.session };
                }
            } catch (sdkError) {
                if (sdkError.message && (sdkError.message.includes("already registered") || sdkError.message.includes("Password"))) {
                    throw sdkError;
                }
                console.warn("SDK SignUp failed, trying REST fallback:", sdkError);
            }
        }

        // Strategy B: Direct Supabase REST API Fallback
        try {
            const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                },
                body: JSON.stringify({ email: cleanEmail, password: password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error_description || data.msg || data.message || "Registration failed.");
            }

            this.currentUser = data.user || data;
            this.sessionToken = data.access_token || null;
            localStorage.setItem("tictactoe_session_user", JSON.stringify(this.currentUser));
            if (this.sessionToken) localStorage.setItem("tictactoe_session_token", this.sessionToken);
            this.notifyAuthListeners(this.currentUser);
            return { user: this.currentUser, session: data };
        } catch (restError) {
            // Strategy C: Offline / Local fallback if network is unreachable
            console.warn("Cloud connection error, enabling secure local account mode:", restError);
            const localUser = {
                id: 'local_user_' + btoa(cleanEmail).replace(/=/g, ''),
                email: cleanEmail,
                created_at: new Date().toISOString(),
                isLocal: true
            };
            this.currentUser = localUser;
            localStorage.setItem("tictactoe_session_user", JSON.stringify(localUser));
            this.notifyAuthListeners(this.currentUser);
            return { user: localUser, isLocal: true };
        }
    }

    // -------------------------------------------------------------
    // AUTHENTICATION: Direct SignIn (Login)
    // -------------------------------------------------------------
    async signIn(email, password) {
        const cleanEmail = email.trim().toLowerCase();

        // Strategy A: Via Supabase SDK
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password: password
                });

                if (error) throw error;

                if (data?.user) {
                    this.currentUser = data.user;
                    this.sessionToken = data.session?.access_token || null;
                    localStorage.setItem("tictactoe_session_user", JSON.stringify(this.currentUser));
                    if (this.sessionToken) localStorage.setItem("tictactoe_session_token", this.sessionToken);
                    this.notifyAuthListeners(this.currentUser);
                    return { user: this.currentUser, session: data.session };
                }
            } catch (sdkError) {
                if (sdkError.message && (sdkError.message.includes("Invalid login") || sdkError.message.includes("Email not confirmed"))) {
                    throw sdkError;
                }
                console.warn("SDK SignIn failed, trying REST fallback:", sdkError);
            }
        }

        // Strategy B: Direct Supabase REST API Fallback
        try {
            const res = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_CONFIG.anonKey
                },
                body: JSON.stringify({ email: cleanEmail, password: password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error_description || data.msg || data.message || "Invalid email or password.");
            }

            this.currentUser = data.user;
            this.sessionToken = data.access_token;
            localStorage.setItem("tictactoe_session_user", JSON.stringify(this.currentUser));
            localStorage.setItem("tictactoe_session_token", this.sessionToken);
            this.notifyAuthListeners(this.currentUser);
            return { user: this.currentUser, session: data };
        } catch (restError) {
            if (restError.message && restError.message.includes("Invalid")) {
                throw restError;
            }
            // Strategy C: Offline session fallback
            const localUser = {
                id: 'local_user_' + btoa(cleanEmail).replace(/=/g, ''),
                email: cleanEmail,
                isLocal: true
            };
            this.currentUser = localUser;
            localStorage.setItem("tictactoe_session_user", JSON.stringify(localUser));
            this.notifyAuthListeners(this.currentUser);
            return { user: localUser, isLocal: true };
        }
    }

    // -------------------------------------------------------------
    // AUTHENTICATION: Sign Out
    // -------------------------------------------------------------
    async signOut() {
        if (this.supabase) {
            try {
                await this.supabase.auth.signOut();
            } catch (e) {
                console.warn("SignOut SDK notice:", e);
            }
        }
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem("tictactoe_session_user");
        localStorage.removeItem("tictactoe_session_token");
        this.notifyAuthListeners(null);
    }

    // -------------------------------------------------------------
    // DATA LAYER: Load User Points & Stats
    // -------------------------------------------------------------
    async loadUserData() {
        let localData = null;
        try {
            const stored = localStorage.getItem("tictactoe_game_data");
            if (stored) localData = JSON.parse(stored);
        } catch (e) {
            console.warn("LocalStorage parse notice:", e);
        }

        if (this.currentUser && !this.currentUser.isLocal) {
            if (this.supabase) {
                try {
                    const { data, error } = await this.supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', this.currentUser.id)
                        .maybeSingle();

                    if (data && !error) {
                        const mergedPoints = Math.max(Number(data.points || 0), Number(localData?.points || 0));
                        const mergedData = {
                            points: mergedPoints,
                            stats: {
                                totalGames: Math.max(data.total_games || 0, localData?.stats?.totalGames || 0),
                                userWins: Math.max(data.user_wins || 0, localData?.stats?.userWins || 0),
                                aiWins: Math.max(data.ai_wins || 0, localData?.stats?.aiWins || 0),
                                draws: Math.max(data.draws || 0, localData?.stats?.draws || 0),
                                easyWins: Math.max(data.easy_wins || 0, localData?.stats?.easyWins || 0),
                                mediumWins: Math.max(data.medium_wins || 0, localData?.stats?.mediumWins || 0),
                                hardWins: Math.max(data.hard_wins || 0, localData?.stats?.hardWins || 0)
                            }
                        };
                        localStorage.setItem("tictactoe_game_data", JSON.stringify(mergedData));
                        return mergedData;
                    }
                } catch (e) {
                    console.warn("Supabase user profile load notice:", e);
                }
            }
        }

        return localData;
    }

    // -------------------------------------------------------------
    // DATA LAYER: Save / Sync User Points & Stats
    // -------------------------------------------------------------
    async saveUserData(userData) {
        try {
            localStorage.setItem("tictactoe_game_data", JSON.stringify(userData));
        } catch (e) {
            console.warn("LocalStorage save notice:", e);
        }

        if (this.currentUser && !this.currentUser.isLocal && !this.isSyncing) {
            this.isSyncing = true;
            try {
                const payload = {
                    id: this.currentUser.id,
                    email: this.currentUser.email,
                    display_name: this.currentUser.email.split('@')[0],
                    points: Number((userData.points || 0).toFixed(1)),
                    easy_wins: userData.stats?.easyWins || 0,
                    medium_wins: userData.stats?.mediumWins || 0,
                    hard_wins: userData.stats?.hardWins || 0,
                    total_games: userData.stats?.totalGames || 0,
                    user_wins: userData.stats?.userWins || 0,
                    ai_wins: userData.stats?.aiWins || 0,
                    draws: userData.stats?.draws || 0,
                    updated_at: new Date().toISOString()
                };

                if (this.supabase) {
                    await this.supabase.from('user_profiles').upsert(payload, { onConflict: 'id' });
                }
            } catch (err) {
                console.warn("Cloud profile save notice:", err);
            } finally {
                this.isSyncing = false;
            }
        }
    }

    // -------------------------------------------------------------
    // REWARDS: Submit Redemption Request
    // -------------------------------------------------------------
    async submitRedemption(amount, pointsSpent) {
        const userEmail = this.currentUser ? this.currentUser.email : 'guest@tictactoe.app';
        const userId = this.currentUser ? this.currentUser.id : 'guest_' + Date.now();

        const record = {
            id: 'redm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            user_id: userId,
            user_email: userEmail,
            amount: Number(amount),
            points_spent: Number(pointsSpent),
            status: 'pending_processing',
            timestamp: new Date().toISOString()
        };

        try {
            const history = JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
            history.unshift(record);
            localStorage.setItem("tictactoe_redemptions", JSON.stringify(history));
        } catch (e) {
            console.warn("Local redemption storage notice:", e);
        }

        // Try submitting via Render Backend API
        try {
            fetch(`${RENDER_BACKEND_URL}/api/redemptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    userEmail: userEmail,
                    amount: amount,
                    pointsSpent: pointsSpent
                })
            }).catch(() => {});
        } catch (e) {}

        // Also try direct Supabase insert
        if (this.supabase && this.currentUser && !this.currentUser.isLocal) {
            try {
                await this.supabase.from('redemptions').insert([{
                    id: record.id,
                    user_id: record.user_id,
                    user_email: record.user_email,
                    amount: record.amount,
                    points_spent: record.points_spent,
                    status: 'pending_processing',
                    created_at: record.timestamp
                }]);
            } catch (err) {
                console.warn("Cloud redemption sync notice:", err);
            }
        }

        return record;
    }

    getRedemptionHistory() {
        try {
            return JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
        } catch (e) {
            return [];
        }
    }

    // -------------------------------------------------------------
    // BACKEND STATUS & LEADERBOARD (Render API Integration)
    // -------------------------------------------------------------
    async checkBackendHealth() {
        try {
            const res = await fetch(`${RENDER_BACKEND_URL}/health`, { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                return { success: true, data };
            }
            return { success: false, status: res.status };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async check3WayStatus() {
        try {
            const res = await fetch(`${RENDER_BACKEND_URL}/api/status`, { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                return { success: true, data };
            }
            return { success: false, status: res.status };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async fetchLeaderboard() {
        try {
            const res = await fetch(`${RENDER_BACKEND_URL}/api/leaderboard`, { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                return data.leaderboard || [];
            }
            return [];
        } catch (e) {
            console.warn("Leaderboard fetch notice:", e);
            return [];
        }
    }
}

// Global Singleton Instance
window.backendService = new BackendService();
