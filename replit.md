# Pixel Fisher - Fishing Game

## Overview
A pixel art fishing game built with HTML5 Canvas and React. Players cast their fishing line, catch various fish species, and build their collection. Features animated pixel art sprites, day/night cycle, particle effects, and a reeling minigame.

## Architecture
- **Frontend**: React + HTML5 Canvas rendering, fullscreen game
- **Backend**: Express (minimal, serves static assets only)
- **No database needed** - game state is in-memory, client-side only
- **Info Page**: Static HTML at `/info.html` - game advertisement/guide with all fish, equipment, and how-to

## Key Files
- `client/src/pages/fishing-game.tsx` - Main game component with all game logic
- `client/src/App.tsx` - App router
- `client/public/assets/` - All pixel art sprite sheets
- `client/public/info.html` - Game info/advertisement page

## Game Flow
1. **Title Screen** - Animated sea creatures + "CLICK TO ENTER"
2. **Character Select** - HTML overlay: pick character variant + enter username
3. **Idle** - Click to begin casting, A/D to walk on pier, Space to dive, E near hut to open shop
4. **Casting** - Mouse-aim crosshair system: move mouse to aim where bobber lands, click to cast
5. **Waiting** - Bobber in water, fish swim nearby; lure effects modify bite timing and fish attraction
6. **Bite** - Fish grabs line! Click to start reeling
7. **Reeling** - Palworld-style minigame; rod stats affect catch zone width, reel speed, and line strength
8. **Caught** - Celebration popup with fish image, weight, rarity, sell price, and bounty completion
9. **Store** - Full-screen shop overlay with Rod (5 types) and Bait & Lures (16 types: 5 live bait + 11 artificial lures) tabs, buy/equip system

## Asset Structure
- `assets/fisherman/` - Classic character sprite sheets (48x48 frames)
- `assets/fisherman2/` - Ocean Blue character sprite sheets
- `assets/fisherman3/` - Crimson character sprite sheets
- `assets/creatures/1-6/` - Sea creature animations (Idle, Walk, Attack, etc.)
- `assets/catch/` - Caught fish/item sprites
- `assets/objects/` - Scene objects (pier, boat, hut, barrels)
- `assets/icons/` - UI icons (32x32)

## Sprite Orientation Convention
- All fisherman sprites default to facing RIGHT in sprite sheets
- Fishing states (idle, casting, waiting, bite, reeling, caught, missed) flip sprites with `flipX=true` so character faces LEFT toward water
- Walking/swimming sprites use `s.facingLeft` to face direction of movement
- Rod tip coords are mirrored when flipped: `(SPRITE_FRAME_W - 1 - tipLocal[0]) * SCALE`
- Reeling minigame (Palworld-style): horizontal bar with fish icon, catch zone moves LEFT on click (2x speed), drifts RIGHT when released; circular progress gauge fills/depletes based on alignment

## Character System
- 3 selectable variants: Classic (no tint), Ocean Blue, Crimson
- Each has a full set of 12 recolored sprite PNGs in their own folder
- Selected on character selection screen (HTML overlay) before game start

## Fish Species (17 total)
- **Common (3)**: Minnow, Perch, Eel
- **Uncommon (3)**: Bass, Catfish, Salmon
- **Rare (1)**: Swordfish
- **Legendary (1)**: Whale
- **Ultra Rare (9)**: Phantom Minnow, Volcanic Perch, Abyssal Bass, Frost Catfish, Storm Swordfish, Celestial Whale, Neon Eel, Golden Salmon, Shadow Leviathan
- Ultra-rare fish use tinted sprites (canvas globalCompositeOperation "source-atop") with glowing auras
- Ultra-rare fish have baseScale multiplier for larger default sizes
- Ultra-rare fish have extremely low spawn weights, boosted by distance from shore and lure rarityBoost

## Equipment System
- **Rods** (5): Bamboo, Fiberglass, Carbon, Titanium, Legendary - affect catch zone, reel speed, line strength
- **Live Bait** (5): Basic Worm, Nightcrawler, Leech, Maggots, Minnow Bait - organic baits with unique fish attraction
- **Lures** (11): Beginner Lure, Crankbait, Silver Spoon, Grub Worm, Spinnerbait, Deep Diver, Golden Fly, Glow Jig, Storm Shad, Kraken Bait, Prismatic - artificial lures affecting rarity boost, size boost, bite speed, and targeted fish attraction
- Each bait/lure has a `type` field ("live" or "lure") for shop categorization
- Equipment purchased with money from fishing hut shop (E key near hut)

