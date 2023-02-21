import pytest

import os
import sys
@pytest.fixture
def client():

    return main.app.test_client()
