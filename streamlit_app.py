import streamlit as st
import pandas as pd
from google.cloud import bigquery
from google.oauth2 import service_account
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Page config
st.set_page_config(
    page_title="Market Opportunity Engine",
    page_icon="📊",
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
    </style>
    """, unsafe_allow_html=True)

def init_session_state():
    """Initialize session state variables"""
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'home'

def sidebar():
    """Render the sidebar"""
    with st.sidebar:
        st.title("🔍 MOE Navigation")
        st.markdown("---")
        
        if st.button("🏠 Dashboard"):
            st.session_state.current_page = 'home'
        if st.button("🎯 Market Analysis"):
            st.session_state.current_page = 'analysis'
        if st.button("⚙️ Settings"):
            st.session_state.current_page = 'settings'
        
        st.markdown("---")
        st.markdown("### About")
        st.markdown("Market Opportunity Engine v1.0")

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

def analysis_page():
    """Render the analysis page"""
    st.title("Market Analysis")
    st.subheader("Analyze Market Opportunities")
    
    with st.form("analysis_form"):
        domain = st.text_input("Domain to analyze:")
        keywords = st.text_area("Keywords (one per line):")
        
        col1, col2 = st.columns(2)
        with col1:
            location = st.selectbox("Location", ["United States", "United Kingdom", "Canada", "Australia"])
        with col2:
            depth = st.slider("Analysis Depth", 1, 5, 3)
        
        if st.form_submit_button("Start Analysis"):
            if domain and keywords:
                st.info("Analysis started! This feature will be implemented soon.")
            else:
                st.error("Please fill in both domain and keywords.")

def settings_page():
    """Render the settings page"""
    st.title("Settings")
    st.subheader("Configure Your Analysis Parameters")
    
    api_key = st.text_input("SE Ranking API Key:", type="password")
    if st.button("Save Settings"):
        st.success("Settings saved successfully!")

def main():
    """Main application logic"""
    init_session_state()
    sidebar()
    
    if st.session_state.current_page == 'home':
        home_page()
    elif st.session_state.current_page == 'analysis':
        analysis_page()
    elif st.session_state.current_page == 'settings':
        settings_page()

if __name__ == "__main__":
    main()
