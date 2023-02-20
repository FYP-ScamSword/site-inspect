import pytest

import os
import sys
@pytest.fixture
def client():
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
    from src import screenshot,main

    return main.app.test_client()
