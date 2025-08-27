// Authentication Module for Digital E Gram Panchayat

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    async init() {
        try {
            // Listen for auth state changes
            window.firebaseAuth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.loadUserRole(user.uid);
                    this.handleAuthSuccess();
                    window.logger.info('User authenticated', { uid: user.uid, email: user.email });
                } else {
                    this.currentUser = null;
                    this.userRole = null;
                    this.handleAuthLogout();
                    window.logger.info('User logged out');
                }
            });
        } catch (error) {
            window.logger.error('Auth initialization failed', error);
        }
    }

    async loadUserRole(uid) {
        try {
            // Check in users collection
            const userDoc = await window.firebaseDB.collection('users').doc(uid).get();
            if (userDoc.exists) {
                this.userRole = 'user';
                return;
            }

            // Check in staff collection
            const staffDoc = await window.firebaseDB.collection('staff').doc(uid).get();
            if (staffDoc.exists) {
                this.userRole = 'staff';
                return;
            }

            // Check in admins collection
            const adminDoc = await window.firebaseDB.collection('admins').doc(uid).get();
            if (adminDoc.exists) {
                this.userRole = 'admin';
                return;
            }

            // Default to user if no role found
            this.userRole = 'user';
        } catch (error) {
            window.logger.error('Failed to load user role', error);
            this.userRole = 'user';
        }
    }

    async register(userData) {
        try {
            window.logger.info('Starting user registration', { email: userData.email });

            // Check if Firebase is configured
            if (!window.firebaseInitialized) {
                throw new Error('Firebase is not configured. Please set up your Firebase project to enable user registration.\n\nSteps:\n1. Go to https://console.firebase.google.com/\n2. Create a new project\n3. Enable Authentication and Firestore\n4. Update the Firebase configuration in js/firebase-config.js');
            }

            // Validate form data
            const validationRules = {
                name: { required: true, minLength: 2 },
                email: { required: true, email: true },
                phone: { required: true, phone: true },
                address: { required: true, minLength: 10 },
                password: { required: true, minLength: 8 },
                confirmPassword: { required: true }
            };

            const errors = window.Validation.validateForm(userData, validationRules);

            if (Object.keys(errors).length > 0) {
                throw new Error(Object.values(errors)[0]);
            }

            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Create user account
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(
                userData.email,
                userData.password
            );

            // Store user data
            await window.firebaseDB.collection('users').doc(userCredential.user.uid).set({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                address: userData.address,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.logger.success('User registration successful', { uid: userCredential.user.uid });
            return { success: true, user: userCredential.user };

        } catch (error) {
            window.logger.error('Registration failed', error);
            throw error;
        }
    }

    async login(email, password, role) {
        try {
            window.logger.info('Starting login attempt', { email, role });

            // Sign in with email and password
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Verify user role
            const userRole = await this.verifyUserRole(user.uid, role);
            if (!userRole) {
                await window.firebaseAuth.signOut();
                throw new Error(`Invalid login. You are not registered as ${role}.`);
            }

            window.logger.success('Login successful', { uid: user.uid, role });
            return { success: true, user, role: userRole };

        } catch (error) {
            window.logger.error('Login failed', error);
            throw error;
        }
    }

    async verifyUserRole(uid, expectedRole) {
        try {
            const collections = {
                user: 'users',
                staff: 'staff',
                admin: 'admins'
            };

            const collection = collections[expectedRole];
            if (!collection) return false;

            const doc = await window.firebaseDB.collection(collection).doc(uid).get();
            return doc.exists;

        } catch (error) {
            window.logger.error('Role verification failed', error);
            return false;
        }
    }

    async logout() {
        try {
            await window.firebaseAuth.signOut();
            window.logger.info('User logged out successfully');
        } catch (error) {
            window.logger.error('Logout failed', error);
            throw error;
        }
    }

    async resetPassword(email) {
        try {
            await window.firebaseAuth.sendPasswordResetEmail(email);
            window.logger.info('Password reset email sent', { email });
            return { success: true };
        } catch (error) {
            window.logger.error('Password reset failed', error);
            throw error;
        }
    }

    async updateProfile(profileData) {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            const updateData = {
                ...profileData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const collection = this.getUserCollection();
            await window.firebaseDB.collection(collection).doc(this.currentUser.uid).update(updateData);

            window.logger.success('Profile updated successfully');
            return { success: true };

        } catch (error) {
            window.logger.error('Profile update failed', error);
            throw error;
        }
    }

    getUserCollection() {
        switch (this.userRole) {
            case 'staff': return 'staff';
            case 'admin': return 'admins';
            default: return 'users';
        }
    }

    handleAuthSuccess() {
        // Check if we're on the main index page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (currentPage === 'index.html' || currentPage === '') {
            // Redirect to appropriate dashboard based on role
            console.log('Auth success - User role:', this.userRole);
            window.logger.info('User authenticated, redirecting to dashboard', { role: this.userRole });
            
            let dashboardPage;
            switch (this.userRole) {
                case 'user':
                    dashboardPage = 'user-dashboard.html';
                    break;
                case 'staff':
                    dashboardPage = 'staff-dashboard.html';
                    break;
                case 'admin':
                    dashboardPage = 'admin-dashboard.html';
                    break;
                default:
                    dashboardPage = 'user-dashboard.html';
            }
            
            // Redirect with a small delay to show any success messages
            setTimeout(() => {
                window.location.href = dashboardPage;
            }, 1000);
        } else {
            // If we're already on a dashboard page, just update the UI
            this.updateUI();
        }
    }

    handleAuthLogout() {
        // Show auth buttons
        window.DOM.show('auth-buttons');
        
        // Hide all dashboards
        window.DOM.hide('user-dashboard');
        window.DOM.hide('staff-dashboard');
        window.DOM.hide('admin-dashboard');
        
        // Show main content
        window.DOM.show('main-content');
        
        // Clear user data
        this.currentUser = null;
        this.userRole = null;
        
        // Update UI
        this.updateUI();
    }

    showDashboard() {
        // Hide main content
        window.DOM.hide('main-content');
        
        // Hide all dashboards first
        window.DOM.hide('user-dashboard');
        window.DOM.hide('staff-dashboard');
        window.DOM.hide('admin-dashboard');
        
        // Close any open modals
        window.DOM.hideModal('login-modal');
        window.DOM.hideModal('register-modal');
        
        // Show appropriate dashboard based on role
        console.log('Showing dashboard for role:', this.userRole);
        window.logger.info('Showing dashboard', { role: this.userRole });
        
        switch (this.userRole) {
            case 'user':
                window.DOM.show('user-dashboard');
                console.log('User dashboard shown');
                // Initialize user dashboard if userManager is available
                if (window.userManager && window.userManager.initializeUserDashboard) {
                    window.userManager.initializeUserDashboard();
                }
                break;
            case 'staff':
                window.DOM.show('staff-dashboard');
                console.log('Staff dashboard shown');
                if (window.staffManager && window.staffManager.initializeStaffDashboard) {
                    window.staffManager.initializeStaffDashboard();
                }
                break;
            case 'admin':
                window.DOM.show('admin-dashboard');
                console.log('Admin dashboard shown');
                if (window.adminManager && window.adminManager.initializeAdminDashboard) {
                    window.adminManager.initializeAdminDashboard();
                }
                break;
            default:
                window.DOM.show('user-dashboard');
                console.log('Default user dashboard shown');
        }
    }

    updateUI() {
        if (this.currentUser) {
            // Update user name in dashboard
            const userNameElements = document.querySelectorAll('#user-name');
            userNameElements.forEach(element => {
                element.textContent = this.currentUser.displayName || this.currentUser.email;
            });
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user role
    getUserRole() {
        return this.userRole;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.userRole === role;
    }

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        return roles.includes(this.userRole);
    }
}

// Initialize Auth Manager
window.authManager = new AuthManager();
console.log('Auth.js - AuthManager initialized');

// Global authentication functions
window.showLoginModal = function() {
    console.log('showLoginModal called');
    
    // Close register modal if it's open
    window.DOM.hideModal('register-modal');
    
    // Show login modal
    window.DOM.showModal('login-modal');
    window.logger.info('Login modal opened');
    
    // Focus on first input field
    setTimeout(() => {
        const emailInput = document.getElementById('login-email');
        if (emailInput) {
            emailInput.focus();
        }
    }, 100);
};

window.showRegisterModal = function() {
    console.log('showRegisterModal called');
    
    // Close login modal if it's open
    window.DOM.hideModal('login-modal');
    
    if (window.DOM && window.DOM.showModal) {
        window.DOM.showModal('register-modal');
        window.logger.info('Register modal opened');
        
        // Focus on first input field
        setTimeout(() => {
            const nameInput = document.getElementById('register-name');
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);
    } else {
        // Fallback if DOM utility is not available
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log('Register modal opened (fallback)');
        } else {
            console.error('Register modal not found');
        }
    }
};

window.closeModal = function(modalId) {
    console.log('closeModal called for:', modalId);
    if (window.DOM && window.DOM.hideModal) {
        window.DOM.hideModal(modalId);
        window.logger.info('Modal closed', { modalId });
    } else {
        // Fallback if DOM utility is not available
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('Modal closed (fallback):', modalId);
        } else {
            console.error('Modal not found:', modalId);
        }
    }
};

