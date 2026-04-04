import { TriggerMonitor } from './triggerMonitor.js';
import { getDb, seedDemoData } from './db.js';

process.env.DEMO_MODE = 'true';

seedDemoData();
const monitor = new TriggerMonitor();
monitor.runChecks().then(() => {
  console.log('Checks completed');
}).catch(err => {
  console.error("FATAL ERROR", err);
});
