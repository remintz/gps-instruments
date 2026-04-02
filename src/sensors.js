const G = 9.81;
const MS_TO_KMH = 3.6;

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
    gforceDot: document.getElementById('gforce-dot'),
    gbarX: document.getElementById('gbar-x'),
    gbarY: document.getElementById('gbar-y'),
    gbarZ: document.getElementById('gbar-z'),
    gvalX: document.getElementById('gval-x'),
    gvalY: document.getElementById('gval-y'),
    gvalZ: document.getElementById('gval-z'),
    accuracyInfo: document.getElementById('accuracy-info'),
    horizonPitchRoll: document.getElementById('horizon-pitchroll'),
    pitchVal: document.getElementById('pitch-val'),
    rollVal: document.getElementById('roll-val'),
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

function updateHeading(deg) {
  const h = Math.round(deg);
  els.headingDeg.textContent = `${h}°`;
  els.headingCardinal.textContent = degreesToCardinal(h);
  els.compassNeedle.setAttribute('transform', `rotate(${h}, 40, 40)`);
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

      // Heading from GPS (only available when moving)
      if (heading !== null && !isNaN(heading)) {
        updateHeading(heading);
      }

      // Altitude GPS
      if (altitude !== null) {
        els.altGps.textContent = Math.round(altitude);
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

// ── Device Orientation (heading fallback + artificial horizon) ──

function startOrientation() {
  function handleOrientation(event) {
    // Heading via compass (works when stationary)
    // webkitCompassHeading is iOS-specific, alpha is Android
    let compassHeading = null;
    if (event.webkitCompassHeading !== undefined) {
      compassHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null && event.absolute) {
      compassHeading = (360 - event.alpha) % 360;
    }

    if (compassHeading !== null) {
      updateHeading(compassHeading);
    }

    // Artificial horizon
    const beta = event.beta ?? 0;   // pitch: -180..180 (front/back tilt)
    const gamma = event.gamma ?? 0; // roll: -90..90 (left/right tilt)

    // Clamp pitch for display
    const pitch = Math.max(-90, Math.min(90, beta));
    const roll = gamma;

    // pitch: 2px per degree, roll: rotate
    const pitchOffset = pitch * 2;
    els.horizonPitchRoll.setAttribute(
      'transform',
      `rotate(${-roll}, 100, 100) translate(0, ${pitchOffset})`
    );

    els.pitchVal.textContent = `${pitch.toFixed(1)}°`;
    els.rollVal.textContent = `${roll.toFixed(1)}°`;
  }

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((state) => {
        if (state === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      })
      .catch(() => {});
  } else {
    window.addEventListener('deviceorientation', handleOrientation);
  }
}

// ── Accelerometer / G-Force (gravity subtracted) ──

function startMotion() {
  function handleMotion(event) {
    // Use .acceleration (without gravity) instead of .accelerationIncludingGravity
    const acc = event.acceleration;
    if (!acc || acc.x === null) return;

    const gx = acc.x / G;
    const gy = acc.y / G;
    const gz = acc.z / G;

    els.gvalX.textContent = `${gx.toFixed(2)} G`;
    els.gvalY.textContent = `${gy.toFixed(2)} G`;
    els.gvalZ.textContent = `${gz.toFixed(2)} G`;

    updateBar(els.gbarX, gx);
    updateBar(els.gbarY, gy);
    updateBar(els.gbarZ, gz);

    // Dot on circle
    const maxG = 3;
    const dotX = 45 + (gx / maxG) * 35;
    const dotY = 45 - (gy / maxG) * 35;
    els.gforceDot.setAttribute('cx', Math.max(5, Math.min(85, dotX)));
    els.gforceDot.setAttribute('cy', Math.max(5, Math.min(85, dotY)));
  }

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
    startOrientation();
    startMotion();
  });
}
