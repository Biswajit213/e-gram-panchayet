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
        // Hide auth buttons
        window.DOM.hide('auth-buttons');
        
        // Show appropriate dashboard
        this.showDashboard();
        
        // Update UI
        this.updateUI();
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
        
        // Show appropriate dashboard based on role
        switch (this.userRole) {
            case 'user':
                window.DOM.show('user-dashboard');
                break;
            case 'staff':
                window.DOM.show('staff-dashboard');
                break;
            case 'admin':
                window.DOM.show('admin-dashboard');
                break;
            default:
                window.DOM.show('user-dashboard');
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
    window.DOM.showModal('login-modal');
    window.logger.info('Login modal opened');
};

window.showRegisterModal = function() {
    console.log('showRegisterModal called');
    if (window.DOM && window.DOM.showModal) {
        window.DOM.showModal('register-modal');
        window.logger.info('Register modal opened');
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

// Form event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const role = document.getElementById('login-role').value;

            if (!email || !password || !role) {
                window.DOM.showMessage('Please fill in all fields', 'error');
                return;
            }

            try {
                window.DOM.setLoading(loginForm, true);
                await window.authManager.login(email, password, role);
                window.DOM.hideModal('login-modal');
                window.DOM.showMessage('Login successful!', 'success');
                loginForm.reset();
            } catch (error) {
                window.DOM.showMessage(error.message, 'error');
            } finally {
                window.DOM.setLoading(loginForm, false);
            }
        });
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

// Log authentication module initialization
window.logger.info('Authentication module initialized'); 