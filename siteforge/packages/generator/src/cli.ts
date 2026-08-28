import path from 'node:path';
import fs from 'node:fs';
import { generateToDir } from './generate.js';
import { validateBlueprint } from './validate.js';
import { PRESETS } from './registry.js';
import type { Blueprint } from '@siteforge/shared';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function main() {
  let blueprintJson = arg('blueprint');
  let raw: unknown;

  if (blueprintJson) {
    raw = JSON.parse(fs.readFileSync(path.resolve(blueprintJson), 'utf8'));
  } else {
    const siteType = (arg('preset') ?? 'personal') as 'personal' | 'business' | 'shop';
    const backend = (arg('backend') ?? 'django') as 'django' | 'dotnet';
    const title = arg('title') ?? PRESETS[siteType].defaultTitle;
    const preset = PRESETS[siteType];
    const headerArg = arg('header') as Blueprint['headerStyle'] | undefined;
    const footerArg = arg('footer') as Blueprint['footerStyle'] | undefined;
    const heroArg = arg('hero') as Blueprint['heroStyle'] | undefined;
    raw = {
      projectName: slugify(title),
      siteType,
      backend,
      database: 'sqlite',
      template: arg('template') ?? preset.defaultTemplate,
      language: (arg('lang') as Blueprint['language']) ?? 'en',
      headerStyle: headerArg ?? preset.headerStyle,
      footerStyle: footerArg ?? preset.footerStyle,
      heroStyle: heroArg ?? preset.heroStyle,
      modules: preset.modules,
      uiModules: preset.uiModules,
      branding: { title, tagline: preset.defaultTagline }
    };
  }

  const bp = validateBlueprint(raw);
  const out = path.resolve(arg('out') ?? `./generated/${bp.projectName}`);
  await generateToDir(bp, out);

  console.log(`Generated "${bp.branding.title}"`);
  console.log(`Project : ${bp.projectName} (${bp.siteType} / ${bp.backend})`);
  console.log(`Output  : ${out}`);
  console.log('');
  console.log('Next steps:');
  if (bp.backend === 'django') {
    console.log(`  cd ${path.join(out, 'backend')}`);
    console.log('  python -m venv .venv && .venv\\Scripts\\activate   (Windows)');
    console.log('  pip install -r requirements.txt');
    console.log('  python manage.py makemigrations && python manage.py migrate');
    console.log('  python manage.py seed_demo');
    console.log('  python manage.py runserver    -> http://localhost:8000');
  } else {
    console.log(`  cd ${path.join(out, 'backend')}`);
    console.log('  dotnet run                    -> http://localhost:8000');
  }
  console.log(`  cd ${path.join(out, 'frontend')} && npm install && npm run dev  -> http://localhost:5173`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
