-- ==============================================================================
-- Supabase Database Schema for Tic-Tac-Toe Pro
-- Tables: user_profiles, redemptions
-- Row Level Security (RLS) enabled
-- ==============================================================================

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    points NUMERIC(10, 1) DEFAULT 0.0 NOT NULL,
    easy_wins INTEGER DEFAULT 0 NOT NULL,
    medium_wins INTEGER DEFAULT 0 NOT NULL,
    hard_wins INTEGER DEFAULT 0 NOT NULL,
    total_games INTEGER DEFAULT 0 NOT NULL,
    user_wins INTEGER DEFAULT 0 NOT NULL,
    ai_wins INTEGER DEFAULT 0 NOT NULL,
    draws INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create redemptions table
CREATE TABLE IF NOT EXISTS public.redemptions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    amount INTEGER NOT NULL,
    points_spent NUMERIC(10, 1) NOT NULL,
    status TEXT DEFAULT 'pending_processing' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- 4. Policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- 5. Policies for redemptions
CREATE POLICY "Users can view their own redemptions"
    ON public.redemptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redemptions"
    ON public.redemptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. Automatically create profile on new user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, avatar_url, points)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        0.0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
