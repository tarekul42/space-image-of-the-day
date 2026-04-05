const fs = require('fs');

const path = 'space-image-of-the-day-frontend/src/data/starterApods.ts';
let content = fs.readFileSync(path, 'utf8');

// The objects look like:
//   {
//     date: '2018-04-16',
//     ...
//     media_type: 'video',
//     ...
//     height: 1600
//   },

const regex = /\s*\{\s*date:\s*'[^']+',[\s\S]*?media_type:\s*'video'[\s\S]*?height:\s*\d+\s*\},?/g;

const newContent = content.replace(regex, '');

fs.writeFileSync(path, newContent);
console.log("Removed videos");
