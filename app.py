import streamlit as st
import pandas as pd
import numpy as np
from google.cloud import bigquery
import requests
from datetime import datetime
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Constants
BASE_URL = "https://api4.seranking.com/research"
SERANKING_API_KEY = os.getenv("SERANKING_API_KEY")
PROJECT_ID = os.getenv("GCP_PROJECT_ID")
DATASET_NAME = os.getenv("BIGQUERY_DATASET")

def make_api_request(endpoint, params=None, max_retries=3):
    """Make an API request to SE Ranking with retry logic."""
    headers = {
        "Authorization": f"Bearer {SERANKING_API_KEY}",
        "Content-Type": "application/json"
    }
    url = f"{BASE_URL}/{endpoint}"
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                st.error(f"API request failed: {str(e)}")
                raise
            time.sleep(2 ** attempt)  # Exponential backoff

def fetch_domain_data(domain: str, progress_bar=None) -> pd.DataFrame:
    """Fetch keyword data for a domain with pagination."""
    all_data = []
    page = 1
    total_pages = 1
    
    while page <= total_pages:
        params = {
            "domain": domain,
            "type": "organic",
            "limit": 1000,
            "page": page,
            "cols": "keyword,position,prev_pos,volume,cpc,competition,url,traffic,price"
        }
        
        try:
            response_data = make_api_request("us/keywords/", params)
            if page == 1:
                total_pages = (response_data.get("total", 0) + 999) // 1000
                if progress_bar:
                    progress_bar.total = total_pages
            
            keywords = response_data.get("keywords", [])
            if not keywords:
                break
                
            for kw in keywords:
                kw["domain"] = domain
                kw["date"] = datetime.now().strftime("%Y-%m")
            
            all_data.extend(keywords)
            if progress_bar:
                progress_bar.progress(page / total_pages)
            
            page += 1
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            st.error(f"Error fetching data for {domain} on page {page}: {str(e)}")
            break
    
    if not all_data:
        return pd.DataFrame()
    
    df = pd.DataFrame(all_data)
    df = df.rename(columns={
        "keyword": "Keyword",
        "volume": "Search_Volume",
        "position": "Position",
        "prev_pos": "Previous_Position",
        "cpc": "CPC",
        "competition": "Competition",
        "url": "URL",
        "traffic": "Traffic",
        "price": "Traffic_Cost",
        "domain": "Competitor"
    })
    
    return df

def save_to_bigquery(df: pd.DataFrame, table_name: str):
    """Save DataFrame to BigQuery."""
    try:
        client = bigquery.Client(project=PROJECT_ID)
        table_id = f"{PROJECT_ID}.{DATASET_NAME}.{table_name}"
        
        # Configure the load job
        job_config = bigquery.LoadJobConfig(
            write_disposition="WRITE_APPEND",
        )
        
        # Load the data
        job = client.load_table_from_dataframe(df, table_id, job_config=job_config)
        job.result()  # Wait for the job to complete
        
        st.success(f"Successfully saved {len(df)} rows to BigQuery table {table_id}")
        
    except Exception as e:
        st.error(f"Error saving to BigQuery: {str(e)}")

def main():
    st.set_page_config(page_title="Market Opportunity Engine", page_icon="📊", layout="wide")
    
    st.title("Market Opportunity Engine")
    st.write("Analyze market opportunities and track competitive insights")
    
    # Input section
    with st.form("input_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            domain = st.text_input("Your Domain (e.g., example.com)")
            branded_terms = st.text_input("Branded Terms (comma-separated)")
            
        with col2:
            competitors = st.text_area("Competitor Domains (one per line)")
            
        submit_button = st.form_submit_button("Analyze")
    
    if submit_button:
        if not domain or not competitors:
            st.warning("Please enter both your domain and at least one competitor.")
            return
            
        competitor_list = [domain] + [c.strip() for c in competitors.split('\n') if c.strip()]
        all_data = []
        
        # Create a progress container
        progress_container = st.container()
        
        for comp in competitor_list:
            with progress_container:
                st.write(f"Fetching data for: {comp}")
                progress_bar = st.progress(0)
                df = fetch_domain_data(comp, progress_bar)
                if not df.empty:
                    all_data.append(df)
                    st.success(f"Successfully fetched {len(df)} keywords for {comp}")
                progress_bar.empty()
        
        if all_data:
            # Combine all data
            final_df = pd.concat(all_data, ignore_index=True)
            
            # Add branded flag
            if branded_terms:
                branded_patterns = '|'.join(term.strip() for term in branded_terms.split(','))
                final_df['Branded'] = final_df['Keyword'].str.contains(
                    branded_patterns, case=False, regex=True).astype(int)
            else:
                final_df['Branded'] = 0
            
            # Save to BigQuery
            save_to_bigquery(final_df, "moe_raw_data")
            
            # Display summary
            st.subheader("Analysis Summary")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Total Keywords", len(final_df))
                
            with col2:
                total_traffic = final_df['Traffic'].sum()
                st.metric("Total Traffic", f"{total_traffic:,.0f}")
                
            with col3:
                total_value = final_df['Traffic_Cost'].sum()
                st.metric("Total Traffic Value", f"${total_value:,.2f}")
            
            # Show data preview
            st.subheader("Data Preview")
            st.dataframe(final_df.head(100))
            
            # Download link
            csv = final_df.to_csv(index=False)
            st.download_button(
                label="Download Full Data as CSV",
                data=csv,
                file_name="market_opportunity_data.csv",
                mime="text/csv"
            )

if __name__ == "__main__":
    main()
