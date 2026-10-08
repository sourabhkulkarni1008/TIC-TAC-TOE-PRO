/**
 * Backend Supabase Client for Tic-Tac-Toe Pro
 * Direct Email & Password Authentication with automatic Supabase Session Persistence.
 */

const SUPABASE_CONFIG = {
    // Supabase Project URL
    url: "https://pwbokhuhhvjllunmotlf.supabase.co",
    // Supabase Public Anon Key
    anonKey: "sb_publishable_8Mz4FDbiPVCuroGHObMAhA_qbZDOOet"
};

// Render Backend API URL
const RENDER_BACKEND_URL = "https://tic-tac-toe-pro-o2km.onrender.com";


class BackendService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.init();
    }

    init() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                });

                // Listen for standard Supabase Auth state changes (SIGNED_IN, SIGNED_OUT, INITIAL_SESSION, TOKEN_REFRESHED)
                this.supabase.auth.onAuthStateChange(async (event, session) => {
                    this.currentUser = session?.user || null;
                    if (typeof window.onUserAuthenticated === 'function') {
                        window.onUserAuthenticated(this.currentUser);
                    }
                });
            } catch (err) {
                console.error("Supabase client init error:", err);
            }
        }
    }

    // Direct Supabase Email & Password Sign Up (New User Registration)
    async signUp(email, password) {
        if (!this.supabase) {
            return { data: null, error: { message: "Database service unavailable. Please check your connection." } };
        }

        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: password
            });

            if (error) throw error;
            this.currentUser = data?.user || null;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Direct Supabase Email & Password Sign In (Returning User Login)
    async signIn(email, password) {
        if (!this.supabase) {
            return { data: null, error: { message: "Database service unavailable. Please check your connection." } };
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: password
            });

            if (error) throw error;
            this.currentUser = data?.user || null;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    // Direct Supabase Sign Out
    async signOut() {
        this.currentUser = null;
        if (this.supabase) {
            try {
                await this.supabase.auth.signOut();
            } catch (error) {
                console.warn("Sign out notice:", error);
            }
        }
        return { error: null };
    }

    // Restore existing Supabase Session on page load
    async getSessionUser() {
        if (this.currentUser) return this.currentUser;
        if (!this.supabase) return null;

        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (session?.user) {
                this.currentUser = session.user;
                return session.user;
            }
            // Fallback user check
            const { data: { user } } = await this.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
                return user;
            }
        } catch (e) {
            console.warn("Session restore check:", e);
        }
        return null;
    }

    // Load User Profile Data (Points & Stats from Supabase)
    async loadUserData(userId) {
        if (!this.supabase || !userId) {
            const localData = localStorage.getItem("tictactoe_game_data");
            return localData ? JSON.parse(localData) : null;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn("Profile fetch notice:", error.message);
                return null;
            }
            return data;
        } catch (e) {
            console.warn("Profile fetch error:", e);
            return null;
        }
    }

    // Save/Sync User Profile Data
    async saveUserData(userData) {
        localStorage.setItem("tictactoe_game_data", JSON.stringify(userData));

        if (!this.supabase || !this.currentUser) {
            return { success: true };
        }

        try {
            const profilePayload = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                display_name: this.currentUser.email.split('@')[0],
                avatar_url: '',
                points: Number(userData.points.toFixed(1)),
                easy_wins: userData.stats.easyWins || 0,
                medium_wins: userData.stats.mediumWins || 0,
                hard_wins: userData.stats.hardWins || 0,
                total_games: userData.stats.totalGames || 0,
                user_wins: userData.stats.userWins || 0,
                ai_wins: userData.stats.aiWins || 0,
                draws: userData.stats.draws || 0,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('user_profiles')
                .upsert(profilePayload, { onConflict: 'id' });

            if (error) {
                console.warn("Profile sync error:", error.message);
                return { success: false, error };
            }
            return { success: true, data };
        } catch (e) {
            console.warn("Profile sync exception:", e);
            return { success: false, error: e };
        }
    }

    // Submit Redemption Request to Supabase Database
    async submitRedemption(amount, pointsSpent) {
        const redemptionRecord = {
            id: 'redm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            amount: amount,
            points_spent: pointsSpent,
            status: 'pending_processing',
            timestamp: new Date().toISOString()
        };

        const history = JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
        history.unshift(redemptionRecord);
        localStorage.setItem("tictactoe_redemptions", JSON.stringify(history));

        if (this.supabase && this.currentUser) {
            try {
                await this.supabase.from('redemptions').insert([{
                    id: redemptionRecord.id,
                    user_id: this.currentUser.id,
                    user_email: this.currentUser.email,
                    amount: amount,
                    points_spent: pointsSpent,
                    status: 'pending_processing',
                    created_at: redemptionRecord.timestamp
                }]);
            } catch (err) {
                console.warn("Redemption sync notice:", err);
            }
        }

        return redemptionRecord;
    }

    // Ping Render Backend Service Health
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

    // Get Redemption History
    getRedemptionHistory() {
        return JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
    }
}

// Global Supabase Backend Service Instance
window.backendService = new BackendService();

