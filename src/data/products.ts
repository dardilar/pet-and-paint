export type ProductKey = 'hoodie' | 'kit';
export type StyleKey = 'face' | 'paw' | 'both';

export interface ProductInfo {
  name: string;
  emoji: string;
  styles: Record<StyleKey, number>;
}

export const PRODUCTS: Record<ProductKey, ProductInfo> = {
  hoodie: {
    name: 'Sudadera',
    emoji: '🧥',
    styles: { face: 89990, paw: 89990, both: 99990 },
  },
  kit: {
    name: 'Kit de Pintura',
    emoji: '🎨',
    styles: { face: 49990, paw: 49990, both: 59990 },
  },
};

export const STYLES: Record<StyleKey, { name: string; emoji: string }> = {
  face: { name: 'Cara de Mascota', emoji: '🐶' },
  paw: { name: 'Huella de Mascota', emoji: '🐾' },
  both: { name: 'Ambas', emoji: '✨' },
};

export const STYLE_KEYS: StyleKey[] = ['face', 'paw', 'both'];

export const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;
export type Size = (typeof SIZES)[number];

const COP_FORMATTER = new Intl.NumberFormat('es-CO');

export function formatPrice(price: number): string {
  return `${COP_FORMATTER.format(price)} COP`;
}

export function getPrice(product: ProductKey, style: StyleKey): number {
  return PRODUCTS[product].styles[style];
}

export function getMinPrice(product: ProductKey): number {
  return Math.min(...Object.values(PRODUCTS[product].styles));
}
