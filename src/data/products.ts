export type ProductKey = 'cremallera' | 'hoodie' | 'kit';
export type StyleKey = 'face' | 'both' | 'kit';

export interface Color {
  id: string;
  name: string;
  hex: string;
  /** Light garments where the embroidery reads best. */
  light: boolean;
}

export interface ProductInfo {
  name: string;
  emoji: string;
  styles: Partial<Record<StyleKey, number>>;
  colors: Color[] | null;
}

// Supplier colors. Some names repeat across garments with a different hex — keep the lists separate.
export const COLORS_HOODIE: Color[] = [
  { id: 'amarillo-bebe', name: 'Amarillo Bebé', hex: '#F5E4A8', light: true },
  { id: 'aguamarina', name: 'Aguamarina', hex: '#CAE0E2', light: true },
  { id: 'marfil', name: 'Marfil', hex: '#E0DAD7', light: true },
  { id: 'blanco', name: 'Blanco', hex: '#DAD8DE', light: true },
  { id: 'beige', name: 'Beige', hex: '#DCC8B4', light: true },
  { id: 'gris-claro', name: 'Gris Claro', hex: '#CAC7CB', light: true },
  { id: 'azul-bebe', name: 'Azul bebé', hex: '#A1BAD7', light: true },
  { id: 'verde-oliva', name: 'Verde Oliva', hex: '#A2B8B1', light: true },
  { id: 'palo-rosa', name: 'Palo Rosa', hex: '#DCA6A3', light: true },
  { id: 'naranja', name: 'Naranja', hex: '#F39E45', light: false },
  { id: 'camel', name: 'Camel', hex: '#CFA79A', light: false },
  { id: 'lila', name: 'Lila', hex: '#B3ABC9', light: false },
  { id: 'rosado', name: 'Rosado', hex: '#D4899E', light: false },
  { id: 'gris-oscuro', name: 'Gris Oscuro', hex: '#90898F', light: false },
  { id: 'rojo', name: 'Rojo', hex: '#E33D45', light: false },
  { id: 'azul-rey', name: 'Azul Rey', hex: '#0C69C0', light: false },
  { id: 'cafe', name: 'Café', hex: '#875849', light: false },
  { id: 'vinotinto', name: 'Vinotinto', hex: '#984647', light: false },
  { id: 'morado', name: 'Morado', hex: '#874272', light: false },
  { id: 'azul-oscuro', name: 'Azul Oscuro', hex: '#43526C', light: false },
  { id: 'verde-militar', name: 'Verde Militar', hex: '#494534', light: false },
  { id: 'verde-oscuro', name: 'Verde Oscuro', hex: '#0A4C41', light: false },
  { id: 'negro', name: 'Negro', hex: '#38343A', light: false },
];

export const COLORS_CREMALLERA: Color[] = [
  { id: 'marfil', name: 'Marfil', hex: '#E0D8D2', light: true },
  { id: 'blanco', name: 'Blanco', hex: '#DAD8DE', light: true },
  { id: 'beige', name: 'Beige', hex: '#DCC8B4', light: true },
  { id: 'gris-claro', name: 'Gris Claro', hex: '#CAC7CB', light: true },
  { id: 'lila', name: 'Lila', hex: '#D2C1D6', light: true },
  { id: 'rosa', name: 'Rosa', hex: '#DFBDC3', light: true },
  { id: 'camel', name: 'Camel', hex: '#E3B290', light: true },
  { id: 'rojo', name: 'Rojo', hex: '#E03B44', light: false },
  { id: 'gris-oscuro', name: 'Gris Oscuro', hex: '#76737E', light: false },
  { id: 'azul-rey', name: 'Azul Rey', hex: '#0259B3', light: false },
  { id: 'azul-oscuro', name: 'Azul Oscuro', hex: '#43526C', light: false },
  { id: 'verde-botella', name: 'Verde Botella', hex: '#2F4A3E', light: false },
  { id: 'negro', name: 'Negro', hex: '#38343A', light: false },
];

export const PRODUCTS: Record<ProductKey, ProductInfo> = {
  cremallera: {
    name: 'Hoodie con cremallera',
    emoji: '🥼',
    styles: { face: 250000, both: 270000 },
    colors: COLORS_CREMALLERA,
  },

  hoodie: {
    name: 'Hoodie',
    emoji: '🧥',
    styles: { face: 230000, both: 250000 },
    colors: COLORS_HOODIE,
  },

  kit: {
    name: 'Kit de Pintura',
    emoji: '🎨',
    styles: { kit: 70000 },
    colors: null,
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

// Unisex sizing, measurements in cm.
export const SIZES = [
  { size: 'XS', ancho: 51, alto: 65, mangas: 61 },
  { size: 'S', ancho: 53, alto: 67, mangas: 62 },
  { size: 'M', ancho: 55, alto: 70, mangas: 64 },
  { size: 'L', ancho: 58, alto: 72, mangas: 66 },
  { size: 'XL', ancho: 61, alto: 75, mangas: 68 },
  { size: '2XL', ancho: 64, alto: 78, mangas: 70 },
] as const;
export type Size = (typeof SIZES)[number]['size'];

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
