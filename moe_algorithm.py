import pandas as pd
import numpy as np
from typing import List, Dict
import requests
from datetime import datetime
import os
from dotenv import load_dotenv
import time

load_dotenv()

def fetch_domain_keywords(domain: str) -> pd.DataFrame:
    """
    Fetch keyword data for a domain using SE Ranking API
    """
    api_key = os.getenv('SE_RANKING_API_KEY')
    if not api_key:
        raise ValueError("SE Ranking API key not found in environment variables")
    
    # SE Ranking API endpoints
    base_url = "https://api.seranking.com/v3"
    
    # First, create a project for the domain
    project_url = f"{base_url}/projects"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    project_data = {
        "site": domain,
        "title": f"MOE Analysis - {domain}",
        "searchEngine": "google.com"
    }
    
    try:
        # Create project
        project_response = requests.post(project_url, headers=headers, json=project_data)
        project_response.raise_for_status()
        project_id = project_response.json()['id']
        
        # Wait for initial data collection
        time.sleep(5)
        
        # Fetch keyword rankings
        rankings_url = f"{base_url}/keywords/{project_id}/rankings"
        rankings_response = requests.get(rankings_url, headers=headers)
        rankings_response.raise_for_status()
        rankings_data = rankings_response.json()
        
        # Process the rankings data into a DataFrame
        keywords_data = []
        for keyword in rankings_data.get('keywords', []):
            keyword_info = {
                'keyword': keyword.get('keyword', ''),
                'search_volume': keyword.get('searchVolume', 0),
                'position': keyword.get('position', 0),
                'traffic': keyword.get('traffic', 0),
                'difficulty': keyword.get('difficulty', 0),
                'cpc': keyword.get('cpc', 0.0)
            }
            keywords_data.append(keyword_info)
        
        # Clean up - delete the project
        delete_url = f"{base_url}/projects/{project_id}"
        requests.delete(delete_url, headers=headers)
        
        return pd.DataFrame(keywords_data)
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error fetching data from SE Ranking API: {str(e)}")

def calculate_opportunity_score(row: pd.Series) -> float:
    """
    Calculate opportunity score based on keyword metrics
    """
    volume_weight = 0.3
    position_weight = 0.25
    difficulty_weight = 0.25
    cpc_weight = 0.2
    
    # Normalize values between 0 and 1
    volume_score = np.log1p(row['search_volume']) / 10  # log scale for volume
    position_score = (100 - row['position']) / 100  # higher positions are better
    difficulty_score = (100 - row['difficulty']) / 100  # lower difficulty is better
    cpc_score = np.minimum(row['cpc'] / 5, 1)  # cap at $5 CPC
    
    return (volume_score * volume_weight +
            position_score * position_weight +
            difficulty_score * difficulty_weight +
            cpc_score * cpc_weight)

def analyze_market_opportunity(prospect_domain: str, competitor_domains: List[str]) -> Dict:
    """
    Analyze market opportunity by comparing prospect domain with competitors
    """
    # Fetch data for all domains
    prospect_data = fetch_domain_keywords(prospect_domain)
    prospect_data['domain'] = prospect_domain
    
    all_data = [prospect_data]
    for domain in competitor_domains:
        comp_data = fetch_domain_keywords(domain)
        comp_data['domain'] = domain
        all_data.append(comp_data)
    
    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Calculate opportunity scores
    combined_df['opportunity_score'] = combined_df.apply(calculate_opportunity_score, axis=1)
    
    # Generate analysis results
    results = {
        'timestamp': datetime.now().isoformat(),
        'prospect_domain': prospect_domain,
        'competitor_domains': competitor_domains,
        'summary': {
            'total_keywords': len(combined_df['keyword'].unique()),
            'avg_opportunity_score': combined_df['opportunity_score'].mean(),
            'high_opportunity_keywords': len(combined_df[combined_df['opportunity_score'] > 0.7])
        },
        'domain_metrics': {},
        'top_opportunities': combined_df.nlargest(10, 'opportunity_score').to_dict('records'),
        'keyword_overlap': {},
        'competitive_gaps': {}
    }
    
    # Calculate domain-specific metrics
    for domain in [prospect_domain] + competitor_domains:
        domain_data = combined_df[combined_df['domain'] == domain]
        results['domain_metrics'][domain] = {
            'total_keywords': len(domain_data),
            'avg_position': domain_data['position'].mean(),
            'total_traffic': domain_data['traffic'].sum(),
            'avg_difficulty': domain_data['difficulty'].mean()
        }
    
    # Calculate keyword overlap
    all_keywords = set(combined_df['keyword'].unique())
    prospect_keywords = set(prospect_data['keyword'])
    
    for domain in competitor_domains:
        comp_keywords = set(combined_df[combined_df['domain'] == domain]['keyword'])
        overlap = prospect_keywords.intersection(comp_keywords)
        results['keyword_overlap'][domain] = {
            'overlap_count': len(overlap),
            'overlap_percentage': len(overlap) / len(prospect_keywords) * 100
        }
    
    # Find competitive gaps (keywords competitors rank for but prospect doesn't)
    competitor_keywords = set()
    for domain in competitor_domains:
        competitor_keywords.update(combined_df[combined_df['domain'] == domain]['keyword'])
    
    gaps = competitor_keywords - prospect_keywords
    if gaps:
        gap_data = combined_df[
            (combined_df['keyword'].isin(gaps)) & 
            (combined_df['domain'].isin(competitor_domains))
        ]
        results['competitive_gaps'] = gap_data.nlargest(10, 'opportunity_score').to_dict('records')
    
    return results
