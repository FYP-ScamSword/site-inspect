from unittest import TestCase
from bs4 import BeautifulSoup
import sys
import os

from src.scrape.form_checker import form_checker


class TestFormChecker(TestCase):
    def test_return_suspicious_input(self):
        # test for a webpage with suspicious input fields
        soup = BeautifulSoup("""
            <html>
            <body>
                <form>
                    <input type="text" name="credit_card_number" placeholder="Credit card number">
                    <input type="text" name="username" placeholder="Username">
                    <input type="password" placeholder="Password">
                </form>
            </body>
            </html>
        """, 'html.parser')
        self.assertEqual(form_checker(soup), [
            '<input name="credit_card_number" placeholder="Credit card number" type="text"/>',
            '<input name="username" placeholder="Username" type="text"/>',
            '<input placeholder="Password" type="password"/>'
        ])

    def test_return_no_suspicious_input(self):

        # test for a webpage with no suspicious input fields
        soup = BeautifulSoup("""
            <html>
            <body>
                <form>
                    <input type="text" name="name" placeholder="Name">
                </form>
                <p>ok</p>
            </body>
            </html>
        """, 'html.parser')
        self.assertEqual(form_checker(soup), [])
