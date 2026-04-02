import './style.css';
import { initSensors } from './sensors.js';

document.querySelector('#app').innerHTML = `
  <header>
    <h1>GPS Instruments</h1>
    <div id="status-bar">
      <span id="status-dot"></span>
      <span id="status-text">Aguardando sensores...</span>
    </div>
  </header>

  <button id="start-btn">Iniciar Sensores</button>

  <!-- Speed -->
  <div class="card">
    <div class="card-label">Velocidade</div>
    <div class="value-row">
      <span class="value-primary" id="speed">--</span>
      <span class="value-unit">km/h</span>
    </div>
  </div>

  <!-- Heading -->
  <div class="card">
    <div class="card-label">Heading</div>
    <div class="compass-container">
      <div class="compass-ring">
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#0f3460" stroke-width="2"/>
          <text x="40" y="12" text-anchor="middle" fill="#8892a4" font-size="9" font-weight="600">N</text>
          <text x="72" y="43" text-anchor="middle" fill="#8892a4" font-size="9" font-weight="600">E</text>
          <text x="40" y="75" text-anchor="middle" fill="#8892a4" font-size="9" font-weight="600">S</text>
          <text x="8" y="43" text-anchor="middle" fill="#8892a4" font-size="9" font-weight="600">W</text>
          <g class="compass-needle" id="compass-needle">
            <polygon points="40,18 37,40 43,40" fill="#ff6b6b"/>
            <polygon points="40,62 37,40 43,40" fill="#e0e0e0" opacity="0.4"/>
          </g>
        </svg>
      </div>
      <div class="compass-info">
        <span class="compass-degrees" id="heading-deg">--°</span>
        <span class="compass-cardinal" id="heading-cardinal">--</span>
      </div>
    </div>
  </div>

  <!-- Altitude -->
  <div class="card">
    <div class="card-label">Altitude</div>
    <div class="grid-2">
      <div class="sub-item">
        <span class="sub-label">GPS</span>
        <span class="sub-value" id="alt-gps">-- m</span>
      </div>
      <div class="sub-item">
        <span class="sub-label">Barométrica</span>
        <span class="sub-value" id="alt-baro">-- m</span>
      </div>
    </div>
  </div>

  <!-- G-Force -->
  <div class="card">
    <div class="card-label">Forças G</div>
    <div class="gforce-display">
      <div class="gforce-circle">
        <svg viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="40" fill="none" stroke="#0f3460" stroke-width="2"/>
          <circle cx="45" cy="45" r="1" fill="#8892a4"/>
          <line x1="45" y1="5" x2="45" y2="85" stroke="#0f3460" stroke-width="0.5"/>
          <line x1="5" y1="45" x2="85" y2="45" stroke="#0f3460" stroke-width="0.5"/>
          <circle id="gforce-dot" cx="45" cy="45" r="4" fill="#00d4ff"/>
        </svg>
      </div>
      <div class="gforce-values">
        <div class="gforce-axis">
          <span class="gforce-axis-label">X</span>
          <div class="gforce-axis-bar"><div class="gforce-axis-fill" id="gbar-x"></div></div>
          <span class="gforce-axis-val" id="gval-x">0.00 G</span>
        </div>
        <div class="gforce-axis">
          <span class="gforce-axis-label">Y</span>
          <div class="gforce-axis-bar"><div class="gforce-axis-fill" id="gbar-y"></div></div>
          <span class="gforce-axis-val" id="gval-y">0.00 G</span>
        </div>
        <div class="gforce-axis">
          <span class="gforce-axis-label">Z</span>
          <div class="gforce-axis-bar"><div class="gforce-axis-fill" id="gbar-z"></div></div>
          <span class="gforce-axis-val" id="gval-z">1.00 G</span>
        </div>
      </div>
    </div>
  </div>

  <div class="accuracy-info" id="accuracy-info"></div>
`;

initSensors();
