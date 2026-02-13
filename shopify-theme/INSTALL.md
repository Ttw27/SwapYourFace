# Native Shopify Theme Integration - Simple Steps

## Quick Install (5 minutes)

### Step 1: Add the CSS file
1. In Shopify Admin, go to **Online Store** → **Themes**
2. Click **"..."** on your current theme → **"Edit code"**
3. In the **Assets** folder, click **"Add a new asset"**
4. Upload or paste the contents of `party-builder-native.css`

### Step 2: Add the Section file
1. In the same code editor, find the **Sections** folder
2. Click **"Add a new section"**
3. Name it: `party-builder`
4. Delete the default content
5. Paste the contents of `party-builder.liquid`
6. Click **Save**

### Step 3: Add to a Page
1. Go to **Online Store** → **Themes** → **Customize**
2. In the page dropdown (top), select **"Create template"** → **"Page"**
3. Name it `party-builder`
4. Click **"Add section"** → scroll down to find **"Party Builder"**
5. Click **Save**

### Step 4: Create the Page
1. Go to **Online Store** → **Pages** → **"Add page"**
2. Title: `Create Your T-Shirt`
3. In **"Theme template"** dropdown (bottom right), select `page.party-builder`
4. Save

### Step 5: Add to Navigation
1. Go to **Online Store** → **Navigation**
2. Edit your main menu
3. Add the new page
4. Save

---

## That's it! 🎉

Your Party Builder will now appear as a native part of your Shopify store:
- Full width
- Proper scrolling
- Matches your theme
- Works on mobile

---

## Files to Upload

### 1. CSS File (Assets/party-builder-native.css)
Copy from: `/app/shopify-theme/assets/party-builder-native.css`

### 2. Section File (Sections/party-builder.liquid)
Copy from: `/app/shopify-theme/sections/party-builder.liquid`

---

## Next Steps

To complete the Shopify cart integration:

1. Create a product called "Custom Party T-Shirt" with size variants
2. Get the variant IDs from Shopify
3. Update the JavaScript in the section file to use those variant IDs

Let me know when you're ready and I'll help configure the cart integration!
