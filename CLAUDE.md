# Swap My Face (swapmyface.co.uk)

Custom face-swap party t-shirts for UK stag dos and hen parties. Run by Tim under TEZL GROUP LTD.
Customers upload a photo, it's cut out and placed onto a costume "body" design with their text, then printed (DTF).

## Repo layout

- `backend/server.py` — the ENTIRE FastAPI backend (single file). There is no `main.py`. All routes use `api_router` with prefix `/api`.
- `backend/requirements.txt`
- `frontend/` — React (Create React App via `react-app-rewired`), Tailwind, shadcn/ui (`@/components/ui/*`), lucide-react, sonner toasts, Konva (`react-konva`) for the builder canvas.
  - `src/pages/BuilderPage.jsx` — customer builder. Also the staff builder via `?staff=true&customer=Name`.
  - `src/pages/AdminPage.jsx` — admin dashboard (tabs: Orders, Templates, Reviews, Settings, Payment Links, Builder, AI Designer).
  - `src/components/AIDesignGenerator.jsx` — AI Designer tab (Claude prompt → Ideogram → eraser cleanup → mockup → publish as template).
  - `src/pages/ReviewsPage.jsx`, `HomePage.jsx` (featured-template carousel), `src/components/Footer.jsx`, `src/components/SEOHead.jsx`.
  - `public/fonts/Plumpfull.ttf` — the "Plump" font (shown as "Default" in the UI), loaded via `@font-face` in `public/index.html`.
- Stray files at repo root (`BuilderPage.jsx`, `backend_test.py`, `test_result.md`, etc.) and `frontend/src/pages/AdminBuilder.jsx`, `AdminOrders.jsx` are unused leftovers.

## Hosting and deploys

- Frontend: Vercel, auto-deploys from `main`. Env: `REACT_APP_BACKEND_URL`, `REACT_APP_ADMIN_PASSWORD`.
- Backend: Railway service "SwapYourFace" (domain swapyourface-production.up.railway.app). Root directory must be `backend`.
- Database: MongoDB Atlas, db `partytees`. Collections: `templates`, `orders`, `photos`, `head_cutouts`, `reviews`, `design_generations`, `config`.
- Storage: Cloudflare R2 bucket `swapmyface`, public URL https://pub-ac6681582ccc439ca43cef357512c6bc.r2.dev. Upload with the `upload_to_r2(bytes, key, content_type)` helper in server.py.
- Payments: Stripe hosted checkout. Email: Resend. Face cutouts: Cutout.pro (`CUTOUT_PRO_API_KEY`) with remove.bg fallback.
- AI Designer: `ANTHROPIC_API_KEY` (must be workspace-scoped) and `IDEOGRAM_API_KEY`. Optional `ANTHROPIC_MODEL`; if the model is retired the backend auto-discovers one via `/v1/models`. Ideogram needs `multipart/form-data` (send fields via `files={...: (None, value)}`).

## Before every commit

1. Backend: `python3 -m py_compile backend/server.py`
2. Frontend: `cd frontend && CI=true REACT_APP_BACKEND_URL=https://x yarn build` must say "Compiled successfully". Vercel treats ESLint warnings as errors, so a warning breaks the deploy and the site silently keeps serving the old build.
3. After pushing, confirm the Vercel and Railway deploys actually succeeded before saying something is live.

## Hard rules (learned the hard way)

- Always read the current file in the repo before editing. Never rebuild a file from memory.
- Audit existing code before building anything new. Extend what's there; don't build parallel systems.
- Canvas: never use `ResizeObserver` or `canvasDisplayWidth`. Pattern is a container with `width:'100%', maxWidth:CANVAS_WIDTH` and a Stage with `width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width:'100%', height:'auto' }}`. Builder frame is 400x500.
- Konva text: changing `fontFamily` needs a `useEffect` that calls `layer.batchDraw()`.
- Template `head_placement` = `{x, y}` as fractions of the 400x500 frame (head centre), `scale` where drawn width = headImg.width * scale * 0.3, `rotation` in degrees. Body is fitted at 95% of the frame, centred.
- Cart store: key is `cartItems` (not `cart`); `removeFromCart(cartId)` takes an id string; persisted as `partytees-storage`.
- `r2.dev` URLs don't reliably honour CORS for canvas export, and folder URLs don't list contents.
- Reviews store `photo_urls` (list) plus `photo_url` (first photo, kept for older code).
- Never commit secrets or API keys.

## Brand

Pink #FF2E63, cyan #08D9D6, yellow #F9ED69 / #FFE600, dark #252A34. Headings in Anton, body in Outfit.
Contact: support@swapmyface.co.uk, WhatsApp +44 7822 032847. Footer credits Weavix Studio.

## Social content

Posts are made with a custom HTML post generator, images go to R2 `posts/`, and scheduling is a bulk CSV import into SocialPilot. Priority is low effort and repeatable over polish. Don't use Canva's AI design generation; build designs in code from real R2/GitHub assets.

## Working with Tim

Build the thing rather than describing it. Keep explanations short. Say exactly which file changed and why. When something can't be verified (e.g. a live deploy), say so plainly.
