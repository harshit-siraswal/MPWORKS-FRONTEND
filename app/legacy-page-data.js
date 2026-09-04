import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd());
const pageSources = {
  'index.html': fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  'works.html': fs.readFileSync(path.join(root, 'works.html'), 'utf8'),
  'project.html': fs.readFileSync(path.join(root, 'project.html'), 'utf8'),
  'mps.html': fs.readFileSync(path.join(root, 'mps.html'), 'utf8'),
  'mp.html': fs.readFileSync(path.join(root, 'mp.html'), 'utf8'),
  'district.html': fs.readFileSync(path.join(root, 'district.html'), 'utf8'),
  'developer.html': fs.readFileSync(path.join(root, 'developer.html'), 'utf8'),
};

export function readLegacyPage(fileName) {
  const source = pageSources[fileName];
  if (!source) throw new Error(`Unknown legacy page: ${fileName}`);
  const bodyMatch = source.match(/<body(?:\s[^>]*)?>([\s\S]*?)<\/body>/i);
  const body = (bodyMatch ? bodyMatch[1] : source)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .trim();
  const classMatch = source.match(/<body[^>]*class="([^"]*)"/i);
  const titleMatch = source.match(/<title>([^<]*)<\/title>/i);
  return {
    markup: body,
    bodyClassName: classMatch?.[1] || '',
    pageTitle: titleMatch?.[1] || 'MP Works | MPLADS public data explorer',
  };
}
