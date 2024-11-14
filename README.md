# Market Opportunity Engine Frontend

A Streamlit-based web application for analyzing market opportunities using SEO data from SE Ranking and storing results in BigQuery.

## Features

- Fetch keyword data for multiple domains using SE Ranking API
- Identify branded vs non-branded keywords
- Calculate traffic and value metrics
- Store results in BigQuery for further analysis
- Export data to CSV

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Add your SE Ranking API key
- Update BigQuery project and dataset names if needed

3. Run the application:
```bash
streamlit run app.py
```

## Usage

1. Enter your domain and competitor domains
2. Add any branded terms to filter out
3. Click "Analyze" to start the process
4. View results and download data as needed

## Requirements

- Python 3.11+
- SE Ranking API access
- Google Cloud project with BigQuery enabled
- Required Python packages listed in requirements.txt
