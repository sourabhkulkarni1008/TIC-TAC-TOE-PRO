/**
 * Silent Background Cloud Sync Client for Tic-Tac-Toe Pro
 * Automatic Unique Player ID identification with zero login friction.
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
        this.playerId = this.getOrCreatePlayerId();
        this.playerName = this.getOrCreatePlayerName();
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.init();
    }

    // 1. Get or Create Unique Anonymous Player ID (e.g., PLY-8F29A4)
    getOrCreatePlayerId() {
        let id = localStorage.getItem("tictactoe_player_id");
        if (!id) {
            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
            const timestampPart = Date.now().toString(36).substring(4).toUpperCase();
            id = `PLY-${randomPart}${timestampPart}`;
            localStorage.setItem("tictactoe_player_id", id);
        }
        return id;
    }

    // 2. Get or Set Player Nickname
    getOrCreatePlayerName() {
        let name = localStorage.getItem("tictactoe_player_name");
        if (!name) {
            name = `Player #${this.playerId.substring(4, 9)}`;
            localStorage.setItem("tictactoe_player_name", name);
        }
        return name;
    }

    setPlayerName(newName) {
        if (newName && newName.trim()) {
            this.playerName = newName.trim().substring(0, 20);
            localStorage.setItem("tictactoe_player_name", this.playerName);
            return this.playerName;
        }
        return this.playerName;
    }

    // 3. Initialize Supabase Database Connection
    init() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                console.log(`🎮 Player Profile Loaded: ${this.playerId} (${this.playerName})`);
            } catch (err) {
                console.warn("Supabase background client init notice:", err);
            }
        }
    }

    // 4. Load Player Data (Local-first with Background Cloud Sync)
    async loadUserData() {
        // Fast local-first load
        let localData = null;
        try {
            const stored = localStorage.getItem("tictactoe_game_data");
            if (stored) localData = JSON.parse(stored);
        } catch (e) {
            console.warn("Local storage parse error:", e);
        }

        // Background Cloud Fetch
        if (this.supabase && this.playerId) {
            try {
                const { data, error } = await this.supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', this.playerId)
                    .maybeSingle();

                if (data && !error) {
                    this.lastSyncTime = new Date();
                    
                    // If cloud has higher score, sync local with cloud
                    const cloudPoints = Number(data.points || 0);
                    const localPoints = Number(localData?.points || 0);

                    if (cloudPoints >= localPoints) {
                        const mergedData = {
                            points: cloudPoints,
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
                }
            } catch (e) {
                console.warn("Background cloud restore notice:", e);
            }
        }

        return localData;
    }

    // 5. Silent Background Cloud Sync of Points & Stats
    async saveUserData(userData) {
        // Always save locally immediately
        try {
            localStorage.setItem("tictactoe_game_data", JSON.stringify(userData));
        } catch (e) {
            console.warn("Local storage save error:", e);
        }

        // Silent Cloud Upsert
        if (this.supabase && this.playerId && !this.isSyncing) {
            this.isSyncing = true;
            try {
                const profilePayload = {
                    id: this.playerId,
                    display_name: this.playerName,
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

                const { data, error } = await this.supabase
                    .from('user_profiles')
                    .upsert(profilePayload, { onConflict: 'id' });

                if (!error) {
                    this.lastSyncTime = new Date();
                } else {
                    console.warn("Cloud sync note:", error.message);
                }
            } catch (err) {
                console.warn("Cloud background sync exception:", err);
            } finally {
                this.isSyncing = false;
            }
        }
    }

    // 6. Submit Reward Redemption Request
    async submitRedemption(amount, pointsSpent, deliveryContact = '') {
        const redemptionRecord = {
            id: 'redm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            player_id: this.playerId,
            player_name: this.playerName,
            amount: amount,
            points_spent: pointsSpent,
            delivery_contact: deliveryContact,
            status: 'pending_processing',
            timestamp: new Date().toISOString()
        };

        // Save in local history
        try {
            const history = JSON.parse(localStorage.getItem("tictactoe_redemptions") || "[]");
            history.unshift(redemptionRecord);
            localStorage.setItem("tictactoe_redemptions", JSON.stringify(history));
        } catch (e) {
            console.warn("Redemption local history save error:", e);
        }

        // Sync to Cloud Redemptions Table
        if (this.supabase) {
            try {
                await this.supabase.from('redemptions').insert([{
                    id: redemptionRecord.id,
                    user_id: this.playerId,
                    user_email: deliveryContact || `${this.playerId}@guest.tictactoe`,
                    amount: amount,
                    points_spent: pointsSpent,
                    status: 'pending_processing',
                    created_at: redemptionRecord.timestamp
                }]);
            } catch (err) {
                console.warn("Redemption cloud sync notice:", err);
            }
        }

        return redemptionRecord;
    }

    // 7. Get Local/Cloud Redemptions History
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
