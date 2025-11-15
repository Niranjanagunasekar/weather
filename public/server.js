// script.js
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const cityInput = document.getElementById('cityInput');

const placeEl = document.getElementById('place');
const bigTempEl = document.getElementById('bigTemp');
const bigDescEl = document.getElementById('bigDesc');
const bigIconEl = document.getElementById('bigIcon');
const precipEl = document.getElementById('precip');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');

const hoursListEl = document.getElementById('hoursList');
const weekGridEl = document.getElementById('weekGrid');
const hoursCanvas = document.getElementById('hoursChart');
const hoursCtx = hoursCanvas.getContext('2d');

function setLoading(on = true) {
  const main = document.getElementById('mainDisplay');
  if (on) main.classList.add('loading'); else main.classList.remove('loading');
}

// Helper: build OpenWeather icon URL
function iconUrl(iconCode, size = 4) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Format helpers
function fmtHour(dt, tzOffset=0) {
  const d = new Date((dt + tzOffset) * 1000);
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}
function fmtDay(dt,tzOffset=0) {
  const d = new Date((dt + tzOffset) * 1000);
  return d.toLocaleDateString(undefined, { weekday:'short' });
}

// Clear UI
function clearUI(){
  hoursListEl.innerHTML = '';
  weekGridEl.innerHTML = '';
}

// Draw simple line on canvas for hourly temps
function drawHoursChart(hourly, tzOffset) {
  const canvas = hoursCanvas;
  const ctx = hoursCtx;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  ctx.scale(2,2);
  ctx.clearRect(0,0,rect.width,rect.height);

  const padding = 20;
  const w = rect.width - padding*2;
  const h = rect.height - padding*2;

  const temps = hourly.map(h => Math.round(h.temp));
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = Math.max(1, maxT - minT);

  const stepX = w / Math.max(1, hourly.length - 1);
  const points = hourly.map((pt, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (pt.temp - minT) / range) * h;
    return {x,y, temp: Math.round(pt.temp), dt: pt.dt};
  });

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points) ctx.lineTo(p.x, p.y);
  ctx.lineTo(points[points.length-1].x, padding + h);
  ctx.lineTo(points[0].x, padding + h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,211,107,0.12)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = '#ffd36b';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillText(p.temp + '°', p.x, p.y - 8);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '11px system-ui';
  for (const p of points) {
    ctx.fillText(fmtHour(p.dt, tzOffset), p.x, rect.height - 6);
  }
}

// Main: fetch by city (gets lat/lon), then fetch full onecall
async function searchCity(city) {
  if (!city) return;
  setLoading(true);
  clearUI();

  try {
    const resp = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!resp.ok) {
      const text = await resp.text();
      alert('Error: ' + text);
      setLoading(false);
      return;
    }
    const curData = await resp.json();
    const lat = curData.coord.lat;
    const lon = curData.coord.lon;

    const r2 = await fetch(`/api/fullweather?lat=${lat}&lon=${lon}`);
    if (!r2.ok) {
      const t = await r2.text();
      alert('Error fullweather: ' + t);
      setLoading(false);
      return;
    }
    const full = await r2.json();
    renderFullData(curData, full);
  } catch (err) {
    console.error(err);
    alert('Request failed: ' + err.message);
  } finally {
    setLoading(false);
  }
}

// Render data to page
function renderFullData(curData, full) {
  const tzOffset = full.timezone_offset || 0;
  placeEl.textContent = `${curData.name}, ${curData.sys?.country || ''}`;
  bigTempEl.textContent = Math.round(curData.main.temp) + '°C';
  bigDescEl.textContent = (curData.weather && curData.weather[0] && curData.weather[0].description) || '';
  bigIconEl.src = iconUrl(curData.weather[0].icon);
  precipEl.textContent = `Precip: ${(curData.rain && curData.rain['1h']) ? (curData.rain['1h'] + ' mm') : ( (full.hourly && full.hourly[0] && Math.round((full.hourly[0].pop||0)*100)+'%') )}`;
  humidityEl.textContent = `Humidity: ${curData.main.humidity}%`;
  windEl.textContent = `Wind: ${Math.round(curData.wind.speed)} m/s`;

  const hours = (full.hourly || []).slice(0, 12);
  const last8 = hours.slice(0, 8);

  hoursListEl.innerHTML = '';
  for (const h of last8) {
    const el = document.createElement('div');
    el.className = 'hour-item';
    el.innerHTML = `<div style="font-weight:700">${fmtHour(h.dt, tzOffset)}</div>
                    <div style="font-size:12px" class="muted">${h.weather[0].description}</div>
                    <div style="margin-top:6px;font-weight:700">${Math.round(h.temp)}°C</div>`;
    hoursListEl.appendChild(el);
  }

  drawHoursChart(last8, tzOffset);

  const daily = (full.daily || []).slice(0, 7);
  weekGridEl.innerHTML = '';
  for (const d of daily) {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
      <div class="day">${fmtDay(d.dt, tzOffset)}</div>
      <img src="${iconUrl(d.weather[0].icon)}" alt="icon" style="width:48px;height:48px;margin-top:6px"/>
      <div class="temps">
        <div style="font-weight:700">${Math.round(d.temp.max)}° / ${Math.round(d.temp.min)}°</div>
        <div class="muted" style="font-size:12px">Pop: ${Math.round((d.pop||0)*100)}%</div>
      </div>
    `;
    weekGridEl.appendChild(card);
  }
}

// Event listeners
searchBtn.addEventListener('click', () => {
  const q = cityInput.value.trim();
  if (!q) return alert('Type a city name');
  searchCity(q);
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  setLoading(true);
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    try {
      const r = await fetch(`/api/fullweather?lat=${lat}&lon=${lon}`);
      if (!r.ok) { const t = await r.text(); alert('Error: '+t); setLoading(false); return; }
      const full = await r.json();
      const curFake = {
        name: 'Your location',
        sys: { country: '' },
        main: { temp: Math.round(full.current.temp), humidity: full.current.humidity, feels_like: full.current.feels_like },
        weather: full.current.weather,
        wind: { speed: full.current.wind_speed },
        coord: { lat, lon }
      };
      renderFullData(curFake, full);
    } catch (err) {
      alert('Geo request failed: ' + err.message);
    } finally { setLoading(false); }
  }, (err) => {
    setLoading(false);
    alert('Location error: ' + err.message);
  }, { enableHighAccuracy: true });
});

window.addEventListener('load', () => {
  // Optional demo: auto-search
  // document.getElementById('cityInput').value = 'Chennai'; searchCity('Chennai');
});
