/**
 * Vercel serverless entry — Express app via serverless-http.
 *
 * Build: `pnpm run build` → `dist/app.js` (exports `createApp`).
 */

const path = require('path');
const serverless = require('serverless-http');

/** @type {import('serverless-http').Handler | undefined} */
let cachedHandler;

function resolveAppModule() {
  const appPath = path.join(__dirname, '..', 'dist', 'app.js');
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(appPath);
}

module.exports = async (req, res) => {
  try {
    if (!cachedHandler) {
      const { createApp } = resolveAppModule();
      if (typeof createApp !== 'function') {
        throw new Error('dist/app.js did not export createApp');
      }
      const app = await createApp();
      cachedHandler = serverless(app, {
        binary: ['application/octet-stream', 'image/*', 'application/pdf'],
      });
    }
    return cachedHandler(req, res);
  } catch (err) {
    console.error('[api/index] Serverless bootstrap failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'FUNCTION_BOOTSTRAP_FAILED',
        message,
      });
    }
  }
};
