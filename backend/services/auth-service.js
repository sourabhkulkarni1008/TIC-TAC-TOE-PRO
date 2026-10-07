/**
 * Authentication Service
 * Modular service handles Google OAuth, Email OTP (6-digit token),
 * and Email + Password registration & login flows.
 */

class AuthService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    async signInWithGoogle(redirectTo) {
        if (!this.supabase) throw new Error("Supabase client is not initialized.");
        return await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo || (window.location.origin + window.location.pathname)
            }
        });
    }

    async sendEmailOtp(email) {
        if (!this.supabase) throw new Error("Supabase client is not initialized.");
        return await this.supabase.auth.signInWithOtp({
            email: email,
            options: { shouldCreateUser: true }
        });
    }

    async verifyEmailOtp(email, token) {
        if (!this.supabase) throw new Error("Supabase client is not initialized.");
        return await this.supabase.auth.verifyOtp({
            email: email,
            token: token.trim(),
            type: 'email'
        });
    }

    async signUp(name, email, password) {
        if (!this.supabase) throw new Error("Supabase client is not initialized.");
        return await this.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
                }
            }
        });
    }

    async signInWithPassword(email, password) {
        if (!this.supabase) throw new Error("Supabase client is not initialized.");
        return await this.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
    }

    async signOut() {
        if (!this.supabase) throw new Error("Supabase client is not initialized.");
        return await this.supabase.auth.signOut();
    }

    async getSession() {
        if (!this.supabase) return { data: { session: null }, error: null };
        return await this.supabase.auth.getSession();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}
