const https = require('https');
const fs = require('fs');

const pages = [
  { name: 'rag-korla', url: 'https://www.myinstants.com/en/instant/rag-korla-47846/' },
  { name: 'bangladeshi-gaali', url: 'https://www.myinstants.com/en/instant/bangladeshi-people-gaali-80100/' },
  { name: 'gribera-bhalo-acho', url: 'https://www.myinstants.com/en/instant/griberaa-bhaalo-aacho-73231/' }
];

async function getPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  for (const p of pages) {
    try {
      const html = await getPage(p.url);
      const match = html.match(/https:\/\/www\.myinstants\.com\/media\/sounds\/[^"'<>\s]+\.mp3/i);
      console.log(p.name, match ? match[0] : 'Not found');
    } catch (e) {
      console.error(p.name, e.message);
    }
  }
}

run();
