# PartyTees - Custom Party T-Shirt Builder PRD

## Original Problem Statement
Build a Shopify-style store with embedded custom product builder for stag/hen party printed t-shirts. Customers can create either:
- ONE shared design for whole group (bulk mode) with size quantities
- MULTIPLE different designs per person (multi-design mode)

Store original uploads and print-ready PNG files for admin download.

## User Personas
1. **Party Organizer** - Plans stag/hen parties, needs to order custom t-shirts for groups of 5-20 people
2. **Group Member** - Wants personal design with their own photo and back name
3. **Admin/Shop Owner** - Needs to process orders and download print-ready files

## Core Requirements (Static)
- Template gallery with body costumes (Stag/Hen categories)
- Photo upload with background removal
- Head placement editor (drag, zoom, rotate)
- Text customization (title, subtitle)
- Back print option (+£2.50)
- Bulk mode: same design, multiple sizes
- Multi-design mode: unique design per person
- Shopping cart and checkout
- Admin dashboard with order management and file downloads
- GBP currency
- GDPR consent for photo uploads

## What's Been Implemented (Feb 13, 2026)
### Backend
- ✅ FastAPI server with MongoDB
- ✅ Template CRUD endpoints
- ✅ Photo upload and storage
- ✅ Background removal endpoint (ready for remove.bg API)
- ✅ Order creation and management
- ✅ Admin stats endpoint
- ✅ ZIP download for order files

### Frontend
- ✅ Homepage with hero section and CTAs
- ✅ Template Gallery with filters (All/Stag/Hen/Popular/New)
- ✅ Party Builder with 4-step wizard
  - Step 1: Template selection
  - Step 2: Photo upload with GDPR consent
  - Step 3: Text customization + back print option
  - Step 4: Size quantities (bulk) or person management (multi)
- ✅ Shopping Cart with checkout flow
- ✅ Admin Dashboard with stats and order list
- ✅ FAQ, Shipping/Returns, Contact pages
- ✅ Responsive design with vibrant party aesthetic

### Templates Seeded
1. Disco King (Stag) - Gold sparkly disco outfit
2. Caveman (Stag) - Prehistoric club-wielding body
3. Lifeguard (Stag) - Beach lifeguard with float

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Configure remove.bg API key for actual background removal
- [ ] Improve Konva canvas to show template preview
- [ ] Add back print preview generation
- [ ] Email notifications for order confirmation

### P1 - Important
- [ ] Quantity discount logic (10+ = 5%, 20+ = 10%, 50+ = 15%)
- [ ] Add more Hen party templates
- [ ] Order status email updates
- [ ] Size guide page

### P2 - Nice to Have
- [ ] Stripe/PayPal payment integration
- [ ] AWS S3 file storage
- [ ] Social media sharing of designs
- [ ] Design save/reload feature
- [ ] Admin bulk order export

## Next Action Items
1. Provide remove.bg API key to enable real background removal
2. Add more template assets (especially Hen party templates)
3. Consider Stripe integration for payments
4. Set up AWS S3 for production file storage
