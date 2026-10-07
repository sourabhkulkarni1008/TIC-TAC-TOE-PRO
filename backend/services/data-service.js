/**
 * Data Service
 * Modular service handles user profiles, points, game statistics,
 * and redemption requests in Supabase.
 */

class DataService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    async getProfile(userId) {
        if (!this.supabase || !userId) return null;
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn("Error fetching profile:", error);
            return null;
        }
        return data;
    }

    async updateProfile(userId, profileData) {
        if (!this.supabase || !userId) return { success: false };
        const payload = {
            id: userId,
            ...profileData,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('user_profiles')
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            console.error("Error updating profile:", error);
            return { success: false, error };
        }
        return { success: true, data };
    }

    async createRedemption(userId, userEmail, amount, pointsSpent) {
        const redemptionId = 'redm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const record = {
            id: redemptionId,
            user_id: userId,
            user_email: userEmail,
            amount: amount,
            points_spent: pointsSpent,
            status: 'pending_processing',
            created_at: new Date().toISOString()
        };

        if (this.supabase && userId) {
            const { error } = await this.supabase
                .from('redemptions')
                .insert([record]);
            
            if (error) {
                console.error("Error creating redemption in Supabase:", error);
            }
        }

        return record;
    }

    async getRedemptions(userId) {
        if (!this.supabase || !userId) return [];
        const { data, error } = await this.supabase
            .from('redemptions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching redemptions:", error);
            return [];
        }
        return data || [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
}
