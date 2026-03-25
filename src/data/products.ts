export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export const HOODIES: Product[] = [
  { id: 'hoodie-1', name: 'Custom Pet Portrait Hoodie', price: 59.99, image: '/products/hoodie-1.png' },
  { id: 'hoodie-2', name: 'Signature Pet Watercolor Hoodie', price: 64.99, image: '/products/hoodie-2.png' },
  { id: 'hoodie-3', name: 'Minimalist Pet Sketch Hoodie', price: 54.99, image: '/products/hoodie-3.png' },
  { id: 'hoodie-4', name: 'Pet "Washed Out" Hoodie', price: 59.99, image: '/products/hoodie-4.png' },
];

export const PAINT_KITS: Product[] = [
  { id: 'kit-1', name: 'Custom Pet Oil Painting Kit', price: 39.99, image: '/products/kit-1.png' },
  { id: 'kit-2', name: 'Signature Watercolor Kit', price: 34.99, image: '/products/kit-2.png' },
  { id: 'kit-3', name: 'Pet Pop Art Kit', price: 37.99, image: '/products/kit-3.png' },
  { id: 'kit-4', name: 'Pet "Washed Out" Kit', price: 35.99, image: '/products/kit-4.png' },
];

export type ProductType = 'hoodie' | 'paint-kit';

export const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;
export type Size = (typeof SIZES)[number];

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getProducts(type: ProductType): Product[] {
  return type === 'hoodie' ? HOODIES : PAINT_KITS;
}

export function getMinPrice(type: ProductType): number {
  return Math.min(...getProducts(type).map((p) => p.price));
}