window.logout = function() {
    window.authManager.logout();
    window.DOM.showMessage('Logged out successfully', 'success');
};

// Login handler function
window.handleLogin = async function(event) {
    if (event) {
        event.preventDefault();
    }
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;

    if (!email || !password || !role) {
        window.DOM.showMessage('Please fill in all fields', 'error');
        return;
    }

    const loginForm = document.getElementById('login-form');
    try {
        window.DOM.setLoading(loginForm, true);
        const result = await window.authManager.login(email, password, role);
        
        if (result.success) {
            window.DOM.hideModal('login-modal');
            window.DOM.showMessage('Login successful! Redirecting to dashboard...', 'success');
            loginForm.reset();
            
            // Redirect to appropriate dashboard based on role
            setTimeout(() => {
                switch(result.role) {
                    case 'user':
                        window.location.href = 'user-dashboard.html';
                        break;
                    case 'staff':
                        window.location.href = 'staff-dashboard.html';
                        break;
                    case 'admin':
                        window.location.href = 'admin-dashboard.html';
                        break;
                    default:
                        window.location.href = 'user-dashboard.html';
                }
            }, 1000);
        }
    } catch (error) {
        window.DOM.showMessage(error.message, 'error');
        window.logger.error('Login error:', error);
    } finally {
        window.DOM.setLoading(loginForm, false);
    }
};

