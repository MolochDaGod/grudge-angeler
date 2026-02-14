# Grudge Angeler - Fishing Game

## Overview
Grudge Angeler is a pixel art fishing game developed with HTML5 Canvas and React. Players engage in a rich fishing experience, casting lines, catching diverse fish species, and expanding their collection. The game features animated pixel art, a dynamic day/night cycle, sophisticated particle effects, and an engaging reeling minigame. The project aims to deliver a compelling and visually appealing fishing simulation, leveraging modern web technologies to create an immersive experience for players.

## User Preferences
I want to prioritize iterative development. I prefer detailed explanations for complex features. Ask before making major changes to the core game loop or architectural decisions. Do not make changes to files in the `client/public/assets/` folder.

## System Architecture
The game utilizes a React frontend with HTML5 Canvas for rendering, ensuring a fullscreen, immersive experience. The backend is a minimal Express server primarily for serving static assets, as game state is managed client-side in-memory.

**UI/UX and Design:**
- **Pixel Art:** All game assets are pixel art, maintaining a consistent aesthetic.
- **Character Selection:** HTML overlay for character variant selection (Classic, Ocean Blue, Crimson) and username input.
- **Hotbar System:** A 5-slot hotbar (Rod, Lure/Bait, Chum, Net, Binoculars) provides quick access to equipment.
- **Shop Interface:** Full-screen shop overlay for purchasing rods, baits, and lures.
- **Billboard System:** Canvas-rendered sign near the fishing hut rotates through bounties, records, deals, and the game logo.
- **Rarity Visuals:** Ultra-rare fish feature tinted sprites with glowing auras and orbiting sparkle particles.
- **UI Icons:** Consistent 32x32 pixel icons for all UI elements.
- **Weather Effects:** Dynamic weather (clear, cloudy, rain, storm, fog) with visual elements like rain particles, lightning, and murky water effects.
- **Celestial Events:** Rare celestial events (Red Sun, Green Moon, Tentacle Sun, Blood Moon) with unique visual phenomena like aurora borealis.

