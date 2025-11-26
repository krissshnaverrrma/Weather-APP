import os
from dotenv import load_dotenv
import requests

load_dotenv()
api_key = os.getenv('OPENWEATHER_API_KEY')

print(f"Testing Key: {api_key}")
city = "Hapur"
url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"

response = requests.get(url)
data = response.json()

print("\n--- RESULTS ---")
print(f"Status Code: {response.status_code}")
print(f"Full Response: {data}")
