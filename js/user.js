// User Module for Digital E Gram Panchayat

class UserManager {
    constructor() {
        this.userProfile = null;
        this.userStats = null;
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            window.logger.info('User manager initialized');
        } catch (error) {
            window.logger.error('Failed to initialize user manager', error);
        }
    }

    async loadUserProfile() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            this.userProfile = await window.dbManager.getUserProfile(user.uid);
            this.populateProfileForm();
            
            window.logger.info('User profile loaded successfully', { userId: user.uid });
        } catch (error) {
            window.logger.error('Failed to load user profile', error);
            this.showError('Failed to load profile. Please try again later.');
        }
    }

    async loadUserStats() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            this.userStats = await window.dbManager.getUserStats(user.uid);
            this.updateDashboardStats();
            
            window.logger.info('User stats loaded successfully', { userId: user.uid });
        } catch (error) {
            window.logger.error('Failed to load user stats', error);
        }
    }

    populateProfileForm() {
        if (!this.userProfile) return;

        const form = document.getElementById('profile-form');
        if (!form) return;

        // Populate form fields
        const fields = {
            'profile-name': this.userProfile.name,
            'profile-email': this.userProfile.email,
            'profile-phone': this.userProfile.phone,
            'profile-address': this.userProfile.address
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });

        window.logger.info('Profile form populated');
    }

    updateDashboardStats() {
        if (!this.userStats) return;

        const stats = {
            'total-applications': this.userStats.totalApplications,
            'pending-applications': this.userStats.pendingApplications,
            'approved-applications': this.userStats.approvedApplications,
            'rejected-applications': this.userStats.rejectedApplications
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        window.logger.info('Dashboard stats updated', this.userStats);
    }

    async updateProfile(formData) {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) {
                throw new Error('No user logged in');
            }

            // Validate form data
            const validationRules = {
                name: { required: true, minLength: 2 },
                email: { required: true, email: true },
                phone: { required: true, phone: true },
                address: { required: true, minLength: 10 }
            };

            const errors = window.Validation.validateForm(formData, validationRules);
            if (Object.keys(errors).length > 0) {
                throw new Error(Object.values(errors)[0]);
            }

            // Update profile
            await window.dbManager.updateUserProfile(
                user.uid,
                this.userProfile.collection,
                formData
            );

            // Reload profile
            await this.loadUserProfile();

            window.DOM.showMessage('Profile updated successfully!', 'success');
            window.logger.success('Profile updated successfully', { userId: user.uid });

        } catch (error) {
            window.logger.error('Failed to update profile', error);
            this.showError(error.message);
        }
    }

    async handleDashboardNavigation(section) {
        try {
            switch (section) {
                case 'overview':
                    await this.loadUserStats();
                    break;
                case 'services':
                    await window.servicesManager.loadServices();
                    break;
                case 'applications':
                    await window.applicationsManager.loadUserApplications();
                    break;
                case 'profile':
                    await this.loadUserProfile();
                    break;
                default:
                    window.logger.warn('Unknown dashboard section', { section });
            }
        } catch (error) {
            window.logger.error('Failed to handle dashboard navigation', error);
        }
    }

    setupDashboardNavigation() {
        const navItems = document.querySelectorAll('.dashboard-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Hide all sections
                const sections = document.querySelectorAll('.dashboard-section');
                sections.forEach(section => section.classList.remove('active'));
                
                // Show target section
                const targetSection = item.getAttribute('data-section');
                const section = document.getElementById(targetSection + '-section');
                if (section) {
                    section.classList.add('active');
                }
                
                // Handle section-specific logic
                this.handleDashboardNavigation(targetSection);
            });
        });
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    name: document.getElementById('profile-name').value,
                    email: document.getElementById('profile-email').value,
                    phone: document.getElementById('profile-phone').value,
                    address: document.getElementById('profile-address').value
                };

                try {
                    window.DOM.setLoading(profileForm, true);
                    await this.updateProfile(formData);
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    window.DOM.setLoading(profileForm, false);
                }
            });
        }

        // Dashboard navigation
        this.setupDashboardNavigation();

        // Real-time updates
        this.setupRealTimeUpdates();
    }

    setupRealTimeUpdates() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        // Listen for profile changes
        window.dbManager.onUserProfileChange(user.uid, this.userProfile?.collection || 'users', (doc) => {
            if (doc.exists) {
                this.userProfile = {
                    id: doc.id,
                    collection: this.userProfile?.collection || 'users',
                    ...doc.data()
                };
                this.populateProfileForm();
                window.logger.info('Profile updated in real-time');
            }
        });

        // Listen for application changes
        window.dbManager.onApplicationsChange(user.uid, (snapshot) => {
            const applications = [];
            snapshot.forEach(doc => {
                applications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Update applications in applications manager
            window.applicationsManager.applications = applications;
            window.applicationsManager.renderUserApplications();
            window.applicationsManager.updateUserStats();
            
            window.logger.info('Applications updated in real-time', { count: applications.length });
        });
    }

    showError(message) {
        window.DOM.showMessage(message, 'error');
    }

    // User-specific utility methods
    async exportUserData() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            const userData = {
                profile: this.userProfile,
                applications: await window.dbManager.getApplications({ userId: user.uid }),
                stats: this.userStats,
                exportDate: new Date().toISOString()
            };

            // Create downloadable file
            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `user-data-${user.uid}-${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);

            window.DOM.showMessage('User data exported successfully!', 'success');
            window.logger.success('User data exported', { userId: user.uid });

        } catch (error) {
            window.logger.error('Failed to export user data', error);
            this.showError('Failed to export data. Please try again.');
        }
    }

    async deleteUserAccount() {
        try {
            const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.');
            if (!confirmed) return;

            const user = window.authManager.getCurrentUser();
            if (!user) return;

            // Delete user data from database
            await window.dbManager.deleteUserProfile(user.uid, this.userProfile?.collection || 'users');
            
            // Delete user applications
            const userApplications = await window.dbManager.getApplications({ userId: user.uid });
            for (const app of userApplications) {
                await window.dbManager.deleteApplication(app.id);
            }

            // Delete Firebase auth account
            await user.delete();

            window.DOM.showMessage('Account deleted successfully', 'success');
            window.logger.success('User account deleted', { userId: user.uid });

        } catch (error) {
            window.logger.error('Failed to delete user account', error);
            this.showError('Failed to delete account. Please try again.');
        }
    }

    // Dashboard initialization
    async initializeUserDashboard() {
        try {
            await this.loadUserProfile();
            await this.loadUserStats();
            await window.servicesManager.loadServices();
            await window.applicationsManager.loadUserApplications();
            
            window.logger.info('User dashboard initialized successfully');
        } catch (error) {
            window.logger.error('Failed to initialize user dashboard', error);
        }
    }
}

// Initialize User Manager
window.userManager = new UserManager();

// Global user functions
window.exportUserData = function() {
    window.userManager.exportUserData();
};

window.deleteUserAccount = function() {
    window.userManager.deleteUserAccount();
};

// Log user module initialization
window.logger.info('User module initialized'); 