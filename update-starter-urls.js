const fs = require('fs');

const dates = [
  '2022-10-19', '2022-07-13', '2009-09-10', '2015-08-30', 
  '2017-11-29', '2010-04-26', '2013-04-22', '2017-05-14', 
  '2011-05-15', '2016-04-21', '2014-10-12', '2015-01-05', 
  '2018-04-16', '2019-06-23', '2015-05-01', '2019-11-18', 
  '2017-09-15', '2022-08-22', '2023-02-14', '2021-02-14'
];

async function update() {
  const content = fs.readFileSync('space-image-of-the-day-frontend/src/data/starterApods.ts', 'utf8');
  let newContent = content;

  for (const date of dates) {
    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=fmfVcx3fQjultpmZwGXFzMLgVv4cNpZsD7b5kjno&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        
        // Let's just do text replacement for that specific array entry
        const blockRegex = new RegExp(`date:\\s*'${date}',[\\s\\S]*?height:\\s*\\d+`);
        const match = newContent.match(blockRegex);
        if (match) {
           let updatedBlock = match[0].replace(/url:\s*'[^']+'/, `url: '${data.url}'`);
           if (data.hdurl) {
               updatedBlock = updatedBlock.replace(/hdurl:\s*'[^']+'/, `hdurl: '${data.hdurl}'`);
           } else {
               updatedBlock = updatedBlock.replace(/hdurl:\s*'[^']+'/, `hdurl: '${data.url}'`);
           }
           newContent = newContent.replace(match[0], updatedBlock);
           console.log("Updated", date, data.url);
        } else {
           console.log("Could not match block for", date);
        }
      } else {
        console.log("Failed API req for", date, res.status);
      }
    } catch(e) {
      console.log("Error for", date, e.message);
    }
  }
  
  fs.writeFileSync('space-image-of-the-day-frontend/src/data/starterApods.ts', newContent);
  console.log("Done");
}

update();
