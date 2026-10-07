/**
 * Supabase Backend Client - Pure Email + Password Authentication & Cloud Sync
 * Features:
 * - Email + Password Registration & Login (No Google, No OTP)
 * - Persistent Session on Page Refresh
 * - Realtime Cloud Points & Stats Sync
 * - Reward Redemptions Ledger
 */

const SUPABASE_CONFIG = {
    url: "https://pwbokhuhhvjllunmotlf.supabase.co",
    anonKey: "sb_publishable_8Mz4FDbiPVCuroGHObMAhA_qbZDOOet"
};

class BackendService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isSyncing = false;
        this.authListeners = [];
        this.init();
    }

    init() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: false
                    }
                });

                // Listen for auth state changes (LOGIN, LOGOUT, INITIAL_SESSION)
                this.supabase.auth.onAuthStateChange(async (event, session) => {
                    this.currentUser = session ? session.user : null;
                    console.log(`🔐 Auth State Change: ${event} | User: ${this.currentUser?.email || 'Logged Out'}`);
                    this.notifyAuthListeners(this.currentUser);
                });

                // Check initial session
                this.checkSession();
            } catch (err) {
                console.warn("Supabase client init warning:", err);
            }
        }
    }

    async checkSession() {
        if (!this.supabase) return null;
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (session && session.user) {
                this.currentUser = session.user;
                this.notifyAuthListeners(this.currentUser);
                return this.currentUser;
            }
        } catch (e) {
            console.warn("Session check error:", e);
        }
        return null;
    }

    onAuthChange(callback) {
        if (typeof callback === 'function') {
            this.authListeners.push(callback);
            if (this.currentUser) callback(this.currentUser);
        }
    }

    notifyAuthListeners(user) {
        this.authListeners.forEach(cb => {
            try { cb(user); } catch (e) { console.error(e); }
        });
    }

    // 1. Register with Email + Password
    async signUp(email, password) {
        if (!this.supabase) throw new Error("Database client not available");
        
        const { data, error } = await this.supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password
        });

        if (error) throw error;
        
        this.currentUser = data.user;
        this.notifyAuthListeners(this.currentUser);
        return data;
    }

    // 2. Sign In with Email + Password
    async signIn(email, password) {
        if (!this.supabase) throw new Error("Database client not available");

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
        });

        if (error) throw error;

        this.currentUser = data.user;
        this.notifyAuthListeners(this.currentUser);
        return data;
    }

    // 3. Sign Out / Logout
    async signOut() {
        if (!this.supabase) return;
        try {
            await this.supabase.auth.signOut();
        } catch (e) {
            console.warn("SignOut notice:", e);
        }
        this.currentUser = null;
        this.notifyAuthListeners(null);
    }

    // 4. Load User Points & Stats (Cloud first if logged in, local fallback)
    async loadUserData() {
        let localData = null;
        try {
            const stored = localStorage.getItem("tictactoe_game_data");
            if (stored) localData = JSON.parse(stored);
        } catch (e) {
            console.warn("LocalStorage parse error:", e);
        }

        if (this.supabase && this.currentUser) {
            try {
                const { data, error } = await this.supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', this.currentUser.id)
                    .maybeSingle();

                if (data && !error) {
                    const cloudPoints = Number(data.points || 0);
                    const localPoints = Number(localData?.points || 0);
                    const mergedPoints = Math.max(cloudPoints, localPoints);

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
                console.warn("Cloud data load notice:", e);
            }
        }

        return localData;
    }

    // 5. Save Points & Stats (Local + Cloud Sync)
    async saveUserData(userData) {
        try {
            localStorage.setItem("tictactoe_game_data", JSON.stringify(userData));
        } catch (e) {
            console.warn("LocalStorage save error:", e);
        }

        if (this.supabase && this.currentUser && !this.isSyncing) {
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

                await this.supabase
                    .from('user_profiles')
                    .upsert(payload, { onConflict: 'id' });
            } catch (err) {
                console.warn("Cloud save exception:", err);
            } finally {
                this.isSyncing = false;
            }
        }
    }

    // 6. Submit Reward Redemption Request
    async submitRedemption(amount, pointsSpent) {
        const userEmail = this.currentUser ? this.currentUser.email : 'guest@tictactoe.app';
        const userId = this.currentUser ? this.currentUser.id : 'guest_' + Date.now();

        const record = {
            id: 'redm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            user_id: userId,
            user_email: userEmail,
            amount: amount,
            points_spent: pointsSpent,
            status: 'pending_processing',
            timestamp: new Date().toISOString()
        };

        try {
            const history = JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
            history.unshift(record);
            localStorage.setItem("tictactoe_redemptions", JSON.stringify(history));
        } catch (e) {
            console.warn("Local redemption save error:", e);
        }

        if (this.supabase) {
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
}

// Global Singleton Instance
window.backendService = new BackendService();
