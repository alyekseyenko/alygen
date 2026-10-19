import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.qscore import calculate_qscore, to_grade, detect_sector


def test_to_grade():
    assert to_grade(95) == 'A+'
    assert to_grade(85) == 'A'
    assert to_grade(50) == 'D'
    assert to_grade(10) == 'F'


def test_detect_sector_ecommerce():
    lead = {'type': 'Loja Online'}
    analysis = {}
    assert detect_sector(lead, analysis) == 'ecommerce'


def test_calculate_qscore_empty():
    result = calculate_qscore({})
    assert isinstance(result['score'], int)
    assert result['score'] <= 30
    assert result['grade'] == 'F'


def test_calculate_qscore_perfect():
    analysis = {
        'performanceMobile': 100,
        'seo': {'score': 100},
        'security': {'score': 100, 'hasSSL': True},
        'accessibility': {'score': 100},
        'pixelDetails': {'totalTracking': 7},
        'hasCTA': True,
    }
    result = calculate_qscore(analysis, {'category': 'default'})
    assert result['score'] >= 90
    assert result['grade'] in ('A+', 'A')


def test_regional_label():
    analysis = {'performanceMobile': 50, 'seo': {'score': 50}, 'security': {'score': 50, 'hasSSL': True}}
    lead = {'address': '1000-001 Lisboa'}
    result = calculate_qscore(analysis, lead)
    assert 'region' in result
    assert 'Lisboa' in result['region']
