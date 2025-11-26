let myChart = null;

document.getElementById("geoBtn").addEventListener("click", () => {
	if (navigator.geolocation) {
		toggleLoader(true);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lon = position.coords.longitude;

				const formData = new FormData();
				formData.append("lat", lat);
				formData.append("lon", lon);

				updateWeather(formData);
			},
			(error) => {
				toggleLoader(false);
				showError("Unable to retrieve location. Please allow access.");
			}
		);
	} else {
		alert("Geolocation is not supported by your browser.");
	}
});

document.getElementById("weatherForm").addEventListener("submit", (e) => {
	e.preventDefault();
	const cityInput = document.getElementById("cityInput");
	const city = cityInput.value.trim();

	if (!city) return;

	cityInput.blur();

	const formData = new FormData();
	formData.append("city", city);

	updateWeather(formData);
});

async function updateWeather(formData) {
	const errorMsg = document.getElementById("errorMsg");
	const body = document.body;

	document.getElementById("headlineData").classList.add("hidden");
	document.getElementById("mainContent").classList.add("hidden");
	document.getElementById("forecastData").classList.add("hidden");
	document.getElementById("errorMsg").classList.add("hidden");

	toggleLoader(true);

	try {
		const res = await fetch("/get_weather", {
			method: "POST",
			body: formData,
		});
		const data = await res.json();

		toggleLoader(false);

		if (res.ok) {
			document.getElementById("cityName").innerText = data.city;
			document.getElementById("country").innerText = data.country;
			document.getElementById("date").innerText = data.date;
			document.getElementById("temp").innerText = data.temp;
			document.getElementById("desc").innerText = data.desc;

			document.getElementById(
				"feelsLike"
			).innerText = `${data.feels_like}°`;
			document.getElementById("temp_min").innerText = data.temp_min;
			document.getElementById("temp_max").innerText = data.temp_max;
			document.getElementById("humidity").innerText = data.humidity;
			document.getElementById("wind").innerText = data.wind;
			document.getElementById("sunrise").innerText = data.sunrise;
			document.getElementById("sunset").innerText = data.sunset;

			renderChart(data.forecast);

			const forecastContainer = document.getElementById("forecastData");
			forecastContainer.innerHTML = "";

			data.forecast.forEach((day) => {
				forecastContainer.innerHTML += `
                    <div class="forecast-card">
                        <div class="f-day">${day.day}</div>
                        <img src="http://openweathermap.org/img/wn/${day.icon}.png" class="f-icon">
                        <div class="f-temp">${day.temp}°</div>
                    </div>`;
			});

			const iconCode = data.icon;
			const mainCondition = data.desc;

			body.className = "";

			if (iconCode === "01n") {
				body.classList.add("Night-Clear");
			} else if (
				["Rain", "Clouds", "Clear", "Snow", "Thunderstorm"].includes(
					mainCondition
				)
			) {
				body.classList.add(mainCondition);
			}

			document.getElementById("headlineData").classList.remove("hidden");
			document.getElementById("mainContent").classList.remove("hidden");
			document.getElementById("forecastData").classList.remove("hidden");
		} else {
			showError(data.error);
		}
	} catch (err) {
		toggleLoader(false);
		showError("Connection failed. Please check your internet.");
		console.error(err);
	}
}

function renderChart(forecastData) {
	const ctx = document.getElementById("weatherChart").getContext("2d");

	const labels = forecastData.map((item) => item.day);
	const temps = forecastData.map((item) => item.temp);

	if (myChart) {
		myChart.destroy();
	}

	myChart = new Chart(ctx, {
		type: "line",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Temperature (°C)",
					data: temps,
					borderColor: "rgba(255, 255, 255, 1)",
					backgroundColor: "rgba(255, 255, 255, 0.1)",
					borderWidth: 2,
					tension: 0.4,
					pointBackgroundColor: "#fff",
					pointRadius: 4,
					fill: true,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: "rgba(0,0,0,0.8)",
					titleColor: "#fff",
					bodyColor: "#fff",
				},
			},
			scales: {
				x: {
					ticks: { color: "rgba(255,255,255,0.8)" },
					grid: { display: false },
				},
				y: {
					ticks: { color: "rgba(255,255,255,0.8)" },
					grid: { color: "rgba(255,255,255,0.1)" },
					beginAtZero: false,
				},
			},
		},
	});
}

function toggleLoader(show) {
	const loader = document.getElementById("loader");
	if (show) loader.classList.remove("hidden");
	else loader.classList.add("hidden");
}

function showError(message) {
	const errorMsg = document.getElementById("errorMsg");
	errorMsg.innerText = message;
	errorMsg.classList.remove("hidden");
}
