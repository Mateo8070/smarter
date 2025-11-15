// src/utils/stockUtils.ts

/**
 * Parses a quantity string (e.g., "5 ctns", "10 pkts", "20") and returns the numerical value.
 * If the string cannot be parsed, it returns 0.
 * @param quantityString The string containing the quantity and optional unit.
 * @returns The numerical quantity.
 */
export const parseQuantityString = (quantityString: string | null | undefined): number => {
  if (!quantityString) {
    return 0;
  }

  // Use a regular expression to extract numbers from the beginning of the string
  const match = quantityString.match(/^(\d+(\.\d+)?)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }

  return 0;
};

/**
 * Determines if an item is considered out of stock based on its quantity string.
 * Assumes out of stock if the numerical quantity is 0.
 * @param quantityString The string containing the quantity and optional unit.
 * @returns True if the item is out of stock, false otherwise.
 */
export const isOutOfStock = (quantityString: string | null | undefined): boolean => {
  const quantity = parseQuantityString(quantityString);
  return quantity === 0;
};
