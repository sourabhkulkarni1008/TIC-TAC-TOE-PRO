const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Cloud Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || "https://pwbokhuhhvjllunmotlf.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_8Mz4FDbiPVCuroGHObMAhA_qbZDOOet";

// Initialize Supabase Client on Backend
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Enable CORS for Vercel Frontend and local dev
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root directory containing static frontend files
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir));

// 1. Health Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'Tic-Tac-Toe Pro Render Backend',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// 2. 3-Way Service Status Endpoint (Vercel <-> Render <-> Supabase)
app.get('/api/status', async (req, res) => {
    let dbStatus = 'connected';
    try {
        const { error } = await supabase.from('user_profiles').select('id').limit(1);
        if (error && error.code !== 'PGRST116') {
            dbStatus = 'notice: ' + error.message;
        }
    } catch (e) {
        dbStatus = 'unavailable: ' + e.message;
    }

    res.status(200).json({
        status: 'online',
        frontend: 'https://tic-tac-toe-pro-frontend.vercel.app',
        backend: 'https://tic-tac-toe-pro-o2km.onrender.com',
        database: {
            provider: 'Supabase Cloud',
            url: SUPABASE_URL,
            status: dbStatus
        },
        timestamp: new Date().toISOString()
    });
});

// 3. Leaderboard API Endpoint (Fetches top players from Supabase)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('display_name, points, total_games, user_wins')
            .order('points', { ascending: false })
            .limit(10);

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json({ leaderboard: data || [] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Secure Redemption Processor Endpoint
app.post('/api/redemptions', async (req, res) => {
    try {
        const { userId, userEmail, amount, pointsSpent } = req.body;
        if (!amount || !pointsSpent) {
            return res.status(400).json({ error: 'Missing amount or pointsSpent' });
        }

        const redemptionId = 'redm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const { data, error } = await supabase.from('redemptions').insert([{
            id: redemptionId,
            user_id: userId || 'anonymous',
            user_email: userEmail || 'player@tictactoe.pro',
            amount: Number(amount),
            points_spent: Number(pointsSpent),
            status: 'pending_processing',
            created_at: new Date().toISOString()
        }]).select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ success: true, redemption: data[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Fallback to frontend single page app
app.get('*', (req, res) => {
    const indexPath = path.join(rootDir, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(200).send('Tic-Tac-Toe Pro Backend Service is Active.');
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Tic-Tac-Toe Pro Server running on port ${PORT}`);
    console.log(`🔗 Connected to Supabase at: ${SUPABASE_URL}`);
});

