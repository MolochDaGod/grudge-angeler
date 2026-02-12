# Pixel Fisher - Fishing Game

## Overview
A pixel art fishing game built with HTML5 Canvas and React. Players cast their fishing line, catch various fish species, and build their collection. Features animated pixel art sprites, day/night cycle, particle effects, and a reeling minigame.

## Architecture
- **Frontend**: React + HTML5 Canvas rendering, fullscreen game
- **Backend**: Express (minimal, serves static assets only)
- **No database needed** - game state is in-memory, client-side only

## Key Files
- `client/src/pages/fishing-game.tsx` - Main game component with all game logic
- `client/src/App.tsx` - App router
- `client/public/assets/` - All pixel art sprite sheets

## Game Mechanics
1. **Title Screen** - Click to start
2. **Idle** - Click to begin casting
3. **Casting** - Power bar mechanic, click to release
4. **Waiting** - Bobber in water, wait for fish
5. **Bite** - Fish bites! Click quickly to start reeling
6. **Reeling** - Mouse-based minigame, keep cursor in green zone
7. **Caught/Missed** - Result shown, click to continue

## Asset Structure
- `assets/fisherman/` - Character sprite sheets (48x48 frames)
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

## Features
- 8 fish species (common, uncommon, rare, legendary)
- 3 junk items including treasure chest
- Combo system for consecutive catches
- Rod leveling (every 5 catches)
- Fish collection log
- Day/night sky cycle
- Water ripples, particles, and screen shake effects
- Character walking on pier (A/D keys)
- Swimming mechanics (Space to dive, WASD underwater, Space near dock to climb out)
