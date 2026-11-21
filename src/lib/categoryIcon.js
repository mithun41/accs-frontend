import {
  Shirt, Smartphone, Sofa, ShoppingBasket, Sparkles, LayoutGrid, Headphones, Footprints, CookingPot, Laptop, Baby, Dumbbell, BookOpen, Gem,
  PencilRuler, NotebookPen, Calculator, Palette, Backpack, GraduationCap, Moon, FlaskConical, Languages, Library,
} from 'lucide-react';

// First match wins, so the more specific book-shop names come first
const MAP = [
  [/station|pen\b|pens|pencil/i, PencilRuler],
  [/khata|notebook|diary/i, NotebookPen],
  [/geometry|calculat/i, Calculator],
  [/\bart\b|colou?r|paint|crayon|draw/i, Palette],
  [/bag|bottle|lunch/i, Backpack],
  [/admission|exam|job|bcs|universit|model test/i, GraduationCap],
  [/islam|religio|quran|arabic/i, Moon],
  [/science|physics|chemistry|biology/i, FlaskConical],
  [/english|bangla|language|dictionar/i, Languages],
  [/novel|story|fiction|literature|poem|poetry|golpo|kobita/i, Library],
  [/book|class|guide|text/i, BookOpen],
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
  [/jewel|accessor/i, Gem],
];

export function categoryIcon(name = '') {
  const hit = MAP.find(([re]) => re.test(name));
  return hit ? hit[1] : LayoutGrid;
}
