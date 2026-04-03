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

  <!-- Artificial Horizon -->
  <div class="card">
    <div class="card-label">Horizonte Artificial</div>
    <div class="horizon-container">
      <svg id="horizon-svg" viewBox="0 0 200 200" class="horizon-svg">
        <defs>
          <clipPath id="horizon-clip">
            <circle cx="100" cy="100" r="90"/>
          </clipPath>
        </defs>
        <g clip-path="url(#horizon-clip)">
          <!-- Sky and ground move together -->
          <g id="horizon-pitchroll">
            <rect x="-100" y="-200" width="400" height="300" fill="#1e90ff"/>
            <rect x="-100" y="100" width="400" height="300" fill="#8B4513"/>
            <line x1="-100" y1="100" x2="300" y2="100" stroke="white" stroke-width="2"/>
            <!-- Pitch lines -->
            <line x1="70" y1="80" x2="130" y2="80" stroke="white" stroke-width="1" opacity="0.5"/>
            <text x="135" y="83" fill="white" font-size="8" opacity="0.5">10</text>
            <line x1="80" y1="90" x2="120" y2="90" stroke="white" stroke-width="0.5" opacity="0.4"/>
            <line x1="70" y1="120" x2="130" y2="120" stroke="white" stroke-width="1" opacity="0.5"/>
            <text x="135" y="123" fill="white" font-size="8" opacity="0.5">-10</text>
            <line x1="80" y1="110" x2="120" y2="110" stroke="white" stroke-width="0.5" opacity="0.4"/>
            <line x1="60" y1="60" x2="140" y2="60" stroke="white" stroke-width="1" opacity="0.5"/>
            <text x="145" y="63" fill="white" font-size="8" opacity="0.5">20</text>
            <line x1="60" y1="140" x2="140" y2="140" stroke="white" stroke-width="1" opacity="0.5"/>
            <text x="145" y="143" fill="white" font-size="8" opacity="0.5">-20</text>
          </g>
        </g>
        <!-- Fixed aircraft reference (wings + center dot) -->
        <line x1="40" y1="100" x2="85" y2="100" stroke="#ffcc00" stroke-width="3" stroke-linecap="round"/>
        <line x1="115" y1="100" x2="160" y2="100" stroke="#ffcc00" stroke-width="3" stroke-linecap="round"/>
        <circle cx="100" cy="100" r="4" fill="#ffcc00"/>
        <!-- Outer ring -->
        <circle cx="100" cy="100" r="90" fill="none" stroke="#0f3460" stroke-width="3"/>
        <!-- Roll indicator triangle at top -->
        <polygon id="roll-indicator" points="100,12 96,4 104,4" fill="#ffcc00"/>
        <!-- Bank angle marks -->
        <line x1="100" y1="10" x2="100" y2="18" stroke="#8892a4" stroke-width="1.5"/>
        <line x1="55.4" y1="22.6" x2="59.1" y2="29.9" stroke="#8892a4" stroke-width="1"/>
        <line x1="144.6" y1="22.6" x2="140.9" y2="29.9" stroke="#8892a4" stroke-width="1"/>
        <line x1="22.6" y1="55.4" x2="29.9" y2="59.1" stroke="#8892a4" stroke-width="1"/>
        <line x1="177.4" y1="55.4" x2="170.1" y2="59.1" stroke="#8892a4" stroke-width="1"/>
      </svg>
      <div class="horizon-readouts">
        <div class="sub-item">
          <span class="sub-label">Pitch</span>
          <span class="sub-value" id="pitch-val">0°</span>
        </div>
        <div class="sub-item">
          <span class="sub-label">Roll</span>
          <span class="sub-value" id="roll-val">0°</span>
        </div>
      </div>
    </div>
  </div>

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
    <div class="card-label">Altitude GPS</div>
    <div class="value-row">
      <span class="value-primary" id="alt-gps">--</span>
      <span class="value-unit">m</span>
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
          <span class="gforce-axis-val" id="gval-z">0.00 G</span>
        </div>
      </div>
    </div>
  </div>

  <div class="accuracy-info" id="accuracy-info"></div>
  <div class="version-info">v0.5.0</div>
`;

initSensors();
