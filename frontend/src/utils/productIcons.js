// Small, related icons shown when a product has no uploaded photo.
// Kept in one place so the product card, cart and any future view match.

const PRODUCT_ICONS = {
  'Fresh Tomatoes': '🍅',
  'Green Spinach': '🥬',
  'Bananas': '🍌',
  'Onions': '🧅',
  'Potatoes': '🥔',
  'Amul Full Cream Milk': '🥛',
  'Farm Eggs': '🥚',
  'Amul Butter': '🧈',
  'Whole Wheat Bread': '🍞',
  'Britannia Biscuits': '🍪',
  'Lays Chips': '🍟',
  'Tata Tea Premium': '🍵',
  'Tropicana Orange Juice': '🧃',
  'Basmati Rice': '🍚',
  'Toor Dal': '🫘',
  'Fortune Sunflower Oil': '🫒',
  'MDH Chaat Masala': '🧂',
  'Colgate Toothpaste': '🪥',
  'Dove Soap': '🧼',
};

const KEYWORD_ICONS = [
  ['tomato', '🍅'],
  ['spinach', '🥬'],
  ['banana', '🍌'],
  ['onion', '🧅'],
  ['potato', '🥔'],
  ['carrot', '🥕'],
  ['chilli', '🌶️'],
  ['apple', '🍎'],
  ['mango', '🥭'],
  ['orange', '🍊'],
  ['lemon', '🍋'],
  ['milk', '🥛'],
  ['curd', '🥣'],
  ['yogurt', '🥣'],
  ['dahi', '🥣'],
  ['egg', '🥚'],
  ['butter', '🧈'],
  ['cheese', '🧀'],
  ['bread', '🍞'],
  ['biscuit', '🍪'],
  ['cookie', '🍪'],
  ['chips', '🍟'],
  ['namkeen', '🥨'],
  ['tea', '🍵'],
  ['coffee', '☕'],
  ['juice', '🧃'],
  ['water', '💧'],
  ['rice', '🍚'],
  ['atta', '🌾'],
  ['flour', '🌾'],
  ['dal', '🫘'],
  ['oil', '🫒'],
  ['masala', '🧂'],
  ['salt', '🧂'],
  ['sugar', '🍬'],
  ['chocolate', '🍫'],
  ['soap', '🧼'],
  ['toothpaste', '🪥'],
  ['shampoo', '🧴'],
  ['detergent', '🧺'],
];

const CATEGORY_ICONS = {
  'Fruits & Vegetables': '🥬',
  'Dairy & Eggs': '🥛',
  'Bakery': '🍞',
  'Beverages': '🧃',
  'Snacks': '🍪',
  'Grains & Pulses': '🌾',
  'Oil & Spices': '🧂',
  'Personal Care': '🧼',
};

export function productIcon(product) {
  if (!product) return '🛒';

  const exact = PRODUCT_ICONS[product.name];
  if (exact) return exact;

  const name = String(product.name || '').toLowerCase();
  for (const [keyword, icon] of KEYWORD_ICONS) {
    if (name.includes(keyword)) return icon;
  }

  return CATEGORY_ICONS[product.category_name] || '🛒';
}

export default productIcon;
