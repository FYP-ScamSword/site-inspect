import os

from typing import Dict, List

from bs4 import BeautifulSoup
import requests
from .scrape.favicon_checker import favicon_checker
from .scrape.form_checker import form_checker
from .scrape.xss_checker import xss_checker
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
from http.client import HTTPException

cwd = os.getcwd()

# Specify the path to the .env file relative to the current working directory
dotenv_path = os.path.join(cwd, '.env')
load_dotenv(dotenv_path)

client = MongoClient(os.environ.get('MONGO_URI'))
db = client[os.environ.get('MONGO_DATABASE')]
collection = db[os.environ.get('MONGO_COLLECTION')]


async def scrape_website(url: str) -> Dict[str, List[str]]:
    # Check if URL is reachable
    headers = {'User-Agent': 'Mozilla/5.0',
               'ngrok-skip-browser-warning': 'true'}
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        # Check if URL exists in database
        if collection.find_one({'url': url}):
            # Update 'alive' field to False
            collection.update_one({'url': url}, {'$set': {'alive': False}})
            # Return result from database
            return collection.find_one({'url': url}, {'_id': 0})
        else:
            raise HTTPException(res.status_code, {"message": "Invalid URL"})

    # Parse HTML content using Beautiful Soup
    soup = BeautifulSoup(res.text, 'html.parser')

    # Create dictionary of scraped data
    scraped_data = {
        'url': url,
        'html': soup.prettify(),
        'suspicious_inputs': form_checker(soup),
        'xss_attempts': xss_checker(soup),
        'similar_favicon': favicon_checker(url),
        'alive': True,
        'updated_at': datetime.now()
    }

    # Insert or update scraped data in database
    collection.update_one({'url': url}, {'$set': scraped_data}, upsert=True)

    return scraped_data