export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Known allergen keywords mapping to codes
const ALLERGEN_MAP: Record<string, string> = {
  'gluten': 'A', 'weizen': 'A', 'roggen': 'A', 'gerste': 'A', 'hafer': 'A', 'dinkel': 'A', 'mehl': 'A',
  'krebstier': 'B', 'garnele': 'B', 'krabbe': 'B', 'hummer': 'B', 'shrimp': 'B',
  'ei': 'C', 'eier': 'C', 'eigelb': 'C', 'eiweiß': 'C',
  'fisch': 'D', 'lachs': 'D', 'forelle': 'D', 'kabeljau': 'D', 'thunfisch': 'D', 'zander': 'D',
  'erdnuss': 'E', 'erdnüsse': 'E',
  'soja': 'F', 'tofu': 'F', 'sojasauce': 'F',
  'milch': 'G', 'sahne': 'G', 'butter': 'G', 'käse': 'G', 'rahm': 'G', 'joghurt': 'G', 'topfen': 'G',
  'obers': 'G', 'schlagobers': 'G', 'mascarpone': 'G', 'parmesan': 'G', 'mozzarella': 'G', 'gouda': 'G',
  'mandel': 'H', 'haselnuss': 'H', 'walnuss': 'H', 'cashew': 'H', 'pistazie': 'H', 'nuss': 'H', 'nüsse': 'H',
  'sellerie': 'L', 'knollensellerie': 'L', 'stangensellerie': 'L',
  'senf': 'M',
  'sesam': 'N',
  'sulfit': 'O', 'sulfite': 'O', 'schwefeldioxid': 'O', 'wein': 'O', 'essig': 'O',
  'lupine': 'P', 'lupinen': 'P',
  'weichtier': 'R', 'muschel': 'R', 'tintenfisch': 'R', 'oktopus': 'R', 'schnecke': 'R',
};

// Detect allergens from ingredient list
function detectAllergens(ingredients: string[]): string {
  const codes = new Set<string>();
  for (const ing of ingredients) {
    const lower = ing.toLowerCase();
    for (const [keyword, code] of Object.entries(ALLERGEN_MAP)) {
      if (lower.includes(keyword)) codes.add(code);
    }
  }
  return [...codes].sort().join('');
}

// Detect dish category from name and ingredients
function detectCategory(name: string, ingredients: string[]): string {
  const lower = name.toLowerCase();
  const allText = (name + ' ' + ingredients.join(' ')).toLowerCase();

  if (lower.includes('suppe') || lower.includes('brühe') || lower.includes('eintopf')) return 'suppe';
  if (lower.includes('kuchen') || lower.includes('torte') || lower.includes('mousse') ||
      lower.includes('creme') || lower.includes('dessert') || lower.includes('eis') ||
      lower.includes('tiramisu') || lower.includes('panna cotta')) return 'dessert';
  if (lower.includes('salat') && !allText.includes('fleisch')) return 'vegetarisch';
  if (allText.includes('tofu') || allText.includes('vegetarisch') || allText.includes('vegan')) return 'vegetarisch';
  if (allText.includes('lachs') || allText.includes('fisch') || allText.includes('forelle') ||
      allText.includes('zander') || allText.includes('kabeljau') || allText.includes('garnele')) return 'fisch';
  if (allText.includes('reis') || allText.includes('nudel') || allText.includes('kartoffel') ||
      allText.includes('pommes') || allText.includes('knödel') || allText.includes('spätzle')) {
    if (!allText.includes('fleisch') && !allText.includes('huhn') && !allText.includes('rind') && !allText.includes('schwein')) {
      return 'beilage';
    }
  }
  return 'fleisch';
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: 'URL erforderlich' }, { status: 400 });
  }

  try {
    // Fetch the page
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MenuplanBot/1.0)' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Seite nicht erreichbar (${res.status})` }, { status: 502 });
    }
    const html = await res.text();

    // Try JSON-LD first (most recipe sites use this)
    let recipeName = '';
    let ingredients: string[] = [];
    let instructions = '';
    let imageUrl = '';
    let prepTime = 0;

    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonStr = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const data = JSON.parse(jsonStr);
          const recipes = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
          for (const item of recipes) {
            if (item['@type'] === 'Recipe' || item['@type']?.includes?.('Recipe')) {
              recipeName = item.name || '';
              imageUrl = Array.isArray(item.image) ? item.image[0] : (typeof item.image === 'string' ? item.image : item.image?.url || '');
              instructions = Array.isArray(item.recipeInstructions)
                ? item.recipeInstructions.map((s: { text?: string } | string) => typeof s === 'string' ? s : s.text || '').join('\n')
                : (item.recipeInstructions || '');
              ingredients = (item.recipeIngredient || []).map((i: string) => String(i));
              // Parse prep time from ISO 8601 duration
              const timeStr = item.totalTime || item.cookTime || item.prepTime || '';
              const timeMatch = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
              if (timeMatch) {
                prepTime = (parseInt(timeMatch[1] || '0') * 60) + parseInt(timeMatch[2] || '0');
              }
              break;
            }
          }
          if (recipeName) break;
        } catch { /* ignore parse errors */ }
      }
    }

    // Fallback: parse HTML meta tags and common patterns
    if (!recipeName) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      recipeName = titleMatch ? titleMatch[1].replace(/\s*[-|–].*$/, '').trim() : 'Importiertes Rezept';
    }
    if (!imageUrl) {
      const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      imageUrl = ogImage ? ogImage[1] : '';
    }
    if (ingredients.length === 0) {
      // Try to find ingredient list items
      const ingMatches = html.match(/<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/li>/gi);
      if (ingMatches) {
        ingredients = ingMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      }
    }

    // Detect allergens and category
    const allergens = detectAllergens(ingredients);
    const category = detectCategory(recipeName, ingredients);

    // Check if dish already exists
    const existing = db.prepare('SELECT id FROM dishes WHERE name = ?').get(recipeName) as { id: number } | undefined;

    return NextResponse.json({
      name: recipeName,
      ingredients,
      allergens,
      category,
      instructions: instructions.slice(0, 2000),
      prepTime,
      imageUrl,
      existingDishId: existing?.id || null,
      source: url,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Import fehlgeschlagen: ' + (err as Error).message }, { status: 500 });
  }
}
