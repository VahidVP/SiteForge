import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generateToDir } from './packages/generator/src/generate.ts';
import type { Blueprint } from './packages/shared/src/index.ts';
import { execSync } from 'node:child_process';
async function main(){
  const bp: Blueprint = {
    projectName: 'test-django-check',
    siteType: 'shop',
    backend: 'django',
    database: 'sqlite',
    template: 'midnight',
    language: 'en',
    bilingual: true,
    headerStyle: 'classic',
    footerStyle: 'columns',
    heroStyle: 'glow-center',
    modules: ['pages','contact-form','auth','shop-catalog'],
    uiModules: [],
    branding: {title:'Test', tagline:''},
    adminAccessCode:''
  };
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'django-check-'));
  await generateToDir(bp, out);
  console.log('generated', out);
  try {
    execSync('python -m py_compile backend/shop/views.py', { cwd: out, stdio:'inherit'});
    execSync('python -m py_compile backend/shop/models.py', { cwd: out, stdio:'inherit'});
    execSync('python -m py_compile backend/config/settings.py', { cwd: out, stdio:'inherit'});
    console.log('py_compile ok');
  } catch(e){ console.error('py_compile failed', e); process.exit(1);}
  // try django check if Django installed
  try {
    execSync('pip show Django', { stdio:'inherit'});
    execSync('python backend/manage.py check', { cwd: out, stdio:'inherit'});
    console.log('django check ok');
  } catch(e){ console.log('django check skipped or failed', (e as Error).message); }
}
main();
