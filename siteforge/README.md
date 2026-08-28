# SiteForge

A visual website builder for non-experts. Pick a template (Personal / Business / Shop), pick a stack
(**Django** or **C# ASP.NET Core**) plus **React**, toggle features, and download a complete,
ready-to-run codebase with working backend APIs, database seeding and animations.

## Quick start

```
npm install
npm run dev
```

- Studio (builder UI): http://localhost:5173
- Generator API: http://localhost:4000

Then in the Studio:

1. Pick a template
2. Pick Django or C#
3. Toggle features and animations
4. Click **Generate my website** → a zip downloads

Unzip, run the backend and frontend (instructions are shown on screen and inside each generated README).

## Headless CLI

```
npm run gen -- --preset shop --backend django --title "Acme Shop" --out ./out/acme
npm run gen -- --blueprint examples/personal-django.json --out ./out/portfolio
```

## Structure

```
packages/
  shared/      Blueprint + catalog types (single source of truth)
  generator/   Generation engine: registry, validation, Handlebars emission,
               Express API (/api/catalog, /api/generate) and CLI
  studio/      React wizard UI (Vite)
  generator/templates/
    frontend/  React SPA base + per-module pages (shop/auth/contact)
    django/    Django project base + apps (accounts/shop/contact)
    dotnet/    ASP.NET Core minimal-API project + module endpoints
    root/      Root README of every generated project
```

## How it works

The Studio never touches generated code directly — it posts a declarative **Blueprint** to the API.
The engine resolves modules from the registry, emits templates per target, and streams back a zip.
Adding a new feature module = adding one folder pair under `templates/frontend/modules/<id>` and
`templates/django|dotnet/modules/<id>` plus a manifest entry in `src/registry.ts`.

## Roadmap

- Blog module (marked "coming soon" in the catalog)
- Postgres option, EF Core migrations instead of EnsureCreated
- GitHub push output, plugin marketplace with versioned manifests
