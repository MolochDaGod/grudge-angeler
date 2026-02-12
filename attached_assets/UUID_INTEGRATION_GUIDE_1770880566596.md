# GRUDGE UUID Integration Guide for Data Exports

## Overview

All game master data files in `data-exports/` now use the **GRUDGE UUID system** for unique identification and tracking. This document explains the UUID format, generation rules, and usage guidelines.

---

## UUID Format

### Structure
```
PREFIX-TIMESTAMP-SEQUENCE-HASH
```

**Example**: `MATL-20260125164209-000001-3BC8B2DC`

### Components

| Component | Description | Format | Example |
|-----------|-------------|--------|---------|
| **PREFIX** | Entity type identifier | 4 uppercase letters | `MATL`, `RECP`, `NODE` |
| **TIMESTAMP** | Generation timestamp | YYYYMMDDHHMMSS (14 digits) | `20260125164209` |
| **SEQUENCE** | Sequential counter | 6 hex digits | `000001`, `0000FF` |
| **HASH** | SHA256 hash of metadata | 8 hex digits | `3BC8B2DC` |

---

## UUID Prefixes

| Prefix | Entity Type | Used In |
|--------|-------------|---------|
| `MATL` | Materials | MASTER_MATERIALS.csv |
| `RECP` | Recipes | COMPLETE_*_RECIPES.csv |
| `NODE` | Gathering Nodes | GATHERING_NODES.csv |
| `MOBS` | Mob Drops | MOB_DROP_TABLES.csv |
| `BOSS` | Boss Loot | BOSS_LOOT_TABLES.csv |
| `MISS` | Missions | DAILY_MISSION_REWARDS.csv |
| `INFU` | Infusions | INFUSION_MATERIALS.csv |

---

## Files with UUIDs

### ✅ Completed Integration

1. **MASTER_MATERIALS.csv** (199 materials)
   - Column: `GrudgeUUID` (position 2, after MaterialID)
   - Prefix: `MATL`
   - Total UUIDs: 199

2. **COMPLETE_MINER_RECIPES.csv** (162 recipes)
   - Column: `GrudgeUUID` (position 2, after RecipeID)
   - Prefix: `RECP`
   - Total UUIDs: 162

3. **COMPLETE_FORESTER_RECIPES.csv** (103 recipes)
   - Column: `GrudgeUUID` (position 2, after RecipeID)
   - Prefix: `RECP`
   - Total UUIDs: 103

4. **COMPLETE_CHEF_RECIPES.csv** (66 recipes)
   - Column: `GrudgeUUID` (position 2, after RecipeID)
   - Prefix: `RECP`
   - Total UUIDs: 66

5. **GATHERING_NODES.csv** (103 nodes)
   - Column: `GrudgeUUID` (position 2)
   - Prefix: `NODE`
   - Total UUIDs: 103

6. **MOB_DROP_TABLES.csv** (32 entries)
   - Column: `GrudgeUUID` (position 1, first column)
   - Prefix: `MOBS`
   - Total UUIDs: 32

7. **BOSS_LOOT_TABLES.csv** (26 bosses)
   - Column: `GrudgeUUID` (position 1, first column)
   - Prefix: `BOSS`
   - Total UUIDs: 26

8. **DAILY_MISSION_REWARDS.csv** (37 missions)
   - Column: `GrudgeUUID` (position 1, first column)
   - Prefix: `MISS`
   - Total UUIDs: 37

9. **INFUSION_MATERIALS.csv** (20 infusions)
   - Column: `GrudgeUUID` (position 2, after InfusionID)
   - Prefix: `INFU`
   - Total UUIDs: 20

**Total UUIDs Generated**: 748

---

## UUID Generation

### Automated Script

Use the Python script to generate/regenerate UUIDs:

```bash
python data-exports/generate-uuids.py
```

### Manual Generation

If you need to manually generate a UUID, follow this format:

```python
import hashlib
from datetime import datetime

def generate_grudge_uuid(prefix, metadata):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    sequence = f"{counter:06X}"  # Increment counter
    hash_val = hashlib.sha256(str(metadata).encode()).hexdigest()[:8].upper()
    return f"{prefix}-{timestamp}-{sequence}-{hash_val}"
```

---

## Integration with UUID Ledger

### Database Tables

UUIDs from data-exports integrate with the server-side UUID tracking system:

- **`uuid_ledger`** - Append-only transaction log for all UUID events
- **`uuidValidationCache`** - Quick lookup cache for UUID validation

### Event Types

When items from data-exports are used in-game, they trigger UUID events:

| Event | Description |
|-------|-------------|
| `CREATED` | UUID generated (drops, rewards, crafting output) |
| `ASSIGNED` | UUID attached to user account |
| `EQUIPPED` | Item equipped to character |
| `UNEQUIPPED` | Item removed from character |
| `UPGRADED` | Item upgraded to new tier (old UUID archived) |
| `CONSUMED` | Item used in crafting or consumed |
| `TRANSFERRED` | Ownership transferred between accounts |
| `DESTROYED` | Item permanently destroyed |
| `ARCHIVED` | UUID moved to archive (superseded by upgrade) |

---

## Best Practices

### ✅ DO

- Always use the automated script to generate UUIDs
- Preserve existing UUIDs when updating CSV files
- Include GrudgeUUID in all new data export files
- Use appropriate PREFIX for entity type
- Log UUID events to uuid_ledger when items are used in-game

### ❌ DON'T

- Manually create UUIDs without the script
- Reuse UUIDs across different entities
- Delete or modify existing UUIDs
- Skip UUID generation for new items
- Use UUIDs from one entity type for another

---

## Future Additions

When creating new CSV files for data-exports:

1. Choose appropriate PREFIX (4 uppercase letters)
2. Add PREFIX to `PREFIX_MAP` in `generate-uuids.py`
3. Add function call in main execution section
4. Run script to generate UUIDs
5. Update this documentation

---

## Troubleshooting

### UUIDs Not Generated

- Check file exists in `data-exports/` directory
- Verify CSV has proper header row
- Ensure file is not corrupted
- Run script with Python 3.6+

### Duplicate UUIDs

- UUIDs are unique by design (timestamp + sequence + hash)
- If duplicates found, regenerate with script
- Check sequence counter is incrementing

### Missing GrudgeUUID Column

- Run `generate-uuids.py` to add column
- Script automatically inserts column at correct position

---

## Related Documentation

- **Server UUID System**: `server/grudgeUuid.ts`
- **UUID Schema**: `shared/schema.ts` (lines 1154-1230)
- **UUID Documentation**: `docs/UUID_SYSTEM.md`
- **Storage Layer**: `server/storage.ts` (UUID methods)

---

**Last Updated**: 2026-01-25  
**Total UUIDs**: 748  
**Script Version**: 1.0

