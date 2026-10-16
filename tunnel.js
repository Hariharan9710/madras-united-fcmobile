// Keep-alive tunnel runner for Madras United FC Mobile Website
const localtunnel = require('localtunnel');

const PORT = process.env.PORT || 3000;
const SUBDOMAIN = process.env.SUBDOMAIN || `madras-united-${Math.floor(1000 + Math.random() * 9000)}`;

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });

    console.log(`====================================================`);
    console.log(`🌐 LIVE PUBLIC TOURNAMENT LINK ONLINE!`);
    console.log(`👉 Link: ${tunnel.url}`);
    console.log(`📱 Share this single link with all 25+ players!`);
    console.log(`====================================================`);

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
      tunnel.close();
    });
  } catch (err) {
    console.error('Failed to start tunnel:', err.message);
    setTimeout(startTunnel, 4000);
  }
}

startTunnel();
