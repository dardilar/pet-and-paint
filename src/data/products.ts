export type ProductKey = 'hoodie' | 'kit';
export type StyleKey = 'face' | 'both' | 'kit';

export interface ProductInfo {
  name: string;
  emoji: string;
  styles: Partial<Record<StyleKey, number>>;
}

export const PRODUCTS: Record<ProductKey, ProductInfo> = {
  hoodie: {
    name: 'Sudadera',
    emoji: '🧥',
    styles: { face: 279000, both: 299000 },
  },

  kit: {
    name: 'Kit de Pintura',
    emoji: '🎨',
    styles: { kit: 70000 },
  },
};

export const STYLES: Record<StyleKey, { name: string; emoji: string }> = {
  face: { name: 'Cara de Mascota', emoji: '🐶' },
  both: { name: 'Cara + Huella de Mascota', emoji: '🐶🐾' },
  kit: { name: 'Kit de Pintura', emoji: '🎨' },
};

export const STYLE_KEYS: StyleKey[] = ['face', 'both', 'kit'];

export function getStyleKeys(product: ProductKey): StyleKey[] {
  return STYLE_KEYS.filter((key) => PRODUCTS[product].styles[key] !== undefined);
}

export const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;
export type Size = (typeof SIZES)[number];

const COP_FORMATTER = new Intl.NumberFormat('es-CO');

export function formatPrice(price: number): string {
  return `${COP_FORMATTER.format(price)} COP`;
}

export function getPrice(product: ProductKey, style: StyleKey): number {
  return PRODUCTS[product].styles[style] ?? 0;
}

export function getMinPrice(product: ProductKey): number {
  const prices = Object.values(PRODUCTS[product].styles).filter(
    (price): price is number => price !== undefined,
  );
  return Math.min(...prices);
}
