declare module 'gifenc' {
  export function GIFEncoder(): any;
  export function quantize(pixels: Uint8Array, maxColors: number, options?: any): Uint8Array[];
  export function applyPalette(pixels: Uint8Array, palette: Uint8Array[], format?: string): Uint8Array;
}
