# Grudge Angeler - Fishing Game

## Overview
Grudge Angeler is a pixel art fishing game developed with HTML5 Canvas and React, offering players an immersive fishing experience. The game features animated pixel art, a dynamic day/night cycle, sophisticated particle effects, and an engaging reeling minigame. Its purpose is to deliver a compelling and visually appealing fishing simulation, leveraging modern web technologies to create an immersive experience. The project aims to provide a rich fishing experience, allowing players to cast lines, catch diverse fish species, and expand their collection.

## User Preferences
I want to prioritize iterative development. I prefer detailed explanations for complex features. Ask before making major changes to the core game loop or architectural decisions. Do not make changes to files in the `client/public/assets/` folder.

## System Architecture
The game utilizes a React frontend with HTML5 Canvas for rendering, ensuring a fullscreen, immersive experience. The backend is a minimal Express server primarily for serving static assets, as game state is managed client-side in-memory.

**UI/UX and Design:**
- **Pixel Art:** Consistent pixel art aesthetic across all game assets.
- **Character Selection:** HTML overlay for character variant selection (Fabled/Legion/Crusade/Rogue/Engineer/Ranger) with unique backgrounds and username input.
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
- **Character System:** Six selectable character variants (Fabled, Legion, Crusade, Rogue, Engineer, Ranger) with unique recolored sprite sets and faction icons.
- **Fish Species:** 53 distinct species (43 fish + 10 crabs) across 5 rarity tiers (common, uncommon, rare, legendary, ultra_rare), including 10 ultra-rare variants (The Legendary 10) and 10 beach crab variants.
- **Fish Sizing System:** Normalized baseScale values for all 43 fish types ensuring consistent on-screen sizes by rarity tier. Formula: `creatureScale = SCALE * 0.65 * sizeMultiplier * baseScale`. Target sizes: common ~30-50px, uncommon ~50-70px, rare ~80-110px, legendary ~200-300px, ultra_rare ~80-350px.
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
- **2026-02-18:** Daily Tournament System: 6-8 PM CST daily tournaments with 10,000 GBUX prize pool. Players compete in 20-minute catch cycles during the window, with best cycle auto-submitted. Composite scoring based on total caught, total weight, largest catch, and rarity score. Top 10 players receive prizes (3500/2000/1500/1000/800/500/400/200/50/50). PostgreSQL-backed with tournament_entries table. Purple-themed HUD shows live stats, countdown, and rank. Clickable overlay shows full standings. Discord webhook announces tournament results.
- **2026-02-18:** Stingray 2-Frame Animation: Stingray now uses two individual frame images (frames/1.png, frames/2.png) alternating every ~1.5 seconds, same approach as Whale.
- **2026-02-18:** Treasure Chest System: Golden glowing treasure chest placed at the deepest point of the ocean floor. Contains The Seal at the Seam coin (5000 pts, ultra_rare). Seal no longer spawns as a swimming fish. To open the chest, hook must reach it with either: (a) depth lure + active chum, or (b) catching 8+ fish in the deep zone causes "zone fatigue" reducing bite rate by 10% per catch, allowing the hook to sink undisturbed. Chest sparkles with orbiting golden particles.
- **2026-02-18:** Catfish Adjustments: Uses static catch image (staticImg) instead of animated sprites. bottomDweller flag keeps it near ocean floor. minDepth lowered from 0.45 to 0.15 for shallow water access.
- **2026-02-18:** In-Game Minimap: Top-right corner minimap showing admin map zones (loaded from localStorage), pier, beach slope, depth slope line, player dot (with beach Y tracking), and camera viewport rectangle. Hidden during title/charSelect/intro/binoculars.
- **2026-02-18:** Beach Walking: Fisherman Y position follows beach slope when on beach (beachY = pierY + 10 + progress * 30). Spacebar triggers cast/net throw from idle state (same as click).
- **2026-02-18:** Net Size Fix: Net visual width = 3x fisherman width (FRAME_H * SCALE * 3 = 576px). Catch area matches visual. Proper aspect ratio rendering for Netthrown.png and Net.png sprites.
- **2026-02-18:** Depth Surface Background: AI-generated underwater surface image (underwater_surface_depth.png) rendered along ocean floor following depth slope, at 45% opacity behind plants/fish.
- **2026-02-19:** Sand Area Boundaries: Fish now respect admin map sand zones (isSand areas). Fish cannot spawn in or swim through sand areas - they bounce off the sand line boundary. Sand areas are loaded from admin map localStorage and scaled to match game coordinates. Both spawn position and movement are checked.
- **2026-02-19:** Bait Shop Position Persistence: Bait shop offsetX, offsetY, and scale now save to localStorage (grudge-angeler-baitshop-pos) when moved via gizmo. Position loads on game start so it stays where placed.
- **2026-02-19:** Legendary Codex Animations: Fish sprites have CSS wiggle/swim animations (unique timing per fish). Art images have gentle floating animation. Fish sprites scaled proportionally by real-world size using logarithmic mapping. Size labels show feet/inches.
- **2026-02-23:** Fish Sizing Normalization: Audited all 43 fish sprite dimensions and normalized baseScale values by rarity tier. Fixed invisible fish (FreshBass 10px, Anchovy 13px) and oversized fish (Clownfish 210px, Lionfish 275px). All species now render at consistent sizes appropriate for their rarity.
- **2026-02-23:** Redfish Sprite Replacement: Replaced tiny 40x12 pixel Redfish Walk.png/Idle.png with new 192x48 (4 frames at 48x48 each) sprites recolored from Salmon. Generated matching catch icon. Updated walkFrames/idleFrames to 4, baseScale to 0.48.
- **2026-02-23:** Hooked Fish Rendering Fix: Fish on the line during reeling now apply baseScale for proper sizing. Computes actual frame dimensions from loaded sprite, applies baseScale, enforces minimum 80px display via `Math.max(swimScale, minHookScale * hookedFishSize)`. Fixed fishSpriteW to use actual hookFrameW.
- **2026-02-23:** Character Variants Expanded: Added Rogue, Engineer, and Ranger character variants (fisherman4/5/6 sprite folders), bringing total from 3 to 6 selectable characters.
- **2026-02-23:** Gameboard Encyclopedia Updated: Added 3 new character variants to gameboard.html, updated section counts and descriptions to match current game state.
