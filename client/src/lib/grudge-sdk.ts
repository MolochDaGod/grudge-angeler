const DEFAULT_BASE_URL = 'https://grudge-studio.github.io/ObjectStore';

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface WeaponItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface CategoryData {
  items: WeaponItem[];
  [key: string]: any;
}

interface WeaponsData {
  categories: Record<string, CategoryData>;
}

interface MaterialItem {
  id: string;
  name: string;
  tier?: number;
  gatheredBy?: string;
  [key: string]: any;
}

interface MaterialCategoryData {
  items: MaterialItem[];
  [key: string]: any;
}

interface MaterialsData {
  categories: Record<string, MaterialCategoryData>;
}

interface ArmorData {
  slots: Record<string, any>;
}

interface SearchResults {
  weapons: (WeaponItem & { category: string })[];
  materials: (MaterialItem & { category: string })[];
  armor: any[];
  consumables: any[];
}

export class GrudgeSDK {
  private baseUrl: string;
  private cache: Map<string, CacheEntry>;
  private cacheExpiry: number;

  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000;
  }

  async fetch(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const cached = this.cache.get(url);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(url, { data, timestamp: Date.now() });
    return data;
  }

  clearCache() {
    this.cache.clear();
  }

  async getWeapons(): Promise<WeaponsData> {
    return this.fetch('/api/v1/weapons.json');
  }

  async getWeaponsByCategory(category: string): Promise<CategoryData | null> {
    const data = await this.getWeapons();
    return data.categories[category] || null;
  }

  async getWeapon(weaponId: string): Promise<WeaponItem | null> {
    const data = await this.getWeapons();
    for (const category of Object.values(data.categories)) {
      const weapon = category.items.find((w: WeaponItem) => w.id === weaponId);
      if (weapon) return weapon;
    }
    return null;
  }

  async getWeaponCategories(): Promise<string[]> {
    const data = await this.getWeapons();
    return Object.keys(data.categories);
  }

  async getMaterials(): Promise<MaterialsData> {
    return this.fetch('/api/v1/materials.json');
  }

  async getMaterialsByCategory(category: string): Promise<MaterialCategoryData | null> {
    const data = await this.getMaterials();
    return data.categories[category] || null;
  }

  async getMaterialsByTier(tier: number): Promise<MaterialItem[]> {
    const data = await this.getMaterials();
    const results: MaterialItem[] = [];
    for (const category of Object.values(data.categories)) {
      results.push(...category.items.filter((m: MaterialItem) => m.tier === tier));
    }
    return results;
  }

  async getMaterialsByProfession(profession: string): Promise<MaterialItem[]> {
    const data = await this.getMaterials();
    const results: MaterialItem[] = [];
    for (const category of Object.values(data.categories)) {
      results.push(...category.items.filter((m: MaterialItem) => m.gatheredBy === profession));
    }
    return results;
  }

  async getArmor(): Promise<ArmorData> {
    return this.fetch('/api/v1/armor.json');
  }

  async getArmorBySlot(slot: string): Promise<any | null> {
    const data = await this.getArmor();
    return data.slots[slot] || null;
  }

  async getConsumables(): Promise<any> {
    return this.fetch('/api/v1/consumables.json');
  }

  async getIcons(): Promise<any> {
    return this.fetch('/api/v1/icons.json');
  }

  getWeaponIconUrl(category: string, index: number, tier = 1): string | null {
    const iconConfigs: Record<string, { base: string; max: number; lowercase?: boolean; offset?: number }> = {
      swords: { base: 'Sword', max: 40 },
      axes1h: { base: 'Axe', max: 30 },
      daggers: { base: 'Dagger', max: 30 },
      bows: { base: 'Bow', max: 30 },
      crossbows: { base: 'Crossbow', max: 30 },
      hammers1h: { base: 'Hammer', max: 25 },
      spears: { base: 'Spear', max: 30 },
      fireStaves: { base: 'staff', max: 60, lowercase: true },
      frostStaves: { base: 'staff', max: 60, lowercase: true, offset: 10 },
      holyStaves: { base: 'staff', max: 60, lowercase: true, offset: 20 },
    };

    const config = iconConfigs[category];
    if (!config) return null;

    const offset = config.offset || 0;
    const idx = ((index + offset + (tier - 1) * 3) % config.max) + 1;
    const suffix = config.lowercase ? `${idx}.png` : `${String(idx).padStart(2, '0')}.png`;

    return `${this.baseUrl}/icons/weapons/${config.base}_${suffix}`;
  }

  getArmorIconUrl(slot: string, tier = 1): string | null {
    const slotBases: Record<string, string> = {
      helm: 'Helm', chest: 'Chest', boots: 'Boots', gloves: 'Gloves',
      pants: 'Pants', belt: 'Belt', shoulder: 'Shoulder', bracer: 'Bracer',
      ring: 'Ring', necklace: 'necklace', back: 'Back'
    };

    const base = slotBases[slot];
    if (!base) return null;

    const idx = String(tier * 5).padStart(2, '0');
    return `${this.baseUrl}/icons/armor/${base}_${idx}.png`;
  }

  getMaterialIconUrl(category: string, tier = 1): string | null {
    const base = ['essence', 'gem', 'infusion'].includes(category) ? 'Loot' : 'Res';
    const idx = String(tier * 5).padStart(2, '0');
    return `${this.baseUrl}/icons/resources/${base}_${idx}.png`;
  }

  async search(query: string): Promise<SearchResults> {
    const lower = query.toLowerCase();
    const results: SearchResults = { weapons: [], materials: [], armor: [], consumables: [] };

    const [weapons, materials] = await Promise.all([
      this.getWeapons(),
      this.getMaterials(),
    ]);

    for (const [cat, data] of Object.entries(weapons.categories)) {
      results.weapons.push(...data.items.filter((w: WeaponItem) =>
        w.name.toLowerCase().includes(lower) || w.id.includes(lower)
      ).map((w: WeaponItem) => ({ ...w, category: cat })));
    }

    for (const [cat, data] of Object.entries(materials.categories)) {
      results.materials.push(...data.items.filter((m: MaterialItem) =>
        m.name.toLowerCase().includes(lower) || m.id.includes(lower)
      ).map((m: MaterialItem) => ({ ...m, category: cat })));
    }

    return results;
  }

  getDatabaseInfo() {
    return {
      provider: 'Supabase',
      type: 'PostgreSQL',
      schemas: {
        studio_core: ['accounts', 'sessions', 'api_keys'],
        warlord_crafting: ['characters', 'inventory_items', 'crafted_items', 'islands', 'battle_history'],
      },
      publicEndpoints: {
        weapons: `${this.baseUrl}/api/v1/weapons.json`,
        materials: `${this.baseUrl}/api/v1/materials.json`,
        armor: `${this.baseUrl}/api/v1/armor.json`,
        consumables: `${this.baseUrl}/api/v1/consumables.json`,
      },
      docs: `${this.baseUrl}/docs/`,
    };
  }
}

export const grudgeSDK = new GrudgeSDK();
