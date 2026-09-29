/**
 * Names for the product catalogue's category ids.
 *
 * The dataset stores only the id ("101"), so the admin form showed a raw number.
 * These names are derived from the products in each category (src/data/products.json),
 * not from an upstream taxonomy: "101" holds Vaasan and Fazer rye breads, "104" holds
 * the milks, and so on. Keep them in step with the catalogue if it changes.
 */
export const CATEGORY_LABELS = {
  '100': 'Fruit & vegetables',
  '101': 'Bread',
  '102': 'Meat & sausages',
  '103': 'Ready meals',
  '104': 'Milk & dairy',
  '106': 'Baking',
  '107': 'Frozen food',
  '108': 'Coffee',
  '109': 'Sweets & chocolate',
  '111': 'Household & paper',
  '115': 'Pantry',
}

export function categoryLabel(id) {
  return CATEGORY_LABELS[String(id)] || `Category ${id}`
}