## Rarity System
- 5 tiers: common, uncommon, rare, legendary, ultra_rare
- Colors: common=#94a3b8, uncommon=#22c55e, rare=#a855f7, legendary=#f59e0b, ultra_rare=#ff2d55
- Sell price multipliers: common=1x, uncommon=1.8x, rare=3x, legendary=5x, ultra_rare=10x
- Reeling difficulty multipliers: common=1x, uncommon=1.15x, rare=1.4x, legendary=1.8x, ultra_rare=2.2x

## Money & Market System
- Fish sell for money based on rarity * weight * size * demand multiplier
- Market dynamics: prices drop when same fish sold repeatedly (0.12 per sale), recover over time (1 per 600 ticks)
- Minimum demand multiplier: 0.3
- Money used to purchase rods and lures at the fishing hut shop

## Bounty System
- 3 random bounties generated at game start
- Each bounty targets a fish species with minimum size requirement
- Bounty rewards added to money on fulfillment
- New bounties generated when all are completed

## Billboard System
- Canvas-rendered sign near the fishing hut
- 4-slide rotation: Bounties, Records, Deals, Logo
- Auto-cycles every 300 ticks

## Fish Behavior
- SwimmingFish have wobblePhase/wobbleAmp for vertical bobbing, dirChangeTimer for random direction changes
- Fish approach hook when selected (approachingHook flag), swim toward hook position
- Hooked fish (during bite/reeling) stored as hookedFishX/Y/Dir/Frame/VX state fields
- Line renders from rod tip to fish mouth position using bezier curve
- Alignment: horizontal distance between player and hooked fish affects difficulty (alignmentBonus 0.6-1.0)

## Boat System
- Press E near boat (left end of pier) to trigger boat prompt
- Clicking "Yes" starts boarding cutscene: fisherman walks to boat edge, hops onto boat
- Boarding has 3 phases: walk (phase 0), jump (phase 1), land (phase 2)
- GameState "boarding" handles cutscene, transitions to "idle" with inBoat=true
- When inBoat: A/D moves the entire boat left/right on water, fisherman rides on deck
- Fishing mechanics work identically from boat (cast, wait, reel, catch)
- boatX tracks boat horizontal position; fisherman position derived from boatX + offset
- Fisherman bobs with boat using boatBobVal
- Press E near pier to exit boat (returns to pier walking)
- Boat movement speed: 2.0 normal, 1.5 during reeling

## Camera System
- cameraX state tracks horizontal camera offset (positive = scrolled left into ocean)
- Camera follows boat: `targetCameraX = max(0, W/2 - boatCenterX)` with smooth interpolation
- `ctx.translate(s.cameraX, 0)` applied to all world-space rendering (water, pier, boat, fish, particles)
- Screen-space UI (catch display, flash, title) rendered after `ctx.restore()` of camera transform
- Visible area in world coords: `viewL = -cameraX`, `viewR = -cameraX + W`
- Mouse input converted to world coords for aiming: `mouseX - cameraX`
- Mountains have 20% parallax (slower scrolling)
- Water effects (shimmer, waves, caustics, rays, bubbles) render relative to visible area
- Fish culling uses camera-relative bounds with 300px margin
- Distance-based fish spawning: rarer fish spawn more frequently further from shore

## Features
- 17 fish species across 5 rarity tiers (common, uncommon, rare, legendary, ultra_rare)
- 9 ultra-rare tinted/glowing variants with massive sizes
- 3 junk items including treasure chest
- Random fish sizes (0.5x-5x) affecting score, weight, difficulty
- Combo system for consecutive catches
- Rod leveling (every 5 catches)
- Fish collection log with detailed stats (biggest size, total weight, rarity badges)
- Day/night sky cycle
- Water ripples, particles, and screen shake effects
- Character walking on pier (A/D keys)
- Swimming mechanics (Space to dive, WASD underwater, Space near dock to climb out)
- Boat boarding cutscene and boat fishing (E to enter/exit)
- Camera scrolling system following boat into open ocean (up to 3 screens left)
- Info/advertisement page at /info.html
