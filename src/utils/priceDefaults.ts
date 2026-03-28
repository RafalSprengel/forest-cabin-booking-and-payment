export const DEFAULT_FALLBACK_PRICES = {
  weekdayPrices: [
    { minGuests: 1, maxGuests: 3, price: 250 },
    { minGuests: 4, maxGuests: 6, price: 350 },
    { minGuests: 7, maxGuests: 10, price: 450 }
  ],
  weekendPrices: [
    { minGuests: 1, maxGuests: 3, price: 350 },
    { minGuests: 4, maxGuests: 6, price: 450 },
    { minGuests: 7, maxGuests: 10, price: 550 }
  ],
  weekdayExtraBedPrice: 50,
  weekendExtraBedPrice: 70
} as const;

export type FallbackPrices = typeof DEFAULT_FALLBACK_PRICES;