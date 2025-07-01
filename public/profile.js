async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem('authToken');
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
    if (response.status === 401) {
        // Try to refresh token
        const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.success && refreshData.data && refreshData.data.token) {
            token = refreshData.data.token;
            localStorage.setItem('authToken', token);
            // Retry original request
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            });
        } else {
            // Refresh failed, force logout
            localStorage.removeItem('authToken');
            window.location.href = 'signin_signup.html';
            return null;
        }
    }
    return response;
}

document.addEventListener('DOMContentLoaded', async function() {
    // Fetch user info with token refresh
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'signin_signup.html';
        return;
    }
    const res = await fetchWithAuth('/api/auth/me');
    if (!res) return;
    if (!res.ok) {
        window.location.href = 'signin_signup.html';
        return;
    }
    const data = await res.json();
    if (data.success && data.data && data.data.user) {
        const user = data.data.user;
        document.getElementById('username').textContent = user.username || '';
        document.getElementById('email').textContent = user.email || '';
        document.getElementById('displayName').textContent = user.username || 'User';
        const userRoleElem = document.getElementById('userRole');
        if (userRoleElem) userRoleElem.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
        document.getElementById('avatar').textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        document.getElementById('userName').textContent = user.username || 'User';
    } else {
        window.location.href = 'signin_signup.html';
    }

    // Logout buttons
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = 'signin_signup.html';
        });
    });
    // Back to dashboard
    const backBtn = document.getElementById('backToDashboardBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
    }
});
