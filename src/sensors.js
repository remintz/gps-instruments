const G = 9.81;
const MS_TO_KMH = 3.6;
const RAD_TO_DEG = 180 / Math.PI;

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

function startGPS() {
  if (!('geolocation' in navigator)) {
    setStatus(false, 'Geolocation não suportada');
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const { speed, heading, altitude, accuracy, altitudeAccuracy } = pos.coords;

      if (speed !== null && speed >= 0) {
        els.speed.textContent = (speed * MS_TO_KMH).toFixed(1);
      } else {
        els.speed.textContent = '0.0';
      }

      if (heading !== null && !isNaN(heading)) {
        updateHeading(heading);
      }

      if (altitude !== null) {
        els.altGps.textContent = Math.round(altitude);
      }

      const parts = [];
      if (accuracy) parts.push(`GPS ±${Math.round(accuracy)}m`);
      if (altitudeAccuracy) parts.push(`Alt ±${Math.round(altitudeAccuracy)}m`);
      els.accuracyInfo.textContent = parts.join(' · ');

      setStatus(true, 'Sensores ativos');
    },
    (err) => {
      setStatus(false, `GPS erro: ${err.message}`);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
}

// ── Device Orientation (heading only) ──

function startOrientation() {
  function handleOrientation(event) {
    let compassHeading = null;
    if (event.webkitCompassHeading != null && event.webkitCompassHeading >= 0) {
      compassHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      compassHeading = (360 - event.alpha) % 360;
    }

    if (compassHeading !== null) {
      updateHeading(compassHeading);
    }
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

// ── DeviceMotion: G-Force + Artificial Horizon ──
//
// Pitch and roll are computed from the gravity vector
// (accelerationIncludingGravity) instead of Euler angles, which avoids
// the gimbal-lock 360° spin that occurs with DeviceOrientation beta/gamma
// when the phone crosses the vertical position.

function startMotion() {
  function handleMotion(event) {
    const accGrav = event.accelerationIncludingGravity;
    const acc = event.acceleration;
    if (!accGrav || accGrav.x === null) return;

    // ── Artificial Horizon (from gravity vector) ──
    // Phone vertical portrait: gx≈0, gy≈-9.81, gz≈0
    // pitch = tilt forward/back relative to vertical
    // roll  = tilt left/right
    const gx = accGrav.x;
    const gy = accGrav.y;
    const gz = accGrav.z;

    // pitch: angle between -gz and -gy (0° when phone is vertical)
    // positive = tilted back (screen facing ceiling)
    const pitch = Math.atan2(gz, -gy) * RAD_TO_DEG;
    // roll: lateral tilt, positive = tilted right
    const roll = Math.atan2(-gx, -gy) * RAD_TO_DEG;

    const clampedPitch = Math.max(-90, Math.min(90, pitch));
    const clampedRoll = Math.max(-90, Math.min(90, roll));

    const pitchOffset = clampedPitch * 2; // 2px per degree
    els.horizonPitchRoll.setAttribute(
      'transform',
      `rotate(${-clampedRoll}, 100, 100) translate(0, ${pitchOffset})`
    );
    els.pitchVal.textContent = `${clampedPitch.toFixed(1)}°`;
    els.rollVal.textContent = `${clampedRoll.toFixed(1)}°`;

    // ── G-Force (gravity subtracted) ──
    if (acc && acc.x !== null) {
      const fx = acc.x / G;
      const fy = acc.y / G;
      const fz = acc.z / G;

      els.gvalX.textContent = `${fx.toFixed(2)} G`;
      els.gvalY.textContent = `${fy.toFixed(2)} G`;
      els.gvalZ.textContent = `${fz.toFixed(2)} G`;

      updateBar(els.gbarX, fx);
      updateBar(els.gbarY, fy);
      updateBar(els.gbarZ, fz);

      const maxG = 3;
      const dotX = 45 + (fx / maxG) * 35;
      const dotY = 45 - (fy / maxG) * 35;
      els.gforceDot.setAttribute('cx', Math.max(5, Math.min(85, dotX)));
      els.gforceDot.setAttribute('cy', Math.max(5, Math.min(85, dotY)));
    }
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
