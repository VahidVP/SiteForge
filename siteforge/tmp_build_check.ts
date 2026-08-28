import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generateToDir } from './packages/generator/src/generate.ts';
import type { Blueprint } from './packages/shared/src/index.ts';

async function main() {
  const bp: Blueprint = {
    projectName: 'test-dotnet-build',
    siteType: 'shop',
    backend: 'dotnet',
    database: 'sqlite',
    template: 'midnight',
    language: 'en',
    bilingual: true,
    headerStyle: 'classic',
    footerStyle: 'columns',
    heroStyle: 'glow-center',
    modules: ['pages','contact-form','auth','shop-catalog'],
    uiModules: [],
    branding: { title: 'Test', tagline: ''},
    adminAccessCode: ''
  };
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dotnet-build-'));
  await generateToDir(bp, out);
  console.log('generated', out);
  // Try dotnet build
  const { execSync } = await import('node:child_process');
  try {
    execSync('dotnet build', { cwd: path.join(out, 'backend'), stdio: 'inherit' });
    console.log('dotnet build succeeded');
  } catch (e) {
    console.error('dotnet build failed');
    process.exit(1);
  }
  // Also check frontend build? not needed
}
main();
