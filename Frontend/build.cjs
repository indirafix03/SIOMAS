const esbuild = require('C:/xampp/siomas-build/node_modules/esbuild');
const path = require('path');
const fs = require('fs');

try {
  const result = esbuild.buildSync({
    entryPoints: [path.join(__dirname, 'src/main.jsx')],
    bundle: true,
    write: false,
    loader: { '.js': 'jsx', '.jsx': 'jsx', '.css': 'empty' },
    define: { 'process.env.NODE_ENV': '"development"' },
    nodePaths: ['C:/xampp/siomas-build/node_modules']
  });

  const bundledCode = result.outputFiles[0].text;
  // Write to C:/xampp/siomas-build/dist/app.bundle.js
  const outDir = 'C:/xampp/siomas-build/dist';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'app.bundle.js'), bundledCode, 'utf8');
  console.log('Build successful! Generated ' + bundledCode.length + ' bytes.');
} catch (e) {
  console.error('Build error:', e);
  process.exit(1);
}
