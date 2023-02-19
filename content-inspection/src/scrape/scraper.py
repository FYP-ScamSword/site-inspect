from io import BytesIO
from typing import Dict, List

from bs4 import BeautifulSoup
import requests
from .favicon_checker import favicon_checker
from .form_checker import form_checker
from .xss_checker import xss_checker


async def scrape_website(url: str) -> Dict[str, List[str]]:
    # Check if URL is reachable
    headers = {'User-Agent': 'Mozilla/5.0',
               'ngrok-skip-browser-warning': 'true'}
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        return {"error": "Invalid URL"}

    # Parse HTML content using Beautiful Soup
    soup = BeautifulSoup(res.text, 'html.parser')

    return {
        'suspicious_inputs': form_checker(soup),
        'xss_attempts':  xss_checker(soup),
        'similar_favicon': favicon_checker(soup, url)
    }
