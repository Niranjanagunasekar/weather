async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) return alert("Enter city");

  const r = await fetch(`/api/weather?city=${city}`);
  const data = await r.json();

  const result = document.getElementById("result");

  if (data.error) {
    result.innerHTML = `<p>Error: ${data.error}</p>`;
    return;
  }

  if (data.cod === "404") {
    result.innerHTML = `<p>City not found</p>`;
    return;
  }

  result.innerHTML = `
    <h2>${data.name}</h2>
    <p>Temp: ${data.main.temp}°C</p>
    <p>Weather: ${data.weather[0].description}</p>
  `;
}

searchBtn.onclick = () => loadWeather(cityInput.value.trim());

clearBtn.onclick = () => {
  cityInput.value = "";
  cityInput.focus();
};

async function loadWeather(city) {
  if (!city) return alert("Enter city name");

  const cur = await fetch(`/api/weather?city=${city}`).then(r => r.json());
  const forecast = await fetch(`/api/forecast?city=${city}`).then(r => r.json());

  if (cur.cod != 200) return alert("City not found");

  updateCurrent(cur);
  updateDetails(cur);
  updateLast8Hours(forecast);
  update5Days(forecast);

  // Reset and replay entrance animation for cards/main (iOS-like pop)
  document.querySelectorAll('.card, .main').forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow to reset animation
    el.style.animation = '';
  });
}

function updateCurrent(cur) {
  const icon = cur.weather[0].icon;
  const desc = cur.weather[0].description;

  bigIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  bigTemp.textContent = Math.round(cur.main.temp) + "°C";
  bigDesc.textContent = desc;
  bigPlace.textContent = `${cur.name}, ${cur.sys.country}`;

  // Change background based on weather
  updateBackground(desc);
  
  // Auto night mode detection
  if (icon.endsWith("n")) {
    document.body.className = "bg-night";
  }
}

function updateDetails(cur) {
  dTemp.textContent = Math.round(cur.main.temp) + "°C";
  dFeels.textContent = Math.round(cur.main.feels_like) + "°C";
  dWeather.textContent = cur.weather[0].description;
  dHum.textContent = cur.main.humidity + "%";
}

function updateBackground(condition) {
  document.body.classList.remove(
    "bg-clear","bg-cloudy","bg-drizzle","bg-rain","bg-thunder",
    "bg-snow","bg-fog","bg-night","bg-default"
  );

  condition = condition.toLowerCase();

  if (condition.includes("thunderstorm")) {
    document.body.classList.add("bg-thunder");
  }
  else if (condition.includes("rain")) {
    document.body.classList.add("bg-rain");
  }
  else if (condition.includes("drizzle")) {
    document.body.classList.add("bg-drizzle");
  }
  else if (condition.includes("snow")) {
    document.body.classList.add("bg-snow");
  }
  else if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) {
    document.body.classList.add("bg-fog");
  }
  else if (condition.includes("cloud")) {
    document.body.classList.add("bg-cloudy");
  }
  else if (condition.includes("clear")) {
    document.body.classList.add("bg-clear");
  }
  else {
    document.body.classList.add("bg-default");
  }
}

function updateLast8Hours(forecast) {
  const raw = forecast.list.slice(0, 4); 

  const hourly = [];

  for (let i = 0; i < raw.length - 1; i++) {
    const a = raw[i];
    const b = raw[i + 1];

    const t1 = a.main.temp;
    const t2 = b.main.temp;

    const time1 = new Date(a.dt_txt);

    const iconA = a.weather[0].icon;
    const iconB = b.weather[0].icon;

    for (let h = 0; h < 3; h++) {
      const hourTime = new Date(time1.getTime() + h * 3600 * 1000);

      // Smooth temp
      const temp = t1 + ((t2 - t1) * (h / 3));

      // Pick closest icon
      const icon = h < 2 ? iconA : iconB;

      hourly.push({
        time: hourTime,
        temp: temp,
        icon: icon
      });
    }
  }

  const last8 = hourly.slice(-8);

  hourList.innerHTML = "";
  const temps = [];

  last8.forEach(item => {
    temps.push(item.temp);

    const el = document.createElement("div");
    el.className = "hourItem";
    el.innerHTML = `
      <div>${item.time.getHours().toString().padStart(2,'0')}:00</div>
      <img src="https://openweathermap.org/img/wn/${item.icon}@2x.png">
      <div>${Math.round(item.temp)}°</div>
    `;
    hourList.appendChild(el);
  });

  drawChart(temps);
}

function drawChart(temps) {
  const w = chartCanvas.width = chartCanvas.clientWidth;
  const h = chartCanvas.height = 140;

  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#00c8ff";

  const max = Math.max(...temps);
  const min = Math.min(...temps);

  ctx.beginPath();
  temps.forEach((t, i) => {
    const x = (w / (temps.length - 1)) * i;
    const y = h - ((t - min) / (max - min)) * (h - 30) - 10;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function update5Days(forecast) {
  weekGrid.innerHTML = "";
  const daily = {};

  forecast.list.forEach(item => {
    const day = item.dt_txt.slice(0, 10);
    if (!daily[day]) daily[day] = [];
    daily[day].push(item);
  });

  const days = Object.keys(daily).slice(0, 5);

  days.forEach(day => {
    const arr = daily[day];

    const iconCount = {};
    arr.forEach(i => {
      const icon = i.weather[0].icon;
      if (!iconCount[icon]) iconCount[icon] = 0;
      iconCount[icon]++;
    });

    const mostUsedIcon = Object.keys(iconCount).sort((a,b)=>iconCount[b]-iconCount[a])[0];

    const avgTemp = arr.reduce((a, b) => a + b.main.temp, 0) / arr.length;

    const card = document.createElement("div");
    card.className = "dayCard";
    card.innerHTML = `
      <div>${new Date(day).toDateString().slice(0,3)}</div>
      <img src="https://openweathermap.org/img/wn/${mostUsedIcon}@2x.png">
      <div>${Math.round(avgTemp)}°C</div>
    `;
    weekGrid.appendChild(card);
  });
}

