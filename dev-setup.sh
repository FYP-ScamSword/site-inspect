#!/usr/bin/env bash
pip install -r requirements-dev.txt
pre-commit install

# Test pre-commit hooks once
pre-commit run --all-files
