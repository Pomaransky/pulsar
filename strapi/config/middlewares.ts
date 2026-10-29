import path from 'path';
import fs from 'fs';

// Use project .tmp to avoid EPERM unlink on Windows (also set TMP/TEMP before start via npm run dev:win)
const tmpDir = path.resolve(process.cwd(), '.tmp');
fs.mkdirSync(tmpDir, { recursive: true });
process.env.TMP = tmpDir;
process.env.TEMP = tmpDir;
process.env.TMPDIR = tmpDir;

export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 'res.cloudinary.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 'res.cloudinary.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formidable: {
        uploadDir: tmpDir,
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
