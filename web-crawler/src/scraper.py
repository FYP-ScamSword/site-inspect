from typing import Dict, List, Tuple

from bs4 import BeautifulSoup
import requests


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


async def scrape_website(url: str) -> Dict[str, List[str]]:
    # Check if URL is reachable
    res = requests.get(url)
    if res.status_code != 200:
        return {"error": "Invalid URL"}

    # Parse HTML content using Beautiful Soup
    soup = BeautifulSoup(res.text, 'html.parser')
    suspicious_inputs = find_suspicious_inputs(soup)
    xss_attempts = find_xss_attempts(soup)

    return {
        'suspicious_inputs': suspicious_inputs,
        'xss_attempts': xss_attempts
    }
