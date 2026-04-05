const https = require("https");
const dates = ["2015-07-14", "2012-09-25", "2023-10-14"]; // 2023-10-14 Solar Eclipse
const apiKey = "fmfVcx3fQjultpmZwGXFzMLgVv4cNpZsD7b5kjno";

async function fetchApod(date) {
    return new Promise((resolve) => {
        https.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(JSON.parse(data)));
        });
    });
}

(async () => {
    let result = "";
    for (let d of dates) {
        const data = await fetchApod(d);
        if (data.media_type === "image") {
            const explanation = data.explanation.replace(/'/g, "\\'");
            result += `  {\n`;
            result += `    date: '${data.date}',\n`;
            result += `    title: '${data.title.replace(/'/g,"\\'")}',\n`;
            result += `    explanation: '${explanation}',\n`;
            result += `    url: '${data.url}',\n`;
            result += `    hdurl: '${data.hdurl || data.url}',\n`;
            result += `    media_type: '${data.media_type}',\n`;
            result += `    object_type: 'Space', // Added generic object_type\n`;
            result += `    width: 2000,\n`;
            result += `    height: 1500\n`;
            result += `  },\n`;
        }
    }
    console.log(result);
})();
