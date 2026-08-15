const RAPIDAPI_HOST = "fragrance-api.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

interface RapidApiFragranceHit {
  id: number;
  name: string;
  popularityScore: number;
  reviewsScoreAvg: number | null;
  reviewsCount: number | null;
  releasedAt: number | null;
  status: string;
  brand: {
    id: number;
    name: string;
  } | null;
  perfumers: { id: number; name: string }[];
  notes: { id: string; name: string }[];
  image: {
    id: number;
    url: string;
  } | null;
}

interface MultiSearchResponse {
  results: {
    indexUid: string;
    hits: RapidApiFragranceHit[];
    estimatedTotalHits: number;
  }[];
}

export interface PerfumeSearchResult {
  id: string;
  name: string;
  brand: string;
  year: number | null;
  rating: number | null;
  image: string | null;
  notes: string[];
  categories: string[];
  description: string;
}

// Mapowanie nut (angielskich identyfikatorów) na polskie kategorie
const NOTE_TO_CATEGORY: Record<string, string[]> = {
  floral: ["Kwiatowe"],
  rose: ["Kwiatowe"],
  jasmine: ["Kwiatowe"],
  "jasmine-sambac": ["Kwiatowe"],
  jasmine_absolute: ["Kwiatowe"],
  tuberose: ["Kwiatowe"],
  "orange-blossom": ["Kwiatowe"],
  neroli: ["Kwiatowe"],
  ylang: ["Kwiatowe"],
  "ylang-ylang": ["Kwiatowe"],
  lilac: ["Kwiatowe"],
  violet: ["Kwiatowe"],
  "violet-leaf": ["Kwiatowe", "Zielone"],
  peony: ["Kwiatowe"],
  magnolia: ["Kwiatowe"],
  iris: ["Kwiatowe"],
  "iris-root": ["Kwiatowe"],
  gardenia: ["Kwiatowe"],
  "freesia": ["Kwiatowe"],
  heliotrope: ["Kwiatowe"],
  "lily-of-the-valley": ["Kwiatowe"],
  muguet: ["Kwiatowe"],
  orchid: ["Kwiatowe"],
  osmanthus: ["Kwiatowe"],
  peony: ["Kwiatowe"],
  carnation: ["Kwiatowe", "Korzenne"],
  woody: ["Drzewne"],
  "cedarwood": ["Drzewne"],
  cedar: ["Drzewne"],
  sandalwood: ["Drzewne"],
  oud: ["Drzewne"],
  agarwood: ["Drzewne"],
  vetiver: ["Drzewne"],
  patchouli: ["Drzewne"],
  oakmoss: ["Drzewne", "Zielone"],
  birch: ["Drzewne"],
  "guaiac-wood": ["Drzewne"],
  guaiac: ["Drzewne"],
  cypress: ["Drzewne"],
  pine: ["Drzewne"],
  cashmere: ["Drzewne"],
  cashmeran: ["Drzewne"],
  "cashmere-wood": ["Drzewne"],
  mahogany: ["Drzewne"],
  citrus: ["Cytrusowe"],
  bergamot: ["Cytrusowe"],
  lemon: ["Cytrusowe"],
  lime: ["Cytrusowe"],
  mandarin: ["Cytrusowe"],
  "mandarin-orange": ["Cytrusowe"],
  orange: ["Cytrusowe"],
  grapefruit: ["Cytrusowe"],
  citron: ["Cytrusowe"],
  yuzu: ["Cytrusowe"],
  kumquat: ["Cytrusowe"],
  "bitter-orange": ["Cytrusowe"],
  spicy: ["Korzenne"],
  pepper: ["Korzenne"],
  "black-pepper": ["Korzenne"],
  "pink-pepper": ["Korzenne"],
  cinnamon: ["Korzenne"],
  cardamom: ["Korzenne"],
  ginger: ["Korzenne"],
  clove: ["Korzenne"],
  nutmeg: ["Korzenne"],
  saffron: ["Korzenne"],
  cumin: ["Korzenne"],
  "star-anise": ["Korzenne"],
  sweet: ["Słodkie"],
  vanilla: ["Słodkie"],
  "tonka-bean": ["Słodkie"],
  caramel: ["Słodkie"],
  honey: ["Słodkie"],
  praline: ["Słodkie"],
  chocolate: ["Słodkie"],
  cocoa: ["Słodkie"],
  sugar: ["Słodkie"],
  marshmallow: ["Słodkie"],
  cottoncandy: ["Słodkie"],
  oriental: ["Orientalne"],
  amber: ["Orientalne", "Ambrowe"],
  incense: ["Orientalne"],
  frankincense: ["Orientalne"],
  myrrh: ["Orientalne"],
  opoponax: ["Orientalne"],
  benzoin: ["Orientalne"],
  "amberwood": ["Orientalne", "Ambrowe"],
  aromatic: ["Aromatyczne"],
  lavender: ["Aromatyczne", "Fougère"],
  rosemary: ["Aromatyczne"],
  sage: ["Aromatyczne"],
  thyme: ["Aromatyczne"],
  basil: ["Aromatyczne"],
  mint: ["Aromatyczne", "Świeże"],
  eucalyptus: ["Aromatyczne", "Świeże"],
  geranium: ["Aromatyczne", "Kwiatowe"],
  leather: ["Skórzane"],
  suede: ["Skórzane"],
  green: ["Zielone"],
  galbanum: ["Zielone"],
  "fig-leaf": ["Zielone"],
  grass: ["Zielone"],
  "tea-leaf": ["Zielone"],
  fern: ["Zielone", "Fougère"],
  fougere: ["Fougère"],
  coumarin: ["Fougère"],
  amber: ["Ambrowe"],
  ambroxan: ["Ambrowe"],
  "white-amber": ["Ambrowe"],
  musky: ["Piżmowe"],
  musk: ["Piżmowe"],
  "white-musk": ["Piżmowe"],
  aquatic: ["Wodne"],
  marine: ["Wodne"],
  "sea-salt": ["Wodne"],
  salt: ["Wodne"],
  ocean: ["Wodne"],
  "ozonic-notes": ["Wodne", "Świeże"],
  watermelon: ["Wodne", "Świeże"],
  fresh: ["Świeże"],
};