**Technical Implementations & Features:**
- **Game Flow:** Structured progression from title screen, character select, idle, casting, waiting, bite, reeling, to caught, and shop interactions.
- **Reeling Minigame:** A Palworld-style minigame with a horizontal bar, moving catch zone, and mechanics affected by rod stats. Includes Force Bar (spacebar active reel) and Resilience Bar (S-key for line letting).
- **Net Tool:** An alternative fishing method with specific casting mechanics, auto-catching, cooldowns, and a chance to catch chum items.
- **Sprite Orientation:** Standardized sprite conventions for character facing, movement, and mirroring.
- **Character System:** Three selectable character variants, each with unique recolored sprite sets.
- **Fish Species:** 17 distinct fish species across 5 rarity tiers (common, uncommon, rare, legendary, ultra_rare), including 10 ultra-rare variants (The Legendary 10) with unique visual traits and spawn mechanics. The 10th legendary "The Seal at the Seam" uses the grudge skull logo as its image.
- **Equipment System:** Diverse range of 5 rods, 5 live baits, 11 artificial lures, and 22 chum items, each affecting gameplay mechanics.
- **Chum System:** Throwable items that boost fish spawns, rarity, and bite speed, activated via the hotbar.
- **Rarity System:** 5 tiers (common to ultra_rare) with distinct colors, star ratings, sell price multipliers, and reeling difficulty multipliers.
- **Gbux & Market System:** In-game currency "gbux" earned from selling fish, with a dynamic market influenced by demand.
- **Bounty System:** Randomly generated bounties targeting specific fish species with size requirements, rewarding gbux upon completion.
- **Attribute Physics System:** An 8-attribute 2D physics-inspired model (Tactics, Strength, Agility, Dexterity, Endurance, Vitality, Wisdom, Intellect) influencing various gameplay elements like fish escape velocity, catch zone movement, and rarity spawns.
- **Fish Behavior:** Detailed swimming patterns, approach mechanics for the hook, and complex reeling behavior for hooked fish.
- **Boat System:** Player can use a boat for open ocean fishing, featuring boarding cutscenes, distinct movement, and fishing mechanics.
- **World Layout (8 Scenes):** A horizontally scrolling world divided into distinct scenes ranging from shallow waters to deep ocean, influencing fish rarity and size.
- **Camera System:** Dynamic camera following the player/boat, clamped to world bounds, with parallax scrolling for background elements. Mouse input is converted to world coordinates for aiming. Binoculars mode (hotkey 5) decouples camera for free WASD panning with both X and Y axes, scope vignette overlay with crosshairs.
- **Swimming Mechanics:** Jump arc into water with parabolic trajectory, horizontal displacement, and enhanced splash. Character sprite rotates based on vertical movement direction (tilt up/down while swimming). Angle lerps smoothly and resets on state transitions.
- **Predator System:** Three types of predators (Shark, Kraken, Sea Devil) with AI behaviors (patrol, chase, attack, flee), affecting fish and potentially the player. Spawn probability scales by world position and depth.
- **Ocean Depth Zones:** Three distinct depth zones (shallow, mid-depth, deep ocean) with visual transitions and varying fish populations.
- **3D Visual Effects:** Includes god rays, underwater particles, depth fog, and caustic light patches to enhance visual immersion.
- **Underwater Plants:** 10 plant types cropped from a sprite sheet, placed across the ocean floor (80 plants, sizes 1x-30x). Plants sway with a wave effect using vertical slice rendering. 35% render in front of fish, 65% behind. Plants excluded from dock area and never rise above the waterline.
- **Underwater Background:** Tiled coral reef background image with 18% opacity, hue-shifted and desaturated, providing ocean floor ambiance.
- **Admin Debug Tools:** Toggle with backtick key. Three tabs: Asset Deck (categorized sprite previews with unused indicators), Gizmo (click-select and drag-move world objects with selection boxes/handles), Trace (pause game and inspect rod tip, hook, rope segment positions with visual markers and coordinate readouts).
- **2D Rope Physics:** Verlet integration fishing line with 12 segments, 15px segment length, 3 constraint iterations, gravity 0.3, damping 0.98. Segment 0 pinned to rod tip, last segment follows hook. Cast-flight projectile arc with gravity and water collision detection.
- **World Objects System:** Array-based world object rendering (barrels, grass, signs) replacing hardcoded positions, supporting gizmo manipulation.
- **NPC System:** 5 interactive NPCs on the pier/dock area with three roles: shopkeeper (sells chum/lures at unique prices), requester (asks for specific fish types with quantity goals), and mission_giver (challenges to catch fish of specific weight). NPCs use 48x48 sprite sheets with idle animations. Interaction via E key when within 60px proximity. Full UI overlay with Talk/Shop/Request/Mission tabs. Progress tracked automatically on fish catch. Sprites in `/assets/npcs/[1-12]/`.
- **Core Features:** Random fish sizes, combo system, rod leveling, fish collection log, dynamic day/night cycle (30-minute), weather system, far background parallax, water effects (ripples, particles, screen shake), catch cutscenes, character movement (walking, swimming), and an interactive `gameboard.html` reference board.

- **Leaderboard System:** Live leaderboard backed by PostgreSQL with three categories: Biggest Single Catch (by weight), Most Catches in 20-Minute Session, and Legendary/Ultra-Rare Catches. Scores auto-submit on each fish catch via REST API. Accessible in-game via LEADERBOARD button (bottom-left). Tabs switch between categories. Shows top 20 entries with gold/silver/bronze medal styling.
- **PWA Support:** Web App Manifest (`manifest.json`) and Service Worker (`sw.js`) enable "Install App" / "Add to Home Screen" functionality. DOWNLOAD button in-game triggers install prompt on supported browsers.

## Database
- **PostgreSQL (Neon-backed):** Stores leaderboard entries. Schema defined in `shared/schema.ts` using Drizzle ORM.
- **Tables:** `users` (unused placeholder), `leaderboard_entries` (id, player_name, category, fish_name, fish_rarity, value, score, created_at).
- **API Routes:** `GET /api/leaderboard/:category` (fetch top entries), `POST /api/leaderboard` (submit new entry).

## External Dependencies
- **React:** Frontend JavaScript library for building user interfaces.
- **Express:** Minimal Node.js web application framework used for serving static assets.
- **HTML5 Canvas:** Core technology for 2D graphics rendering.
- **Drizzle ORM:** TypeScript ORM for PostgreSQL database management.
- **pg:** PostgreSQL client for Node.js.