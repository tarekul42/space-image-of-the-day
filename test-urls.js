const fs = require('fs');
const content = fs.readFileSync('space-image-of-the-day-frontend/src/data/starterApods.ts', 'utf8');

// just extract the URLs with regex
const urls = [...content.matchAll(/hdurl:\s*'([^']+)'/g)].map(m => m[1]);

(async () => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) {
        console.log("FAIL:", url);
      } else {
        console.log("OK:", url);
      }
    } catch(e) {
      console.log("ERROR:", url, e.message);
    }
  }
})();
