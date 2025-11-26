import os
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
load_dotenv()

app = Flask(__name__)

API_KEY = os.getenv('OPENWEATHER_API_KEY')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_weather', methods=['POST'])
def get_weather():
    city = request.form.get('city')
    lat = request.form.get('lat')
    lon = request.form.get('lon')

    if lat and lon:
        query_str = f"lat={lat}&lon={lon}"
    elif city:
        query_str = f"q={city}"
    else:
        return jsonify({'error': 'Location required'}), 400

    current_url = f"http://api.openweathermap.org/data/2.5/weather?{query_str}&appid={API_KEY}&units=metric"
    forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?{query_str}&appid={API_KEY}&units=metric"

    try:

        current_resp = requests.get(current_url)
        if current_resp.status_code != 200:
            return jsonify({'error': 'Location not found'}), 404
        current_data = current_resp.json()

        forecast_resp = requests.get(forecast_url)
        forecast_data = forecast_resp.json()

        daily_forecast = []
        seen_dates = set()
        for item in forecast_data['list']:
            date_txt = item['dt_txt'].split(' ')[0]
            time_txt = item['dt_txt'].split(' ')[1]

            if date_txt not in seen_dates and "12:00" in time_txt:
                day_name = datetime.strptime(
                    date_txt, "%Y-%m-%d").strftime("%a")
                daily_forecast.append({
                    'day': day_name,
                    'temp': round(item['main']['temp']),
                    'icon': item['weather'][0]['icon']
                })
                seen_dates.add(date_txt)
        daily_forecast = daily_forecast[:5]

        tz_offset = timezone(timedelta(seconds=current_data['timezone']))

        def format_local_time(ts, tz):
            return datetime.fromtimestamp(ts, tz).strftime('%I:%M %p')

        sunrise_time = format_local_time(
            current_data['sys']['sunrise'], tz_offset)
        sunset_time = format_local_time(
            current_data['sys']['sunset'], tz_offset)

        now = datetime.now(tz_offset)
        date_str = now.strftime("%d/ %B/ %Y , %A")

        return jsonify({
            'city': current_data['name'],
            'country': current_data['sys']['country'],
            'date': date_str,
            'temp': round(current_data['main']['temp']),
            'temp_min': round(current_data['main']['temp_min'], 1),
            'temp_max': round(current_data['main']['temp_max'], 1),
            'feels_like': round(current_data['main']['feels_like'], 1),
            'desc': current_data['weather'][0]['main'],
            'icon': current_data['weather'][0]['icon'],
            'humidity': current_data['main']['humidity'],
            'pressure': current_data['main']['pressure'],
            'wind': round(current_data['wind']['speed'] * 3.6, 2),
            'sunrise': sunrise_time,
            'sunset': sunset_time,
            'forecast': daily_forecast
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Server connection failed.'}), 500


if __name__ == '__main__':
    app.run(debug=True)
