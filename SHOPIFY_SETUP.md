# Shopify Buy Button Integration - Setup Complete! 🎉

## What Was Done:

### 1. Installed Shopify Buy SDK
- Added `shopify-buy` package to connect your website to Shopify

### 2. Created Shopify Client (`/app/frontend/src/services/shopifyClient.js`)
- Connects to your Shopify store
- Creates checkout sessions
- Adds items to Shopify cart
- Redirects to Shopify checkout

### 3. Updated Cart Page (`/app/frontend/src/pages/CartPage.jsx`)
- "Checkout with Shopify" button added
- Sends cart items to Shopify with custom attributes:
  - Template name
  - Title text
  - Subtitle text
  - Back print (yes/no)
  - Back name
  - Design file reference
- Redirects to Shopify checkout page

---

## ⚠️ ONE THING YOU NEED TO DO:

### Add Your Storefront Access Token

1. Open file: `/app/frontend/src/services/shopifyClient.js`

2. Find line 10:
   ```javascript
   const STOREFRONT_ACCESS_TOKEN = 'YOUR_STOREFRONT_ACCESS_TOKEN_HERE';
   ```

3. Replace `YOUR_STOREFRONT_ACCESS_TOKEN_HERE` with your actual token

### How to Get Your Token:

1. Go to: https://admin.shopify.com/store/swap-my-face-tees/settings/apps/development
2. Click "Create an app" (or select existing)
3. Go to "Configuration" tab
4. Click "Configure" next to Storefront API access scopes
5. Enable:
   - ☑️ unauthenticated_read_product_listings
   - ☑️ unauthenticated_write_checkouts
   - ☑️ unauthenticated_read_checkouts
6. Save, then go to "API credentials" tab
7. Click "Install app"
8. Copy the "Storefront API access token"

---

## How It Works Now:

```
Customer Journey:
1. Creates design on your website (party-tees.preview.emergentagent.com)
2. Adds to cart
3. Clicks "Checkout with Shopify"
4. Redirected to Shopify checkout (swap-my-face-tees.myshopify.com)
5. Pays via Shopify (card, PayPal, etc.)
6. Order appears in your Shopify admin with design details
```

---

## Product Handle

Make sure your Shopify product URL handle matches. Current setting:
- Handle: `custom-party-t-shirt`

Your product URL should be: `swap-my-face-tees.myshopify.com/products/custom-party-t-shirt`

If your product has a different handle, update line 13 in CartPage.jsx:
```javascript
const PRODUCT_HANDLE = 'your-actual-product-handle';
```

---

## Test It:

1. Add your Storefront Access Token
2. Go to https://party-shirt-builder.preview.emergentagent.com/builder
3. Create a design
4. Add to cart
5. Click "Checkout with Shopify"
6. You should be redirected to Shopify checkout!

---

## Need Help?

If you get errors:
1. Check browser console (F12 → Console tab)
2. Make sure the token is correct
3. Make sure product handle matches
4. Make sure product has size variants (S, M, L, XL, 2XL, 3XL)
