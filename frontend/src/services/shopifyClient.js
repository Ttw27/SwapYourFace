// Shopify Buy SDK Client
// This connects your website to your Shopify store for checkout

import Client from 'shopify-buy';

// ============================================
// ⚠️ ADD YOUR STOREFRONT ACCESS TOKEN BELOW ⚠️
// ============================================
const SHOPIFY_DOMAIN = 'swap-my-face-tees.myshopify.com';
const STOREFRONT_ACCESS_TOKEN = 'YOUR_STOREFRONT_ACCESS_TOKEN_HERE'; // Replace this!

// Initialize the Shopify client
const shopifyClient = Client.buildClient({
  domain: SHOPIFY_DOMAIN,
  storefrontAccessToken: STOREFRONT_ACCESS_TOKEN,
});

// Store the checkout in localStorage
const CHECKOUT_STORAGE_KEY = 'shopify_checkout_id';

/**
 * Get or create a Shopify checkout
 */
export async function getCheckout() {
  try {
    const existingCheckoutId = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    
    if (existingCheckoutId) {
      // Try to fetch existing checkout
      const checkout = await shopifyClient.checkout.fetch(existingCheckoutId);
      
      // If checkout is completed or null, create a new one
      if (!checkout || checkout.completedAt) {
        return await createNewCheckout();
      }
      
      return checkout;
    }
    
    return await createNewCheckout();
  } catch (error) {
    console.error('Error getting checkout:', error);
    return await createNewCheckout();
  }
}

/**
 * Create a new Shopify checkout
 */
async function createNewCheckout() {
  const checkout = await shopifyClient.checkout.create();
  localStorage.setItem(CHECKOUT_STORAGE_KEY, checkout.id);
  return checkout;
}

/**
 * Add items to Shopify checkout
 * @param {Array} items - Array of items with variantId and quantity
 * @param {Object} customAttributes - Custom attributes for the order
 */
export async function addToCheckout(items, customAttributes = []) {
  try {
    const checkout = await getCheckout();
    
    // Format line items for Shopify
    const lineItems = items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
      customAttributes: item.customAttributes || [],
    }));
    
    // Add line items to checkout
    const updatedCheckout = await shopifyClient.checkout.addLineItems(
      checkout.id,
      lineItems
    );
    
    return updatedCheckout;
  } catch (error) {
    console.error('Error adding to checkout:', error);
    throw error;
  }
}

/**
 * Get all products from Shopify
 */
export async function getProducts() {
  try {
    const products = await shopifyClient.product.fetchAll();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get a specific product by handle
 * @param {string} handle - Product handle (e.g., 'custom-party-t-shirt')
 */
export async function getProductByHandle(handle) {
  try {
    const product = await shopifyClient.product.fetchByHandle(handle);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Find variant ID by size and color
 * @param {Object} product - Shopify product object
 * @param {string} size - Size option (e.g., 'M')
 * @param {string} color - Color option (optional)
 */
export function findVariantId(product, size, color = null) {
  if (!product || !product.variants) return null;
  
  const variant = product.variants.find(v => {
    const sizeMatch = v.selectedOptions?.some(
      opt => opt.name.toLowerCase() === 'size' && opt.value === size
    );
    
    if (color) {
      const colorMatch = v.selectedOptions?.some(
        opt => opt.name.toLowerCase() === 'color' && opt.value === color
      );
      return sizeMatch && colorMatch;
    }
    
    return sizeMatch;
  });
  
  return variant ? variant.id : null;
}

/**
 * Redirect to Shopify checkout
 */
export async function redirectToCheckout() {
  const checkout = await getCheckout();
  if (checkout && checkout.webUrl) {
    window.location.href = checkout.webUrl;
  }
}

/**
 * Clear the current checkout
 */
export function clearCheckout() {
  localStorage.removeItem(CHECKOUT_STORAGE_KEY);
}

/**
 * Get checkout URL
 */
export async function getCheckoutUrl() {
  const checkout = await getCheckout();
  return checkout?.webUrl || null;
}

export default shopifyClient;
