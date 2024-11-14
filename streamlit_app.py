import streamlit as st
import pandas as pd
from google.cloud import bigquery
from google.oauth2 import service_account
import os
from dotenv import load_dotenv
import plotly.express as px
import plotly.graph_objects as go
from moe_algorithm import analyze_market_opportunity
import requests
from utils.rate_limiter import rate_limit, RateLimiter

# Load environment variables
load_dotenv()

# Page config
st.set_page_config(
    page_title="Market Opportunity Engine",
    page_icon="",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
    <style>
    .main {
        padding: 2rem;
    }
    .stButton>button {
        width: 100%;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    </style>
    """, unsafe_allow_html=True)

def init_session_state():
    """Initialize session state variables"""
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'home'
    if 'analysis_results' not in st.session_state:
        st.session_state.analysis_results = None

def sidebar():
    """Render the sidebar"""
    with st.sidebar:
        st.title("🔍 MOE Navigation")
        st.markdown("---")
        
        if st.button("🏠 Home"):
            st.session_state.current_page = 'home'
        if st.button("🎯 Analysis"):
            st.session_state.current_page = 'analysis'
        if st.button("📊 Results", disabled=st.session_state.analysis_results is None):
            st.session_state.current_page = 'results'
        if st.button("⚙️ Settings"):
            st.session_state.current_page = 'settings'
        
        st.markdown("---")
        st.markdown("### About")
        st.markdown("Market Opportunity Engine v1.0")

def display_metric_card(title, value, description=""):
    """Display a metric in a card format"""
    st.markdown(f"""
        <div class="metric-card">
            <h3>{title}</h3>
            <h2>{value}</h2>
            <p>{description}</p>
        </div>
    """, unsafe_allow_html=True)

def results_page():
    """Render the results page"""
    if st.session_state.analysis_results is None:
        st.warning("No analysis results available. Please run an analysis first.")
        return

    st.title("Analysis Results")
    results = st.session_state.analysis_results
    
    # Summary Section
    st.header("Summary")
    col1, col2, col3 = st.columns(3)
    with col1:
        display_metric_card(
            "Total Keywords",
            results['summary']['total_keywords'],
            "Unique keywords across all domains"
        )
    with col2:
        display_metric_card(
            "Opportunity Score",
            f"{results['summary']['avg_opportunity_score']:.2f}",
            "Average opportunity score"
        )
    with col3:
        display_metric_card(
            "High Opportunity Keywords",
            results['summary']['high_opportunity_keywords'],
            "Keywords with score > 0.7"
        )
    
    # Domain Metrics
    st.header("Domain Comparison")
    metrics_df = pd.DataFrame.from_dict(results['domain_metrics'], orient='index')
    
    # Create radar chart for domain comparison
    domains = list(results['domain_metrics'].keys())
    metrics = ['avg_position', 'total_traffic', 'avg_difficulty']
    
    fig = go.Figure()
    for domain in domains:
        fig.add_trace(go.Scatterpolar(
            r=[results['domain_metrics'][domain][m] for m in metrics],
            theta=metrics,
            fill='toself',
            name=domain
        ))
    
    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
        showlegend=True
    )
    
    st.plotly_chart(fig)
    
    # Top Opportunities
    st.header("Top Opportunities")
    top_opportunities_df = pd.DataFrame(results['top_opportunities'])
    st.dataframe(top_opportunities_df)
    
    # Keyword Overlap
    st.header("Keyword Overlap")
    overlap_data = results['keyword_overlap']
    overlap_df = pd.DataFrame.from_dict(overlap_data, orient='index')
    
    fig_overlap = px.bar(
        overlap_df,
        y='overlap_percentage',
        title="Keyword Overlap with Prospect Domain"
    )
    st.plotly_chart(fig_overlap)
    
    # Competitive Gaps
    st.header("Competitive Gaps")
    if results['competitive_gaps']:
        gaps_df = pd.DataFrame(results['competitive_gaps'])
        st.dataframe(gaps_df)
    else:
        st.info("No significant competitive gaps found.")

def analysis_page():
    """Render the analysis page"""
    st.title("Market Analysis")
    st.subheader("Domain Competition Analysis")
    
    # Check for API key
    api_key = os.getenv('SE_RANKING_API_KEY')
    if not api_key:
        st.error("SE Ranking API key not found. Please add it in the Settings page.")
        return
    
    # Prospect Domain Input
    prospect_domain = st.text_input("Enter Prospect Domain:", 
                                  placeholder="e.g., example.com",
                                  help="The main domain you want to analyze")
    
    # Competitor Domains Section
    st.subheader("Competitor Domains")
    
    # Initialize competitor domains in session state if not exists
    if 'competitor_domains' not in st.session_state:
        st.session_state.competitor_domains = []
    
    # Add new competitor domain
    new_competitor = st.text_input("Add Competitor Domain:", 
                                 placeholder="e.g., competitor.com",
                                 key="new_competitor")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        if st.button("Add Competitor") and new_competitor:
            if new_competitor not in st.session_state.competitor_domains:
                st.session_state.competitor_domains.append(new_competitor)
                st.session_state.new_competitor = ""  # Clear input
                st.rerun()
    
    # Display and manage competitor domains
    if st.session_state.competitor_domains:
        st.write("Current Competitors:")
        for i, domain in enumerate(st.session_state.competitor_domains):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.text(f"{i+1}. {domain}")
            with col2:
                if st.button("Remove", key=f"remove_{i}"):
                    st.session_state.competitor_domains.pop(i)
                    st.rerun()
    
    # Analysis Options
    st.subheader("Analysis Options")
    col1, col2 = st.columns(2)
    with col1:
        store_bigquery = st.checkbox("Store results in BigQuery", value=True)
    with col2:
        show_report = st.checkbox("Show analysis report", value=True)
    
    # Run Analysis Button
    if st.button("Run Market Analysis", type="primary", disabled=not (prospect_domain and st.session_state.competitor_domains)):
        if not prospect_domain:
            st.error("Please enter a prospect domain.")
        elif not st.session_state.competitor_domains:
            st.error("Please add at least one competitor domain.")
        else:
            progress_text = st.empty()
            progress_bar = st.progress(0)
            try:
                # Run the MOE analysis with progress updates
                total_steps = len(st.session_state.competitor_domains) + 3  # +3 for prospect domain, merging, and final analysis
                current_step = 0
                
                # Fetch prospect domain data
                progress_text.text(f"Fetching data for prospect domain: {prospect_domain}")
                results = analyze_market_opportunity(
                    prospect_domain,
                    st.session_state.competitor_domains,
                    progress_callback=lambda msg: progress_text.text(msg)
                )
                current_step += 1
                progress_bar.progress(current_step / total_steps)
                
                # Store results in session state
                st.session_state.analysis_results = results
                
                if store_bigquery:
                    progress_text.text("Storing results in BigQuery...")
                    # TODO: Implement BigQuery storage
                    st.info("BigQuery storage will be implemented soon")
                
                progress_text.text("Analysis completed successfully!")
                progress_bar.progress(1.0)
                
                if show_report:
                    st.session_state.current_page = 'results'
                    st.rerun()
                
            except ValueError as ve:
                st.error(f"Configuration error: {str(ve)}")
            except requests.exceptions.RequestException as re:
                st.error(f"API error: Failed to fetch data from SE Ranking. Please check your API key and try again. Error: {str(re)}")
            except Exception as e:
                st.error(f"An unexpected error occurred: {str(e)}")
            finally:
                progress_bar.empty()
                progress_text.empty()

@rate_limit(calls_per_second=1)
def verify_api_key(api_key):
    """Verify SE Rankings API key with rate limiting"""
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(
            "https://api4.seranking.com/research/us/overview/",
            params={"domain": "example.com"},
            headers=headers,
            timeout=10
        )
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 600))
            st.warning(f"Rate limit exceeded. Please try again in {retry_after} seconds.")
            return False
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        st.error(f"API request failed: {str(e)}")
        return False

def settings_page():
    """Render the settings page"""
    st.title("Settings")
    st.subheader("Configure Your Analysis Parameters")
    
    # Load current API key
    current_api_key = os.getenv('SE_RANKING_API_KEY', '')
    
    # API Key input
    api_key = st.text_input(
        "SE Ranking API Key:",
        type="password",
        value=current_api_key,
        help="Enter your SE Ranking API key. This is required for fetching domain keyword data."
    )
    
    # Save settings
    if st.button("Save Settings"):
        try:
            # Update .env file
            env_path = os.path.join(os.path.dirname(__file__), '.env')
            
            # Read existing env file
            env_vars = {}
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    for line in f:
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            env_vars[key] = value
            
            # Update API key
            env_vars['SE_RANKING_API_KEY'] = api_key
            
            # Write back to .env file
            with open(env_path, 'w') as f:
                for key, value in env_vars.items():
                    f.write(f"{key}={value}\n")
            
            # Reload environment variables
            load_dotenv()
            
            st.success("Settings saved successfully! API key has been updated.")
            
            # Verify API key works
            if api_key:
                with st.spinner("Verifying API key..."):
                    if verify_api_key(api_key):
                        st.success("API key verified successfully!")
                    else:
                        st.error("Invalid API key. Please check your credentials.")
        
        except Exception as e:
            st.error(f"Error saving settings: {str(e)}")

def home_page():
    """Render the home page"""
    st.title("Market Opportunity Engine")
    st.subheader("Welcome to your SEO and Market Analysis Dashboard")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### Quick Actions")
        if st.button("New Analysis"):
            st.session_state.current_page = 'analysis'
        if st.button("View Recent Reports"):
            st.info("Recent reports feature coming soon!")
    
    with col2:
        st.markdown("### Recent Activity")
        st.info("Activity feed coming soon!")

def main():
    """Main application logic"""
    init_session_state()
    sidebar()
    
    if st.session_state.current_page == 'home':
        home_page()
    elif st.session_state.current_page == 'analysis':
        analysis_page()
    elif st.session_state.current_page == 'results':
        results_page()
    elif st.session_state.current_page == 'settings':
        settings_page()

if __name__ == "__main__":
    main()
