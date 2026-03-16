# PartyTees Shopify Integration - Complete Setup Guide

## Overview

This guide will help you integrate the PartyTees Party Builder into your Shopify store. After setup, customers will be able to create custom party t-shirts directly on your Shopify store and checkout using Shopify's payment system.

---

## Step 1: Create a Shopify Partner Account

1. Go to **https://partners.shopify.com**
2. Click **"Join now"** and create a free account
3. Complete the signup process

---

## Step 2: Create a Development Store (for testing)

1. In Partner Dashboard, click **"Stores"** in the left menu
2. Click **"Add store"** → **"Create development store"**
3. Choose **"Create a store to test and build"**
4. Fill in store details and click **"Create development store"**

---

## Step 3: Create Your Shopify App

1. In Partner Dashboard, go to **"Apps"** → **"Create app"**
2. Choose **"Create app manually"**
3. Fill in:
   - **App name**: `PartyTees Builder`
   - **App URL**: `https://party-shirt-builder.preview.emergentagent.com`
   - **Allowed redirection URL(s)**: `https://party-shirt-builder.preview.emergentagent.com/api/shopify/callback`
4. Click **"Create app"**

---

## Step 4: Configure App API Access

1. After creating the app, go to **"API access"** tab
2. Under **"Admin API access scopes"**, enable:
   - `read_products`
   - `write_products`
   - `read_themes`
   - `write_themes`
3. Click **"Save"**

---

## Step 5: Get Your API Credentials

From your app's **"Overview"** page, note down:
- **Client ID** (API Key)
- **Client Secret** (API Secret Key)

---

## Step 6: Create the T-Shirt Product in Shopify

In your Shopify store admin:

1. Go to **Products** → **Add product**
2. Create a product with:
   - **Title**: `Custom Party T-Shirt`
   - **Handle**: `custom-party-tshirt` (important!)
   - **Price**: £19.99 (base price)
3. Add **Variants** for sizes:
   - S, M, L, XL, 2XL, 3XL
   - Each variant should have the same base price
4. Note down each **Variant ID** (visible in the URL when editing a variant, or via API)

---

## Step 7: Deploy the Theme App Extension

### Option A: Using Shopify CLI (Recommended)

```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/theme

# Navigate to the shopify-app folder
cd /app/shopify-app

# Login to Shopify
shopify auth login

# Link to your app
shopify app config link

# Deploy the extension
shopify app deploy
```

### Option B: Manual Upload

1. Go to your app in Partner Dashboard
2. Navigate to **"Extensions"**
3. Click **"Create extension"** → **"Theme app extension"**
4. Upload the files from `/app/shopify-app/extensions/party-builder-extension/`:
   - `blocks/party-builder.liquid`
   - `assets/party-builder.css`
   - `assets/party-builder.js`
   - `locales/en.default.json`

---

## Step 8: Install the App on Your Store

1. In Partner Dashboard, go to your app
2. Click **"Select store"** and choose your development store
3. Click **"Install app"**
4. Authorize the app

---

## Step 9: Add the Builder to Your Theme

1. In your Shopify store admin, go to **Online Store** → **Themes**
2. Click **"Customize"** on your current theme
3. Navigate to the page where you want the builder (e.g., a custom page or collection page)
4. Click **"Add section"** or **"Add block"**
5. Look for **"Party Builder"** under "Apps"
6. Add it and configure settings:
   - **Backend API URL**: `https://party-shirt-builder.preview.emergentagent.com/api`
   - **Product Handle**: `custom-party-tshirt`
   - **Base Price**: 1999 (£19.99 in pence)
   - **Back Print Price**: 250 (£2.50 in pence)
7. Click **"Save"**

---

## Step 10: Update Variant IDs

Edit the file `/app/shopify-app/extensions/party-builder-extension/src/index.jsx` and update the `getVariantIdForSize` function with your actual Shopify variant IDs:

```javascript
const getVariantIdForSize = (size) => {
  const variantMap = {
    'S': '123456789',      // Replace with actual variant ID
    'M': '123456790',      // Replace with actual variant ID
    'L': '123456791',      // Replace with actual variant ID
    'XL': '123456792',     // Replace with actual variant ID
    '2XL': '123456793',    // Replace with actual variant ID
    '3XL': '123456794',    // Replace with actual variant ID
  };
  return variantMap[size];
};
```

Then rebuild and redeploy:
```bash
cd /app/shopify-app/extensions/party-builder-extension
npm run build
cd /app/shopify-app
shopify app deploy
```

---

## Configuration Options

The Theme App Extension block has these settings:

| Setting | Description | Default |
|---------|-------------|---------|
| Backend API URL | Your PartyTees API endpoint | `https://party-shirt-builder.preview.emergentagent.com/api` |
| Product Handle | Shopify product handle for custom shirts | `custom-party-tshirt` |
| Primary Color | Main brand color | `#FF2E63` |
| Secondary Color | Accent color | `#08D9D6` |
| Base Price | Price per shirt in pence | 1999 (£19.99) |
| Back Print Price | Additional price for back name in pence | 250 (£2.50) |

---

## How It Works

1. **Customer visits your store** → Sees the Party Builder on your product page
2. **Selects template** → Chooses from Disco King, Caveman, Lifeguard, etc.
3. **Uploads photo** → Background is removed via your backend API
4. **Customizes text** → Adds party name, location, back names
5. **Selects sizes** → Chooses quantities for S, M, L, XL, 2XL, 3XL
6. **Adds to cart** → Items added to Shopify cart with custom properties
7. **Checkout** → Standard Shopify checkout with your payment provider
8. **Order created** → Order data includes custom properties for fulfillment

---

## Order Properties

Each cart item will include these custom properties:
- `Template`: Template name (e.g., "Disco King")
- `Title Text`: Main text on shirt
- `Subtitle Text`: Secondary text
- `Size`: Selected size
- `Back Print`: Yes/No
- `Back Name`: Name for back print (if selected)
- `_head_cutout_id`: Internal ID for processed photo
- `_original_photo_id`: Internal ID for original upload

---

## Admin Access

Your admin dashboard at `/admin` shows:
- All orders with custom t-shirt designs
- Ability to download ZIP files with print-ready assets
- Order status management

---

## Troubleshooting

### Builder not showing on theme?
- Make sure the app is installed on the store
- Check that the extension is deployed
- Try refreshing the theme editor

### Photos not uploading?
- Check the Backend API URL is correct
- Ensure your backend server is running
- Check browser console for CORS errors

### Cart not working?
- Verify variant IDs are correct
- Make sure the product exists with matching variants
- Check browser console for errors

---

## Support

For technical issues, contact the development team or check the documentation at `/app/shopify-app/README.md`.
