#!/usr/bin/env node
/**
 * Generate VAPID keys for web push notifications.
 * Run: node scripts/generate-vapid-keys.js
 * Add the output to your .env file:
 *   VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 */
const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nVAPID_SUBJECT=mailto:support@hsms.app (optional)');
