from io import BytesIO
from time import sleep
from typing import Dict, List, Tuple

from bs4 import BeautifulSoup
import requests
import cv2
import requests
import numpy as np
import urllib.parse
import os
from PIL import Image
import pyemd

# Get the current directory of the script
script_dir = os.path.dirname(__file__)

# Construct the path to the image directory (assuming it's located in a directory called "assets" in the same directory as the script)
directory = os.path.join(script_dir, "assets", "favicons")
input_directory = os.path.join(script_dir, "assets", "favicons")

# Get a list of image files in the directory
image_files = [f for f in os.listdir(
    directory) if os.path.isfile(os.path.join(directory, f))]

# Load the database of factual logos as a list of numpy arrays
factual_logos = []
for image_file in image_files:
    image_path = os.path.join(directory, image_file)
    try:
        img = cv2.imread(image_path, cv2.IMREAD_COLOR)
        if img is not None:
            factual_logos.append((image_file.split('.')[0],img))
    except Exception as e:
        print(f"Failed to read image {image_file}: {e}")


def find_suspicious_inputs(soup: BeautifulSoup) -> List[str]:
    # Find all form inputs on the webpage
    form_inputs = soup.find_all('input')

    # TODO: look for placeholder
    # TODO: Classify type of suspicious input in array (i.e. "EMail":"<input/>")
    suspicious_inputs = []
    for form_input in form_inputs:
        type = form_input.get('type')
        name = form_input.get('name')
        if type is None:
            continue
        if type == 'text' and (name is not None and ('card' in name or 'credit' in name)):
            # This is a potential credit card input field
            suspicious_inputs.append(str(form_input))
        if type == 'email' or (type == 'text' and name is not None and 'user' in name):
            # This is a potential email or username input field
            suspicious_inputs.append(str(form_input))

        if type in ['password', 'text'] and not name:
            suspicious_inputs.append(str(form_input))

    return suspicious_inputs


def find_xss_attempts(soup: BeautifulSoup) -> List[Tuple[str, str]]:
    xss_attempts = []
    scripts = soup.find_all('script')
    for script in scripts:
        script_text = str(script)
        # TODO: include more checks
        if 'alert(' in script_text or 'prompt(' in script_text or 'confirm(' in script_text:
            xss_attempts.append(('Reflected', script_text))
        elif 'document.cookie' in script_text:
            xss_attempts.append(('Stored', script_text))
    return xss_attempts

def get_metrics(img1, img2):
    diff = cv2.subtract(img2, img1)
    err = np.sum(diff**2)
    mse = err/(float(16*16))
    msre = np.sqrt(mse)
    return mse,msre

def find_similar_favicon(soup: BeautifulSoup, url: str):
    favicon_link = soup.find('link', rel='shortcut icon')
    if not favicon_link:
        return "Can't find favicon"
    favicon_url = favicon_link.get('href')
    print(favicon_url)

    if not favicon_url.startswith("http"):
        favicon_url = url+favicon_url

    res = requests.get(favicon_url)
    if res.status_code != 200:
        return "Failed to download favicon"

    img = Image.open(BytesIO(res.content))
    input_logo = img.resize((16, 16), Image.ANTIALIAS)
    input_logo = np.array(input_logo)

    # Decode image to 3D numpy array
    # input_logo = cv2.imdecode(img_data, cv2.IMREAD_COLOR)

    # Compare the phishing logo with each factual logo in the database
    similar_favicon = []
    for name,logo in factual_logos:
        input_logo = cv2.cvtColor(logo, cv2.IMREAD_COLOR)
        # Use OpenCV's template matching function to compare the images
        result = cv2.matchTemplate(logo, input_logo, cv2.TM_SQDIFF_NORMED)
        _, score, _, _ = cv2.minMaxLoc(result)
        mse,msre = get_metrics(logo,input_logo)
        # if msre<2:
        distance_matrix = np.zeros((len(logo.flatten()), len(input_logo.flatten())))
        for i in range(len(logo.flatten())):
            for j in range(len(input_logo.flatten())):
                distance_matrix[i, j] = abs(i - j)
        emd = pyemd.emd(logo.flatten().astype(np.float64), input_logo.flatten().astype(np.float64), distance_matrix)
        similar_favicon.append({name: [mse,msre,score,emd]})
    return similar_favicon


async def scrape_website(url: str) -> Dict[str, List[str]]:
    # Check if URL is reachable
    headers = {'User-Agent': 'Mozilla/5.0',
               'ngrok-skip-browser-warning': 'true'}
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        return {"error": "Invalid URL"}

    # Parse HTML content using Beautiful Soup
    soup = BeautifulSoup(res.text, 'html.parser')
    similar_favicon = find_similar_favicon(soup, url)

    suspicious_inputs = find_suspicious_inputs(soup)
    xss_attempts = find_xss_attempts(soup)

    return {
        'suspicious_inputs': suspicious_inputs,
        'xss_attempts': xss_attempts,
        'similar_favicon': similar_favicon
    }
