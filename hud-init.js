// hud-init.js
const hud = require('hud-sdk/setup');


// Add internal packages names from node_modules using glob patterns (e.g., '@your-org/*').
// Hud does not auto-instrument anything inside node_modules unless specified.
hud.register({
  includeModules: ['./js/index.js'],
  verbose: true, // Enable verbose logging to see codemap generation
});

void hud.initSession('local_5098469a31d5d29c1f11db80c18a01be27c5ba8fd11d58fdd24d1a01fb064809', 'qodo');