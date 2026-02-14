---
name: grudge-angeler
description: Complete development guide for Grudge Angeler fishing game. Use when working on any game feature, system, UI, backend, leaderboard, login, Grudge ID, wallet, Grudge Studio integration, mobile controls, or asset management.
---

# Grudge Angeler - Development Skill

## Project Architecture

### File Structure
```
client/src/pages/fishing-game.tsx   - Main game (7700+ lines, all game logic + canvas + UI overlays)
client/src/pages/legendary-codex.tsx - Legendary 10 lore page (/legendaries route)
client/src/pages/not-found.tsx       - 404 page
client/src/App.tsx                   - Router (wouter): / = FishingGame, /legendaries = LegendaryCodex
client/src/lib/grudge-sdk.ts         - GrudgeSDK client for Grudge Studio ObjectStore API
client/src/lib/queryClient.ts        - TanStack Query client config
client/public/gameboard.html         - Standalone interactive reference board (all fish, items, rarity)
client/public/sw.js                  - Service worker for PWA support
client/public/manifest.json          - Web app manifest for PWA install
client/public/assets/                - ALL pixel art assets (DO NOT MODIFY)
server/routes.ts                     - Express API routes (leaderboard CRUD)
server/storage.ts                    - IStorage interface + DatabaseStorage implementation
server/db.ts                         - Drizzle PostgreSQL connection
shared/schema.ts                     - Drizzle ORM schema (users, leaderboard_entries)
```

### Critical Rules
- **NEVER modify files in `client/public/assets/`** - User preference
- **NEVER modify `server/vite.ts`, `vite.config.ts`, `drizzle.config.ts`, `package.json`**
- All game state is client-side in `stateRef.current` (React ref object)
- UI updates via `syncUI()` which copies stateRef fields to React state
- Canvas rendering happens in `requestAnimationFrame` loop
- Frontend port: 5000 (Express serves both API and Vite frontend)

## Game State Machine
States: `intro → title → charSelect → idle → casting → waiting → bite → reeling → caught/missed → idle`
Additional states: `swimming`, `boarding`, `store`, `npcChat`

### State Ref Pattern
```typescript
const stateRef = useRef<GameState>({...});
const [uiState, setUiState] = useState<UIState>({...});
function syncUI() { setUiState({...stateRef.current}); }
```
- `stateRef.current` = mutable game state (updated every frame)
- `uiState` = React state snapshot (triggers re-render for HTML overlays)
- Always call `syncUI()` after state changes that need UI updates

## Key Systems

### Character System
3 factions with character variants:
- **Fabled** (green, folder: `fisherman`, icon: `faction_fabled.png`)
- **Legion** (red, folder: `fisherman3`, icon: `faction_legion.png`)
- **Crusade** (blue, folder: `fisherman2`, icon: `faction_crusade.png`)

Each has: `selectImg` for character select, `factionIcon` for emblems, `folder` for sprite sheets.

### Fish & Rarity
5 tiers: common → uncommon → rare → legendary → ultra_rare
17 fish species + 10 ultra-rare "Legendary 10" with unique visual effects (tinted sprites, glow auras, sparkle particles).
10th legendary "The Seal at the Seam" uses `/assets/grudge_logo.png`.

### Equipment
- 5 Rods (varying power, speed, range)
- 5 Live Baits (affect bite speed, rarity chance)
- 11 Artificial Lures (affect fish behavior)
- 22 Chum items (boost spawns, rarity)

### Hotbar (5 slots)
1=Rod, 2=Lure/Bait, 3=Chum, 4=Net, 5=Binoculars

### Currency
- **Gbux**: In-game currency from selling fish
- **Head of Legends**: Premium currency for BetaXGruda Eggs (50 Beta + 50 Warlord limit)

## Backend / Database

### PostgreSQL Schema (Drizzle ORM)
```typescript
// shared/schema.ts
users: { id (uuid), username (unique), password }
leaderboard_entries: { id (uuid), playerName, category, fishName, fishRarity, value, score, createdAt }
```

