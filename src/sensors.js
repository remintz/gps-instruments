const G = 9.81;
const MS_TO_KMH = 3.6;

// DOM refs (resolved lazily after DOM is ready)
let els = {};

function getEls() {
  els = {
    startBtn: document.getElementById('start-btn'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    speed: document.getElementById('speed'),
    headingDeg: document.getElementById('heading-deg'),
    headingCardinal: document.getElementById('heading-cardinal'),
    compassNeedle: document.getElementById('compass-needle'),
    altGps: document.getElementById('alt-gps'),
    altBaro: document.getElementById('alt-baro'),
    gforceDot: document.getElementById('gforce-dot'),
    gbarX: document.getElementById('gbar-x'),
    gbarY: document.getElementById('gbar-y'),
    gbarZ: document.getElementById('gbar-z'),
    gvalX: document.getElementById('gval-x'),
    gvalY: document.getElementById('gval-y'),
    gvalZ: document.getElementById('gval-z'),
    accuracyInfo: document.getElementById('accuracy-info'),
  };
}

function degreesToCardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function setStatus(active, text) {
  els.statusDot.classList.toggle('active', active);
  els.statusText.textContent = text;
}

// ── GPS ──

let gpsWatchId = null;

function startGPS() {
  if (!('geolocation' in navigator)) {
    setStatus(false, 'Geolocation não suportada');
    return;
  }

  gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { speed, heading, altitude, accuracy, altitudeAccuracy } = pos.coords;

      // Speed
      if (speed !== null && speed >= 0) {
        els.speed.textContent = (speed * MS_TO_KMH).toFixed(1);
      } else {
        els.speed.textContent = '0.0';
      }

      // Heading
      if (heading !== null && !isNaN(heading)) {
        const h = Math.round(heading);
        els.headingDeg.textContent = `${h}°`;
        els.headingCardinal.textContent = degreesToCardinal(h);
        els.compassNeedle.setAttribute('transform', `rotate(${h}, 40, 40)`);
      }

      // Altitude GPS
      if (altitude !== null) {
        els.altGps.textContent = `${Math.round(altitude)} m`;
      }

      // Accuracy info
      const parts = [];
      if (accuracy) parts.push(`GPS ±${Math.round(accuracy)}m`);
      if (altitudeAccuracy) parts.push(`Alt ±${Math.round(altitudeAccuracy)}m`);
      els.accuracyInfo.textContent = parts.join(' · ');

      setStatus(true, 'Sensores ativos');
    },
    (err) => {
      setStatus(false, `GPS erro: ${err.message}`);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );
}

// ── Barometer (Generic Sensor API) ──

function startBarometer() {
  if (!('Barometer' in window)) {
    els.altBaro.textContent = 'N/D';
    return;
  }

  try {
    const barometer = new Barometer({ frequency: 1 });
    barometer.addEventListener('reading', () => {
      // Standard atmosphere: altitude from pressure
      // h = 44330 * (1 - (P/P0)^0.1903)
      const P0 = 1013.25; // hPa at sea level
      const P = barometer.pressure / 100; // Pa to hPa
      const alt = 44330 * (1 - Math.pow(P / P0, 0.1903));
      els.altBaro.textContent = `${Math.round(alt)} m`;
    });
    barometer.addEventListener('error', () => {
      els.altBaro.textContent = 'N/D';
    });
    barometer.start();
  } catch {
    els.altBaro.textContent = 'N/D';
  }
}

// ── Accelerometer / G-Force ──

function startMotion() {
  function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null) return;

    const gx = acc.x / G;
    const gy = acc.y / G;
    const gz = acc.z / G;

    // Values
    els.gvalX.textContent = `${gx.toFixed(2)} G`;
    els.gvalY.textContent = `${gy.toFixed(2)} G`;
    els.gvalZ.textContent = `${gz.toFixed(2)} G`;

    // Bars: map -3G..+3G to 0%..100%
    updateBar(els.gbarX, gx);
    updateBar(els.gbarY, gy);
    updateBar(els.gbarZ, gz);

    // Dot on circle: map X,Y to position (±3G = full radius)
    const maxG = 3;
    const dotX = 45 + (gx / maxG) * 35;
    const dotY = 45 - (gy / maxG) * 35;
    els.gforceDot.setAttribute('cx', Math.max(5, Math.min(85, dotX)));
    els.gforceDot.setAttribute('cy', Math.max(5, Math.min(85, dotY)));
  }

  // iOS requires permission request from user gesture
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then((state) => {
        if (state === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      })
      .catch(() => {});
  } else {
    window.addEventListener('devicemotion', handleMotion);
  }
}

function updateBar(el, gVal) {
  const maxG = 3;
  const pct = ((gVal + maxG) / (2 * maxG)) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  // Bar shows from center (50%) to current value
  const center = 50;
  if (clamped >= center) {
    el.style.left = `${center}%`;
    el.style.width = `${clamped - center}%`;
  } else {
    el.style.left = `${clamped}%`;
    el.style.width = `${center - clamped}%`;
  }
}

// ── Init ──

export function initSensors() {
  getEls();

  els.startBtn.addEventListener('click', () => {
    els.startBtn.classList.add('hidden');
    setStatus(false, 'Iniciando sensores...');
    startGPS();
    startBarometer();
    startMotion();
  });
}
