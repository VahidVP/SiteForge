# SiteForge — Project Log & Roadmap

> Living document. Every time we build or change something, we add an entry here.
> Sections: **Vision** → **How to run** → **Project map** → **Done** → **In progress / Next up** → **Backlog** → **Changelog**.

---

## 1. Vision

SiteForge is a modular website builder for non-experts: pick a template (Personal, Business, Shop),
pick a backend (**Django** or **C# ASP.NET Core**) with a **React** frontend, toggle features and
animations in a friendly dashboard, click Generate, and download a complete ready-to-run codebase.

Core principle: the Studio UI never edits code directly. It sends a declarative **Blueprint** (JSON)
to a generator engine that emits files from versioned templates. Adding a future feature module =
adding template folders + one registry entry. Nothing else changes.

---

## 2. How to run

Everything lives in this folder:

```
C:\Users\Raouf_Rayane\Documents\Default Project\siteforge
```

```powershell
cd "C:\Users\Raouf_Rayane\Documents\Default Project\siteforge"
npm install        # only needed once (already done on this machine)
npm run dev
```

- **Studio (the builder app):** http://localhost:5173
- **Generator API:** http://localhost:4000

Then: Template → Stack → Features → Name → **Generate my website** → zip downloads.
Unzip, open a terminal inside, follow the on-screen instructions (also in each generated `README.md`).

Headless CLI alternative:

```powershell
npm run gen -- --preset shop --backend django --title "Acme Shop" --out ./out/acme
npm run gen -- --blueprint examples/shop-dotnet.json --out ./out/my-shop
```

Generated sites run like this (instructions are also printed by the CLI):

- **Frontend (always):** `cd frontend` → `npm install` → `npm run dev` → http://localhost:5173
- **Django backend:** `cd backend` → create venv → `pip install -r requirements.txt`
  → `python manage.py makemigrations` → `migrate` → `seed_demo` → `runserver` → http://localhost:8000
- **ASP.NET Core backend:** `cd backend` → `dotnet run` → http://localhost:8000

Machine prerequisites installed during this project: Node.js 24 LTS, .NET 10 SDK (8 also present), Python 3.12.

---

## 3. Project map

```
siteforge/
├── package.json              Root scripts: dev, build, typecheck, gen (npm workspaces)
├── examples/                 Sample blueprints (personal-django.json, shop-dotnet.json)
├── packages/
│   ├── shared/src/index.ts   Blueprint + Catalog types — single source of truth
│   ├── generator/
│   │   └── src/
│   │       ├── registry.ts   Module catalog + presets (Personal/Business/Shop) — EDIT THIS to add modules
│   │       ├── validate.ts   Blueprint validation
│   │       ├── generate.ts   Handlebars emission engine (walks templates, renders .hbs)
│   │       ├── index.ts      Express API: GET /api/catalog, POST /api/generate (returns zip)
│   │       └── cli.ts        Headless generation CLI
│   ├── studio/               React wizard UI (Vite): App.tsx = 5-step wizard
│   └── templates/            ← THE ACTUAL CODE THAT GETS GENERATED
│       ├── frontend/
│       │   ├── base/         React SPA always included (router, theme, animations, API client)
│       │   └── modules/      shop-catalog/, auth/, contact-form/ pages & components
│       ├── django/
│       │   ├── base/         manage.py, config/settings.py.hbs, core app (pages + seed_demo command)
│       │   └── modules/      auth/→accounts app, shop-catalog/→shop app, contact-form/→contact app
│       ├── dotnet/
│       │   ├── base/         Api.csproj, Program.cs.hbs, EF Core DbContext, seeding, page endpoints
│       │   └── modules/      auth/ (tokens+hashing), shop-catalog/, contact-form/ endpoints+models
│       └── root/             README.md.hbs placed at the root of every generated project
└── tmp/out/                  Test outputs from verification runs (gitignored)
```

Key design decisions (why it works this way):

- **Blueprint-driven:** UI emits JSON; engine resolves modules; output is deterministic and testable.
- **Module = folder pair:** `templates/frontend/modules/<id>` + `templates/<backend>/modules/<id>`.
- **API contract is the seam:** both backends implement identical REST endpoints, so the exact same
  React code runs against either one (`authScheme` Token vs Bearer is injected per backend).
- **Additive-only generation:** generated shared files are fully owned by the engine; no fragile merging.
- **SQLite everywhere in MVP:** Django uses migrations; .NET uses `EnsureCreated()` + auto-seed.

---

## 4. Done ✅ (as of 2026-08-23)

1. **Monorepo scaffold** — npm workspaces: shared types, generator, studio.
2. **Generator engine** — module registry with statuses (`available`/`soon`), blueprint validation,
   Handlebars emitter (`.hbs` files rendered with flat flags: auth/shop/contact/reveal/hoverLift),
   Express server streaming zips, headless CLI with preset/blueprint modes.
3. **Catalog + presets API** — `/api/catalog` feeds the Studio dynamically; adding a module in the
   registry automatically appears in the wizard.
4. **React SPA template (frontend target)** — Vite + React + Router; runtime feature flags injected
   into index.html; Navbar/Footer/Hero/Section/Reveal components; scroll-reveal + hover-lift UI
   modules implemented; typed API client handling both Token (Django) and Bearer (.NET) schemes;
   cart with localStorage + events; AuthContext; per-site-type marketing copy.
5. **Django target** — DRF + CORS + token auth; apps: core (pages), accounts, shop, contact;
   admin registrations; `seed_demo` management command with demo products/pages.
6. **ASP.NET Core target** — .NET 8 minimal APIs; EF Core + SQLite with auto-seed on boot;
   PasswordHasher-based register/login/me/logout with DB tokens; page/product/contact endpoints;
   Swagger UI in development.
7. **Studio wizard UI** — 5 steps, catalog-driven toggles with "coming soon" badges, live slug
   generation from title, review summary, zip download, success screen with per-backend instructions.
8. **Verification (all passed):**
   - All 6 preset × backend combinations generate cleanly (no unrendered template markers).
   - Generated C# site compiled with .NET 8 SDK and booted: pages ✓ products(6) ✓ register(token) ✓ contact ✓
   - Generated Django site: venv + makemigrations + migrate + seed ✓, booted: all 4 endpoints ✓
   - Studio production build ✓, TypeScript typecheck ✓ for generator + studio.
9. **Bugs found & fixed during verification:**
   - C#: wrong namespace import for `PasswordHasher<T>` (`Microsoft.AspNetCore.Identity`, not
     `Microsoft.Extensions.Identity.Core` which is only the assembly name) + missing `Api.Models`
     usings in Program.cs/DbInitializer.cs.
   - Django: generic `api/<slug>/` route was swallowing `/api/products/` and `/api/contact/`;
     restructured root urls so every module gets its own prefix and pages live at `/api/pages/<slug>/`.
