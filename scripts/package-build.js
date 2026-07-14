const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Script to package the built application for deployment.
 * It creates a zip file containing only the necessary production files.
 */

async function packageApp() {
  const rootDir = path.resolve(__dirname, '..');
  const outputZip = path.join(rootDir, 'build-package.zip');
  
  console.log('📦 Starting packaging process...');

  // Create a file to stream archive data to.
  const output = fs.createWriteStream(outputZip);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  // Listen for all archive data to be written
  output.on('close', function() {
    console.log(`\n✅ Packaging complete!`);
    console.log(`📂 Output: ${outputZip}`);
    console.log(`📊 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  });

  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      console.warn('⚠️ Warning:', err);
    } else {
      throw err;
    }
  });

  archive.on('error', function(err) {
    throw err;
  });

  // Pipe archive data to the file
  archive.pipe(output);

  console.log('  - Adding root files...');
  archive.file(path.join(rootDir, 'package.json'), { name: 'package.json' });
  archive.file(path.join(rootDir, 'pnpm-workspace.yaml'), { name: 'pnpm-workspace.yaml' });
  archive.file(path.join(rootDir, 'pnpm-lock.yaml'), { name: 'pnpm-lock.yaml' });
  archive.file(path.join(rootDir, 'production.config.js'), { name: 'production.config.js' });
  
  if (fs.existsSync(path.join(rootDir, '.env'))) {
    archive.file(path.join(rootDir, '.env'), { name: '.env' });
  }

  console.log('  - Adding backend production files...');
  archive.file(path.join(rootDir, 'backend', 'package.json'), { name: 'backend/package.json' });
  if (fs.existsSync(path.join(rootDir, 'backend', 'dist'))) {
    archive.directory(path.join(rootDir, 'backend', 'dist'), 'backend/dist');
  } else {
    console.warn('❌ Backend build (dist) not found! Run pnpm build:all first.');
  }

  console.log('  - Adding frontend production files...');
  archive.file(path.join(rootDir, 'frontend', 'package.json'), { name: 'frontend/package.json' });
  if (fs.existsSync(path.join(rootDir, 'frontend', '.next'))) {
    archive.directory(path.join(rootDir, 'frontend', '.next'), 'frontend/.next');
  } else {
    console.warn('❌ Frontend build (.next) not found! Run pnpm build:all first.');
  }
  
  if (fs.existsSync(path.join(rootDir, 'frontend', 'public'))) {
    archive.directory(path.join(rootDir, 'frontend', 'public'), 'frontend/public');
  }

  // Note: node_modules are NOT included by default to keep the package small.
  // The user should run 'pnpm install --prod' on the server.
  console.log('ℹ️ Note: node_modules are excluded. Run "pnpm install" on your server.');

  // Finalize the archive
  await archive.finalize();
}

packageApp().catch(err => {
  console.error('❌ Packaging failed:', err);
  process.exit(1);
});
