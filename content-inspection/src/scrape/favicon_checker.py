from io import BytesIO
from typing import List, Tuple

from urllib.parse import urlparse

def favicon_checker(url: str) -> dict:
    parsed_url = urlparse(url)
    favicon_url = parsed_url.scheme + "://" + parsed_url.netloc + "/favicon.ico"
    similar_favicon = []
    # todo: call model

    return {"favicon_url":favicon_url, "similar_favicon":tuple(similar_favicon)}
