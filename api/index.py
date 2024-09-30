from flask import Flask, jsonify, render_template, request
import pandas as pd
from datetime import datetime

app = Flask(__name__)

# Load data from Excel file
# Replace 'your_excel_file.xlsx' with the path to your actual Excel file
from os.path import join
fileName=join('api', 'your_excel_file.xlsx')
df = pd.read_excel(fileName)
df=df.fillna("")

# Convert date columns to datetime
df['postDate'] = pd.to_datetime(df['postDate'])
df['callDate'] = pd.to_datetime(df['callDate'])

@app.route('/')
def index():
    return render_template('index.html')



@app.route('/api/interviews')
def get_interviews():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    sort_by = request.args.get('sort_by', 'callDate')
    sort_order = request.args.get('sort_order', 'desc')

    # Sort the dataframe
    sorted_df = df.sort_values(by=sort_by, ascending=(sort_order == 'asc'))

    # Paginate the results
    start = (page - 1) * per_page
    end = start + per_page
    paginated_df = sorted_df.iloc[start:end]
    # Convert DataFrame to list of dictionaries
    interviews = paginated_df.to_dict('records')
    
    # Convert datetime objects to strings
    for interview in interviews:
        interview['postDate'] = interview['postDate'].strftime('%Y-%m-%d')
        interview['callDate'] = interview['callDate'].strftime('%Y-%m-%d')

    return jsonify({
        'interviews': interviews,
        'total': len(df),
        'page': page,
        'per_page': per_page
    })


@app.route('/api/search')
def search_interviews():
    query = request.args.get('query', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    sort_by = request.args.get('sort_by', 'callDate')
    sort_order = request.args.get('sort_order', 'desc')

    # Perform case-insensitive search across multiple columns
    results = df[
        df['title'].str.contains(query, case=False, na=False) |
        df['summary'].str.contains(query, case=False, na=False) |
        df['Company Name'].str.contains(query, case=False, na=False) |
        df['topics'].str.contains(query, case=False, na=False)
    ]


    # Sort the results
    sorted_results = results.sort_values(by=sort_by, ascending=(sort_order == 'asc'))

    # Paginate the results
    start = (page - 1) * per_page
    end = start + per_page
    paginated_results = sorted_results.iloc[start:end]

    # Convert DataFrame to list of dictionaries
    interviews = paginated_results.to_dict('records')


    # Convert datetime objects to strings
    for interview in interviews:
        interview['postDate'] = interview['postDate'].strftime('%Y-%m-%d')
        interview['callDate'] = interview['callDate'].strftime('%Y-%m-%d')
    return jsonify({
        'interviews': interviews,
        'total': len(results),
        'page': page,
        'per_page': per_page
    })

if __name__ == '__main__':
    app.run(debug=True)