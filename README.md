# Smartstore Scraper API

This project is a RESTful API built using Node.js to scrape product data from Naver Smartstore using Puppeteer.

## Features

- Scrape product details from a given Naver Smartstore product URL.
- Easily test scraping using the provided endpoint.
- Optional support for proxy rotation (commented for simplicity).

## Requirements

- Node.js >= 14
- npm

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/smartstore-api.git
cd smartstore-api
```

2. Install dependencies:

```bash
npm install
```

## Usage

Start the server:

```bash
node app.js
```

You should see:

```bash
✅ Scraper API running at http://localhost:3000
test use http://localhost:3000/scrape-product?url=https://smartstore.naver.com/rainbows9030/products/10785143997
```

## Test Runner

To test multiple product URLs for success/failure and latency, run:

```bash
node test-runner.js
```

This script reads from `urls.json`, sends requests to the API, and prints a report with the number of successes, failures, and average latency.

## Project Structure

- `app.js` — Main server file and scraper endpoint
- `scraper.js` — Puppeteer-based scraping logic
- `test-runner.js` — Script for testing multiple URLs

## Example API Request

```http
GET /scrape-product?url=https://smartstore.naver.com/rainbows9030/products/10785143997
```