### API Routes (server/routes.ts)
```
GET  /api/leaderboard/:category  - Fetch top entries (limit param, max 100)
POST /api/leaderboard            - Submit entry (validated via insertLeaderboardSchema)
```
Categories: `biggest_catch`, `session_catches`, `legendary_catches`

### Storage Interface (server/storage.ts)
```typescript
interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLeaderboard(category: string, limit?: number): Promise<LeaderboardEntry[]>;
  submitLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
}
```

## Grudge Studio Integration

### GrudgeSDK (client/src/lib/grudge-sdk.ts)
- Base URL: `https://grudge-studio.github.io/ObjectStore`
- Fetches weapons, materials, armor, consumables from static JSON API
- 5-minute client-side cache
- Methods: `getWeapons()`, `getMaterials()`, `getArmor()`, `getConsumables()`, `search(query)`
- Icon URL generators for weapons, armor, materials
- Database info: Supabase PostgreSQL with schemas `studio_core` (accounts, sessions, api_keys) and `warlord_crafting` (characters, inventory, battles)

### Grudge ID System (Planned)
- Server-side user authentication with Grudge ID
- Wallet system for persistent currency (gbux, Head of Legends)
- Session-based login flowing into character select
- Links to Grudge Studio ecosystem (accounts, API keys)

## Mobile Controls

### Detection
```typescript
'ontouchstart' in window  // true on touch devices
```

### Layout
- **Bottom action bar**: Cast, Reel, Release, Force, Resilience buttons (center)
- **D-Pad** (left): W/A/S/D movement buttons
- **Extra buttons** (right): E (interact) + DIVE/SPACE
- All buttons use `data-mobile-controls` attribute to prevent canvas touch conflicts
- All held buttons have `onTouchCancel` handlers to prevent stuck inputs
- UI elements (hotbar, prompts, reel bar) reposition higher on mobile (bottom offset 76-90px)

### Touch → Game Input Mapping
```
CAST button   → stateRef.current.isReeling = true (idle/caught/missed states)
REEL button   → stateRef.current.isReeling = true (reeling state)
RELEASE       → Reset to idle, clear hook/rope
FORCE         → stateRef.current.activeReelHeld = true (reeling state)
RESILIENCE    → Consume resilience point, reduce fish velocity
D-Pad W/A/S/D → keysDown.add/delete("w"/"a"/"s"/"d")
E button      → Shop/Boat/NPC interaction OR space key while swimming
DIVE button   → keysDown.add(" ") for 100ms (idle or swimming)
```

## HTML Gameboard (client/public/gameboard.html)
Standalone reference page showing all fish species, equipment, rarity tiers, and game data in a visual grid. Includes dock underwater structure visualization with stackable dock leg assets.

## PWA Support
- `manifest.json`: App name, icons, theme color, display standalone
- `sw.js`: Service worker for offline caching
- In-game DOWNLOAD button triggers `beforeinstallprompt` event

## Visual Systems
- Day/night cycle (30-minute period)
- Weather: clear, cloudy, rain, storm, fog
- Celestial events: Red Sun, Green Moon, Tentacle Sun, Blood Moon
- Underwater: god rays, particles, depth fog, caustic lights, plant sway
- Predators: Shark, Kraken, Sea Devil with AI behaviors
- 2D rope physics: Verlet integration, 12 segments

## Debug Tools
Toggle with backtick (`) key:
- **Asset Deck**: Categorized sprite previews with unused indicators
- **Gizmo**: Click-select and drag world objects
- **Trace**: Pause game, inspect rod tip/hook/rope positions

## Best Practices
1. Game logic changes go in `stateRef.current` updates within the animation loop
2. UI overlay changes go in JSX with `uiState` conditionals
3. Always call `syncUI()` after stateRef changes that affect visible UI
4. New fish species: Add to `FISH_SPECIES` array with rarity, sprite, size range
5. New equipment: Add to respective arrays (`RODS`, `BAITS`, `LURES`, `CHUM_ITEMS`)
6. Canvas assets: Preload in the image loading section (search "new Image()")
7. Test on both desktop (keyboard/mouse) and mobile (touch controls)
8. Leaderboard entries auto-submit on catch via POST /api/leaderboard
