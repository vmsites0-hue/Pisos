export type Variation = { field: "PRECIO" | "PRESENTACION" | "CONVERSION" | "DISPONIBILIDAD" | "DESCUENTO"; previous: string | number | boolean; current: string | number | boolean; difference?: number };

export function compareCommercialValues(input: { previous: { price: number; presentation: string; factor: number; available: boolean; discount: number }; current: { price: number; presentation: string; factor: number; available: boolean; discount: number } }) {
  const variations: Variation[] = [];
  if (input.previous.price !== input.current.price) variations.push({ field: "PRECIO", previous: input.previous.price, current: input.current.price, difference: input.current.price - input.previous.price });
  if (input.previous.presentation !== input.current.presentation) variations.push({ field: "PRESENTACION", previous: input.previous.presentation, current: input.current.presentation });
  if (Math.abs(input.previous.factor - input.current.factor) > 0.000001) variations.push({ field: "CONVERSION", previous: input.previous.factor, current: input.current.factor, difference: input.current.factor - input.previous.factor });
  if (input.previous.available !== input.current.available) variations.push({ field: "DISPONIBILIDAD", previous: input.previous.available, current: input.current.available });
  if (input.previous.discount !== input.current.discount) variations.push({ field: "DESCUENTO", previous: input.previous.discount, current: input.current.discount, difference: input.current.discount - input.previous.discount });
  return variations;
}
