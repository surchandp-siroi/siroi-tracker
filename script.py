from playwright.sync_api import sync_playwright
import time
import urllib.request
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('https://mixkit.co/free-stock-video/beautiful-satellite-shot-of-planet-earth-45033/')
    video_element = page.query_selector('video')
    if video_element:
        src = video_element.get_attribute('src')
        print('Found URL:', src)
        urllib.request.urlretrieve(src, 'public/earth.mp4')
        print('Downloaded successfully.')
    else:
        print('Video not found.')
    browser.close()
