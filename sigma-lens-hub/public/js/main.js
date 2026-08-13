import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    increment 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==================== LIVE TERMINAL ====================

class LiveTerminal {
  constructor(elementId) {
    this.terminal = document.getElementById(elementId);
    this.lines = [];
  }

  clear() {
    if (this.terminal) this.terminal.innerHTML = '';
    this.lines = [];
  }

  addLine(text, className = '') {
    if (!this.terminal) return;
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = text; // ใช้ innerHTML รองรับการใส่ span แท็กสี
    this.terminal.appendChild(line);
    this.terminal.scrollTop = this.terminal.scrollHeight;
    this.lines.push(text);
  }

  typeText(text, speed = 50, onComplete = null) {
    if (!this.terminal) return;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    this.terminal.appendChild(line);

    let index = 0;
    const type = () => {
      if (index < text.length) {
        line.textContent += text[index];
        index++;
        this.terminal.scrollTop = this.terminal.scrollHeight;
        setTimeout(type, speed);
      } else {
        if (onComplete) onComplete();
      }
    };
    type();
  }
}

// ==================== DATA STREAM ====================

class DataStream {
  constructor(elementId) {
    this.container = document.getElementById(elementId);
  }

  addEntry(message, type = 'info') {
    if (!this.container) return;
    const time = new Date();
    const timeStr = String(time.getHours()).padStart(2, '0') + ':' +
      String(time.getMinutes()).padStart(2, '0') + ':' +
      String(time.getSeconds()).padStart(2, '0');

    const entry = document.createElement('div');
    entry.className = `data-item data-${type}`;
    entry.innerHTML = `<span class="data-time">[${timeStr}]</span><span class="data-message">${message}</span>`;

    this.container.insertBefore(entry, this.container.firstChild);

    // Keep only last 20 entries
    while (this.container.children.length > 20) {
      this.container.removeChild(this.container.lastChild);
    }
  }
}

// ==================== INITIALIZATION ====================

const terminal = new LiveTerminal('terminal-output');
const dataStream = new DataStream('data-stream');

let systemStats = {
  cpu: 92,
  memory: 78,
  uptime: 0
};

let uptimeSeconds = 0;

// ==================== LOAD DATA FROM FIREBASE ====================

async function loadLinks() {
  try {
    const container = document.getElementById('links-container');
    if (!container) return;

    const querySnapshot = await getDocs(collection(db, "links"));
    
    if (querySnapshot.empty) {
      container.innerHTML = '<div class="loading-placeholder"><p>No links found in Firebase. Create one in admin panel.</p></div>';
      return;
    }

    container.innerHTML = '';
    let totalLinks = 0;

    querySnapshot.forEach((docSnap) => {
      totalLinks++;
      const link = docSnap.data();
      const linkId = docSnap.id;

      const card = document.createElement('div');
      card.className = `link-card ${link.highlight ? 'highlight' : ''}`;
      card.innerHTML = `
        <div class="link-icon">${link.icon_url || link.icon || '🔗'}</div>
        <div class="link-category">${link.category || 'general'}</div>
        <div class="link-title">${link.title}</div>
        <div class="link-description">${link.description || 'No description'}</div>
        <div class="link-stats">
          <span class="link-clicks">👁 ${link.clicks || 0}</span>
          <a href="${link.url}" target="_blank" class="link-visit-btn" onclick="recordClick('${linkId}')">VISIT</a>
        </div>
      `;
      container.appendChild(card);
    });

    dataStream.addEntry(`Loaded ${totalLinks} links from Firestore DB`, 'success');
  } catch (error) {
    console.error('Error loading links:', error);
    dataStream.addEntry('Failed to load links from Firebase', 'error');
  }
}

