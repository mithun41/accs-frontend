import {
  Shirt, Smartphone, Sofa, ShoppingBasket, Sparkles, LayoutGrid, Headphones, Footprints, CookingPot, Laptop, Baby, Dumbbell, BookOpen, Gem,
} from 'lucide-react';

const MAP = [
  [/fashion|cloth|apparel|wear/i, Shirt],
  [/foot|shoe|sneaker/i, Footprints],
  [/phone|mobile|electronic/i, Smartphone],
  [/audio|headphone|speaker/i, Headphones],
  [/laptop|computer/i, Laptop],
  [/kitchen|cook/i, CookingPot],
  [/home|living|furniture|decor/i, Sofa],
  [/grocer|food|rice|spice|beverage/i, ShoppingBasket],
  [/beauty|health|care|skin/i, Sparkles],
  [/baby|kid|toy/i, Baby],
  [/sport|fitness/i, Dumbbell],
  [/book|station/i, BookOpen],
  [/jewel|accessor/i, Gem],
];

export function categoryIcon(name = '') {
  const hit = MAP.find(([re]) => re.test(name));
  return hit ? hit[1] : LayoutGrid;
}
