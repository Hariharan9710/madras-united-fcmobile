# ⚽ Madras United - FC Mobile Solo Tournament System

> **Official Mobile-First Tournament Management Hub**  
> Complete automated platform for FC Mobile tournaments: Player Registration, Exclusive Team Selection (with Timestamps & Timed Locks), 3 Tournament Formats, Automatic Points Table, Golden Boot & Golden Glove Leaderboards, and Admin Result Posting.

---

## 🌟 Key Features

### 1. 📱 Built for Mobile View
- Specially tailored dark-mode gaming UI inspired by **EA Sports FC 24/25 Mobile**.
- Bottom navigation bar: **Home**, **Pick Team**, **Fixtures**, **Table**, and **Stats**.
- Glowing status badges, dynamic team crests, and live sync indicators.

### 2. 📝 Player Registration & Live Capacity
- Players register with their **Name**, **FC Mobile IGN (In-Game Name)**, **FC Mobile UID**, **OVR Rating**, and **WhatsApp Number**.
- Live registered player counter (e.g. `25 Players Registered`).
- Duplicate UID and duplicate IGN prevention built in.

### 3. 🛡️ Exclusive Team Selection (Draft Mode)
- **Categories Supported:**
  - 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Premier League** (Man City, Arsenal, Liverpool, Chelsea, Man United, Spurs, Newcastle, Aston Villa)
  - 🇪🇸 **La Liga** (Real Madrid, Barcelona, Atletico Madrid, Girona, Athletic Bilbao, Real Sociedad)
  - 🇩🇪 **Bundesliga** (Bayern Munich, Bayer Leverkusen, Dortmund, RB Leipzig)
  - 🇮🇹 **Serie A** (Inter Milan, AC Milan, Juventus, Napoli)
  - 🌍 **International Teams** (Argentina, France, Brazil, England, Portugal, Spain, Germany, Netherlands, Italy)
- **Strict Exclusivity Rule:**
  - Once a player picks a team, it is **LOCKED** and immediately disabled for all other players.
  - Displays: `LOCKED / TAKEN by [Player Name] ([IGN])`.
- **Timestamp Proof:**
  - Exact date and timestamp recorded down to the second (e.g. `Selected on 16 Oct, 06:02:15 PM IST`).
- **Timed Lock & Countdown Timer:**
  - Admin can schedule an exact opening date & time (e.g. *Today at 6:00 PM*).
  - Players see a live countdown clock: `Team Draft Opens In: 02h 15m 30s`.
  - Admin can also lock or unlock manually with 1 click.

### 4. 🏆 3 Tournament Formats Supported
1. **Group Stage + Knockouts** (e.g. 2 Groups -> Top 2 advance to Semifinals & Grand Final).
2. **Premier League Style** (Single unified round-robin league table where all players play each other).
3. **Multi-Stage Format** (Stage 1 Groups -> Stage 2 Super League / Championship Group -> Grand Final).

### 5. 🎲 1-Click Automatic Random Fixture Generator
- Shuffles players and automatically creates round-by-round balanced match pairings (Matchday 1, Matchday 2, etc.).

### 6. 📊 Real-Time Automated Points Table
- Tracks: **Played (P)**, **Won (W)**, **Drawn (D)**, **Lost (L)**, **Goals For (GF)**, **Goals Against (GA)**, **Goal Difference (GD)**, **Points (PTS)**, and **Form Guide** (`W`, `D`, `L` badges).
- Automatic sorting: Points ➔ Goal Difference ➔ Goals For.
- Highlighted qualification zone for Top 2 teams advancing to knockouts.

### 7. 👟 Top Stats Tracking
- **⚽ Golden Boot:** Automatically tallies goals per player across all completed fixtures and ranks top scorers.
- **🧤 Golden Glove:** Automatically counts clean sheets (zero goals conceded) and ranks top goalkeepers.

### 8. ⚙️ Admin Control Panel (PIN Protected)
- **Default Admin PIN:** `1947` (can be changed in settings).
- **Match Result Entry:**
  - Select fixture ➔ Enter Home & Away scores.
  - Log goalscorers (e.g. `Mbappe 2, Saka 1`) ➔ immediately updates Golden Boot!
  - Log clean sheets ➔ immediately updates Golden Glove!
  - In Knockouts, the winner automatically advances to the next bracket round!
- **1-Click 8-Player Demo:** Test the full experience with 1 click!

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open your browser at:
`http://localhost:3000`

---

## 🌐 100% Free 24/7 Hosting Options

### Option A: Render.com (Recommended Free 24/7 Hosting)
Render provides free Node.js hosting with zero configuration:
1. Create a free account at [render.com](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository (`Hariharan9176/...`).
4. Settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Deploy**. Render gives you a permanent live URL like `https://madras-united-fcmobile.onrender.com`.

### Option B: Vercel (100% Free Serverless Hosting)
The project includes pre-configured `vercel.json` and `api/index.js`:
1. Push code to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **Import Project**.
3. Click **Deploy**. Your permanent free link is ready!

---

## 🔒 Admin Credentials
- **Default PIN:** `1947`
- Changeable directly in Admin settings.
