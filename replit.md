# Grudge Angeler - Fishing Game

## Overview
Grudge Angeler is a pixel art fishing game developed with HTML5 Canvas and React, offering players an immersive fishing experience. The game features animated pixel art, a dynamic day/night cycle, sophisticated particle effects, and an engaging reeling minigame. Its purpose is to deliver a compelling and visually appealing fishing simulation, leveraging modern web technologies to create an immersive experience. The project aims to provide a rich fishing experience, allowing players to cast lines, catch diverse fish species, and expand their collection.

## User Preferences
I want to prioritize iterative development. I prefer detailed explanations for complex features. Ask before making major changes to the core game loop or architectural decisions. Do not make changes to files in the `client/public/assets/` folder.

## System Architecture
The game utilizes a React frontend with HTML5 Canvas for rendering, ensuring a fullscreen, immersive experience. The backend is a minimal Express server primarily for serving static assets, as game state is managed client-side in-memory.

**UI/UX and Design:**
- **Pixel Art:** Consistent pixel art aesthetic across all game assets.
- **Character Selection:** HTML overlay for faction variant selection (Fabled/Legion/Crusade) with unique backgrounds and username input.
- **Hotbar System:** A 5-slot hotbar for quick access to equipment.
- **Shop Interface:** Full-screen shop overlay for purchasing equipment.
- **Billboard System:** Canvas-rendered sign rotating through bounties, records, deals, and game logo.
- **Rarity Visuals:** Ultra-rare fish feature tinted sprites with glowing auras and orbiting sparkle particles.
- **UI Icons:** Consistent 32x32 pixel icons for all UI elements.
- **Weather Effects:** Dynamic weather (clear, cloudy, rain, storm, fog) with visual elements like rain particles, lightning, and murky water effects.
- **Celestial Events:** Rare celestial events (Red Sun, Green Moon, Tentacle Sun, Blood Moon) with unique visual phenomena.
- **Mobile Controls:** Touch-friendly bottom action bar, D-pad, Dive and E (interact) buttons, with UI elements repositioned for mobile.

**Technical Implementations & Features:**
- **Game Flow:** Structured progression from title screen through character selection, idle, casting, biting, reeling, to caught, and shop interactions.
- **Reeling Minigame:** A Palworld-style minigame with a horizontal bar, moving catch zone, and mechanics affected by rod stats, including Force Bar and Resilience Bar.
- **Net Tool:** Alternative fishing method with 7-frame throw animation (NetThrow.png), Netthrown.png sinking sprite, and Net.png rising sprite. Auto-catches common/uncommon fish in area. 49lb max weight capacity — overweight breaks the net (5-minute cooldown, catch lost). Normal cooldown is 10 seconds. Shows caught fish icons bobbing in net during rise with weight counter.
- **Sprite Orientation:** Standardized sprite conventions for character facing, movement, and mirroring.
- **Character System:** Three selectable factions (Fabled, Legion, Crusade) with unique recolored sprite sets and faction icons.
- **Fish Species:** 30 distinct species (fish + crabs) across 5 rarity tiers (common, uncommon, rare, legendary, ultra_rare), including 10 ultra-rare variants (The Legendary 10) and 10 beach crab variants.
- **Equipment System:** Diverse range of rods, live baits, artificial lures, and chum items, each affecting gameplay mechanics.
- **Chum System:** Throwable items boosting fish spawns, rarity, and bite speed, activated via hotbar.
- **Rarity System:** 5 tiers with distinct colors, star ratings, sell price multipliers, and reeling difficulty multipliers.
- **Gbux & Market System:** In-game currency "gbux" earned from selling fish, with a dynamic market influenced by demand.
- **Bounty System:** Randomly generated bounties targeting specific fish species with size requirements, rewarding gbux.
- **Attribute Physics System:** An 8-attribute 2D physics-inspired model influencing gameplay elements like fish escape velocity, catch zone movement, and rarity spawns.
- **Fish Behavior:** Detailed swimming patterns, approach mechanics for the hook, and complex reeling behavior for hooked fish.
- **Boat System:** Player can use a boat for open ocean fishing, featuring boarding cutscenes, distinct movement, and fishing mechanics.
- **World Layout (8 Scenes):** A horizontally scrolling world divided into distinct scenes, influencing fish rarity and size.
- **Camera System:** Dynamic camera following the player/boat, clamped to world bounds, with parallax scrolling for background elements and a binoculars mode.
- **Swimming Mechanics:** Jump arc into water with parabolic trajectory, horizontal displacement, and enhanced splash; character sprite rotates based on vertical movement direction.
- **Predator System:** Four types of predators (Shark, Kraken, Sea Devil, Shadow Leviathan) with AI behaviors (patrol, chase, attack, flee), affecting fish and potentially the player. Shadow Leviathan is ultra_rare, spawns 15% in deepest zone with red/black recolored sprites.
- **Guardian Defender:** Merman creature that appears in deep zones (zone 3+). Once per cast, intercepts predator attacks to protect the player's catch. Shows attack animation and shield glow when ready. Resets each cast.
- **Ocean Depth Zones:** Three distinct depth zones (shallow, mid-depth, deep ocean) with visual transitions and varying fish populations.
- **3D Visual Effects:** Includes god rays, underwater particles, depth fog, and caustic light patches.
- **Underwater Plants:** 10 plant types swaying with a wave effect, positioned across the ocean floor.
- **Underwater Background:** Tiled coral reef background image providing ocean floor ambiance.
- **Admin Debug Tools:** Toggleable with backtick key, featuring Asset Deck, Gizmo for object manipulation, and Trace for physics inspection.
- **2D Rope Physics:** Verlet integration fishing line with 12 segments, simulating realistic rope behavior.
- **World Objects System:** Array-based rendering of barrels, grass, and signs, supporting gizmo manipulation.
- **NPC System:** 9 interactive NPCs across pier/dock and beach areas with roles as shopkeepers, requesters, mission givers, and specialists. Includes Chum Charlie, a static sitting NPC on the dock who sells all chum types and periodically plays a chum-making animation.
- **Core Features:** Random fish sizes, combo system, rod leveling, fish collection log, dynamic day/night cycle, weather system, far background parallax, water effects, catch cutscenes, character movement, and an interactive `gameboard.html` reference board.
- **Leaderboard System:** Live leaderboard backed by PostgreSQL with categories for Biggest Single Catch, Most Catches in 20-Minute Session, and Legendary/Ultra-Rare Catches. Scores auto-submit via REST API.
- **PWA Support:** Web App Manifest and Service Worker enable "Install App" / "Add to Home Screen" functionality.

