# 🎮 Tic-Tac-Toe Pro | Gaming & Rewards Platform

A modern, interactive, responsive Tic-Tac-Toe gaming platform with a **cleanly separated Frontend & Backend architecture**, integrated with **Supabase Authentication & PostgreSQL Database** (with automatic offline fallback).

---

## 🌟 Project Architecture

The project is structured into dedicated **Frontend** and **Backend** directories:

```text
TIC TAC TOE/
├── frontend/                   # 🎨 Frontend User Interface & Game Logic
│   ├── index.html              # Main HTML user interface
│   ├── css/
│   │   └── style.css           # Premium gaming styles, responsive layout, animations
│   ├── js/
│   │   └── script.js           # Game Engine, AI (Easy/Medium/Hard), Wallet/Points & UI Controllers
│   ├── assets/
│   │   ├── images/             # Visual banners and assets
│   │   └── icons/              # UI vector icons and badges
│   └── README.md               # Frontend documentation
│
├── backend/                    # 🛠️ Backend Cloud Services & Database
│   ├── db/
│   │   └── schema.sql          # PostgreSQL DDL for Supabase (Tables, RLS, Triggers)
│   ├── services/
│   │   ├── auth-service.js     # Modular Auth (Google OAuth, 6-digit OTP, Password)
│   │   └── data-service.js     # Modular Data Layer (Profiles, Points, Redemptions)
│   ├── supabase-client.js      # Supabase cloud client with offline fallback
│   └── README.md               # Backend setup and API guide
│
├── index.html                  # Root entry point
├── server.ps1                  # Local HTTP server runner (Port 8080)
└── README.md                   # Main project documentation
```

---

## 🚀 Key Features

1. **Modern Gaming Aesthetics**: Dark neon theme, glassmorphism cards, glowing mark accents (Cyan `✕`, Magenta `○`), victory line animations, celebratory confetti, and synthesized Web Audio sound effects.
2. **AI Difficulty Engine**:
   - **Easy (1.0 Pt)**: Casual challenge with 40% tactical responsiveness (+1.0 Point per win).
   - **Medium (1.5 Pts)**: Balanced tactical play (+1.5 Points per win).
   - **Hard (2.0 Pts)**: Unbeatable **Minimax Algorithm** with depth scoring (+2.0 Points per win).
3. **Auto-Board Reset**: After any win, loss, or draw, the game automatically resets after displaying results.
4. **Point System (Exact 0.5 Increments)**:
   - Win on Easy: **+1.0 Point**
   - Win on Medium: **+1.5 Points**
   - Win on Hard: **+2.0 Points**
   - AI Win / Draw: **0 Points**
5. **Google Play Rewards (100 Points = ₹1 INR)**:
   - ₹10 Google Play Card = **1,000 Points**
   - ₹20 Google Play Card = **2,000 Points**
   - ₹50 Google Play Card = **5,000 Points**
   - ₹100 Google Play Card = **10,000 Points**
6. **Authentication Options**:
   - **Google Sign-In**: 1-click Google OAuth.
   - **6-Digit Email OTP**: Email code verification.
   - **Email + Password**: Direct Sign In & Sign Up tabs (rate limit proof).
   - **Local Storage Mode**: Automatic offline fallback.
7. **Mobile-First Responsive Design**: Includes bottom navigation bar (`🏠 Home`, `🎮 Play`, `📊 Stats`, `🎁 Rewards`, `👤 Account`).

---

## ⚙️ How to Run the Website

### Option 1: Open Directly in Browser
- Open `frontend/index.html` or `index.html` directly in Google Chrome, Microsoft Edge, or any modern web browser.

### Option 2: Run Local Server via PowerShell
```powershell
.\server.ps1
```
Then visit `http://localhost:8080` in your web browser.