// Form event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', window.handleLogin);
        
        // Also add click handler to submit button as backup
        const submitButton = loginForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.handleLogin(e);
            });
        }
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    console.log('Register form found:', registerForm);
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Register form submitted');
            
            const formData = {
                name: document.getElementById('register-name').value,
                email: document.getElementById('register-email').value,
                phone: document.getElementById('register-phone').value,
                address: document.getElementById('register-address').value,
                password: document.getElementById('register-password').value,
                confirmPassword: document.getElementById('register-confirm-password').value
            };

            console.log('Form data:', formData);

            try {
                if (window.DOM && window.DOM.setLoading) {
                    window.DOM.setLoading(registerForm, true);
                }
                if (window.authManager && window.authManager.register) {
                    await window.authManager.register(formData);
                    if (window.DOM && window.DOM.hideModal) {
                        window.DOM.hideModal('register-modal');
                    }
                    if (window.DOM && window.DOM.showMessage) {
                        window.DOM.showMessage('REGISTRATION IS SUCCESSFUL', 'success', 7000);
                    }
                    registerForm.reset();
                } else {
                    console.error('AuthManager not available');
                    alert('Registration system not available. Please try again later.');
                }
            } catch (error) {
                console.error('Registration error:', error);
                let errorMessage = error.message;

                // Show user-friendly error message for Firebase configuration issues
                if (error.message.includes('Firebase is not configured')) {
                    errorMessage = 'Database not configured. Please contact the administrator to set up Firebase for user registration.';
                }

                if (window.DOM && window.DOM.showMessage) {
                    window.DOM.showMessage(errorMessage, 'error');
                } else {
                    alert('Registration error: ' + errorMessage);
                }
            } finally {
                if (window.DOM && window.DOM.setLoading) {
                    window.DOM.setLoading(registerForm, false);
                }
            }
        });
    } else {
        console.error('Register form not found');
    }

    // Password strength indicator
    const passwordInput = document.getElementById('register-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strength = window.Validation.getPasswordStrength(this.value);
            const strengthIndicator = document.querySelector('.password-strength');
            
            if (strengthIndicator) {
                strengthIndicator.textContent = `Password strength: ${strength}`;
                strengthIndicator.className = `password-strength ${strength}`;
            }
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                window.DOM.hideModal(modal.id);
            }
        });
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="display: block"]');
            openModals.forEach(modal => {
                window.DOM.hideModal(modal.id);
            });
        }
    });
});

