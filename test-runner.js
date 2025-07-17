const axios = require('axios');
const fs = require('fs');

const targetHost = 'http://localhost:3000';
const urls = [
  'https://smartstore.naver.com/rainbows9030/products/9645732504',
  'https://smartstore.naver.com/rainbows9030/products/9651683428',
  'https://smartstore.naver.com/rainbows9030/products/10785143997',
];

let results = [];
const iterations = 50;

(async () => {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    for (let j = 0; j < iterations; j++) {
      const fullUrl = `${targetHost}/scrape-product?url=${encodeURIComponent(url)}`;
      const start = Date.now();

      try {
        const response = await axios.get(fullUrl);
        const latency = Date.now() - start;

        console.log(`✅ [${i + 1}.${j + 1}] Success - ${latency}ms`);
        results.push({ index: `${i + 1}.${j + 1}`, status: 'success', latency, url });
      } catch (error) {
        const latency = Date.now() - start;
        const errMsg = error.response
          ? `HTTP ${error.response.status}`
          : error.message;

        console.log(`❌ [${i + 1}.${j + 1}] Failed - ${errMsg} - ${latency}ms`);
        results.push({ index: `${i + 1}.${j + 1}`, status: 'fail', latency, url, error: errMsg });
      }
    }
  }

  const success = results.filter(r => r.status === 'success');
  const fail = results.filter(r => r.status === 'fail');
  const avgLatency = success.length
    ? (success.reduce((a, b) => a + b.latency, 0) / success.length).toFixed(2)
    : 0;

  const summary = {
    total: results.length,
    success: success.length,
    failed: fail.length,
    avgLatency: `${avgLatency}ms`,
    errorRate: ((fail.length / results.length) * 100).toFixed(2) + '%'
  };

  console.log('\n🎯 Test Summary');
  console.table(summary);

  fs.writeFileSync('results.json', JSON.stringify({ summary, results }, null, 2));
})();