function mapNotesToCategories(notes: { id: string; name: string }[]): string[] {
  const categories = new Set<string>();
  for (const note of notes) {
    const key = note.id.toLowerCase();
    const mapped = NOTE_TO_CATEGORY[key];
    if (mapped) {
      for (const cat of mapped) categories.add(cat);
    }
  }
  return Array.from(categories);
}

// Cache w pamięci, żeby nie marnować darmowego limitu (1000 zapytań/mies.)
const cache = new Map<string, { expiresAt: number; data: unknown }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function rapidApiFetch<T>(query: string, limit: number): Promise<T> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error("RAPIDAPI_KEY is not set");
  }

  const body = JSON.stringify({
    queries: [
      {
        indexUid: "fragrances",
        q: query,
        limit,
        attributesToRetrieve: [
          "id",
          "name",
          "popularityScore",
          "reviewsScoreAvg",
          "reviewsCount",
          "releasedAt",
          "status",
          "brand",
          "notes",
          "image",
          "perfumers",
        ],
      },
    ],
  });

  const cacheKey = `q:${query}:l:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const res = await fetch(`${RAPIDAPI_BASE}/multi-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": key,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    body,
    cache: "no-store",
  });

  if (res.status === 429) {
    throw new Error("RAPIDAPI_RATE_LIMITED");
  }

  if (!res.ok) {
    throw new Error(`Fragrance API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as T;
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: json });
  return json;
}

function buildDescription(hit: RapidApiFragranceHit): string {
  const name = hit.name || "";
  const brand = hit.brand?.name || "";
  const year = hit.releasedAt
    ? new Date(hit.releasedAt).getFullYear()
    : null;
  const notes = hit.notes.map((n) => n.name);
  const parts: string[] = [];
  if (brand) {
    parts.push(
      year
        ? `${name} to zapach marki ${brand}, wydany w ${year} roku.`
        : `${name} to zapach marki ${brand}.`,
    );
  }
  if (notes.length > 0) {
    parts.push(`W nutach znajdziemy: ${notes.join(", ")}.`);
  }
  return parts.join(" ");
}

function mapHit(hit: RapidApiFragranceHit): PerfumeSearchResult {
  const year = hit.releasedAt
    ? new Date(hit.releasedAt).getFullYear()
    : null;

  return {
    id: String(hit.id),
    name: hit.name,
    brand: hit.brand?.name || "",
    year,
    rating: hit.reviewsScoreAvg,
    image: hit.image?.url || null,
    notes: hit.notes.map((n) => n.name),
    categories: mapNotesToCategories(hit.notes),
    description: buildDescription(hit),
  };
}

export async function searchPerfumes(
  query: string,
  limit = 5,
): Promise<PerfumeSearchResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const data = await rapidApiFetch<MultiSearchResponse>(q, limit);

  const hits = data.results?.[0]?.hits || [];
  return hits
    .filter((h) => h.status === "published")
    .map(mapHit);
}