10. **Toolchain installed:** Node.js 24 LTS, .NET 8 SDK, Python 3.12 (all via winget).

---

## 5. In progress 🔄

Nothing right now — baseline is verified and stable.

## 6. Next up ▶️ (agreed priority order)

0. **Frontend verification in the pipeline** — add `vite build` of a generated site to our standard
   check routine so frontend regressions can't ship again (done manually this time).
1. **Blog module** — first test of the "add a module" workflow: posts CRUD in both backends,
   blog page in frontend, registry entry with `status: 'available'`. Proves extensibility cheaply.
2. **Checkout wiring for Shop** — real cart state (currently localStorage count), order model +
   checkout endpoint, payment-provider placeholder docs.
3. **Postgres option** — second database choice in the wizard; docker-compose in generated output.
4. **EF Core migrations instead of EnsureCreated()** for .NET targets (parity with Django story).

## 7. Backlog 💡 (not started)

- GitHub push output (OAuth device flow) alongside zip download
- Plugin marketplace tab: browse/install third-party module packages (manifest.json + semver,
  `blueprint.lock` in outputs) — the "UI/Animation marketplace" from the original vision
- More UI/animation packs (page transitions, parallax hero, dark/light theme switcher)
- Live preview of the generated site inside the Studio
- Image uploads for products (currently image URLs only)
- Email notifications on contact form submissions
- i18n groundwork
- Tests: golden-file snapshot tests for the generator (generate each combo in CI, diff against snapshots)

---

## 8. Changelog (append-only, newest first)

### 2026-09-01 — .NET backend upgraded to .NET 10 (LTS)

- **The generated .NET backend now targets `net10.0`** — the current LTS (supported to Nov 2028) — instead of `net8.0` (LTS ends Nov 2026). Packages moved to the matching generation: **EF Core SQLite 10.0.11, Swashbuckle.AspNetCore 10.2.3**. Per the .NET 10 SDK's own guidance (NU1510), the explicit `Microsoft.Extensions.Identity.Core` reference was **removed** — it ships automatically with the framework now (as does core EF), so the generated csproj is down to just two explicit packages. Studio catalog copy and the generated README now say ".NET 10".
- **Machine prep:** installed the **.NET 10 SDK (10.0.400)** machine-wide via winget (SDK 8.0.424 remains side-by-side for older outputs).
- **Verification (all green):** fresh `dotnet build` of a generated personal site on net10.0 — **0 warnings, 0 errors**; booted live — `/api/pages/home/` serves, `/api/owner/login` issues an owner token, Swagger UI (Swashbuckle 10) returns HTTP 200.

### 2026-09-01 — Full dependency refresh to current stable versions (per official registries/docs)

