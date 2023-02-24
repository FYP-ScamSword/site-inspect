from bs4 import BeautifulSoup
from typing import List


def form_checker(soup: BeautifulSoup) -> List[str]:
    # Find all form inputs on the webpage
    form_inputs = soup.find_all('input')

    # TODO: look for placeholder
    # TODO: Classify input_type of suspicious input in array (i.e. "EMail":"<input/>")
    suspicious_inputs = []
    for form_input in form_inputs:
        input_type = form_input.get('type')
        input_name = form_input.get('name')
        if input_type is None:
            continue
        if input_type == 'text' and (input_name is not None and ('card' in input_name or 'credit' in input_name)):
            # This is a potential credit card input field
            suspicious_inputs.append(str(form_input))
        if input_type in ['text', 'email', 'password', 'tel', 'hidden']:
            suspicious_inputs.append(str(form_input))

    return suspicious_inputs
