# PartyTees Shopify App

This is the Shopify App version of PartyTees Party Builder, designed to be embedded directly into your Shopify store.

## Prerequisites

1. **Shopify Partner Account**: https://partners.shopify.com
2. **Development Store**: Create one in your Partner Dashboard
3. **Node.js 18+** and **npm/yarn**

## Setup Instructions

### Step 1: Create Shopify Partner Account
1. Go to https://partners.shopify.com
2. Sign up for free
3. Create a "Development Store" for testing

### Step 2: Create a New App
1. In Partner Dashboard, go to **Apps** → **Create app**
2. Choose **Create app manually**
3. App name: `PartyTees Builder`
4. App URL: Your deployed backend URL (e.g., `https://party-tees.preview.emergentagent.com`)
5. Allowed redirection URLs: Add your app URL + `/api/auth/callback`

### Step 3: Get API Credentials
After creating the app, you'll get:
- **Client ID** (API Key)
- **Client Secret**

Add these to `/app/shopify-app/.env`:
```
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
SCOPES=write_products,read_products,write_themes,read_themes
HOST=your-app-url.com
```

### Step 4: Install Shopify CLI
```bash
npm install -g @shopify/cli @shopify/theme
```

### Step 5: Deploy the Extension
```bash
cd /app/shopify-app
npm install
shopify app deploy
```

### Step 6: Enable in Your Store
1. Go to your Shopify store admin
2. **Online Store** → **Themes** → **Customize**
3. Add the "Party Builder" app block to your desired page

## Project Structure

```
shopify-app/
├── extensions/
│   └── party-builder-extension/    # Theme App Extension
│       ├── assets/                  # Compiled JS/CSS
│       ├── blocks/                  # Liquid blocks
│       ├── locales/                 # Translations
│       └── snippets/                # Liquid snippets
├── package.json
├── shopify.app.toml                 # App configuration
└── README.md
```

## How It Works

1. The Theme App Extension adds a "Party Builder" block to your Shopify theme
2. Customers use the builder to create their designs
3. When they click "Add to Cart", items are added to the Shopify cart via AJAX
4. Checkout uses Shopify's native checkout with your payment provider
5. Order data syncs to your backend for print file generation

## Backend Integration

The existing FastAPI backend at `/app/backend` handles:
- Template storage and retrieval
- Image upload and processing
- Print file generation
- Order management for admin

The Shopify app communicates with this backend via API calls.
