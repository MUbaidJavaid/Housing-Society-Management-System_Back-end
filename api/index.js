/**
 * Vercel serverless entry — Express app via serverless-http.
 *
 * Build: `pnpm run build` → `dist/app.js` (exports `createApp`).
 * Vercel runs `vercel-build` then routes all traffic → this function.
 *
 * Note: Socket.IO needs a long-lived server; on Vercel it is skipped (see app.ts).
 * Use Pusher/Ably or keep sockets on a small always-on service if required.
 */

const serverless = require('serverless-http');

/** @type {import('serverless-http').Handler | undefined} */
let cachedHandler;

module.exports = async (req, res) => {
  if (!cachedHandler) {
    const { createApp } = require('../dist/app.js');
    const app = await createApp();
    cachedHandler = serverless(app, {
      binary: ['application/octet-stream', 'image/*', 'application/pdf'],
    });
  }
  return cachedHandler(req, res);
};
