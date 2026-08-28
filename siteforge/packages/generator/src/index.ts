import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import archiver from 'archiver';
import { generateToDir } from './generate.js';
import { validateBlueprint } from './validate.js';
import { catalog } from './registry.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/catalog', (_req, res) => {
  res.json(catalog);
});

app.post('/api/generate', async (req, res) => {
  let bp;
  try {
    bp = validateBlueprint(req.body);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid blueprint.' });
    return;
  }

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'siteforge-'));
  try {
    await generateToDir(bp, stage);

    const zip = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    zip.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<void>((resolve, reject) => {
      zip.on('end', () => resolve());
      zip.on('error', reject);
    });

    zip.directory(stage, '');
    await zip.finalize();
    await done;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${bp.projectName}.zip"`);
    res.end(Buffer.concat(chunks));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Generation failed.' });
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`SiteForge API listening on http://localhost:${port}`);
});
