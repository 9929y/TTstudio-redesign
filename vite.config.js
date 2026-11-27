import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';

const RES = path.resolve(__dirname, '..');

// dev：把研究文件夹的 assets/、clips/ 挂到 /evidence/ 下，供研究面板对照证据
function evidence() {
  return {
    name: 'evidence',
    configureServer(server) {
      server.middlewares.use('/evidence', (req, res, next) => {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
        if (!/^(assets\/frames|clips)\/[\w.\-]+$/.test(rel)) return next();
        const file = path.join(RES, rel);
        if (!fs.existsSync(file)) return next();
        const ext = path.extname(file);
        res.setHeader('Content-Type', ext === '.mp4' ? 'video/mp4' : 'image/jpeg');
        const stat = fs.statSync(file);
        const range = req.headers.range;
        if (range && ext === '.mp4') {
          const [s, e] = range.replace('bytes=', '').split('-');
          const start = Number(s), end = e ? Number(e) : stat.size - 1;
          res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': 'video/mp4' });
          fs.createReadStream(file, { start, end }).pipe(res);
        } else {
          res.setHeader('Content-Length', stat.size);
          fs.createReadStream(file).pipe(res);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), evidence(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    rollupOptions: { input: 'TikTokStudio_prototype.html' },
  },
});
