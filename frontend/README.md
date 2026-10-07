# 🎨 Tic-Tac-Toe Pro - Frontend Application

This directory contains the user interface, game engine, AI logic, and rewards UI for **Tic-Tac-Toe Pro**.

---

## 📁 Directory Structure

```text
frontend/
├── index.html              # Main frontend application entry point
├── css/
│   └── style.css           # Premium styling, responsive layout, animations, modals, bottom nav
├── js/
│   └── script.js           # Game Engine, AI algorithms (Easy, Medium, Hard), Wallet/Points & UI Controllers
└── assets/
    ├── icons/              # UI vector icons and badges
    └── images/             # Visual banners and assets
```

---

## 🚀 Features & Architecture

- **Interactive AI Game Engine**:
  - **Easy Mode**: Casual play with 40% tactical responsiveness (+1.0 Point per win).
  - **Medium Mode**: Balanced tactical play (+1.5 Points per win).
  - **Hard Mode**: Unbeatable Minimax algorithm (+2.0 Points per win).
- **Auto-Board Reset**: Automatically refreshes the board after a match ends.
- **Points & Rewards Wallet**:
  - Live points ledger with exact `0.5` increment handling.
  - Google Play Card redemption system (₹10, ₹20, ₹50, ₹100).
  - Live countdown timer for the daily spin bonus.
- **Modern Mobile-First Responsive Design**:
  - Glassmorphic UI with dynamic particle canvas (confetti on victory).
  - Bottom navigation bar for mobile devices (`🏠 Home`, `🎮 Play`, `📊 Stats`, `🎁 Rewards`, `👤 Account`).
- **Backend Integration**:
  - Interacts with `../backend/supabase-client.js` for Google OAuth, 6-digit OTP authentication, Email/Password login, and real-time database sync.