async function loadProfile() {
  try {
    const profileRef = doc(db, "profile", "main");
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const profile = profileSnap.data();
      if (document.getElementById('profile-name')) document.getElementById('profile-name').textContent = profile.name || 'SIGMA LENS';
      if (document.getElementById('profile-bio')) document.getElementById('profile-bio').textContent = profile.bio || 'Cyberpunk Hub & Link Control';
      if (profile.avatar_url && document.getElementById('profile-avatar')) {
        document.getElementById('profile-avatar').src = profile.avatar_url;
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadStats() {
  try {
    const querySnapshot = await getDocs(collection(db, "links"));
    let totalLinks = querySnapshot.size;
    let totalClicks = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      totalClicks += (data.clicks || 0);
    });

    if (document.getElementById('total-links')) document.getElementById('total-links').textContent = totalLinks;
    if (document.getElementById('total-clicks')) document.getElementById('total-clicks').textContent = totalClicks;
    if (document.getElementById('user-links')) document.getElementById('user-links').textContent = totalLinks;
    if (document.getElementById('user-clicks')) document.getElementById('user-clicks').textContent = totalClicks;

    const avgCtrElem = document.getElementById('dash-avg-ctr');
    if (avgCtrElem && totalLinks > 0) {
      const avgCTR = ((totalClicks / totalLinks) * 100).toFixed(1);
      avgCtrElem.textContent = `${avgCTR}%`;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function recordClick(linkId) {
  try {
    const linkRef = doc(db, "links", linkId);
    await updateDoc(linkRef, {
      clicks: increment(1)
    });
    dataStream.addEntry(`Link click recorded: ID ${linkId}`, 'info');
    loadStats(); // อัปเดตสถิติทันที
  } catch (error) {
    console.error('Error recording click:', error);
  }
}

// ==================== LIVE METRICS ====================

function updateMetrics() {
  systemStats.cpu = Math.max(60, Math.min(99, systemStats.cpu + (Math.random() - 0.5) * 5));
  if (document.getElementById('cpu-value')) document.getElementById('cpu-value').textContent = Math.round(systemStats.cpu) + '%';

  systemStats.memory = Math.max(50, Math.min(90, systemStats.memory + (Math.random() - 0.5) * 3));
  if (document.getElementById('memory-value')) document.getElementById('memory-value').textContent = Math.round(systemStats.memory) + '%';

  uptimeSeconds += 1;
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  if (document.getElementById('uptime-value')) document.getElementById('uptime-value').textContent = `${hours}h ${minutes}m`;
}

function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  if (document.getElementById('footer-time')) document.getElementById('footer-time').textContent = `${hours}:${minutes}:${seconds} UTC`;
  if (document.getElementById('footer-date')) document.getElementById('footer-date').textContent = date;
}

// ==================== TERMINAL MESSAGES ====================

function initializeTerminal() {
  terminal.clear();
  terminal.addLine('$ Initializing Sigma Lens Hub v1.0.0...');
  
  setTimeout(() => {
    terminal.addLine('$ Loading neural network protocols...');
    dataStream.addEntry('System initialization started', 'info');
  }, 500);

  setTimeout(() => {
    terminal.addLine('$ Syncing with Firebase Firestore DB...');
  }, 1000);

  setTimeout(() => {
    terminal.addLine('$ Authenticating user session...');
  }, 1500);

  setTimeout(() => {
    terminal.addLine('$ <span class="success">✓ All systems operational</span>');
    terminal.addLine('$ <span class="success">✓ Firebase link stream active</span>');
    terminal.addLine('$ <span class="success">✓ Quantum sync completed</span>');
    dataStream.addEntry('All systems operational and ready', 'success');
  }, 2500);

  setTimeout(() => {
    terminal.typeText('$ > ', 50);
  }, 3500);
}

// ==================== THEME SWITCHING ====================

function switchTheme(theme) {
  const root = document.documentElement;
  
  switch(theme) {
    case 'neon':
      root.style.setProperty('--cyan', '#00ff88');
      root.style.setProperty('--purple', '#ff00ff');
      break;
    case 'matrix':
      root.style.setProperty('--cyan', '#00ff00');
      root.style.setProperty('--purple', '#00aa00');
      break;
    case 'cyberpunk':
    default:
      root.style.setProperty('--cyan', '#00d9ff');
      root.style.setProperty('--purple', '#d946ef');
  }

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  dataStream.addEntry(`Theme switched to: ${theme.toUpperCase()}`, 'info');
}

// ==================== RANDOM TERMINAL MESSAGES ====================

const randomMessages = [
  'Synchronizing Firebase clusters...',
  'Running diagnostic scan...',
  'Neural network processing...',
  'Cache optimization: 87%',
  'Network latency: 2.3ms',
  'Quantum entanglement stable',
  'Firewall: All clear',
  'Data redundancy: Verified',
  'Firestore sync speed: 1.2Gbps',
  'Sector scan: Complete',
  'Processing incoming packet...',
  'Database integrity: OK',
  'System health: Excellent',
  'Parallel processing: Active'
];

function randomTerminalMessage() {
  const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
  const messages = [
    `[INFO] ${message}`,
    `[SYNC] ${message}`,
    `[PROCESS] ${message}`
  ];
  
  terminal.addLine(messages[Math.floor(Math.random() * messages.length)]);
  dataStream.addEntry(message, 'info');
}

// ==================== EVENT LISTENERS ====================

document.querySelectorAll('[data-theme]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    switchTheme(e.target.dataset.theme);
  });
});

document.querySelectorAll('[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = e.target.dataset.section;
    dataStream.addEntry(`Navigation: ${section.toUpperCase()}`, 'info');
  });
});

// ==================== STARTUP SEQUENCE ====================

window.addEventListener('load', () => {
  initializeTerminal();
  loadLinks();
  loadProfile();
  loadStats();
  updateTime();

  setInterval(updateMetrics, 1000);
  setInterval(updateTime, 1000);

  setInterval(() => {
    if (Math.random() > 0.7) {
      randomTerminalMessage();
    }
  }, 5000);

  setInterval(() => {
    loadStats();
  }, 30000);

  setTimeout(() => {
    dataStream.addEntry('Dashboard fully initialized', 'success');
  }, 4000);
});

// ==================== UTILITY FUNCTIONS ====================

window.recordClick = recordClick;
window.loadLinks = loadLinks;
window.switchTheme = switchTheme;

document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && e.target.href && !e.target.target) {
    const href = e.target.getAttribute('href');
    if (!href.startsWith('#') && !href.startsWith('http')) {
      e.preventDefault();
      window.location.href = href;
    }
  }
});