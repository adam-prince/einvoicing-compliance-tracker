#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.API_PORT || 4321;
const root = process.cwd();
const progressFile = path.join(root, 'tmp', 'refresh-progress.json');

function ensureTmp() {
  const dir = path.dirname(progressFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeProgress(obj) {
  ensureTmp();
  fs.writeFileSync(progressFile, JSON.stringify(obj, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/refresh-web') {
    ensureTmp();
    writeProgress({ status: 'running', progress: 0, startedAt: new Date().toISOString() });
    const child = spawn(process.execPath, ['scripts/update-from-web.cjs'], { stdio: 'inherit' });
    child.on('exit', (code) => {
      writeProgress({ status: code === 0 ? 'done' : 'error', progress: 100, finishedAt: new Date().toISOString(), code });
    });
    res.writeHead(202, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    return res.end(JSON.stringify({ ok: true }));
  }
  // Country sync endpoint removed per user request.
  if (req.method === 'GET' && req.url === '/progress') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    try { return res.end(fs.readFileSync(progressFile, 'utf8')); } catch {
      return res.end(JSON.stringify({ status: 'idle', progress: 0 }));
    }
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
    return res.end();
  }
  res.writeHead(404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});


