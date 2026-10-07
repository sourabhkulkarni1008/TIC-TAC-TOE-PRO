/**
 * Backend Supabase Client & API Service for Tic-Tac-Toe Pro
 * Manages Supabase Cloud Authentication, Real-time Profile Synchronization,
 * Points Ledger, and Reward Redemptions with seamless local storage fallback.
 */

const SUPABASE_CONFIG = {
    // Supabase Project URL
    url: "https://pwbokhuhhvjllunmotlf.supabase.co",
    // Supabase Public Anon Key
    anonKey: "sb_publishable_8Mz4FDbiPVCuroGHObMAhA_qbZDOOet"
};

class BackendService {
    constructor() {
        this.supabase = null;
        this.isCloudEnabled = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        const isPlaceholder = !SUPABASE_CONFIG.url || 
                              SUPABASE_CONFIG.url.includes("YOUR_SUPABASE_PROJECT") || 
                              !SUPABASE_CONFIG.anonKey || 
                              SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

        if (!isPlaceholder && window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                this.isCloudEnabled = true;
                console.log("⚡ Supabase Cloud Backend initialized successfully.");

                // Listen for session changes (e.g. from magic link, OAuth redirect, or OTP)
                this.supabase.auth.onAuthStateChange(async (event, session) => {
                    if (session?.user) {
                        this.currentUser = session.user;
                        if (typeof window.onUserAuthenticated === 'function') {
                            window.onUserAuthenticated(session.user);
                        }
                    }
                });
            } catch (err) {
                console.warn("⚠️ Supabase initialization failed, falling back to Local Storage mode:", err);
                this.isCloudEnabled = false;
            }
        } else {
            console.log("ℹ️ Running in Local Storage mode (Supabase credentials not configured).");
            this.isCloudEnabled = false;
        }
    }

    // Google OAuth Sign In
    async signInWithGoogle() {
        if (!this.isCloudEnabled) {
            const mockName = prompt("Enter your Player/Gmail Name (Local Mode):", "Player One") || "Guest Player";
            const mockEmail = `${mockName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
            const mockUser = {
                id: "local-user-" + Date.now(),
                email: mockEmail,
                user_metadata: {
                    full_name: mockName,
                    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(mockName)}`
                }
            };
            localStorage.setItem("tictactoe_local_auth", JSON.stringify(mockUser));
            this.currentUser = mockUser;
            return { user: mockUser, error: null };
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname
                }
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Google Auth error:", error);
            return { data: null, error };
        }
    }

    // Send 6-Digit Email OTP
    async sendEmailOtp(email) {
        if (!this.isCloudEnabled) {
            const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
            sessionStorage.setItem("tictactoe_mock_otp", JSON.stringify({ email, otp: mockOtp }));
            console.log(`🔑 [Local Mode OTP] Generated 6-digit code for ${email}: ${mockOtp}`);
            return { data: { mockOtp }, error: null };
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: true
                }
            });
            if (error) {
                console.warn("Supabase OTP API returned error:", error);
                return { data: null, error };
            }
            return { data, error: null };
        } catch (error) {
            console.error("Supabase OTP send error:", error);
            return { data: null, error: { message: error.message || "Failed to send OTP code." } };
        }
    }

    // Verify 6-Digit Email OTP
    async verifyEmailOtp(email, token) {
        if (!this.isCloudEnabled) {
            const stored = sessionStorage.getItem("tictactoe_mock_otp");
            if (stored) {
                const { email: savedEmail, otp: savedOtp } = JSON.parse(stored);
                if (savedEmail.toLowerCase() === email.toLowerCase() && savedOtp === token.trim()) {
                    const mockUser = {
                        id: "local-user-" + Date.now(),
                        email: email,
                        user_metadata: {
                            full_name: email.split('@')[0],
                            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`
                        }
                    };
                    localStorage.setItem("tictactoe_local_auth", JSON.stringify(mockUser));
                    this.currentUser = mockUser;
                    return { data: { user: mockUser }, error: null };
                }
            }
            return { data: null, error: { message: "Invalid or expired OTP code. Please check and try again." } };
        }

        try {
            const { data, error } = await this.supabase.auth.verifyOtp({
                email: email,
                token: token.trim(),
                type: 'email'
            });
            if (error) throw error;
            if (data.user) {
                this.currentUser = data.user;
            }
            return { data, error: null };
        } catch (error) {
            console.error("Supabase OTP verification error:", error);
            return { data: null, error: { message: error.message || "Invalid or expired OTP code." } };
        }
    }

    // Email & Password Sign Up
    async signUpWithEmail(name, email, password) {
        if (!this.isCloudEnabled) {
            const existingUsers = JSON.parse(localStorage.getItem("tictactoe_local_accounts") || "[]");
            const existing = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existing) {
                return { data: null, error: { message: "An account with this email already exists." } };
            }
            const newUser = {
                id: "local-usr-" + Date.now(),
                email: email,
                user_metadata: {
                    full_name: name,
                    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
                },
                password: password
            };
            existingUsers.push(newUser);
            localStorage.setItem("tictactoe_local_accounts", JSON.stringify(existingUsers));
            localStorage.setItem("tictactoe_local_auth", JSON.stringify(newUser));
            this.currentUser = newUser;
            return { data: { user: newUser }, error: null };
        }

        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
                    }
                }
            });
            if (error) throw error;
            if (data.user) {
                this.currentUser = data.user;
            }
            return { data, error: null };
        } catch (error) {
            console.error("Sign up error:", error);
            return { data: null, error: { message: error.message || "Failed to create account." } };
        }
    }

    // Email & Password Sign In
    async signInWithEmail(email, password) {
        if (!this.isCloudEnabled) {
            const existingUsers = JSON.parse(localStorage.getItem("tictactoe_local_accounts") || "[]");
            const userMatch = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (!userMatch) {
                const fallbackUser = {
                    id: "local-usr-" + Date.now(),
                    email: email,
                    user_metadata: {
                        full_name: email.split('@')[0],
                        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`
                    }
                };
                localStorage.setItem("tictactoe_local_auth", JSON.stringify(fallbackUser));
                this.currentUser = fallbackUser;
                return { data: { user: fallbackUser }, error: null };
            }
            localStorage.setItem("tictactoe_local_auth", JSON.stringify(userMatch));
            this.currentUser = userMatch;
            return { data: { user: userMatch }, error: null };
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error) throw error;
            if (data.user) {
                this.currentUser = data.user;
            }
            return { data, error: null };
        } catch (error) {
            console.error("Sign in error:", error);
            return { data: null, error: { message: error.message || "Invalid email or password." } };
        }
    }

    // Sign Out
    async signOut() {
        if (!this.isCloudEnabled) {
            localStorage.removeItem("tictactoe_local_auth");
            this.currentUser = null;
            return { error: null };
        }

        try {
            const { error } = await this.supabase.auth.signOut();
            this.currentUser = null;
            return { error };
        } catch (error) {
            console.error("Sign out error:", error);
            return { error };
        }
    }

    // Get Current Authenticated Session
    async getSessionUser() {
        if (!this.isCloudEnabled) {
            const stored = localStorage.getItem("tictactoe_local_auth");
            if (stored) {
                try {
                    this.currentUser = JSON.parse(stored);
                    return this.currentUser;
                } catch (e) {
                    return null;
                }
            }
            return null;
        }

        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error || !session) return null;
            this.currentUser = session.user;
            return session.user;
        } catch (e) {
            console.warn("Failed to get session:", e);
            return null;
        }
    }

    // Load User Profile Data (Points, Stats)
    async loadUserData(userId) {
        if (!this.isCloudEnabled || !userId) {
            const localData = localStorage.getItem("tictactoe_game_data");
            if (localData) {
                try {
                    return JSON.parse(localData);
                } catch (e) {
                    return null;
                }
            }
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn("Error fetching profile from Supabase:", error);
                return null;
            }
            return data;
        } catch (e) {
            console.warn("Supabase fetch failed:", e);
            return null;
        }
    }

    // Save/Sync User Profile Data (Points, Stats)
    async saveUserData(userData) {
        localStorage.setItem("tictactoe_game_data", JSON.stringify(userData));

        if (!this.isCloudEnabled || !this.currentUser) {
            return { success: true, mode: 'local' };
        }

        try {
            const profilePayload = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                display_name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0],
                avatar_url: this.currentUser.user_metadata?.avatar_url || '',
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
                console.warn("Supabase profile save error:", error);
                return { success: false, error };
            }
            return { success: true, mode: 'cloud', data };
        } catch (e) {
            console.warn("Supabase save exception:", e);
            return { success: false, error: e };
        }
    }

    // Submit Redemption Request to Database
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

        if (this.isCloudEnabled && this.currentUser) {
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
                console.warn("Could not sync redemption record to Supabase:", err);
            }
        }

        return redemptionRecord;
    }

    // Get Redemption History
    getRedemptionHistory() {
        return JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
    }
}

// Instantiate global backend service
window.backendService = new BackendService();