- **Every dependency in the monorepo and in the generated-site templates is now the current stable major**, verified against the official npm registry, PyPI and NuGet (not guesses): generated frontend & studio on **React 19.2.8 / React Router 7.18.3 / Vite 8.2.2 (+ @vitejs/plugin-react 6.1.1) / TypeScript 7.0.2**; generator API on **Express 5.2.1 / archiver 8 / Handlebars 4.7.9 / cors 2.8.6**; root tooling **tsx 4.23.13 / concurrently 10**; Django stack **Django 6.0 / DRF 3.18 / django-cors-headers 4.9 / Pillow 12.3**; .NET stack **EF Core SQLite + Identity.Core 8.0.30 / Swashbuckle 9.0.6** (stays `net8.0` — the machine's SDK — with latest 8.0.x patches). Root `engines.node` raised to `>=20.19` (Vite 8 requirement); unused leftover React devDeps removed from the generator package.
- **Code updates required by the new majors:** `archiver@8` removed its default-export factory — the zip endpoint now uses `new ZipArchive({ zlib: { level: 9 } })` per the v8 API; no other deprecated-API usage existed (audited for React 19 removals, Express 5 path-to-regexp changes, Django 6 deprecations, DRF 3.18, EF Core 8 — all clean).
- **Repo hygiene:** added `.gitignore` and untracked `node_modules/` (it had been committed — thousands of binaries churned on every install); local `tmp/` verification outputs are now ignored too.
- **Verification (all green):** root `npm run typecheck` on TS 7 ✓; studio production build on Vite 8 ✓; generator API boots on Express 5 and `/api/health` responds ✓; freshly generated personal site — frontend `npm install && npm run build` on React 19 + Router 7 + Vite 8 ✓, .NET backend `dotnet build` (0 errors, EF 8.0.30/Swashbuckle 9 restore) ✓ and boots live: `/api/pages/home/` serves and `/api/owner/login` issues an owner token ✓, Django 6.0.8 backend: venv + pip install + `makemigrations` + `migrate` + `check` all clean ✓.

### 2026-09-01 — Owner media access fix + required wizard access code + docs-currency audit

- **"Admin access required." when adding images to portfolio/services is fixed.** Root cause: `api.media.list()` and `api.media.upload()` in the frontend template (`client.ts`) passed `useAuth = false` to `request()`, so the `Authorization: Owner …` header was never sent on `GET/POST /api/admin/media` — both backends then correctly answered 403 (`Deny()` on .NET / `IsOwnerOrStaff` rejection on Django) even for a logged-in owner. Both calls now send auth like every other admin endpoint. This is why the shop's product-image upload worked (it already used auth) while the MediaPicker used by ProjectsPanel/ServicesPanel failed.
- **The wizard access code can no longer be empty or too weak.** The `required` attribute on the input was inert (there is no `<form>` submit around the wizard steps), so a non-auth site could be generated with an empty `ADMIN_ACCESS_CODE`/`AdminAccessCode`, leaving `/owner` permanently locked. `canNext` on the Identity step now also requires the access code to match the backend rule (`4–64` chars of `A-Za-z0-9@#$_-`, same regex as `validate.ts`) whenever User Accounts is off, with an inline bilingual error (`w.ownerCodeRequired` EN+FA). No default value is set on purpose: without a typed code generation is blocked, never silently insecure.
- **Docs-currency audit of all templates vs. this log:** owner flow (signed/DB owner tokens, `IsOwnerOrStaff`, `/admin` gate, no public owner link), admin projects/services CRUD + galleries, media library, full-bleed hero in `Home.tsx`, per-site `site_lang:` key, bilingual field order, Zarinpal payment settings, tickets and `formatPrice` Tooman all match the latest documented behavior — no stale code found besides the media auth bug above.
- **Verification:** root `npm run typecheck` clean; studio `vite build` clean; fresh generation (`npm run gen -- --blueprint …`, personal/django, `adminAccessCode: audit1234`) emits `ADMIN_ACCESS_CODE = "audit1234"`, media calls with auth, and zero unrendered Handlebars markers.

### 2026-08-31 — Studio API resilience (ECONNRESET) + final verification

- **The studio no longer dead-ends when the generator API resets.** A single-shot `/api/catalog` fetch meant that any transient API failure (most common: the API restarting or being killed while the studio loads → `ECONNRESET` "socket connection was closed unexpectedly") left the whole wizard stuck on an error screen with no way back. Fixes: `api.ts` now wraps the fetch in a try/catch and surfaces a clear, actionable message (`Cannot connect to the generator API … Start it with: npm run dev:api`); `App.tsx` retries the catalog load up to 4 times with linear backoff (transient restarts self-heal without user action) and adds a **"Try again"** button (`w.retry`/`w.retryHint` EN+FA, `.error-retry` style) once retries are exhausted.
- **Added a dedicated recovery test** (`tmp/verify-fix/retry-check.mjs`): loads the studio with the API down → error screen shows the clear message + Try again → starts the API → clicking retry recovers to the full wizard. **3/3 passed.**
- Full final verification with UTF-8-confirmed output: `preview-check` **10/10**, `bilingual-check` **1/1** (Farsi field order first, non-swapped payload, RTL Farsi preview), `site-check` **16/16** (full-bleed 1920px hero + waves, no glow blobs, language switch, per-site `site_lang:` persistence). Root `npm run typecheck` + studio `vite build` clean.
### 2026-08-31 — Full-width heroes, waves overlap fix, bilingual field order + per-site language memory

- **Hero is full-bleed, not boxed.** Root cause: `Home.tsx` wrapped `<Hero>` in `<div className="container">`, so every hero style (glow/waves/grid/spotlight) was capped at the 1120px content box — on a fullscreen browser the hero backgrounds stopped mid-screen and the waves only drew across the box. `Home.tsx` now renders `<Hero>` directly inside `<main>` (full viewport width); each hero style centers/constrains its own content. Verified in Edge at 1920px: `.hero` and `.waves` both span exactly the viewport width.
- **Waves hero no longer layered with the glow style.** Follow-up to the previous fix: the waves branch's aurora blob is gated on `site.aurora` (done last round); this round just re-confirmed via e2e that with aurora off, zero `.hero-glow` elements render and exactly 3 waves are present — no leftover "default style" anywhere.
- **Bilingual identity form shows the primary-language fields first.** Previously the Farsi name/tagline inputs were always *below* the English ones regardless of the site's primary language, so with a Farsi-primary site the labelled Farsi field was sitting in the "second" slot (and vice versa). The bilingual branch now orders fields by `language` (all four fields, labels included), so Farsi-primary sites get Website name (Farsi), Website name (English), Tagline (Farsi), Tagline (English).
- **Generated sites no longer bleed language state into each other.** `i18n.ts` saved the visitor's language under a single global `site_lang` key, so two generated sites opened on the same dev port (`localhost:5173`) shared it — open an English-preference site, then a fresh Farsi site would *open in English* (and the toggle would persist English right back), which read exactly like "the Farsi and English are swapped". The key is now per-site (`site_lang:${site.title}`); a fresh Farsi-primary site falls back to Farsi, and each site remembers its own visitor language only.
- **No data swap exists in the pipeline:** e2e wizard run (Farsi primary) produced preview `برند فارسی`/`شعار فارسی اینجا` in RTL and payload `title:"EN Brand", tagline:"English tagline here", titleFa:"برند فارسی", taglineFa:"شعار فارسی اینجا", language:"fa"` — the fields, preview and generator all agree.

**Verification:** root `npm run typecheck` clean; studio `vite build` clean; wizard drive-through (`tmp/verify-fix/bilingual-check.mjs`) — field order Farsi-first when primary=Farsi, Farsi preview, payload not swapped; generated bilingual waves site e2e (`tmp/verify-fix/site-check.mjs`) **16/16** — first load in Farsi (RTL) with the right H1/tagline, full-bleed hero + waves at 1920×1000, no glow blobs, 3 waves, switch→English updates h1/tagline/nav, reload persists English, localStorage key is `site_lang:EN Brand Name` (per-site).

### 2026-08-31 — Live preview 1:1 fixes (palette, hero overlap, animations)

Three user-reported preview bugs fixed, plus one latent CSS bug found while investigating:

- **Preview palette now equals the real site's palette.** Root cause: `deriveTheme()` guessed fg/surface/border/muted/accent-2 by mixing the template swatches toward generic colors (`#9fe8ff`, `#eef2ff`, `#141b2c`), which diverged from `themes.css` (e.g. Ocean's real `--accent-2` is orange `#f59e0b`, Paper's text is warm `#1c1917`, not navy). Fix: the registry (`generator/src/registry.ts`) is now the single source of truth — every template carries its exact `theme` (bg/bgSoft/surface/surfaceStrong/border/text/muted/accent/accent2/accentContrast/fontHead/fontBody/glowOpacity), `/api/catalog` serves it, `themes.css` is **rendered from the same data** via the new `themes.css.hbs` (old static `themes.css` deleted; generated output is byte-identical), and `LivePreview.deriveTheme()` consumes it directly (old heuristic kept only as fallback for theme-less catalogs). Head/body font vars (`--p-font-head/body`) drive `.pv-title`/`.browser` so serif templates look serif in the preview too.
- **Browser mockup painted with the Studio's background.** `.browser { background: var(--bg) }` used the *studio theme's* dark `--bg`, so the hero/page area of light templates (paper/mono/ocean) showed a dark studio background. Now `background: var(--p-bg)`; `.pv-nav` also matches the real nav (`color-mix(in srgb, var(--p-bg) 80%, transparent)` instead of `--p-surface`).
- **Generated site showed the chosen hero style + the glow-center style stacked.** Root cause: `Hero.tsx`'s **waves** branch always rendered the two blurred `hero-glow` blobs on top of the waves (the preview only shows them when `anim.aurora` is on — hence "two styles overlapping"). Fix: the aurora-wrap in the waves branch is now gated on `site.aurora`, matching the preview exactly. The glow-center branch keeps its glows (that IS the style).
- **Missing preview animations added:** `.pv-floor` (grid hero) now runs `grid-scroll` (was static; keyframe loop fixed to `0 12px` for the 12px background-size), and the split-hero art gets the real site's sheen sweep (`.pv-art--plain::after`) when no image is uploaded.
- **Fixed broken CSS in the generated template** (found during review): `styles.css` had an orphaned declaration block after `.hero-art-img::after` (missing `.hero-art::after {` selector) that killed the sheen rule; repaired with `pointer-events: none` added.

**Verification:** root `npm run typecheck` clean; `npm run build` (studio) clean; CLI generation of ocean/business+waves, paper/personal+split, mono/shop — emitted `themes.css` identical to the previous static file, waves gating + repaired `.hero-art::after` present in output; `/api/catalog` serves the exact palettes; new Playwright drive-through (`tmp/verify-fix/preview-check.mjs`) **10/10** — ocean preview bg/accent/accent-2 exactly `#eaf4fb`/`#0369a1`/`#f59e0b`, `.browser` paints template bg not studio bg, waves hero shows no glow blobs/aurora when aurora off, waves + grid-floor animations run, zero page errors.


### 2026-08-30 — Live site preview inside the wizard

The studio now shows a **live preview of the site being built** — a browser-frame mockup in a sticky right-hand panel (`LivePreview.tsx` + `.wizard-grid`/`.pv-*` styles) that re-renders the whole page (navbar → hero → content → optional ticker → footer) from the current wizard state as a mini-blueprint, on every step.

- **Theme:** each template's real `swatchBg`/`swatchAccent` drive a derived palette (fg/surface/border/muted/second accent via luminance + mix). Light vs dark text is chosen by background luminance so every template stays legible.
- **Header/hero/footer styles:** all 5 designs of each are rendered as real layouts (classic/centered/minimal/glass/bordered nav; glow-center/split/spotlight/waves/grid hero; columns/simple/centered/brandmark/split footer). Split hero honors the uploaded hero image; Spotlight tracks the cursor.
- **Content:** nav links + content section adapt to the site type and enabled modules (personal → About/Projects; business → Services; shop → products grid with prices, cart, account), marquee strip appears under the hero when `anim.marquee`, aurora blobs when `anim.aurora`, hero-title word cascade when `anim.text-reveal`, card hover-lift when `anim.hover-lift`.
- **Branding/language:** brand title/tagline update live while typing (bilingual: Farsi title/tagline used when Farsi is primary, with an EN/فا switcher chip shown when bilingual), PNG logo + text/image/both modes render in the nav, and the mockup flips to RTL + Vazirmatn when Farsi is the primary language.
- **Layout:** the wizard is now two columns on desktop (sticky preview on the right, container widened to 1120px) and preview-above-controls on narrow screens.
- **Preset seeding:** choosing a site type now also applies its preset header/footer/hero styles (previously only modules/template/title were seeded).

**Verification:** studio `tsc` + `vite build` clean, repo `npm run typecheck` clean; Playwright drive-through of the running studio+API — 28/28 checks (preview renders on step 0, preset brand/nav, template palette change, split hero, aurora/marquee add+remove, glass nav, simple footer, RTL on Farsi, live brand typing, logo upload + image-only mode, sticky→stacked responsive, light/dark contrast, business marquee placement, shop nav + 4-col grid, no page errors).

### 2026-08-28 — Owner flow reaches `/admin`, admin-managed portfolio & services, local galleries + media library, wizard hero image + merged design page

**Owner flow (#1 bug) end-to-end:** typing the correct access code on `/owner` now lands on the admin console (Django `signing.dumps` owner token with 30-day `max_age` + `IsOwnerOrStaff`; .NET `Owner <token>` bearer) instead of being bounced to `/login`. Wrong code shows an error and stays on `/owner`. The owner entry point is hidden entirely for regular visitors — no navbar/footer links — and `/admin` renders a "website owner only" gate (with Enter → `/owner`) until `owner_token` is present. `Admin.tsx` moved to `frontend/base/src/pages/` (deleted the auth-module fork) so the gate applies to non-auth sites too, and `/admin` is unconditional in `App.tsx.hbs`.

**Admin-managed portfolio projects + business services:** `Project` (personal) and `Service` (business) models/endpoints on both backends — public GET list/detail (tags parsed into arrays via `ParseGallery`/`ParseTags`/`serializer` logic) and full admin CRUD. The admin console gained `ProjectsPanel`/`ServicesPanel` (modal-less inline ADD/EDIT with gallery editor), and new frontend pages `PortfolioDetail.tsx`/`ServiceDetail.tsx` render summary, text, tags and a click-to-zoom gallery (`Lightbox.tsx` — overlay, Escape to close, keyframes renamed `lightbox-in` to avoid clobbering the Reveal `fade-in`). `Portfolio.tsx`/`Services.tsx`/`Home.tsx` are now API-driven; `ProductCard` got an `img-fallback` placeholder and **every picsum / default stock URL was removed** from seeds and client code (seed data ships with empty images on both backends).

**Local media library:** `/api/admin/media/` GET (list) + POST (multipart upload) on Django (`_media_root()` under `media/`) and .NET (`wwwroot/media/`), both owner/staff-only; a reusable `MediaPicker` in the admin lets products/projects/services pick existing uploads; uploads and gallery URLs are relative `/media/...` paths resolved through the existing image helpers.

**Wizard:** hero image upload (data URL, only for image-capable hero designs) and the merged Design+Features page (wizard is now 5 steps).

**Template system hardening:** only `*.hbs` files are compiled — mustache left in a non-`.hbs` file leaked verbatim into generated Django (`core/urls.py` crashed every generated site; missing `serializers` import failed the rest). Converted Django `core/{models,serializers,admin,urls}.py` + `views.py.hbs` to guarded `.hbs` and deleted the stale unguarded copies and a stray `__pycache__`. Also fixed staleness in the shop-catalog module fork: its `ProductDetail.tsx` predated the zoom/lightbox work, so shop product images couldn't zoom — synced to base.

**Verification:** repo `tsc` clean; `tmp/appcheck` regenerated sites — frontend `tsc` ×4 + `vite build` ×4 clean, `dotnet build` **3/3** 0 errors, Django `manage.py check` ×3 clean; Django runtime migrate+seed OK on all three and live API checks green (owner login, services/projects CRUD with gallery persistence, product gallery, media list/upload served under `/media`, no picsum refs). Browser e2e against live dev+API: business **13/13** (owner gate→/owner wrong-code error→correct code redirects→console, no owner links, services + detail), personal **9/9** (portfolio list/detail/gallery/lightbox), shop **8/8** (products list, no picsum, detail zoom + lightbox). Full harness `tools/verify.mjs` **30/30**.

### 2026-08-28 — .NET admin fix, bilingual product details, hero animation fixes, glass navbar, bilingual site name + PNG logo

**Files touched:** `generator/templates/dotnet/base/Endpoints/AdminEndpoints.cs.hbs` (NEW — moved from `dotnet/modules/auth/Endpoints/`, now self-contained: inline `IsAdminAsync` accepting `Owner `/`Bearer ` tokens, `{{#if auth}}`/`{{#if shop}}`/`{{#if contact}}` guards, `JsonNode? Details` on `CreateProductRequest`/`UpdateProductRequest` so JSON arrays bind, `ParseDetails`/`ParseGallery` with trailing-comma tolerance); old auth-module copy deleted. `django/modules/shop-catalog/shop/serializers.py` (`normalize_details`, rows from `get_details`, dict-or-array in create/update, camelCase `nameFa/descriptionFa/imageUrl` mapping). `django/base/core/admin_api.py.hbs` + `shop/views.py` (PUT loops `details/DetailsJson/detailsJson`, stores `json.dumps(normalize_details(...))`). `frontend/base/src/api/client.ts` (`DetailRow`, `getProductDetails` returns rows). `frontend/modules/auth/src/pages/Admin.tsx` (DetailsEditor — 4 inputs when bilingual, 2 when single; formDetails in ADD + startEdit; `details`+`DetailsJson` sent). `dictionaries.ts` (`admin.details`, `detailKey`, `detailKeyFa`, `detailValue`, `detailValueFa`, `addField`, `removeField`). Both `ProductDetail.tsx` copies render rows localized. `Reveal.tsx` (`className` prop) + `Hero.tsx` (glow wrap inside `<Reveal className="hero-bg">`, `anim-glow`/`anim-float` gated on `site.aurora`) + `styles.css` (`.hero-bg`). `styles.css` (`body[data-header='glass'] .hero { margin-top:-57px; padding-top:96px }`). `shared/src/index.ts` `Branding` (`titleFa/taglineFa/logo/logoMode`), `validate.ts`, `generate.ts` (`Ctx`), `index.html.hbs` (`__SITE__` + localized `<title>`), `lib/site.ts` (`siteTitle(lang)`/`siteTagline(lang)` helpers). `Navbar.tsx` (`<Brand/>`: logo image-only / text / both modes), `Footer.tsx` (+ `footer-logo`), `Login.tsx`. `studio/src/App.tsx` (step 4: EN+FA name/tagline when bilingual, PNG upload w/ 450KB cap via FileReader, logo style picker, reset), `studio/src/studioI18n.ts` (14 new EN/FA keys), `studio/src/styles.css` (`.logo-row/.logo-preview/.chip-pick`).

- **Generated C# sites now build again** — root cause: `MappingAdminEndpoints()` was called unconditionally in `base/Program.cs.hbs:45` but `AdminEndpoints.cs.hbs` only lived in the auth module. Moved to `dotnet/base/Endpoints/` and made standalone → `dotnet build` 0 errors on personal-full, personal-min (pages-only), and shop-noauth. Shop-noauth legitimately still emits `AuthEndpoints` (brand forces auth for shops).
- **Bilingual product details end-to-end:** admin ADD + edit now edit rows of `{key,keyFa,value,valueFa}` (`DetailsEditor`), frontend sends `details` array + `DetailsJson`; Django stores `DetailsJson`; storefront renders localized chips per language. Fixed a real bug found during e2e: POST create silently dropped `nameFa`/`descriptionFa`/`imageUrl` (serializer only knew snake_case — PUT handled camelCase manually) via `ProductSerializer._map_camel_fields`.
- **Hero animation now animates the hero itself:** aurora/glow pulsing and float are gated behind the chosen `anim.aurora`, and the ambient "default" glow animation no longer plays on top of other heroes; glow canvas sits inside `.hero-bg` so it reveals with the page.
- **Glass navbar vs full-width:** floating (glass) headers pull the hero flush to the viewport top (`margin-top:-57px`), classic headers keep the hero just below the navbar. Measured in Edge: glass hero top = 4px, classic = 68px.
- **Bilingual site name + optional PNG logo (text / image / image+text):** navbar + footer + hero + login welcome + SEO `<title>` localize; logo renders as image-only, text-only, or both. Studio step 4 has EN/FA name+tagline fields when bilingual and PNG upload (≤450KB) with an inline 3-way logo-style picker; default `logoMode` falls back to `both` when a logo is present.
- **Verification:** `tsc` clean (generator+studio); full harness **30/30** (now also generates bilingual-HA name/tagline + logo); real `dotnet build` **3/3** clean; new targeted browser suite **13/13** (classic/glass hero positions, aurora gating, FA/EN name+tagline+logo+SEO toggle); Django admin **15/15** (register→admin, create 2 bilingual detail rows, localized GETs, PUT updates, localized detail page). One pre-existing latent issue noted, left out of scope: cold-loading `/admin` redirects to `/login` before session `me()` resolves (admin panel still reachable via the navbar link / SPA).

### 2026-08-28 — RTL fixed, Cart Tooman, studio fully bilingual & selectable animation picker

**You asked & found:** cart prices still `$`; wizard had untranslated text; animation previews showed but couldn't be selected and Scroll Reveal / Word Cascade / 3D Tilt demos didn't animate; and the most important one — LTR/RTL layout did not flip. All fixed and browser-tested.

**Files:** `packages/generator/templates/frontend/base/src/lib/i18n.ts` (body dir sync), `index.html.hbs` (removed hardcoded `body dir="rtl"`), `modules/shop-catalog/src/pages/Cart.tsx` (dropped local `$ formatPrice`, uses shared `formatPrice`), `studio/src/App.tsx` (animation picker, `cat()` translation helper, translated summaries), `studio/src/studioI18n.ts` (~90 new EN/FA keys + `studioT()`), `studio/src/components/Toggle.tsx`, `studio/src/styles.css` (RTL logical props + demo styles + `tilt-idle`), `studio/index.html` (Vazirmatn).

- **RTL/LTR now truly symmetric — root cause:** `index.html.hbs` stamped `<body dir="rtl">` on Farsi-primary sites. The hardcoded `<body>` attribute survived the language switch and overrode `html dir="ltr"`, keeping the WHOLE layout RTL. Fix: `apply()` in `i18n.ts` now sets `document.body.dir` too, and the static `dir` attribute was removed from the body tag. Verified in headless Edge: primary-EN `ltr→rtl→ltr` and primary-FA `rtl→ltr→rtl` both flip the navbar (brand LEFT↔RIGHT, links, actions) exactly, JS error free.
- **Cart prices Tooman:** `Cart.tsx` had its own `formatPrice` returning `'$' + …`. Removed it; now imports the shared `lib/format` `formatPrice` (localizes product names too). Verified live: cart rows `Aurora Hoodie — 50 Tooman`, total `129 Tooman`, product cards `45 Tooman` etc., zero `$` on both pages.
- **Studio fully bilingual:** every catalog item (site types, backends, 6 templates, 5 header/footer/hero styles, 5 modules, 7 animations = labels + descriptions) is now translated via `cat()` → `w.cat.{cat}.{id}[.desc]` keys (~90 new EN/FA pairs). Also translated: language hints, summary rows (header/hero/+ React/selected), "included"/"coming soon" badges, animation demo notes, marquee items. Verified in browser: step0 `سایت شخصی | سایت کسبوکار | فروشگاه`, templates `نیمهشب | کاغذ | غروب | جنگل | تکرنگ | اقیانوس`, studio flips `dir=rtl` with the toggle and loads Vazirmatn.
- **Animation picker (choose them!):** the old passive preview row is gone. The Features step now shows 7 cards (one per animation) each with a **live, working demo**, translated label + description, and an **on/off checkbox** wired to `uiModules` (survives via blueprint → `__SITE__` flags). Scroll Reveal & Word Cascade **re-trigger every time the card scrolls into view** (IntersectionObserver, matching the real site), 3D Tilt has a cursor-tracking card + idle float so it's obviously alive, Magnetic still pulls, Aurora drifts, Marquee scrolls. Verified: `fade-up` / `word-in` / `tilt-idle` animations + tilt `rotateY` all confirmed running in browser.
- **Studio RTL polish:** switch knob uses logical `inset-inline-start`, option text uses `text-align:start`, `html[lang='fa']` gets Vazirmatn + `letter-spacing:0`.
- **Verification:** full browser suite **30/30**; RTL/LTR kit **2/2**; studio checks **PASS** (EN labels, FA labels, FA design+templates, animation picker count/toggle); demo previews **PASS**; cart & product price **PASS**. New harnesses: `tools/layout-test.mjs`, `tools/studio-test.mjs`, `tools/cart-test.mjs`, `tools/demo-test.mjs`.

### 2026-08-27 — Bilingual optional, WebP gallery & product details + custom specs

**Files:** `shared/src/index.ts:16` `bilingual`, `validate.ts`, `generate.ts`, `studio` bilingual toggle + studio i18n (`studioI18n.ts`), `shop/models.py:10` + `serializers.py` + `DbInitializer.cs.hbs` Persian `name_fa/description_fa` seed, `media/` handling (`requirements.txt` Pillow, `settings.py.hbs` MEDIA, `config/urls.py.hbs` static), `Product.cs` `GalleryJson`/`DetailsJson`, `ProductDetail.tsx` (+ route `App.tsx.hbs:18`), `ProductCard.tsx` gallery link, `store_urls` / `StoreEndpoints` for `/products/<id>/` + `details` JSON, `animations.css` + `TiltCard`/`Magnetic`/`Hero spotlight` fixes.

- **Wizard now bilingual + site bilingual is optional:** new `bilingual` checkbox in Design step (`studio/src/App.tsx:11` + `studioI18n.ts`). When off, language choice is single-select and generated site hides the `فا/EN` toggle (`Navbar.tsx`, `i18n.ts`, `site.ts`). Wizard UI itself switches EN/فا via topbar button. `Blueprint.bilingual` defaults `true` for backwards compat.
- **Persian seed data:** `seed_demo.py.hbs:28` + `DbInitializer.cs.hbs:34` now create 6 demo products with both `name/name_fa` (Aurora Hoodie / هودی آرورا, Drift Sneakers / کفش دریفت, etc.) so Farsi mode shows Persian immediately; fallback both ways already in `shop/views.py:21` + `ProductEndpoints.cs:1` + `ProductCard.tsx:20`.
- **Local WebP images (up to 6 / product):** `Product.gallery` (`TextField` JSON) / `Product.GalleryJson` + `MEDIA_ROOT` `media/products/<uuid>.webp` (Pillow conversion quality 80, else raw). New endpoints `POST /api/admin/products/<id>/images/` + `vite.config.ts` proxy for `/media`. Admin product panel uploads via `FormData` (`api/client.ts:44` `uploadProductImages`). `ProductCard` prefers `gallery[0]` else `image_url`; seed still uses `picsum.photos` as fallback.
- **Product details page `/products/:id`:** `ProductDetail.tsx` (gallery thumbnails → main, localized name/description, `formatPrice`, `getProductDetails` table for `details` JSON, add-to-cart, back link). Card titles link to it. Route added to `App.tsx.hbs:18` when `shop` enabled.
- **Custom details editor per shop type:** `Product.details` (`{Size:"M", Material:"Cotton"}`) — admin can add/remove/edit key-value rows (e.g. accessory shop no `Size`, clothing shop has it). Both backends store as JSON `details` / `DetailsJson`, exposed via `ProductSerializer` + `AdminProductUpdateView` (`PUT /api/admin/products/<id>/`) and dotnet `PUT /api/admin/products/{id}`. Verified generation contains `details` field.
- **Animations & header preview now 1:1:** `Hero.tsx:58` spotlight now correctly sets `--mx/--my` on `hero-spotlight::before` (was missing `window.__SITE__.heroStyle`), `TiltCard.tsx:12` `perspective(900px)`, `Magnetic.tsx:12` `0.18×`, `animations.css` added missing utilities; wizard `MiniHeader` glass pill now uses `body[data-header='glass'] .nav` (was `.nav[data-header]` never matched) with `top:14px` + centered `width:min(980px)` + `border-radius:999px` — preview matches generated site exactly.

### 2026-08-27 — Layout & Farsi correctness pass (your reported issues)

**Files touched:** `packages/generator/templates/frontend/base/src/themes.css:1` (Vazirmatn), `rtl.css:1`, `styles.css:719` + variant blocks `styles.css:731`, `lib/format.ts:15` (Tooman), `components/ProductCard.tsx:20`, `lib/site.ts:1`, `shared/src/index.ts:16` (bilingual flag).

- **Farsi font — second fix:** `themes.css` had regressed: `:root` and every `[data-template]` block still contained `'Vazirmatn'` as fallback, so it was leaking into English. Stripped Vazirmatn from all latin stacks; now only `body[data-lang='fa']` sets `Vazirmatn`. Verified `dist/assets/*.css` contains `Vazirmatn` exactly once under that selector.
- **RTL layout shift:** `rtl.css` was double-flipping (`row-reverse` on top of native `dir=rtl` flex reversal). Removed the hacks — now `html[dir=rtl]` alone drives logo right / actions left. Kept only table-align and letter-spacing overrides.
- **Header/footer variants now actually apply:** CSS was `.nav[data-header]` but `data-header` lives on `<body>` (`index.html.hbs:14`). Changed to `body[data-header='glass'] .nav` (and same for footer). Wizard preview now matches generated site 1:1.
- **Sticky footer:** `html,body{height:100%}` + `#root{min-height:100vh}` + `.site-main{flex:1;display:flex;flex-direction:column}` already added; confirmed footer sticks to viewport bottom on short pages (e.g. `/about` with 2 paragraphs).
- **Equal-height cards:** `.grid{align-items:stretch}` + `.grid>*{display:flex}` + `.card{flex:1;height:100%}` — "Why shop with us" boxes equal height even with different Farsi text lengths.
- **Prices always Tooman:** `lib/format.ts:15` was `$` for English. Now `en → "1,500 Tooman"`, `fa → "۱٬۵۰۰ تومان"` (Persian digits). Used in `ProductCard.tsx:34`, `Cart.tsx`, `Admin.tsx` orders.
- **Bilingual product fallback both ways:** storefront picks `fa? nameFa||name : name||nameFa` so empty English falls back to Farsi. Backend `shop/views.py:21` / `dotnet ProductEndpoints.cs:1` now return `?lang=fa` localized names with same fallback. Seed will include Persian `name_fa` next regen.
- **Bilingual flag:** `Blueprint.bilingual:boolean` added to `shared/src/index.ts:16`, `validate.ts`, `generate.ts`, `site.ts` — wizard will get a "Bilingual website?" toggle (language switcher hidden when off).
- **Missing Farsi strings fixed (2026-08-27 follow-up):** `admin.overviewSites` / `admin.priceTomans` / `admin.admin` (ADMIN→مدیر) were absent in `dictionaries.ts:69` — added EN/FA; `Admin.tsx:191` badge and `Overview:91` revenue now use `t()` + `formatPrice` so they translate and show Tooman/تومان correctly in both languages. Verified `admin.users` role column now shows `مدیر`.

### 2026-08-25 — Farsi polish + modular header/footer/hero designs + bilingual products
- **FIXED Vazirmatn font**: root cause was a cyclic CSS variable (`--font-head: 'Vazirmatn', var(--font-head)`)
  which CSS invalidates silently. Now a plain override on `body[data-lang='fa']` wins the cascade.
  Verified Vazirmatn present in built CSS.
- **Farsi numerals & currency everywhere**: new `lib/format.ts` (`formatPrice/formatNumber/formatDate`)
  converts digits to ۰-۹ and shows تومان when Farsi is active — dashboards, orders, admin tables, cart.
- **Status badges translated** (paid/pending/failed/open/answered/closed) via shared `StatusBadge`
  component used by Dashboard + Admin.
- **Bilingual products**: admin product form now has side-by-side English/Farsi name & description fields
  (our recommendation over auto-translate: deterministic, no external API, no mistranslations).
  Storefront serves the visitor's language with graceful fallback (`?lang=fa`), implemented in both backends.
- **Sticky layout hardened**: `html/body` 100% + `.site-main` flex wrapper so header sticks to top and
  footer to bottom regardless of content length.
- **5 header designs** (Classic / Centered / Minimal / Glass Pill / Bold Border) and **5 footer designs**
  (Columns / Simple Row / Centered Stack / Big Brandmark / Split Bar) — chosen in the wizard,
  color comes from the selected template.
- **5 hero-only designs** with animated mini-previews in the wizard: Glow Center, Split Screen,
  Cursor Spotlight, Waves, Tech Grid.
- **Live animation previews** added to the wizard's animations section (hover/tilt/marquee demos).
- **Sign-out fixed**: state clears first then a full-page navigation home removes the router/state race
  that caused a one-time error.
- Verified: browser suite 30/30 across 6 scenarios; .NET compiles; `/api/products?lang=fa` returns
  هدفون while `lang=en` returns Headphones.

### 2026-08-25 — Big expansion: templates, bilingual EN/Farsi, Iranian payments, tickets, owner access
- **6 design templates** (wizard step "Design"), all compatible with both backends:
  Midnight (dark violet), Paper (light editorial), Sunset (colorful purple/orange), Forest (deep green),
  Mono (black & white minimal), Ocean (light corporate blue). Theme = CSS variables under
  `body[data-template=…]` in `src/themes.css`; change colors in one place.
- **Bilingual English + Farsi:** primary language chosen during setup; visitors can switch anytime via
  the navbar toggle. Full UI dictionaries (`src/lib/dictionaries.ts`), translated marketing content
  per site type, automatic RTL (`dir=rtl`, `rtl.css`) and **Vazirmatn** font for Farsi.
- **7 animation modules** (was 2): Scroll Reveal, Hover Lift, **Word Cascade** (hero text),
  **3D Tilt Cards**, **Magnetic Buttons**, **Aurora Glow** background, **Ticker Strip** marquee.
  All centralized in `animations.css`; colors follow the theme variables automatically.
- **Iranian payments (Zarinpal)** for shops, both backends:
  - Admin → Payment settings: paste Zarinpal merchant ID, toggle enable/sandbox.
  - While disabled, a built-in **mock gateway** simulates success/failure so the flow is testable free.
  - Real flow: `/api/checkout` → Zarinpal request → StartPay redirect → callback verifies (code 100/101)
    → order marked paid with refId. Prices are treated as Tomans when payments are enabled.
  - Orders table + user's "My orders" + admin Orders view.
- **Owner access code** solves "no user accounts" sites: wizard asks for a code when User Accounts is
  off; owner logs in at `/owner` (footer 🔑 link) and gets full admin panel access (messages etc).
  Django uses signed tokens (`Authorization: Owner …`); .NET uses DB-backed tokens.
- **Support tickets** (shop sites): users create tickets from their dashboard; owners see them in
  admin → Tickets, reply (thread), close. Status badges open/answered/closed.
- **Professional console layout:** shared sidebar shell for Dashboard & Admin; admin sections:
  Overview stats, Users, Products, Orders, Messages, Tickets, Payment settings (shown per enabled modules).
- Contact messages remain in admin → Messages for ALL site types (with or without accounts).
- **Verification:** browser suite 30/30 across 6 scenarios (incl. Farsi RTL + every template);
  API smoke tests passed for payments mock-flow, tickets and owner login on BOTH stacks.
- Bugs fixed en route: DRF permission signature, shop route mounting, Product model accidentally
  dropped in Django store rewrite, token-scheme collision for owner tokens.

### 2026-08-23 — Full redesign pass: per-type designs, dashboards, admin panels, real verification
- **Per-site-type designs** (fonts, colors, layout personality via `data-theme`):
  Personal = Sora/Inter + violet/pink; Business = Libre Baskerville/Source Sans + royal blue/gold;
  Shop = Manrope + emerald/amber. Fonts load from Google Fonts; colors are CSS variables
  (`--accent`, `--accent-2`) — change them in one place to re-theme.
- **Pages per type:** Personal → Home, About, Portfolio, Contact · Business → Home, About,
  Services, Contact · Shop → Home, Products, Cart, About, Contact.
- **Modular components:** Navbar and Footer live in their own files; Navbar shows Sign in / Sign up
  buttons when logged out and avatar + Admin link when signed in.
- **Auth UX:** split login/signup page with tabs; redirects to new **user dashboard** (profile card,
  role badge, orders placeholder, admin shortcut).
- **Admin panel (modular):** `/admin` route with tabs Users / Products / Messages (tabs appear only
  if the relevant module is enabled). Owner = **the very first registered account**, in both backends.
  - New REST APIs both stacks: `GET/DELETE /api/admin/users[/{id}]`,
    `GET/POST/DELETE /api/admin/products[/{id}]`, `GET /api/admin/messages`.
  - Django also keeps its classic `/admin` panel (ContactMessage model now registered there too).
- **Animation skeleton:** all motion centralized in `src/animations.css` (fade-up, pop-in, float,
  glow-pulse, shimmer skeleton loaders, stagger delays `.d-1…d-6`). Add new keyframes there;
  recolor happens automatically through the CSS variables.
- **Verification overhaul — real browser testing:**
  - New harness `tools/verify.mjs`: generates all 6 preset × backend combos, installs, builds,
    serves, and drives each page in headless Edge (playwright-core) checking for uncaught JS errors
    and rendered DOM. Result: **30/30 PASS**.
  - New end-to-end test `tools/e2e.mjs` (.NET shop): boots backend + frontend, registers the owner
    through the UI, verifies ADMIN badge, opens admin panel, adds a product, sees it on the public
    shop page. Result: **12/12 PASS**.
  - Django admin API verified by direct API calls (first user admin ✓, second user 403 ✓, product
    create appears publicly ✓).
- **Bugs found & fixed during this round:**
  - `getToken/setToken` missing export (the earlier white-screen) + added ErrorBoundary so crashes
    show a visible message instead of a blank page.
  - AuthContext called `/me` before saving the fresh token → admin flag lost on login (fixed order).
  - Django admin routes were nested under `/api/auth/admin/*`; moved mount to `/api/admin/*`.
  - Missing `IsAuthenticated` import in generated Django views; missing npm install step in e2e script.

### 2026-08-23 — Hotfix: white screen on generated frontends
- **Symptom:** Generated React site showed a blank white page at localhost:5173.
- **Root cause:** `src/api/client.ts` never exported `getToken`/`setToken`, but
  `src/context/AuthContext.tsx` imported them → the module graph failed → React never mounted.
  Only surfaced in sites with User Accounts enabled; backends were unaffected.
- **Why we missed it:** earlier verification covered generation + backends end-to-end but never
  compiled/ran the generated *frontend*.
- **Fixes:** exported `getToken()`/`setToken()` from client.ts template; added an ErrorBoundary
  component so future runtime errors show a visible message + Reload button instead of a white screen;
  wrapped App with it in main.tsx.
- **Verification:** regenerated personal+auth (.NET), `npm run build` passes, Vite dev server serves
  index.html with site flags and transforms main.tsx correctly.
- **Action for existing downloaded projects:** re-generate from the Studio (or manually add the two
  functions to your copy of `src/api/client.ts`, see Changelog diff below).

### 2026-08-23 — Initial MVP ("baseline")
- Built monorepo: generator engine, dual-target templates (Django + ASP.NET Core), React Studio wizard.
- Modules available: Content Pages (locked), Contact Form, User Accounts, Product Catalog + Cart,
  Scroll Reveal, Hover Lift Cards. Blog marked "coming soon".
- Verified all 6 combinations end-to-end (generation, compile/run for both backends, live API checks).
- Fixed: C# PasswordHasher namespace imports; Django route ordering/prefix mismatch with frontend.
- Installed toolchain: Node 24, .NET 8 SDK, Python 3.12.
- Created this document (DOCS.md).
