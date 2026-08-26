const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    
    // Intercept requests and mock auth if needed, but since it's local, we can just inject local storage
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
        window.localStorage.setItem('auth-storage', JSON.stringify({
            state: {
                user: { id: 'test', email: 'surchanddsingh@siroiforex.com', role: 'statehead', branchId: '2f43bb22-4467-4d7a-af37-58b6680486a6' },
                isInitialized: true,
                session: {}
            }
        }));
    });
    
    await page.goto('http://localhost:5173/entry');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: 'entry_mobile.png', fullPage: true });
    await browser.close();
    console.log('Screenshot saved to entry_mobile.png');
})();
