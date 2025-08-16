// Main Application File for Digital E Gram Panchayat

// Check if all required scripts are loaded
console.log('Main.js loaded');
console.log('Firebase config available:', typeof firebase !== 'undefined');
console.log('Utils loaded:', typeof window.DOM !== 'undefined');
console.log('Auth loaded:', typeof window.authManager !== 'undefined');

class DigitalGramPanchayatApp {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            window.logger.error('Failed to initialize application', error);
        }
    }

    async initializeApp() {
        try {
            console.log('Initializing Digital E Gram Panchayat application');
            window.logger.info('Initializing Digital E Gram Panchayat application');

            // Check if all required modules are loaded
            console.log('Checking modules...');
            console.log('DOM utility:', window.DOM);
            console.log('AuthManager:', window.authManager);
            console.log('Logger:', window.logger);

            // Hide loading screen
            this.hideLoadingScreen();

            // Setup navigation
            this.setupNavigation();

            // Setup scroll animations
            this.setupScrollAnimations();

            // Setup mobile menu
            this.setupMobileMenu();

            // Initialize based on authentication state
            this.handleInitialState();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            this.isInitialized = true;
            console.log('Application initialized successfully');
            window.logger.success('Application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            window.logger.error('Failed to initialize application', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    setupNavigation() {
        // Smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    window.DOM.scrollTo(targetElement, 70);
                }
            });
        });

        // Active navigation highlighting
        window.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.pageYOffset >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        // Observe elements with scroll-animate class
        const animateElements = document.querySelectorAll('.scroll-animate');
        animateElements.forEach(el => observer.observe(el));
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking on a link
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    async handleInitialState() {
        // Listen for authentication state changes
        window.firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserRole(user.uid);
                this.handleAuthenticatedState();
            } else {
                this.currentUser = null;
                this.userRole = null;
                this.handleUnauthenticatedState();
            }
        });
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

    async handleAuthenticatedState() {
        // Hide auth buttons
        window.DOM.hide('auth-buttons');

        // Show appropriate dashboard
        this.showDashboard();

        // Initialize dashboard based on role
        this.initializeDashboard();

        // Update UI
        await this.updateUI();
    }

    handleUnauthenticatedState() {
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

    async initializeDashboard() {
        try {
            switch (this.userRole) {
                case 'user':
                    await window.userManager.initializeUserDashboard();
                    break;
                case 'staff':
                    await window.staffManager.initializeStaffDashboard();
                    break;
                case 'admin':
                    await window.adminManager.initializeAdminDashboard();
                    break;
                default:
                    await window.userManager.initializeUserDashboard();
            }
        } catch (error) {
            window.logger.error('Failed to initialize dashboard', error);
        }
    }

    async updateUI() {
        if (this.currentUser) {
            // Update user name in dashboard
            const userNameElements = document.querySelectorAll('#user-name');
            let displayName = this.currentUser.displayName;

            // If no displayName, try to get name from database
            if (!displayName) {
                try {
                    if (window.firebaseRealtimeDB) {
                        const snapshot = await window.firebaseRealtimeDB.ref('users/' + this.currentUser.uid + '/name').once('value');
                        displayName = snapshot.val();
                    }
                } catch (error) {
                    console.log('Could not fetch name from database:', error);
                }
            }

            // Fallback to email if still no name
            displayName = displayName || this.currentUser.email;

            userNameElements.forEach(element => {
                element.textContent = displayName;
            });
        }
    }

    setupGlobalEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', () => {
            window.logger.info('Application closing');
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            window.DOM.showMessage('Connection restored', 'success');
            window.logger.info('Application is online');
        });

        window.addEventListener('offline', () => {
            window.DOM.showMessage('Connection lost. Some features may not work.', 'warning');
            window.logger.warn('Application is offline');
        });

        // Handle service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SKIP_WAITING') {
                    window.location.reload();
                }
            });
        }
    }

    handleWindowResize() {
        // Close mobile menu on resize
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (window.innerWidth > 768) {
            if (navToggle) navToggle.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        }
    }

    showError(message) {
        window.DOM.showMessage(message, 'error');
    }

    // Utility methods
    getCurrentUser() {
        return this.currentUser;
    }

    getUserRole() {
        return this.userRole;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    hasRole(role) {
        return this.userRole === role;
    }

    hasAnyRole(roles) {
        return roles.includes(this.userRole);
    }
}

// Initialize the main application
window.app = new DigitalGramPanchayatApp();

// Global utility functions
window.getCurrentUser = function() {
    return window.app.getCurrentUser();
};

window.getUserRole = function() {
    return window.app.getUserRole();
};

window.isAuthenticated = function() {
    return window.app.isAuthenticated();
};

window.hasRole = function(role) {
    return window.app.hasRole(role);
};

window.hasAnyRole = function(roles) {
    return window.app.hasAnyRole(roles);
};

// Performance monitoring
window.addEventListener('load', () => {
    // Log performance metrics
    if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        window.logger.info('Page load performance', {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            totalTime: perfData.loadEventEnd - perfData.fetchStart
        });
    }
});

// Error handling
window.addEventListener('error', (event) => {
    window.logger.error('Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    window.logger.error('Unhandled promise rejection', {
        reason: event.reason
    });
});

// Log main application initialization
window.logger.info('Main application module initialized'); 