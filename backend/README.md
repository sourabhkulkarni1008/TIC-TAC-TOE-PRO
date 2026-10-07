# 🛠️ Tic-Tac-Toe Pro - Backend Architecture & Services

This directory contains all backend database schemas, authentication controllers, and cloud synchronization services for **Tic-Tac-Toe Pro**.

---

## 📁 Directory Structure

```text
backend/
├── db/
│   └── schema.sql              # PostgreSQL DDL for Supabase (Tables, RLS, Triggers)
├── services/
│   ├── auth-service.js         # Dedicated auth service (OAuth, 6-digit OTP, Password)
│   └── data-service.js         # Dedicated data service (Profiles, Points, Redemptions)
├── supabase-client.js          # Master Supabase Cloud client with offline fallback
└── README.md                   # This documentation
```

---

## 🗄️ Database Tables (`backend/db/schema.sql`)

### 1. `user_profiles`
Stores user profile information, real-time points balance, and match statistics.
- `id` (UUID, Primary Key, references `auth.users(id)`)
- `email` (TEXT)
- `display_name` (TEXT)
- `avatar_url` (TEXT)
- `points` (NUMERIC(10,1), default 0.0)
- `easy_wins` (INTEGER, default 0)
- `medium_wins` (INTEGER, default 0)
- `hard_wins` (INTEGER, default 0)
- `total_games`, `user_wins`, `ai_wins`, `draws` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `redemptions`
Stores submitted Google Play redemption requests.
- `id` (TEXT, Primary Key)
- `user_id` (UUID, references `auth.users(id)`)
- `user_email` (TEXT)
- `amount` (INTEGER - ₹10, ₹20, ₹50, ₹100)
- `points_spent` (NUMERIC(10,1))
- `status` (TEXT, default `'pending_processing'`)
- `created_at` (TIMESTAMPTZ)

---

## 🔐 Security & Row Level Security (RLS)

- **RLS Enabled on all tables**: Users can only read and modify their own profile data and redemption history.
- **Trigger `handle_new_user()`**: Automatically creates a matching profile in `user_profiles` when a user registers or signs in for the first time via OAuth/OTP/Password.
- **Backend-managed rewards**: Raw gift card codes are never stored on the client; redemption records are submitted securely for backend distribution.

---

## 🚀 Setting Up the Database in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor**.
3. Copy the contents of [`backend/db/schema.sql`](file:///backend/db/schema.sql) and paste it into the editor.
4. Click **Run** to execute the script and apply the schema and RLS policies.
