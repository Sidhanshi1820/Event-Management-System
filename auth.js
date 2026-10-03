// API configuration — config.js must be loaded BEFORE this script on every
// page (it defines window.API_BASE_URL).
const API_BASE_URL = window.API_BASE_URL;

// Login handler
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;

  const email = form.querySelector('[name="email"]').value.trim();
  const password = form.querySelector('[name="password"]').value;
  const remember = form.querySelector('[name="remember"]')?.checked || false;

  if (!email || !password) {
    showMessage('Please fill in all fields', 'error', form);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, remember })
    });

    const data = await response.json();

    if (data.success) {
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }

      showMessage('Login successful! Redirecting...', 'success', form);

      // Redirect to the user's dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      showMessage(data.message || 'Login failed', 'error', form);
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage('Connection error. Make sure backend is running on http://localhost:3000', 'error', form);
  }
}

// Register handler
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;

  const full_name = form.querySelector('[name="full_name"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const company = form.querySelector('[name="company"]').value.trim();
  const password = form.querySelector('[name="password"]').value;
  const confirm_password = form.querySelector('[name="confirm_password"]').value;
  const terms = form.querySelector('[name="terms"]')?.checked;

  // Validation
  if (!full_name || !email || !company || !password || !confirm_password || !terms) {
    showMessage('Please fill in all fields and agree to terms', 'error', form);
    return;
  }

  if (password !== confirm_password) {
    showMessage('Passwords do not match', 'error', form);
    return;
  }

  if (password.length < 8) {
    showMessage('Password must be at least 8 characters', 'error', form);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ full_name, email, company, password, confirm_password })
    });

    const data = await response.json();

    if (data.success) {
      // Store token and user data
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }

      showMessage('Registration successful! Redirecting...', 'success', form);

      setTimeout(() => {
        window.location.href = 'contact.html';
      }, 1500);
    } else {
      showMessage(data.message || 'Registration failed', 'error', form);
    }
  } catch (error) {
    console.error('Registration error:', error);
    showMessage('Connection error. Make sure backend is running on http://localhost:3000', 'error', form);
  }
}

// Show message function (scoped to the form that triggered it, with a
// fallback to #form-message for pages with a single form)
function showMessage(text, type, form) {
  const messageDiv =
    (form && (form.querySelector('.form-message') || form.parentElement.querySelector('.form-message'))) ||
    document.getElementById('form-message');
  if (!messageDiv) return;

  messageDiv.textContent = text;
  // Update classes additively so the form-message hook class is preserved
  messageDiv.classList.remove('hidden', 'text-green-600', 'text-red-600');
  messageDiv.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600', 'font-semibold');

  setTimeout(() => {
    messageDiv.classList.add('hidden');
  }, 5000);
}

// Logout handler
async function handleLogout() {
  // The backend requires an Authorization: Bearer header on logout
  const token = localStorage.getItem('authToken');

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
  } catch (error) {
    // Network/server failure must not keep the user stuck in a logged-in state
    console.error('Logout error:', error);
  } finally {
    // Always clear the session and send the user back to the login screen
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'get-started.html#login';
  }
}

// Check if user is logged in
function isLoggedIn() {
  return !!localStorage.getItem('authToken');
}

// Get current user data
function getCurrentUser() {
  const userDataStr = localStorage.getItem('userData');
  return userDataStr ? JSON.parse(userDataStr) : null;
}

// Update navigation based on login status
function updateNavigation() {
  if (isLoggedIn()) {
    const user = getCurrentUser();
    // You can update navigation to show logout button instead of login
    // This is optional and depends on your UI design
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Attach event listeners to forms
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  // Update navigation
  updateNavigation();
});
