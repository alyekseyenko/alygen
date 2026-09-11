import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from microservices import calculate_score_numpy, to_grade, detect_sector

def test_to_grade():
    assert to_grade(95) == 'A+'
    assert to_grade(85) == 'A'
    assert to_grade(50) == 'D'
    assert to_grade(10) == 'F'

def test_detect_sector_ecommerce():
    lead = {'type': 'Loja Online'}
    analysis = {}
    assert detect_sector(lead, analysis) == 'ecommerce'

def test_calculate_score_numpy_empty():
    result = calculate_score_numpy({})
    assert isinstance(result['score'], int)
    assert result['score'] < 30  # Empty analysis means penalties
    assert result['grade'] == 'F'

def test_calculate_score_numpy_perfect():
    analysis = {
        'performanceMobile': 100,
        'seo': {'score': 100},
        'security': {'score': 100, 'hasSSL': True},
        'accessibility': {'score': 100},
        'pixelDetails': {'totalTracking': 7}
    }
    result = calculate_score_numpy(analysis, {'category': 'default'})
    assert result['score'] >= 95
    assert result['grade'] == 'A+'

def test_benchmarking():
    analysis = {}
    all_leads = [
        {'qScore': 50, 'city': 'Lisboa', 'category': 'agency'},
        {'qScore': 70, 'city': 'Lisboa', 'category': 'agency'}
    ]
    lead = {'city': 'lisboa', 'category': 'agency'}
    result = calculate_score_numpy(analysis, lead, all_leads)
    
    assert 'benchmark' in result
    assert result['benchmark']['city_avg'] == 60
