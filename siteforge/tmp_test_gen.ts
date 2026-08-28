import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generateToDir } from './packages/generator/src/generate.ts';
import type { Blueprint } from './packages/shared/src/index.ts';

async function testBackend(backend: 'django'|'dotnet') {
  const bp: Blueprint = {
    projectName: `test-${backend}-shop`,
    siteType: 'shop',
    backend,
    database: 'sqlite',
    template: 'midnight',
    language: 'en',
    bilingual: true,
    headerStyle: 'classic',
    footerStyle: 'columns',
    heroStyle: 'glow-center',
    modules: ['pages','contact-form','auth','shop-catalog'],
    uiModules: ['anim.reveal','anim.hover-lift'],
    branding: { title: 'Test Shop', tagline: 'Test' },
    adminAccessCode: ''
  };
  const out = fs.mkdtempSync(path.join(os.tmpdir(), `siteforge-test-${backend}-`));
  await generateToDir(bp, out);
  console.log(`\n=== GENERATED ${backend} at ${out} ===`);
  const checks: string[] = [];
  function check(file: string, needle: string, label: string) {
    const full = path.join(out, file);
    if (!fs.existsSync(full)) {
      console.log(`❌ MISSING ${label}: ${file} not found`);
      checks.push(`MISSING ${label}`);
      return;
    }
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes(needle)) console.log(`✅ ${label}: contains "${needle}"`);
    else {
      console.log(`❌ ${label}: missing "${needle}" in ${file}`);
      console.log(content.slice(0,500));
      checks.push(`FAIL ${label}`);
    }
  }
  if (backend === 'django') {
    check('backend/shop/models.py', 'gallery', 'Django Product gallery field');
    check('backend/shop/models.py', 'gallery =', 'Django gallery definition');
    check('backend/config/settings.py', "MEDIA_URL", 'Django MEDIA_URL');
    check('backend/config/settings.py', "MEDIA_ROOT", 'Django MEDIA_ROOT');
    check('backend/config/urls.py', "static(settings.MEDIA_URL", 'Django media static');
    check('backend/shop/serializers.py', 'gallery', 'Django serializer gallery');
    check('backend/shop/serializers.py', 'imageUrl', 'Django serializer imageUrl alias');
    check('backend/shop/views.py', 'ProductImageUploadView', 'Django ProductImageUploadView');
    check('backend/shop/views.py', 'try:', 'Django Pillow try import');
    check('backend/shop/views.py', 'WEBP', 'Django WEBP conversion');
    check('backend/requirements.txt', 'Pillow', 'Django Pillow dependency');
    check('backend/shop/store_urls.py', 'images', 'Django store_urls images endpoint');
  } else {
    check('backend/Models/Product.cs', 'GalleryJson', 'Dotnet Product GalleryJson');
    check('backend/Endpoints/ProductEndpoints.cs', 'Gallery', 'Dotnet ProductEndpoints Gallery');
    check('backend/Endpoints/StoreEndpoints.cs', '/api/admin/products/{id}/images', 'Dotnet StoreEndpoints image upload');
    check('backend/Program.cs', 'UseStaticFiles', 'Dotnet Program UseStaticFiles');
  }
  check('frontend/vite.config.ts', '/media', 'Frontend vite media proxy');
  check('frontend/src/api/client.ts', 'getProductGallery', 'Frontend client gallery helper');
  check('frontend/src/api/client.ts', 'uploadProductImages', 'Frontend upload helper');
  check('frontend/src/components/ProductCard.tsx', 'getProductGallery', 'Frontend ProductCard gallery');
  check('frontend/src/components/ProductCard.tsx', 'resolveImageUrl', 'Frontend ProductCard resolve');
  if (backend==='django') {
    check('backend/core/management/commands/seed_demo.py', 'picsum.photos', 'Django seed picsum fallback');
  } else {
    check('backend/Data/DbInitializer.cs', 'picsum.photos', 'Dotnet seed picsum fallback');
  }
  console.log(`\nChecks summary for ${backend}: ${checks.length===0 ? 'ALL PASSED' : checks.join(', ')}`);
  return checks.length===0;
}

async function main() {
  const djangoOk = await testBackend('django');
  const dotnetOk = await testBackend('dotnet');
  console.log(`\n\nFINAL: Django ${djangoOk?'✅':'❌'} Dotnet ${dotnetOk?'✅':'❌'}`);
  if (!djangoOk || !dotnetOk) process.exit(1);
}
main();
