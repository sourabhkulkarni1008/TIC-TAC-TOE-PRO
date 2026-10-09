/**
 * Supabase & Cloud Backend Client for Tic-Tac-Toe Pro (v5.1)
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
        this.initSupabaseSDK();
        if (!this.supabase) {
            await this.ensureSupabaseLoaded();
        }
        await this.restoreSession();
        this.isReady = true;
        console.log("🚀 BackendService initialized. Active User:", this.currentUser?.email || 'Guest (0.0 Pts)');
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

                this.supabase.auth.onAuthStateChange(async (event, session) => {
                    this.currentUser = session?.user || null;
                    this.sessionToken = session?.access_token || null;
                    if (this.currentUser) {
                        localStorage.setItem("tictactoe_session_user", JSON.stringify(this.currentUser));
                        if (this.sessionToken) localStorage.setItem("tictactoe_session_token", this.sessionToken);
                    } else {
                        localStorage.removeItem("tictactoe_session_user");
                        localStorage.removeItem("tictactoe_session_token");
                    }
                    console.log(`🔐 Auth State Event: ${event} | User: ${this.currentUser?.email || 'Logged Out'}`);
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
        this.sessionToken = null;
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

    async signUp(email, password) {
        const cleanEmail = email.trim().toLowerCase();

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase.auth.signUp({
                    email: cleanEmail,
                    password: password
                });

                if (error) {
                    if (error.message.includes("User already registered") || error.message.includes("already registered")) {
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

    async signIn(email, password) {
        const cleanEmail = email.trim().toLowerCase();

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

    async loadUserData() {
        if (!this.currentUser) {
            return {
                points: 0.0,
                stats: { totalGames: 0, userWins: 0, aiWins: 0, draws: 0, easyWins: 0, mediumWins: 0, hardWins: 0 }
            };
        }

        const userId = this.currentUser.id;
        const userCacheKey = `tictactoe_user_${userId}_data`;

        if (this.supabase && !this.currentUser.isLocal) {
            try {
                const { data, error } = await this.supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (data && !error) {
                    const cloudData = {
                        points: Number(data.points || 0.0),
                        stats: {
                            totalGames: Number(data.total_games || 0),
                            userWins: Number(data.user_wins || 0),
                            aiWins: Number(data.ai_wins || 0),
                            draws: Number(data.draws || 0),
                            easyWins: Number(data.easy_wins || 0),
                            mediumWins: Number(data.medium_wins || 0),
                            hardWins: Number(data.hard_wins || 0)
                        }
                    };
                    localStorage.setItem(userCacheKey, JSON.stringify(cloudData));
                    return cloudData;
                }
            } catch (e) {
                console.warn("SDK loadUserData notice:", e);
            }
        }

        if (this.sessionToken && !this.currentUser.isLocal) {
            try {
                const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_profiles?id=eq.${userId}&select=*`, {
                    headers: {
                        'apikey': SUPABASE_CONFIG.anonKey,
                        'Authorization': `Bearer ${this.sessionToken}`
                    }
                });
                if (res.ok) {
                    const rows = await res.json();
                    if (rows && rows.length > 0) {
                        const data = rows[0];
                        const cloudData = {
                            points: Number(data.points || 0.0),
                            stats: {
                                totalGames: Number(data.total_games || 0),
                                userWins: Number(data.user_wins || 0),
                                aiWins: Number(data.ai_wins || 0),
                                draws: Number(data.draws || 0),
                                easyWins: Number(data.easy_wins || 0),
                                mediumWins: Number(data.medium_wins || 0),
                                hardWins: Number(data.hard_wins || 0)
                            }
                        };
                        localStorage.setItem(userCacheKey, JSON.stringify(cloudData));
                        return cloudData;
                    }
                }
            } catch (e) {
                console.warn("REST loadUserData notice:", e);
            }
        }

        const cached = localStorage.getItem(userCacheKey);
        if (cached) {
            try { return JSON.parse(cached); } catch (e) {}
        }

        return {
            points: 0.0,
            stats: { totalGames: 0, userWins: 0, aiWins: 0, draws: 0, easyWins: 0, mediumWins: 0, hardWins: 0 }
        };
    }

    async saveUserData(userData) {
        if (!this.currentUser) {
            return;
        }

        const userId = this.currentUser.id;
        const userCacheKey = `tictactoe_user_${userId}_data`;
        try {
            localStorage.setItem(userCacheKey, JSON.stringify(userData));
        } catch (e) {}

        if (this.currentUser.isLocal) return;

        const payload = {
            id: userId,
            email: this.currentUser.email,
            display_name: (this.currentUser.email || '').split('@')[0],
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
            try {
                await this.supabase.from('user_profiles').upsert(payload, { onConflict: 'id' });
                return;
            } catch (err) {
                console.warn("SDK saveUserData notice:", err);
            }
        }

        if (this.sessionToken) {
            try {
                await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_profiles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_CONFIG.anonKey,
                        'Authorization': `Bearer ${this.sessionToken}`,
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                console.warn("REST saveUserData notice:", e);
            }
        }
    }

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

        const historyKey = this.currentUser ? `tictactoe_redemptions_${this.currentUser.id}` : 'tictactoe_guest_redemptions';
        try {
            const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
            history.unshift(record);
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) {}

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
        const historyKey = this.currentUser ? `tictactoe_redemptions_${this.currentUser.id}` : 'tictactoe_guest_redemptions';
        try {
            return JSON.parse(localStorage.getItem(historyKey) || "[]");
        } catch (e) {
            return [];
        }
    }

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

window.backendService = new BackendService();
