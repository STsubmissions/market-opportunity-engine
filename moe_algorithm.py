import os
import pandas as pd
import numpy as np
from typing import List, Dict
import requests
from datetime import datetime
import time
from dotenv import load_dotenv
from utils.rate_limiter import rate_limit, RateLimiter

load_dotenv()

# Initialize rate limiters
research_limiter = RateLimiter(calls_per_second=1)  # 1 request per second for research API

@rate_limit(calls_per_second=1)
def make_api_request(url, headers=None, params=None, retries=3, delay=1):
    """Make a rate-limited API request with retries"""
    response = None
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if response is not None and response.status_code == 429:  # Rate limit exceeded
                retry_after = int(response.headers.get('Retry-After', 60))
                time.sleep(retry_after)
                continue
            
            if attempt == retries - 1:  # Last attempt
                error_msg = str(e)
                if response is not None:
                    error_msg = f"HTTP {response.status_code}: {response.text}"
                raise Exception(f"API request failed after {retries} attempts: {error_msg}")
            
            # Exponential backoff for other errors
            time.sleep(delay * (2 ** attempt))

def fetch_domain_keywords(domain: str) -> pd.DataFrame:
    """
    Fetch keyword data for a domain using SE Ranking API
    """
    api_key = os.getenv('SE_RANKING_API_KEY')
    if not api_key:
        raise ValueError("SE Ranking API key not found in environment variables")
    
    # SE Ranking API endpoints
    base_url = "https://api4.seranking.com/research"
    
    # Headers for all requests
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        # Get domain keywords with pagination
        keywords = []
        page = 1
        while True:
            keyword_params = {
                "domain": domain,
                "type": "organic",
                "limit": 1000,
                "page": page,
                "cols": "keyword,position,prev_pos,volume,cpc,competition,url,traffic,price"
            }
            
            keyword_response = make_api_request(
                f"{base_url}/us/keywords/",
                headers=headers,
                params=keyword_params
            )
            
            # Check if we got valid data
            if not isinstance(keyword_response, dict) or 'rows' not in keyword_response:
                print(f"Unexpected API response format: {keyword_response}")
                break
                
            rows = keyword_response.get('rows', [])
            if not rows:
                break
                
            # Process each keyword row
            for row in rows:
                if isinstance(row, dict):
                    keywords.append({
                        'keyword': row.get('keyword', ''),
                        'position': row.get('position', 0),
                        'prev_pos': row.get('prev_pos', 0),
                        'volume': row.get('volume', 0),
                        'cpc': row.get('cpc', 0.0),
                        'competition': row.get('competition', 0),
                        'url': row.get('url', ''),
                        'traffic': row.get('traffic', 0),
                        'price': row.get('price', 0.0)
                    })
            
            page += 1
            
            # Limit to first 10 pages for now to avoid long processing times
            if page > 10:
                break
        
        # Process the rankings data into a DataFrame
        keywords_data = []
        for keyword in keywords:
            keyword_info = {
                'keyword': keyword.get('keyword', ''),
                'search_volume': keyword.get('volume', 0),
                'position': keyword.get('position', 0),
                'traffic': keyword.get('traffic', 0),
                'difficulty': keyword.get('competition', 0),
                'cpc': keyword.get('cpc', 0.0)
            }
            keywords_data.append(keyword_info)
        
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

def analyze_market_opportunity(prospect_domain: str, competitor_domains: List[str], progress_callback=None) -> Dict:
    """
    Analyze market opportunity by comparing prospect domain with competitors
    """
    # Fetch data for all domains
    prospect_data = fetch_domain_keywords(prospect_domain)
    prospect_data['domain'] = prospect_domain
    
    if progress_callback:
        progress_callback(0.1, "Fetching competitor data...")
    
    all_data = [prospect_data]
    for domain in competitor_domains:
        comp_data = fetch_domain_keywords(domain)
        comp_data['domain'] = domain
        all_data.append(comp_data)
    
    if progress_callback:
        progress_callback(0.3, "Combining data...")
    
    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    
    if progress_callback:
        progress_callback(0.4, "Calculating opportunity scores...")
    
    # Calculate opportunity scores
    combined_df['opportunity_score'] = combined_df.apply(calculate_opportunity_score, axis=1)
    
    if progress_callback:
        progress_callback(0.6, "Generating analysis results...")
    
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
    
    if progress_callback:
        progress_callback(0.7, "Calculating domain-specific metrics...")
    
    # Calculate domain-specific metrics
    for domain in [prospect_domain] + competitor_domains:
        domain_data = combined_df[combined_df['domain'] == domain]
        results['domain_metrics'][domain] = {
            'total_keywords': len(domain_data),
            'avg_position': domain_data['position'].mean(),
            'total_traffic': domain_data['traffic'].sum(),
            'avg_difficulty': domain_data['difficulty'].mean()
        }
    
    if progress_callback:
        progress_callback(0.8, "Calculating keyword overlap...")
    
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
    
    if progress_callback:
        progress_callback(0.9, "Finding competitive gaps...")
    
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
    
    if progress_callback:
        progress_callback(1.0, "Analysis complete!")
    
    return results