## External Dependencies
- **React:** Frontend JavaScript library.
- **Express:** Node.js web application framework for serving static assets.
- **HTML5 Canvas:** Core technology for 2D graphics rendering.
- **Drizzle ORM:** TypeScript ORM for PostgreSQL.
- **pg:** PostgreSQL client for Node.js.
- **wouter:** Lightweight React router.
- **@tanstack/react-query:** Data fetching and caching for leaderboard API.
- **PostgreSQL (Neon-backed):** Database for leaderboard entries.
- **GrudgeSDK:** Client for Grudge Studio ObjectStore API.

## Recent Changes
- **2026-02-18:** Chum Charlie NPC: New static sitting NPC (id: 8, spriteFolder "8") on the dock at worldX 0.62 (between shops). Sells all 20 non-catchable chum types derived from CHUM_ITEMS. Never walks (noWalk: true), has 4-frame Special.png chum-making animation that plays periodically. Extensive chum-specialist dialogue with stats info. NPC system now supports noWalk and specialFrames properties.
- **2026-02-18:** Legendary Codex GIF: "DOWNLOAD GIF" button on /codex page generates an animated GIF (640x400) of all 10 legendary fish as a book with artwork on left page and lore/stats on right page. Uses gifenc for browser-side encoding. Loops infinitely for Discord embed compatibility.
- **2026-02-18:** Admin Fish Editor: New /adminfish page with fish dropdown, sprite preview canvas with animation player (play/pause/prev/next/speed control), visual overrides (tint, scale), flip toggle, idle/walk sprite switching, AI-powered sprite generation using gpt-image-1, and sprite swap dropdown listing all creature folders from /api/creature-sprites endpoint.
- **2026-02-18:** AI Image Generation: Server-side /api/generate-image endpoint registered via replit_integrations, supports sprite and surface generation for admin tools.
- **2026-02-18:** Whale 2-Frame Animation: Whale sprites use two individual frame images (whale_frame1.png, whale_frame2.png) alternating every ~1.5 seconds instead of a sprite sheet.
- **2026-02-18:** Admin Map Generate Surface: Added AI-powered "Generate Surface" button to admin map for creating underwater background layer images.
- **2026-02-18:** Beach Shop & Fishing License: Added bait shop building and wooden license sign on beach area. Fishing License costs 100 gbux and gates access to the dock/pier area and main equipment shop. Players start on the beach and must earn money from beach fishing/crabs before unlocking the dock. Boat still costs 400 gbux at the pier.
- **2026-02-18:** Crab Bait System: All 10 crabs become consumable live bait when caught. 3 tiers with escalating legendary boosts (1.5x/3.0x/6.0x). Without crab bait, legendary/ultra_rare spawn rates are heavily reduced.
- **2026-02-18:** Added Crimson Crab and Shadow Crab (rare beach crabs). Species count: 30.
- **2026-02-18:** Shadow Leviathan Predator: 4th predator type with red/black recolored sprites in /assets/predators/leviathan/. Ultra_rare, speed 2.8, size 2.8, 1200 points. Spawns 15% in deepest zone (zone 4). Fixed predator folder references from "1","2","3" to actual directory names.
- **2026-02-18:** Guardian Defender: Merman sprite in /assets/guardian/. Automatically appears in deep zones (zone 3+) near the player's hook. Once per cast, intercepts predator steal attacks - knocks predator back, deals damage, shows attack animation with blue particles and shield glow. Resets each new cast.
- **2026-02-18:** Net Tool Overhaul: 7-frame throw animation sprite (NetThrow.png), Netthrown.png sinking phase, Net.png for rising. 49lb weight limit - overweight breaks net (5min cooldown, catch lost). Normal cooldown 10s. Fish icons bob in net during rise. Weight counter display. Hotbar shows cooldown/break status. Rewards only granted on successful retrieval.