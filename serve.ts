// Development only. The distributed game needs any ordinary static server.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./game', import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};
createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Sundown Debt: http://127.0.0.1:${port}`));
