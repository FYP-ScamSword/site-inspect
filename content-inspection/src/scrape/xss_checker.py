from bs4 import BeautifulSoup
from typing import List, Tuple

def xss_checker(soup: BeautifulSoup) -> List[Tuple[str, str]]:
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
