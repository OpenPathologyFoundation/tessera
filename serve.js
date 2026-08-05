#!/usr/bin/env node
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 8089;
const ROOT = path.join(__dirname, 'web');

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.css':  'text/css',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.txt':  'text/plain'
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  try {
    url = decodeURIComponent(url);
  } catch (e) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const file = path.resolve(ROOT, '.' + (url === '/' ? '/counter.html' : url));

  // Prevent path traversal. Comparing against ROOT alone would also admit a
  // sibling directory whose name merely begins with ROOT (e.g. "web-backup"),
  // so the separator must be part of the prefix.
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext  = path.extname(file).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`WBC ΔΣ server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop');
});
