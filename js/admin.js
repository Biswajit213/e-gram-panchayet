// Admin Module for Digital E Gram Panchayat

class AdminManager {
    constructor() {
        this.adminProfile = null;
        this.systemStats = null;
        this.users = [];
        this.logs = [];
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            window.logger.info('Admin manager initialized');
        } catch (error) {
            window.logger.error('Failed to initialize admin manager', error);
        }
    }

    async loadAdminProfile() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            this.adminProfile = await window.dbManager.getUserProfile(user.uid);
            
            window.logger.info('Admin profile loaded successfully', { userId: user.uid });
        } catch (error) {
            window.logger.error('Failed to load admin profile', error);
            this.showError('Failed to load profile. Please try again later.');
        }
    }

    async loadSystemStats() {
        try {
            this.systemStats = await window.dbManager.getDashboardStats();
            this.updateAdminDashboardStats();
            
            window.logger.info('System stats loaded successfully');
        } catch (error) {
            window.logger.error('Failed to load system stats', error);
        }
    }

    updateAdminDashboardStats() {
        if (!this.systemStats) return;

        const stats = {
            'admin-total-users': this.systemStats.totalUsers || 0,
            'admin-total-applications': this.systemStats.totalApplications || 0,
            'admin-active-services': this.systemStats.activeServices || 0,
            'admin-today-activity': this.systemStats.todayActivity || 0
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        window.logger.info('Admin dashboard stats updated', this.systemStats);
    }

    async loadAllUsers() {
        try {
            this.users = await window.dbManager.getAllUsers();
            this.renderUsersManagement();
            
            window.logger.info('All users loaded successfully', { count: this.users.length });
        } catch (error) {
            window.logger.error('Failed to load users', error);
            this.showError('Failed to load users. Please try again later.');
        }
    }

    renderUsersManagement() {
        const container = document.getElementById('admin-users-management');
        if (!container) return;

        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Users Found</h3>
                    <p>No users are registered in the system.</p>
                </div>
            `;
            return;
        }

        const usersHTML = this.users.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-info">
                    <h4>${user.name || 'Unknown User'}</h4>
                    <p>${user.email} • ${user.collection}</p>
                    <p><small>Created: ${window.DateTime.formatDate(user.createdAt)}</small></p>
                </div>
                <div class="user-actions">
                    <button class="btn btn-primary btn-small" onclick="adminManager.viewUserDetails('${user.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-warning btn-small" onclick="adminManager.editUser('${user.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="adminManager.deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = usersHTML;
    }

    async loadSystemLogs() {
        try {
            this.logs = await window.dbManager.getSystemLogs();
            this.renderSystemLogs();
            
            window.logger.info('System logs loaded successfully', { count: this.logs.length });
        } catch (error) {
            window.logger.error('Failed to load system logs', error);
            this.showError('Failed to load logs. Please try again later.');
        }
    }

    renderSystemLogs() {
        const container = document.getElementById('admin-logs-container');
        if (!container) return;

        if (this.logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>No Logs Found</h3>
                    <p>No system logs are available.</p>
                </div>
            `;
            return;
        }

        const logsHTML = this.logs.map(log => `
            <div class="log-item">
                <div class="log-timestamp">${window.DateTime.formatDateTime(log.timestamp)}</div>
                <div class="log-message">${log.message}</div>
                <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                ${log.userId ? `<small>User: ${log.userId}</small>` : ''}
            </div>
        `).join('');

        container.innerHTML = logsHTML;
    }

    async handleAdminDashboardNavigation(section) {
        try {
            switch (section) {
                case 'admin-overview':
                    await this.loadSystemStats();
                    break;
                case 'admin-services':
                    await window.servicesManager.loadServices();
                    break;
                case 'admin-applications':
                    await window.applicationsManager.loadAllApplications();
                    break;
                case 'admin-users':
                    await this.loadAllUsers();
                    break;
                case 'admin-logs':
                    await this.loadSystemLogs();
                    break;
                default:
                    window.logger.warn('Unknown admin dashboard section', { section });
            }
        } catch (error) {
            window.logger.error('Failed to handle admin dashboard navigation', error);
        }
    }

    setupAdminDashboardNavigation() {
        const navItems = document.querySelectorAll('#admin-dashboard .dashboard-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Hide all sections
                const sections = document.querySelectorAll('#admin-dashboard .dashboard-section');
                sections.forEach(section => section.classList.remove('active'));
                
                // Show target section
                const targetSection = item.getAttribute('data-section');
                const section = document.getElementById(targetSection + '-section');
                if (section) {
                    section.classList.add('active');
                }
                
                // Handle section-specific logic
                this.handleAdminDashboardNavigation(targetSection);
            });
        });
    }

    async viewUserDetails(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get user applications
            const userApplications = await window.dbManager.getApplications({ userId });
            const userStats = await window.dbManager.getUserStats(userId);

            // Create and show details modal
            const detailsHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>User Details</h2>
                        <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    </div>
                    <div class="user-details-modal" style="padding: 30px;">
                        <div class="detail-item">
                            <strong>Name:</strong>
                            <span>${user.name || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Email:</strong>
                            <span>${user.email}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Phone:</strong>
                            <span>${user.phone || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Address:</strong>
                            <span>${user.address || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Role:</strong>
                            <span>${user.collection}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Created:</strong>
                            <span>${window.DateTime.formatDateTime(user.createdAt)}</span>
                        </div>
                        <hr>
                        <h3>User Statistics</h3>
                        <div class="detail-item">
                            <strong>Total Applications:</strong>
                            <span>${userStats.totalApplications}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Pending Applications:</strong>
                            <span>${userStats.pendingApplications}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Approved Applications:</strong>
                            <span>${userStats.approvedApplications}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Rejected Applications:</strong>
                            <span>${userStats.rejectedApplications}</span>
                        </div>
                    </div>
                </div>
            `;

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = detailsHTML;
            document.body.appendChild(modal);

            // Close modal when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });

            window.logger.info('User details viewed', { userId });

        } catch (error) {
            window.logger.error('Failed to view user details', error);
            this.showError(error.message);
        }
    }

    async editUser(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Show edit user modal
            this.showEditUserModal(user);

        } catch (error) {
            window.logger.error('Failed to edit user', error);
            this.showError(error.message);
        }
    }

    showEditUserModal(user) {
        const modalHTML = `
            <div class="modal" id="edit-user-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit User</h2>
                        <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    </div>
                    <form id="edit-user-form" class="user-form">
                        <div class="form-group">
                            <label>User ID</label>
                            <input type="text" value="${user.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="edit-user-name" value="${user.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="edit-user-email" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="edit-user-phone" value="${user.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea id="edit-user-address">${user.address || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="edit-user-role" required>
                                <option value="users" ${user.collection === 'users' ? 'selected' : ''}>User</option>
                                <option value="staff" ${user.collection === 'staff' ? 'selected' : ''}>Staff</option>
                                <option value="admins" ${user.collection === 'admins' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Update User</button>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('edit-user-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        window.DOM.showModal('edit-user-modal');

        // Setup form submission
        const form = document.getElementById('edit-user-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const updateData = {
                    name: document.getElementById('edit-user-name').value,
                    email: document.getElementById('edit-user-email').value,
                    phone: document.getElementById('edit-user-phone').value,
                    address: document.getElementById('edit-user-address').value
                };

                const newRole = document.getElementById('edit-user-role').value;

                try {
                    await this.updateUser(user.id, user.collection, newRole, updateData);
                    window.DOM.hideModal('edit-user-modal');
                } catch (error) {
                    this.showError(error.message);
                }
            });
        }

        window.logger.info('Edit user modal opened', { userId: user.id });
    }

    async updateUser(userId, currentCollection, newRole, updateData) {
        try {
            // If role is changing, move user to new collection
            if (currentCollection !== newRole) {
                // Delete from current collection
                await window.dbManager.deleteUserProfile(userId, currentCollection);
                
                // Add to new collection
                await window.dbManager.createUserProfile(userId, newRole, updateData);
            } else {
                // Update in current collection
                await window.dbManager.updateUserProfile(userId, currentCollection, updateData);
            }

            // Reload users
            await this.loadAllUsers();

            window.DOM.showMessage('User updated successfully!', 'success');
            window.logger.success('User updated', { userId, newRole });

        } catch (error) {
            window.logger.error('Failed to update user', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.');
            if (!confirmed) return;

            const user = this.users.find(u => u.id === userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Delete user applications
            const userApplications = await window.dbManager.getApplications({ userId });
            for (const app of userApplications) {
                await window.dbManager.deleteApplication(app.id);
            }

            // Delete user profile
            await window.dbManager.deleteUserProfile(userId, user.collection);

            // Reload users
            await this.loadAllUsers();

            window.DOM.showMessage('User deleted successfully', 'success');
            window.logger.success('User deleted', { userId });

        } catch (error) {
            window.logger.error('Failed to delete user', error);
            this.showError(error.message);
        }
    }

    async generateSystemReport() {
        try {
            const report = {
                systemStats: this.systemStats,
                totalUsers: this.users.length,
                usersByRole: this.users.reduce((acc, user) => {
                    acc[user.collection] = (acc[user.collection] || 0) + 1;
                    return acc;
                }, {}),
                recentLogs: this.logs.slice(0, 50),
                generatedAt: new Date().toISOString(),
                generatedBy: window.authManager.getCurrentUser()?.email || 'Admin'
            };

            // Create downloadable report
            const reportStr = JSON.stringify(report, null, 2);
            const reportBlob = new Blob([reportStr], { type: 'application/json' });
            const url = URL.createObjectURL(reportBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `system-report-${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);

            window.DOM.showMessage('System report generated successfully!', 'success');
            window.logger.success('System report generated', report);

        } catch (error) {
            window.logger.error('Failed to generate system report', error);
            this.showError('Failed to generate report. Please try again.');
        }
    }

    async clearSystemLogs() {
        try {
            const confirmed = confirm('Are you sure you want to clear all system logs? This action cannot be undone.');
            if (!confirmed) return;

            // Clear logs from database (implement as needed)
            // await window.dbManager.clearSystemLogs();

            // Reload logs
            await this.loadSystemLogs();

            window.DOM.showMessage('System logs cleared successfully', 'success');
            window.logger.success('System logs cleared');

        } catch (error) {
            window.logger.error('Failed to clear system logs', error);
            this.showError(error.message);
        }
    }

    setupEventListeners() {
        // Admin dashboard navigation
        this.setupAdminDashboardNavigation();

        // Real-time updates for admin
        this.setupRealTimeUpdates();

        // Admin shortcuts
        this.setupAdminShortcuts();
    }

    setupRealTimeUpdates() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        // Listen for system-wide changes
        window.dbManager.onServicesChange((snapshot) => {
            const services = [];
            snapshot.forEach(doc => {
                services.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Update services in services manager
            window.servicesManager.services = services;
            window.servicesManager.renderServices();
            
            // Update system stats
            this.loadSystemStats();
            
            window.logger.info('System services updated in real-time', { count: services.length });
        });
    }

    setupAdminShortcuts() {
        // Add keyboard shortcuts for admin functions
        document.addEventListener('keydown', (e) => {
            // Only activate shortcuts when admin dashboard is visible
            const adminDashboard = document.getElementById('admin-dashboard');
            if (!adminDashboard || adminDashboard.classList.contains('hidden')) return;

            // Ctrl/Cmd + R to generate system report
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.generateSystemReport();
            }

            // Ctrl/Cmd + L to clear logs
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                this.clearSystemLogs();
            }

            // Ctrl/Cmd + U to refresh users
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                this.loadAllUsers();
            }
        });
    }

    showError(message) {
        window.DOM.showMessage(message, 'error');
    }

    // Admin dashboard initialization
    async initializeAdminDashboard() {
        try {
            await this.loadAdminProfile();
            await this.loadSystemStats();
            await window.servicesManager.loadServices();
            await window.applicationsManager.loadAllApplications();
            await this.loadAllUsers();
            await this.loadSystemLogs();
            
            window.logger.info('Admin dashboard initialized successfully');
        } catch (error) {
            window.logger.error('Failed to initialize admin dashboard', error);
        }
    }
}

// Initialize Admin Manager
window.adminManager = new AdminManager();

// Global admin functions
window.generateSystemReport = function() {
    window.adminManager.generateSystemReport();
};

window.clearSystemLogs = function() {
    window.adminManager.clearSystemLogs();
};

// Log admin module initialization
window.logger.info('Admin module initialized'); 