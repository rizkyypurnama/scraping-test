const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const JSON5 = require('json5');
const balanced = require('balanced-match');
const http = require('http');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;
const cache = new Map();

let successCount = 0;
let failureCount = 0;

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/99.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0',
  'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.58 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/100.0.4896.58 Mobile/15E148 Safari/604.1'
];

app.get('/scrape-product', async (req, res) => {
  const productUrl = req.query.url;

  if (!productUrl || !productUrl.startsWith('https://smartstore.naver.com/') || !productUrl.includes('/products/')) {
    return res.status(400).json({ error: 'Invalid or missing Naver SmartStore product URL.' });
  }

  if (cache.has(productUrl)) {
    return res.json({ cached: true, ...cache.get(productUrl) });
  }

  try {
    const delay = process.env.STRESS_TEST === 'true' ? 0 : Math.random() * 500 + 200;
    await new Promise(r => setTimeout(r, delay));

    const response = await axios.get(productUrl, {
      proxy: {
        host: 'proxy-server.scraperapi.com',
        port: 8001,
        auth: {
          username: 'scraperapi.render=true.country_code=kr',
          password: 'c2ce3b3a4dd56c943bc43ab757bf71fa',
        },
        protocol: 'http',
      },
      headers: {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Cache-Control': 'no-cache',
      },
      timeout: 30000,
      httpAgent,
      httpsAgent
    });

    const html = response.data;
    const $ = cheerio.load(html);

    let rawScript = null;
    $('script').each((_, el) => {
      const scriptContent = $(el).html();
      if (scriptContent && scriptContent.includes('window.__PRELOADED_STATE__')) {
        rawScript = scriptContent;
      }
    });

    if (!rawScript) {
      failureCount++;
      return res.status(404).json({ error: '__PRELOADED_STATE__ not found in HTML.' });
    }

let preloadString;

const match = rawScript.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.*\});?/s);
if (match && match[1]) {
  preloadString = match[1];
} else {
  const idx = rawScript.indexOf('{');
  const jsonPart = rawScript.slice(idx);
  const pair = balanced('{', '}', jsonPart);

  if (!pair || !pair.body) {
    failureCount++;
    return res.status(500).json({ error: 'Failed to extract preload state (regex and balanced fallback failed)' });
  }

  preloadString = `{${pair.body}}`;
}

let state;
try {
  state = JSON5.parse(preloadString);
} catch (e) {
  failureCount++;
  return res.status(500).json({ error: 'Failed to parse preload state', details: e.message });
}


    const result = { status: 'success', url: productUrl, data: state };
    cache.set(productUrl, result);
    successCount++;
    return res.json(result);

  } catch (err) {
    failureCount++;
    console.error(err.message);
    return res.status(500).json({
      error: axios.isAxiosError(err)
        ? err.response
          ? `HTTP ${err.response.status}`
          : 'No response from target'
        : err.message,
    });
  }
});



app.get('/status', (req, res) => {
  const total = successCount + failureCount;
  res.json({
    uptime: process.uptime().toFixed(0) + 's',
    successCount,
    failureCount,
    totalRequests: total,
    errorRate: total === 0 ? '0%' : ((failureCount / total) * 100).toFixed(2) + '%',
  });
});

app.listen(port, () => {
  console.log(`✅ Scraper API running at http://localhost:${port}`);
  console.log(`🔍 Test use: http://localhost:${port}/scrape-product?url=https://smartstore.naver.com/rainbows9030/products/10785143997`);
});
