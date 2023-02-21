from bs4 import BeautifulSoup
from unittest import TestCase
from src.scrape.xss_checker import xss_checker


class TestXSSChecker(TestCase):
    def test_reflected_xss(self):
        soup = BeautifulSoup("""
            <html>
            <body>
                <script>alert('Hello, World!');</script>
            </body>
            </html>
        """, 'html.parser')
        self.assertEqual(xss_checker(soup), [('Reflected', "<script>alert('Hello, World!');</script>")])

    def test_stored_xss(self):
        soup = BeautifulSoup("""
            <html>
            <body>
                <script>document.cookie = 'session_id=12345';</script>
            </body>
            </html>
        """, 'html.parser')
        self.assertEqual(xss_checker(soup), [('Stored', "<script>document.cookie = 'session_id=12345';</script>")])

    def test_no_xss(self):
        soup = BeautifulSoup("""
            <html>
            <body>
                <script>console.log('Hello, World!');</script>
            </body>
            </html>
        """, 'html.parser')
        self.assertEqual(xss_checker(soup), [])
