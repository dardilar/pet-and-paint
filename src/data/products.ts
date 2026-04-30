export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export const HOODIES: Product[] = [
  { id: 'hoodie-face', name: 'Pet Face', price: 89990, image: '/products/hoodie-face.png' },
  { id: 'hoodie-fingerprint', name: 'Pet Fingerprint', price: 89990, image: '/products/hoodie-fingerprint.png' },
  { id: 'hoodie-both', name: 'Pet Face + Fingerprint', price: 99990, image: '/products/hoodie-both.png' },
];

export const PAINT_KITS: Product[] = [
  { id: 'kit-numbers', name: 'Paint by Numbers', price: 59990, image: '/products/kit-numbers.png' },
  { id: 'kit-canvas', name: 'Canvas Print', price: 49990, image: '/products/kit-canvas.png' },
];

export type ProductType = 'hoodie' | 'paint-kit';

export const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;
export type Size = (typeof SIZES)[number];

const COP_FORMATTER = new Intl.NumberFormat('es-CO');

export function formatPrice(price: number): string {
  return `${COP_FORMATTER.format(price)} COP`;
}

export function getProducts(type: ProductType): Product[] {
  return type === 'hoodie' ? HOODIES : PAINT_KITS;
}

export function getMinPrice(type: ProductType): number {
  return Math.min(...getProducts(type).map((p) => p.price));
}