// Modal testing functions
window.testModalSwitching = function() {
    console.log('=== Testing Modal Switching ===');
    
    // Test showing login modal
    console.log('1. Testing showLoginModal()');
    window.showLoginModal();
    
    setTimeout(() => {
        console.log('2. Testing showRegisterModal()');
        window.showRegisterModal();
        
        setTimeout(() => {
            console.log('3. Testing showLoginModal() again');
            window.showLoginModal();
            
            setTimeout(() => {
                console.log('4. Closing all modals');
                window.closeModal('login-modal');
                window.closeModal('register-modal');
                console.log('Modal switching test completed');
            }, 2000);
        }, 2000);
    }, 2000);
};

window.checkModalElements = function() {
    console.log('=== Checking Modal Elements ===');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    
    console.log('Login Modal Element:', loginModal ? 'Found' : 'Not found');
    console.log('Register Modal Element:', registerModal ? 'Found' : 'Not found');
    
    if (loginModal) {
        console.log('Login Modal Display:', loginModal.style.display);
        console.log('Login Modal Classes:', loginModal.className);
    }
    
    if (registerModal) {
        console.log('Register Modal Display:', registerModal.style.display);
        console.log('Register Modal Classes:', registerModal.className);
    }
    
    // Check for login here links
    const loginLinks = document.querySelectorAll('a[onclick*="showLoginModal"]');
    console.log('Login Here Links Found:', loginLinks.length);
    loginLinks.forEach((link, index) => {
        console.log(`Link ${index + 1}:`, link.outerHTML);
    });
};

// Test user creation for debugging
window.createTestUser = async function() {
    try {
        const testUserData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
            address: 'Test Address, Test City',
            password: 'password123',
            confirmPassword: 'password123'
        };
        
        await window.authManager.register(testUserData);
        console.log('Test user created successfully');
        window.DOM.showMessage('Test user created: test@example.com / password123', 'success', 10000);
    } catch (error) {
        console.error('Failed to create test user:', error);
        window.DOM.showMessage('Failed to create test user: ' + error.message, 'error');
    }
};

// Add debugging info
window.debugAuth = function() {
    console.log('=== Authentication Debug Info ===');
    console.log('Current User:', window.authManager.getCurrentUser());
    console.log('User Role:', window.authManager.getUserRole());
    console.log('Is Authenticated:', window.authManager.isAuthenticated());
    console.log('Firebase Initialized:', window.firebaseInitialized);
    console.log('Auth Manager:', window.authManager);
    console.log('================================');
};

// Log authentication module initialization
window.logger.info('Authentication module initialized'); 