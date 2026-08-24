const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Test 1: Direct access to /login
  console.log("Testing direct access to /login...");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  let url = page.url();
  console.log("Current URL after direct access:", url);
  
  // Test 2: Invalid email on homepage
  console.log("\nTesting invalid email on homepage...");
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.type('#email', 'hacker@example.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  url = page.url();
  console.log("Current URL after invalid email:", url);
  
  // Test 3: Valid email on homepage
  console.log("\nTesting valid email on homepage...");
  await page.evaluate(() => document.getElementById('email').value = '');
  await page.type('#email', 'surchanddsingh@siroiforex.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  url = page.url();
  console.log("Current URL after valid email:", url);
  
  await browser.close();
})();
