// ==================== ADMIN API SERVICE ====================

class AdminAPI {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('adminToken');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders()
    });
    return await response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async put(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await response.json();
  }

  async uploadProfile(formData) {
    const response = await fetch(`${this.baseURL}/profile`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });
    return await response.json();
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('adminToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('adminToken');
  }
}

// ==================== INITIALIZATION ====================

const adminAPI = new AdminAPI();

window.addEventListener('load', () => {
  checkAuth();
  setupEventListeners();
});

// ==================== AUTHENTICATION ====================

async function checkAuth() {
  if (!adminAPI.token) {
    showLoginScreen();
    return;
  }

  try {
    const result = await adminAPI.get('/auth/verify');
    if (result.valid) {
      showDashboard();
      document.getElementById('current-user').textContent = result.user.username;
      loadDashboardStats();
      loadAllLinks();
      loadProfile();
      loadLogs();
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error('Auth error:', error);
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const result = await adminAPI.post('/auth/login', { username, password });
    
    if (result.success) {
      adminAPI.setToken(result.token);
      showDashboard();
      document.getElementById('current-user').textContent = result.user.username;
      document.getElementById('login-form').reset();
      loadDashboardStats();
      loadAllLinks();
      loadProfile();
      loadLogs();
    } else {
      alert('Invalid credentials: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please try again.');
  }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
  adminAPI.clearToken();
  showLoginScreen();
  document.getElementById('login-form').reset();
});

// ==================== TAB NAVIGATION ====================

function setupEventListeners() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = tab.dataset.tab;
      
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

// ==================== DASHBOARD STATS ====================

async function loadDashboardStats() {
  try {
    const stats = await adminAPI.get('/stats');
    
    document.getElementById('dash-total-links').textContent = stats.totalLinks || 0;
    document.getElementById('dash-total-clicks').textContent = stats.totalClicks || 0;
    document.getElementById('dash-total-users').textContent = stats.totalUsers || 1;
    
    if (stats.totalLinks > 0) {
      const ctr = ((stats.totalClicks / stats.totalLinks) * 100).toFixed(1);
      document.getElementById('dash-avg-ctr').textContent = `${ctr}%`;
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// ==================== LINKS MANAGEMENT ====================

async function loadAllLinks() {
  try {
    const links = await adminAPI.get('/links');
    const tbody = document.getElementById('links-list');
    
    if (!links || links.length === 0) {
      tbody.innerHTML = '<tr class="loading-row"><td colspan="7">No links yet. Create one below!</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    links.forEach(link => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${link.icon_url || '🔗'}</td>
        <td>${link.title}</td>
        <td><a href="${link.url}" target="_blank" style="color: var(--cyan);">${link.url.substring(0, 30)}...</a></td>
        <td>${link.category || '-'}</td>
        <td>${link.clicks || 0}</td>
        <td>${new Date(link.created_at).toLocaleDateString()}</td>
        <td>
          <div class="action-buttons">
            <button class="edit-btn" onclick="openEditModal(${link.id})">EDIT</button>
            <button class="delete-btn" onclick="deleteLink(${link.id})">DELETE</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading links:', error);
  }
}

document.getElementById('add-link-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const linkData = {
    title: document.getElementById('form-title').value,
    url: document.getElementById('form-url').value,
    category: document.getElementById('form-category').value,
    icon_url: document.getElementById('form-icon').value,
    description: document.getElementById('form-description').value
  };

  try {
    const result = await adminAPI.post('/links', linkData);
    if (result.id) {
      alert('Link created successfully!');
      document.getElementById('add-link-form').reset();
      loadAllLinks();
      loadDashboardStats();
    } else {
      alert('Error creating link');
    }
  } catch (error) {
    console.error('Error creating link:', error);
    alert('Failed to create link');
  }
});

async function deleteLink(id) {
  if (!confirm('Are you sure you want to delete this link?')) return;

  try {
    const result = await adminAPI.delete(`/links/${id}`);
    if (result.success) {
      alert('Link deleted!');
      loadAllLinks();
      loadDashboardStats();
    } else {
      alert('Error deleting link');
    }
  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Failed to delete link');
  }
}

// ==================== EDIT MODAL ====================

const modal = document.getElementById('edit-modal');
const modalClose = document.querySelector('.modal-close');

modalClose?.addEventListener('click', closeEditModal);
modal?.addEventListener('click', (e) => {
  if (e.target === modal) closeEditModal();
});

function closeEditModal() {
  modal.classList.add('hidden');
}

async function openEditModal(id) {
  try {
    const link = await adminAPI.get(`/links/${id}`);
    
    document.getElementById('edit-link-id').value = link.id;
    document.getElementById('edit-title').value = link.title;
    document.getElementById('edit-url').value = link.url;
    document.getElementById('edit-category').value = link.category || '';
    document.getElementById('edit-icon').value = link.icon_url || '🔗';
    document.getElementById('edit-description').value = link.description || '';
    
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading link:', error);
    alert('Failed to load link');
  }
}

document.getElementById('edit-link-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('edit-link-id').value;
  const linkData = {
    title: document.getElementById('edit-title').value,
    url: document.getElementById('edit-url').value,
    category: document.getElementById('edit-category').value,
    icon_url: document.getElementById('edit-icon').value,
    description: document.getElementById('edit-description').value
  };

  try {
    const result = await adminAPI.put(`/links/${id}`, linkData);
    if (result.id) {
      alert('Link updated successfully!');
      closeEditModal();
      loadAllLinks();
    } else {
      alert('Error updating link');
    }
  } catch (error) {
    console.error('Error updating link:', error);
    alert('Failed to update link');
  }
});

// ==================== PROFILE SETTINGS ====================

async function loadProfile() {
  try {
    const profile = await adminAPI.get('/profile');
    
    if (profile && profile.id) {
      document.getElementById('profile-name').value = profile.name || '';
      document.getElementById('profile-bio').value = profile.bio || '';
      document.getElementById('profile-theme').value = profile.theme || 'cyberpunk';
      
      if (profile.avatar_url) {
        document.getElementById('avatar-preview').src = profile.avatar_url;
      }
      if (profile.banner_url) {
        document.getElementById('banner-preview').src = profile.banner_url;
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('name', document.getElementById('profile-name').value);
  formData.append('bio', document.getElementById('profile-bio').value);
  formData.append('theme', document.getElementById('profile-theme').value);

  const avatarFile = document.getElementById('avatar-upload').files[0];
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  const bannerFile = document.getElementById('banner-upload').files[0];
  if (bannerFile) {
    formData.append('banner', bannerFile);
  }

  try {
    const result = await adminAPI.uploadProfile(formData);
    if (result.id) {
      alert('Profile updated successfully!');
      loadProfile();
    } else {
      alert('Error updating profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  }
});

// Preview image before upload
document.getElementById('avatar-upload')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('avatar-preview').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('banner-upload')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('banner-preview').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// ==================== LOGS ====================

async function loadLogs() {
  try {
    const logs = await adminAPI.get('/logs');
    const container = document.getElementById('logs-list');

    if (!logs || logs.length === 0) {
      container.innerHTML = '<div class="log-entry"><span class="log-message">No logs yet</span></div>';
      return;
    }

    container.innerHTML = '';
    logs.forEach(log => {
      const time = new Date(log.timestamp);
      const timeStr = time.toLocaleTimeString();
      
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = `
        <span class="log-time">${timeStr}</span>
        <span class="log-action">${log.action}</span>
        <span class="log-message">${log.details || '-'}</span>
      `;
      container.appendChild(entry);
    });
  } catch (error) {
    console.error('Error loading logs:', error);
  }
}

// ==================== REFRESH INTERVAL ====================

setInterval(() => {
  if (adminAPI.token && !document.getElementById('login-screen').classList.contains('hidden')) {
    loadDashboardStats();
  }
}, 30000);

// Log actions
function logAction(action, details = '') {
  if (adminAPI.token) {
    adminAPI.post('/logs', { action, details });
  }
}

// Wrap admin functions for global scope
window.openEditModal = openEditModal;
window.deleteLink = deleteLink;
window.closeEditModal = closeEditModal;
window.loadAllLinks = loadAllLinks;
window.loadDashboardStats = loadDashboardStats;
