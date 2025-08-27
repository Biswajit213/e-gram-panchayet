// User Dashboard JavaScript Module
// Handles dashboard navigation, user session management, and UI interactions

class UserDashboard {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.currentSection = 'overview';
        this.init();
    }

    async init() {
        console.log('Initializing User Dashboard...');
        
        // Check authentication state
        await this.checkAuthentication();
        
        // Initialize UI components
        this.initializeUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        console.log('User Dashboard initialized successfully');
    }

    async checkAuthentication() {
        return new Promise((resolve) => {
            if (window.firebaseAuth) {
                window.firebaseAuth.onAuthStateChanged(async (user) => {
                    if (user) {
                        this.currentUser = user;
                        await this.loadUserRole(user.uid);
                        this.updateUserInterface(user);
                        resolve(true);
                    } else {
                        // Redirect to login if not authenticated
                        console.log('User not authenticated, redirecting to main page...');
                        window.location.href = 'index.html';
                        resolve(false);
                    }
                });
            } else {
                console.error('Firebase Auth not available');
                window.location.href = 'index.html';
                resolve(false);
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
                // Redirect staff to staff dashboard
                window.location.href = 'staff-dashboard.html';
                return;
            }

            // Check in admins collection
            const adminDoc = await window.firebaseDB.collection('admins').doc(uid).get();
            if (adminDoc.exists) {
                this.userRole = 'admin';
                // Redirect admin to admin dashboard
                window.location.href = 'admin-dashboard.html';
                return;
            }

            // Default to user if no role found
            this.userRole = 'user';
        } catch (error) {
            console.error('Failed to load user role:', error);
            this.userRole = 'user';
        }
    }

    initializeUI() {
        // Load initial section data
        this.loadSectionData('overview');
        
        // Setup navigation
        this.setupNavigation();
        
        // Load user data
        this.loadUserData();
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            // Add form submit event listener
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
            
            // Add backup click handler to submit button
            const submitButton = profileForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleProfileUpdate(e);
                });
            }
            
            console.log('Profile form event listeners attached successfully');
        } else {
            console.warn('Profile form not found during event listener setup');
            // Retry after a delay
            setTimeout(() => {
                const retryForm = document.getElementById('profile-form');
                if (retryForm && !retryForm.hasAttribute('data-listeners-attached')) {
                    retryForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
                    retryForm.setAttribute('data-listeners-attached', 'true');
                    console.log('Profile form event listeners attached on retry');
                }
            }, 1000);
        }

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const hash = window.location.hash.substring(1) || 'overview';
            this.showSection(hash);
        });

        // Handle refresh/reload protection
        window.addEventListener('beforeunload', (e) => {
            // Optional: Add warning if user has unsaved changes
        });
    }

    setupNavigation() {
        // Setup hash-based navigation
        const hash = window.location.hash.substring(1) || 'overview';
        this.showSection(hash);
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 800);
    }

    updateUserInterface(user) {
        try {
            const userName = user.displayName || user.email.split('@')[0];
            const userEmail = user.email;
            
            // Update user name displays
            const userNameElement = document.getElementById('user-name');
            const navUserNameElement = document.getElementById('nav-user-name');
            const userEmailElement = document.getElementById('user-email');
            
            if (userNameElement) userNameElement.textContent = userName;
            if (navUserNameElement) navUserNameElement.textContent = userName;
            if (userEmailElement) userEmailElement.textContent = userEmail;
            
            // Update avatar
            const avatar = document.getElementById('user-avatar');
            if (avatar) {
                avatar.textContent = userName.charAt(0).toUpperCase();
            }

            console.log('User interface updated for:', userName);
        } catch (error) {
            console.error('Error updating user interface:', error);
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            // Load user profile data from database
            const userDoc = await window.firebaseDB.collection('users').doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Update profile form if it exists
                const profileForm = document.getElementById('profile-form');
                if (profileForm) {
                    const nameInput = document.getElementById('profile-name');
                    const emailInput = document.getElementById('profile-email');
                    const phoneInput = document.getElementById('profile-phone');
                    const addressInput = document.getElementById('profile-address');
                    
                    if (nameInput) nameInput.value = userData.name || '';
                    if (emailInput) emailInput.value = userData.email || this.currentUser.email;
                    if (phoneInput) phoneInput.value = userData.phone || '';
                    if (addressInput) addressInput.value = userData.address || '';
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Show/Hide sections
    showSection(sectionName) {
        console.log(`\n=== SHOW SECTION: ${sectionName} ===`);
        console.log('Dashboard instance:', this);
        console.log('Current user:', this.currentUser ? 'Authenticated' : 'Not authenticated');
        
        try {
            // Hide all sections
            const sections = ['overview', 'services', 'applications', 'profile', 'support'];
            console.log('Step 1: Hiding all sections...');
            
            sections.forEach(section => {
                const element = document.getElementById(section + '-section');
                if (element) {
                    // Use triple approach for maximum compatibility
                    element.classList.add('hidden');
                    element.classList.remove('active');
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    console.log(`  ✅ Hidden section: ${section}`);
                } else {
                    console.warn(`  ❌ Section element not found: ${section}-section`);
                }
            });

            // Show selected section
            const selectedSection = document.getElementById(sectionName + '-section');
            console.log(`Step 2: Looking for section: ${sectionName}-section`);
            
            if (selectedSection) {
                console.log('  Section found! Applying display logic...');
                
                // Use triple approach for maximum compatibility and force display
                selectedSection.classList.remove('hidden');
                selectedSection.classList.add('active');
                selectedSection.style.display = 'block';
                selectedSection.style.visibility = 'visible';
                selectedSection.style.opacity = '1';
                
                // Force reflow to ensure changes take effect
                selectedSection.offsetHeight;
                
                this.currentSection = sectionName;
                
                console.log(`  ✅ Successfully showed section: ${sectionName}`);
                console.log(`  Section classes: ${selectedSection.className}`);
                console.log(`  Section display: ${selectedSection.style.display}`);
                console.log(`  Section visibility: ${selectedSection.style.visibility}`);
                console.log(`  Section computed display: ${getComputedStyle(selectedSection).display}`);
                
                // Additional check after a brief delay
                setTimeout(() => {
                    const finalDisplay = getComputedStyle(selectedSection).display;
                    const finalVisibility = getComputedStyle(selectedSection).visibility;
                    console.log(`  Final check - Display: ${finalDisplay}, Visibility: ${finalVisibility}`);
                    
                    if (finalDisplay === 'none') {
                        console.error('  ❌ CRITICAL: Section is still hidden after all attempts!');
                        // Emergency override
                        selectedSection.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
                        console.log('  🚨 Applied emergency CSS override');
                    }
                }, 50);
                
            } else {
                console.error(`❌ Section element not found: ${sectionName}-section`);
                console.log('Available sections in DOM:');
                sections.forEach(section => {
                    const el = document.getElementById(section + '-section');
                    console.log(`  ${section}-section: ${el ? 'Found' : 'Not found'}`);
                });
                return;
            }

            // Update navigation
            console.log('Step 3: Updating navigation...');
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const activeNav = document.querySelector(`[onclick*="showSection('${sectionName}')"]`);
            if (activeNav) {
                activeNav.classList.add('active');
                console.log(`  ✅ Updated navigation for: ${sectionName}`);
            } else {
                console.warn(`  ⚠️ Navigation item not found for: ${sectionName}`);
            }

            // Update URL hash
            window.location.hash = sectionName;
            console.log(`Step 4: Updated URL hash to: ${sectionName}`);

            // Load section specific data
            console.log(`Step 5: Loading data for section: ${sectionName}`);
            this.loadSectionData(sectionName);
            
            // Special handling for services section
            if (sectionName === 'services') {
                console.log('🔧 Special services section handling...');
                
                // Immediate services load
                console.log('Loading services immediately...');
                this.loadAvailableServices();
                
                // Also load with delay for safety
                setTimeout(() => {
                    console.log('Loading services with delay...');
                    this.loadAvailableServices();
                    
                    // Final visibility check for services
                    const servicesCheck = document.getElementById('services-section');
                    if (servicesCheck) {
                        const isVisible = getComputedStyle(servicesCheck).display !== 'none';
                        console.log(`🔍 Final services visibility check: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
                        
                        if (!isVisible) {
                            console.error('🚨 Services section still not visible, forcing display...');
                            servicesCheck.style.cssText = 'display: block !important; visibility: visible !important;';
                        }
                    }
                }, 100);
            }
            
            console.log(`=== SHOW SECTION COMPLETED: ${sectionName} ===\n`);
            
        } catch (error) {
            console.error('❌ Error in showSection:', error);
            console.error('Stack trace:', error.stack);
            
            // Emergency fallback
            console.log('🚨 Attempting emergency fallback...');
            const emergencySection = document.getElementById(sectionName + '-section');
            if (emergencySection) {
                emergencySection.style.cssText = 'display: block !important; visibility: visible !important;';
                console.log('Emergency fallback applied');
            }
        }
    }

    // Load section specific data
    loadSectionData(sectionName) {
        console.log(`loadSectionData called for: ${sectionName}`);
        
        try {
            switch(sectionName) {
                case 'overview':
                    console.log('Loading dashboard stats...');
                    this.loadDashboardStats();
                    break;
                case 'services':
                    console.log('Loading available services...');
                    this.loadAvailableServices();
                    break;
                case 'applications':
                    console.log('Loading user applications...');
                    this.loadUserApplications();
                    break;
                case 'profile':
                    console.log('Loading user data...');
                    this.loadUserData();
                    break;
                default:
                    console.log(`No specific data loading for section: ${sectionName}`);
            }
        } catch (error) {
            console.error(`Error loading data for section ${sectionName}:`, error);
        }
    }

    // Load dashboard statistics
    async loadDashboardStats() {
        try {
            if (!this.currentUser) return;

            // In a real implementation, this would query the database
            // For now, using mock data
            const stats = {
                total: 5,
                pending: 2,
                approved: 2,
                payments: 1
            };

            document.getElementById('total-applications').textContent = stats.total;
            document.getElementById('pending-applications').textContent = stats.pending;
            document.getElementById('approved-applications').textContent = stats.approved;
            document.getElementById('completed-payments').textContent = stats.payments;

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    // Load available services
    loadAvailableServices() {
        console.log('Loading available services...');
        
        const servicesGrid = document.getElementById('services-grid');
        if (!servicesGrid) {
            console.error('Services grid element not found');
            return;
        }
        
        const services = [
            {
                title: 'Birth Certificate',
                description: 'Apply for official birth certificate with digital verification',
                fee: '₹50',
                id: 'birth-certificate'
            },
            {
                title: 'Death Certificate',
                description: 'Apply for official death certificate documentation',
                fee: '₹50',
                id: 'death-certificate'
            },
            {
                title: 'Property Tax Payment',
                description: 'Pay your property tax online with instant receipt',
                fee: 'Variable',
                id: 'property-tax'
            },
            {
                title: 'Trade License',
                description: 'Apply for new trade license or renew existing license',
                fee: '₹500',
                id: 'trade-license'
            },
            {
                title: 'Water Connection',
                description: 'Apply for new water connection or report issues',
                fee: '₹200',
                id: 'water-connection'
            },
            {
                title: 'Building Permit',
                description: 'Apply for building construction or renovation permits',
                fee: '₹1000',
                id: 'building-permit'
            }
        ];

        try {
            servicesGrid.innerHTML = services.map(service => `
                <div class="service-card">
                    <h3 class="service-title">${service.title}</h3>
                    <p class="service-description">${service.description}</p>
                    <div class="service-footer">
                        <span class="service-fee">${service.fee}</span>
                        <button class="btn-apply" onclick="window.applyForService('${service.id}')">Apply Now</button>
                    </div>
                </div>
            `).join('');
            
            console.log('Available services loaded successfully');
        } catch (error) {
            console.error('Error loading available services:', error);
        }
    }

    // Load user applications
    async loadUserApplications() {
        const tableBody = document.getElementById('applications-table-body');
        if (!tableBody) return;
        
        try {
            // In a real implementation, this would query the user's applications from the database
            // For now, using mock data
            const applications = [
                {
                    id: 'BC2024001',
                    service: 'Birth Certificate',
                    date: '2024-01-15',
                    status: 'pending'
                },
                {
                    id: 'PT2024002',
                    service: 'Property Tax',
                    date: '2024-01-10',
                    status: 'approved'
                },
                {
                    id: 'TL2024003',
                    service: 'Trade License',
                    date: '2024-01-08',
                    status: 'rejected'
                }
            ];

            tableBody.innerHTML = applications.map(app => `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.service}</td>
                    <td>${app.date}</td>
                    <td><span class="status-badge status-${app.status}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="userDashboard.viewApplication('${app.id}')">View</button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading user applications:', error);
        }
    }

    // Apply for service
    applyForService(serviceId) {
        console.log('Applying for service:', serviceId);
        
        // Show confirmation
        if (window.DOM && window.DOM.showMessage) {
            window.DOM.showMessage(`Starting application for ${serviceId}. Application form will open shortly.`, 'info');
        } else {
            alert(`Starting application for ${serviceId}. This would open the application form.`);
        }
        
        // In a real implementation, this would open the application form modal
        // or redirect to a dedicated application page
    }

    // View application details
    viewApplication(applicationId) {
        console.log('Viewing application:', applicationId);
        
        if (window.DOM && window.DOM.showMessage) {
            window.DOM.showMessage(`Loading details for application ${applicationId}...`, 'info');
        } else {
            alert(`Viewing details for application ${applicationId}. This would open the application details modal.`);
        }
        
        // In a real implementation, this would open the application details modal
    }

    // Handle profile update
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        console.log('Profile update initiated...');
        
        try {
            // Check if user is authenticated
            if (!this.currentUser) {
                throw new Error('User not authenticated. Please login again.');
            }
            
            // Get form data
            const nameInput = document.getElementById('profile-name');
            const phoneInput = document.getElementById('profile-phone');
            const addressInput = document.getElementById('profile-address');
            
            if (!nameInput || !phoneInput || !addressInput) {
                throw new Error('Profile form elements not found. Please refresh the page.');
            }
            
            const formData = {
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                address: addressInput.value.trim()
            };
            
            console.log('Form data collected:', formData);
            
            // Validate form data
            if (!formData.name || formData.name.length < 2) {
                throw new Error('Please enter a valid name (at least 2 characters)');
            }
            
            if (!formData.phone || formData.phone.length < 10) {
                throw new Error('Please enter a valid phone number (at least 10 digits)');
            }
            
            if (!formData.address || formData.address.length < 10) {
                throw new Error('Please enter a valid address (at least 10 characters)');
            }
            
            // Add loading state
            const submitButton = document.querySelector('#profile-form button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            }
            
            // Check Firebase availability
            if (!window.firebaseDB) {
                throw new Error('Database connection not available. Please check your internet connection.');
            }
            
            console.log('Updating profile in database...');
            
            // Prepare update data with timestamp
            const updateData = {
                ...formData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update user profile in database
            await window.firebaseDB.collection('users').doc(this.currentUser.uid).update(updateData);
            
            console.log('Profile updated successfully in database');
            
            // Update UI with new data
            this.updateUserInterface({
                ...this.currentUser,
                displayName: formData.name
            });
            
            // Show success message
            if (window.DOM && window.DOM.showMessage) {
                window.DOM.showMessage('Profile updated successfully!', 'success', 3000);
            } else {
                alert('Profile updated successfully!');
            }
            
            console.log('Profile update completed successfully');

        } catch (error) {
            console.error('Error updating profile:', error);
            
            // Show user-friendly error message
            let errorMessage = 'Failed to update profile. Please try again.';
            
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please check your account permissions.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Service temporarily unavailable. Please try again later.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            if (window.DOM && window.DOM.showMessage) {
                window.DOM.showMessage(errorMessage, 'error', 5000);
            } else {
                alert('Error: ' + errorMessage);
            }
        } finally {
            // Remove loading state
            const submitButton = document.querySelector('#profile-form button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Update Profile';
            }
        }
    }

    // Logout function
    async logout() {
        try {
            if (window.authManager) {
                await window.authManager.logout();
            } else if (window.firebaseAuth) {
                await window.firebaseAuth.signOut();
            }
            
            console.log('User logged out successfully');
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Error during logout:', error);
            // Force redirect even if logout fails
            window.location.href = 'index.html';
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current section
    getCurrentSection() {
        return this.currentSection;
    }
}

// Global functions for HTML onclick handlers
window.showSection = function(sectionName) {
    console.log('\n=== GLOBAL SHOW SECTION CALLED ===');
    console.log('Section requested:', sectionName);
    console.log('Dashboard instance available:', !!window.userDashboard);
    console.log('Dashboard type:', typeof window.userDashboard);
    
    // Immediate visibility check
    const targetSection = document.getElementById(sectionName + '-section');
    console.log('Target section exists:', !!targetSection);
    if (targetSection) {
        console.log('Target section current classes:', targetSection.className);
        console.log('Target section current display:', getComputedStyle(targetSection).display);
    }
    
    if (window.userDashboard && typeof window.userDashboard.showSection === 'function') {
        console.log('Using dashboard instance method for section:', sectionName);
        try {
            window.userDashboard.showSection(sectionName);
            console.log('✅ Dashboard showSection completed successfully');
            
            // Immediate verification
            setTimeout(() => {
                if (targetSection) {
                    const finalDisplay = getComputedStyle(targetSection).display;
                    console.log(`Verification: Section ${sectionName} display is now: ${finalDisplay}`);
                    
                    if (finalDisplay === 'none' && sectionName === 'services') {
                        console.error('🚨 CRITICAL: Services section still hidden after dashboard method');
                        console.log('Attempting emergency intervention...');
                        
                        // Emergency override for services
                        targetSection.className = 'dashboard-section active';
                        targetSection.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
                        
                        // Force services load
                        if (window.userDashboard.loadAvailableServices) {
                            window.userDashboard.loadAvailableServices();
                        }
                        
                        console.log('🛠️ Emergency intervention applied');
                    }
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Error in dashboard showSection:', error);
            console.log('Falling back to manual section switching...');
            showSectionFallback(sectionName);
        }
    } else if (window.userDashboard) {
        console.error('Dashboard exists but showSection method not found');
        console.log('Available methods:', Object.getOwnPropertyNames(window.userDashboard));
        
        // Try to call the method directly with error handling
        try {
            window.userDashboard.showSection(sectionName);
        } catch (error) {
            console.error('Error calling showSection:', error);
            showSectionFallback(sectionName);
        }
    } else {
        console.error('User dashboard not initialized');
        console.log('Attempting fallback section switching...');
        
        // Wait a bit and try again
        setTimeout(() => {
            if (window.userDashboard) {
                console.log('Dashboard now available, retrying...');
                window.userDashboard.showSection(sectionName);
            } else {
                console.error('Dashboard still not available after retry');
                showSectionFallback(sectionName);
            }
        }, 1000);
    }
    
    // Additional safety mechanism for services section
    if (sectionName === 'services') {
        console.log('🔧 Additional safety mechanism for services section');
        
        setTimeout(() => {
            const servicesSection = document.getElementById('services-section');
            const servicesGrid = document.getElementById('services-grid');
            
            if (servicesSection) {
                const isVisible = getComputedStyle(servicesSection).display !== 'none';
                console.log(`Services section final visibility: ${isVisible}`);
                
                if (!isVisible) {
                    console.log('🚨 Services section still not visible, applying final fix...');
                    
                    // Final override
                    servicesSection.className = 'dashboard-section';
                    servicesSection.style.display = 'block';
                    servicesSection.style.visibility = 'visible';
                    
                    // Ensure services grid has content
                    if (servicesGrid && servicesGrid.innerHTML.trim() === '') {
                        console.log('Loading services content directly...');
                        loadAvailableServicesFallback();
                    }
                    
                    console.log('✅ Final services fix applied');
                } else {
                    console.log('✅ Services section is now visible');
                }
            }
        }, 500);
    }
    
    console.log('=== GLOBAL SHOW SECTION END ===\n');
};

window.logout = function() {
    if (window.userDashboard) {
        window.userDashboard.logout();
    }
};

// Debug function for profile settings
window.debugProfileSettings = function() {
    console.log('=== Profile Settings Debug ===');
    console.log('User Dashboard:', window.userDashboard);
    console.log('Profile Form:', document.getElementById('profile-form'));
    console.log('Profile Section:', document.getElementById('profile-section'));
    console.log('Submit Button:', document.querySelector('#profile-form button[type="submit"]'));
    console.log('Firebase Auth:', window.firebaseAuth);
    console.log('Firebase DB:', window.firebaseDB);
    console.log('Current User:', window.firebaseAuth?.currentUser);
    
    // Test profile form visibility
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
        console.log('Profile section classes:', profileSection.className);
        console.log('Profile section hidden:', profileSection.classList.contains('hidden'));
    }
    
    // Test form elements
    const formElements = {
        'profile-name': document.getElementById('profile-name'),
        'profile-phone': document.getElementById('profile-phone'),
        'profile-address': document.getElementById('profile-address')
    };
    
    Object.entries(formElements).forEach(([id, element]) => {
        console.log(`${id}:`, element ? 'Found' : 'Not found', element?.value || '');
    });
    
    console.log('=== End Debug ===');
};

// Force show profile section (for debugging)
window.forceShowProfile = function() {
    console.log('Force showing profile section...');
    if (window.userDashboard) {
        window.userDashboard.showSection('profile');
    } else {
        // Manual show
        const profileSection = document.getElementById('profile-section');
        if (profileSection) {
            profileSection.classList.remove('hidden');
            console.log('Profile section shown manually');
        }
    }
};

window.handleProfileUpdate = function(event) {
    console.log('Global handleProfileUpdate called');
    
    if (event) {
        event.preventDefault();
    }
    
    // Multiple fallback attempts
    if (window.userDashboard && typeof window.userDashboard.handleProfileUpdate === 'function') {
        console.log('Using dashboard instance method');
        window.userDashboard.handleProfileUpdate(event);
    } else if (window.userDashboard) {
        console.error('Dashboard exists but handleProfileUpdate method not found');
        console.log('Available methods:', Object.getOwnPropertyNames(window.userDashboard));
        
        // Try to call the method directly with error handling
        try {
            window.userDashboard.handleProfileUpdate(event);
        } catch (error) {
            console.error('Error calling handleProfileUpdate:', error);
            handleProfileUpdateFallback();
        }
    } else {
        console.error('User dashboard not initialized');
        
        // Wait a bit and try again
        setTimeout(() => {
            if (window.userDashboard) {
                console.log('Dashboard now available, retrying...');
                window.userDashboard.handleProfileUpdate(event);
            } else {
                console.error('Dashboard still not available after retry');
                handleProfileUpdateFallback();
            }
        }, 1000);
    }
};

// Fallback profile update function
function handleProfileUpdateFallback() {
    console.log('Using fallback profile update method');
    
    try {
        // Get form data directly
        const nameInput = document.getElementById('profile-name');
        const phoneInput = document.getElementById('profile-phone');
        const addressInput = document.getElementById('profile-address');
        
        if (!nameInput || !phoneInput || !addressInput) {
            throw new Error('Profile form elements not found');
        }
        
        const formData = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            address: addressInput.value.trim()
        };
        
        // Basic validation
        if (!formData.name || formData.name.length < 2) {
            throw new Error('Please enter a valid name (at least 2 characters)');
        }
        
        if (!formData.phone || formData.phone.length < 10) {
            throw new Error('Please enter a valid phone number (at least 10 digits)');
        }
        
        if (!formData.address || formData.address.length < 10) {
            throw new Error('Please enter a valid address (at least 10 characters)');
        }
        
        // Check authentication
        if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
            throw new Error('User not authenticated. Please login again.');
        }
        
        const currentUser = window.firebaseAuth.currentUser;
        
        // Update profile in Firebase
        if (window.firebaseDB) {
            const updateData = {
                ...formData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            window.firebaseDB.collection('users').doc(currentUser.uid).update(updateData)
                .then(() => {
                    console.log('Profile updated successfully via fallback');
                    if (window.DOM && window.DOM.showMessage) {
                        window.DOM.showMessage('Profile updated successfully!', 'success');
                    } else {
                        alert('Profile updated successfully!');
                    }
                })
                .catch((error) => {
                    console.error('Error updating profile via fallback:', error);
                    if (window.DOM && window.DOM.showMessage) {
                        window.DOM.showMessage('Failed to update profile: ' + error.message, 'error');
                    } else {
                        alert('Failed to update profile: ' + error.message);
                    }
                });
        } else {
            throw new Error('Database not available');
        }
        
    } catch (error) {
        console.error('Fallback profile update failed:', error);
        
        if (window.DOM && window.DOM.showMessage) {
            window.DOM.showMessage(error.message, 'error');
        } else {
            alert('Error: ' + error.message);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dashboard...');
    
    // Wait for Firebase to be initialized
    const initDashboard = () => {
        if (window.firebaseInitialized !== undefined) {
            console.log('Firebase initialized, creating dashboard instance...');
            window.userDashboard = new UserDashboard();
            
            // Additional safety check for profile form after dashboard initialization
            setTimeout(() => {
                ensureProfileFormHandlers();
            }, 2000);
        } else {
            console.log('Waiting for Firebase initialization...');
            setTimeout(initDashboard, 100);
        }
    };
    
    initDashboard();
});

// Ensure navigation handlers are properly attached
function ensureNavigationHandlers() {
    console.log('Ensuring navigation handlers...');
    
    // Check all navigation items
    const navItems = document.querySelectorAll('.nav-item[onclick*="showSection"]');
    console.log('Found navigation items:', navItems.length);
    
    navItems.forEach((item, index) => {
        const onclickAttr = item.getAttribute('onclick');
        console.log(`Nav item ${index + 1}: ${item.textContent.trim()} - ${onclickAttr}`);
        
        // Add additional click event listener as backup
        if (!item.hasAttribute('data-backup-handler')) {
            item.setAttribute('data-backup-handler', 'true');
            
            item.addEventListener('click', function(e) {
                // Get section name from onclick attribute
                const match = onclickAttr.match(/showSection\('([^']+)'\)/);
                if (match) {
                    const sectionName = match[1];
                    console.log('Backup handler triggered for section:', sectionName);
                    
                    // Try global function first
                    if (window.showSection) {
                        window.showSection(sectionName);
                    } else {
                        // Use fallback
                        showSectionFallback(sectionName);
                    }
                }
            });
            
            console.log('Backup handler added for:', item.textContent.trim());
        }
    });
    
    console.log('Navigation handlers ensured successfully');
}

// Add multiple initialization phases for navigation
setTimeout(() => {
    ensureNavigationHandlers();
}, 3000);

setTimeout(() => {
    // Final check and retry
    if (!window.userDashboard) {
        console.warn('Dashboard still not initialized after 5 seconds');
        ensureNavigationHandlers();
    }
}, 5000);

// Ensure profile form handlers are properly attached
function ensureProfileFormHandlers() {
    const profileForm = document.getElementById('profile-form');
    const submitButton = document.querySelector('#profile-form button[type="submit"]');
    
    console.log('Ensuring profile form handlers...');
    console.log('Profile form found:', !!profileForm);
    console.log('Submit button found:', !!submitButton);
    
    if (profileForm && !profileForm.hasAttribute('data-handlers-ensured')) {
        // Mark as processed
        profileForm.setAttribute('data-handlers-ensured', 'true');
        
        // Remove any existing listeners to avoid duplicates
        const newForm = profileForm.cloneNode(true);
        profileForm.parentNode.replaceChild(newForm, profileForm);
        
        // Add fresh event listeners
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Profile form submitted via event listener');
            if (window.userDashboard && window.userDashboard.handleProfileUpdate) {
                window.userDashboard.handleProfileUpdate(e);
            } else {
                console.error('Dashboard not ready for profile update');
                alert('Dashboard not ready. Please refresh the page and try again.');
            }
        });
        
        // Add click handler to button as well
        const newSubmitButton = newForm.querySelector('button[type="submit"]');
        if (newSubmitButton) {
            newSubmitButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Profile button clicked via event listener');
                if (window.userDashboard && window.userDashboard.handleProfileUpdate) {
                    window.userDashboard.handleProfileUpdate(e);
                } else {
                    console.error('Dashboard not ready for profile update');
                    alert('Dashboard not ready. Please refresh the page and try again.');
                }
            });
        }
        
        console.log('Profile form handlers ensured successfully');
    }
}

// Global service application function
window.applyForService = function(serviceId) {
    console.log('Global applyForService called with:', serviceId);
    
    if (window.userDashboard && typeof window.userDashboard.applyForService === 'function') {
        console.log('Using dashboard instance method for service:', serviceId);
        window.userDashboard.applyForService(serviceId);
    } else {
        console.warn('Dashboard not available, using fallback for service:', serviceId);
        window.applyForServiceFallback(serviceId);
    }
};

// Fallback section switching function
function showSectionFallback(sectionName) {
    console.log('=== Using Fallback Section Switching ===');
    console.log('Fallback switching to section:', sectionName);
    
    try {
        // Hide all sections
        const sections = ['overview', 'services', 'applications', 'profile', 'support'];
        console.log('Fallback: Hiding all sections...');
        
        sections.forEach(section => {
            const element = document.getElementById(section + '-section');
            if (element) {
                // Use multiple approaches for maximum compatibility
                element.classList.add('hidden');
                element.classList.remove('active');
                element.style.display = 'none';
                console.log(`Fallback: Hidden section ${section}`);
            } else {
                console.warn(`Fallback: Section element not found: ${section}-section`);
            }
        });

        // Show selected section
        const selectedSection = document.getElementById(sectionName + '-section');
        console.log(`Fallback: Looking for section: ${sectionName}-section`);
        
        if (selectedSection) {
            // Use multiple approaches for maximum compatibility
            selectedSection.classList.remove('hidden');
            selectedSection.classList.add('active');
            selectedSection.style.display = 'block';
            console.log('Fallback: Section shown successfully:', sectionName);
            console.log('Fallback: Section classes:', selectedSection.className);
            console.log('Fallback: Section display style:', selectedSection.style.display);
        } else {
            console.error('Fallback: Section element not found:', sectionName + '-section');
            // List all available sections for debugging
            console.log('Available sections in DOM:');
            sections.forEach(section => {
                const el = document.getElementById(section + '-section');
                console.log(`  ${section}-section:`, el ? 'Found' : 'Not found');
            });
            return;
        }

        // Update navigation
        console.log('Fallback: Updating navigation...');
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[onclick*="showSection('${sectionName}')"]`);
        if (activeNav) {
            activeNav.classList.add('active');
            console.log('Fallback: Navigation updated for:', sectionName);
        } else {
            console.warn('Fallback: Navigation item not found for:', sectionName);
        }

        // Update URL hash
        window.location.hash = sectionName;
        console.log('Fallback: Updated URL hash to:', sectionName);

        // Load section specific data based on section name
        if (sectionName === 'services') {
            console.log('Fallback: Loading services...');
            setTimeout(() => {
                loadAvailableServicesFallback();
            }, 100);
        }
        
        console.log('=== Fallback Section Switching Completed ===');
        
    } catch (error) {
        console.error('Fallback section switching failed:', error);
        console.error('Fallback error stack:', error.stack);
        
        if (window.DOM && window.DOM.showMessage) {
            window.DOM.showMessage('Navigation error. Please refresh the page.', 'error');
        } else {
            alert('Navigation error. Please refresh the page.');
        }
    }
}

// Fallback function to load available services
function loadAvailableServicesFallback() {
    console.log('Loading available services via fallback...');
    
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) {
        console.error('Services grid not found');
        return;
    }
    
    const services = [
        {
            title: 'Birth Certificate',
            description: 'Apply for official birth certificate with digital verification',
            fee: '₹50',
            id: 'birth-certificate'
        },
        {
            title: 'Death Certificate',
            description: 'Apply for official death certificate documentation',
            fee: '₹50',
            id: 'death-certificate'
        },
        {
            title: 'Property Tax Payment',
            description: 'Pay your property tax online with instant receipt',
            fee: 'Variable',
            id: 'property-tax'
        },
        {
            title: 'Trade License',
            description: 'Apply for new trade license or renew existing license',
            fee: '₹500',
            id: 'trade-license'
        },
        {
            title: 'Water Connection',
            description: 'Apply for new water connection or report issues',
            fee: '₹200',
            id: 'water-connection'
        },
        {
            title: 'Building Permit',
            description: 'Apply for building construction or renovation permits',
            fee: '₹1000',
            id: 'building-permit'
        }
    ];

    try {
        servicesGrid.innerHTML = services.map(service => `
            <div class="service-card">
                <h3 class="service-title">${service.title}</h3>
                <p class="service-description">${service.description}</p>
                <div class="service-footer">
                    <span class="service-fee">${service.fee}</span>
                    <button class="btn-apply" onclick="applyForServiceFallback('${service.id}')">Apply Now</button>
                </div>
            </div>
        `).join('');
        
        console.log('Services loaded successfully via fallback');
    } catch (error) {
        console.error('Error loading services via fallback:', error);
    }
}

// Fallback function for service applications
window.applyForServiceFallback = function(serviceId) {
    console.log('Applying for service via fallback:', serviceId);
    
    if (window.DOM && window.DOM.showMessage) {
        window.DOM.showMessage(`Starting application for ${serviceId}. Application form will open shortly.`, 'info');
    } else {
        alert(`Starting application for ${serviceId}. This would open the application form.`);
    }
};

// Debug function for services navigation
window.debugServicesNavigation = function() {
    console.log('=== Services Navigation Debug ===');
    console.log('User Dashboard:', window.userDashboard);
    console.log('Services Section:', document.getElementById('services-section'));
    console.log('Services Grid:', document.getElementById('services-grid'));
    console.log('Services Nav Item:', document.querySelector('[onclick*="showSection(\'services\')"'));
    console.log('Global showSection:', typeof window.showSection);
    
    // Test section visibility
    const servicesSection = document.getElementById('services-section');
    if (servicesSection) {
        console.log('Services section classes:', servicesSection.className);
        console.log('Services section hidden:', servicesSection.classList.contains('hidden'));
    }
    
    // Test navigation item
    const navItem = document.querySelector('[onclick*="showSection(\'services\')"');
    if (navItem) {
        console.log('Navigation item found:', navItem.textContent.trim());
        console.log('Navigation item onclick:', navItem.getAttribute('onclick'));
    }
    
    console.log('=== End Debug ===');
};

// Test function for services section (for debugging)
window.testServicesSection = function() {
    console.log('\n=== COMPREHENSIVE SERVICES SECTION TEST ===');
    
    // Step 1: Basic checks
    console.log('Step 1: Basic Environment Checks');
    console.log('  showSection function:', typeof window.showSection);
    console.log('  userDashboard instance:', !!window.userDashboard);
    console.log('  Firebase initialized:', window.firebaseInitialized);
    
    // Step 2: DOM element checks
    console.log('\nStep 2: DOM Element Checks');
    const servicesSection = document.getElementById('services-section');
    const servicesGrid = document.getElementById('services-grid');
    const navItem = document.querySelector('[onclick*="showSection(\'services\')"');
    
    console.log('  services-section element:', !!servicesSection);
    console.log('  services-grid element:', !!servicesGrid);
    console.log('  navigation item:', !!navItem);
    
    if (servicesSection) {
        console.log('  services-section classes:', servicesSection.className);
        console.log('  services-section display:', getComputedStyle(servicesSection).display);
        console.log('  services-section visibility:', getComputedStyle(servicesSection).visibility);
    }
    
    // Step 3: Test showSection function
    if (typeof window.showSection === 'function') {
        console.log('\nStep 3: Testing showSection Function');
        console.log('  Calling showSection("services")...');
        
        try {
            window.showSection('services');
            
            // Check after delay
            setTimeout(() => {
                if (servicesSection) {
                    const isVisible = getComputedStyle(servicesSection).display !== 'none';
                    const hasContent = servicesGrid && servicesGrid.innerHTML.trim() !== '';
                    
                    console.log('\n  🔍 POST-TEST VERIFICATION:');
                    console.log('    Section visible:', isVisible);
                    console.log('    Has content:', hasContent);
                    console.log('    Classes:', servicesSection.className);
                    console.log('    Display:', getComputedStyle(servicesSection).display);
                    
                    if (isVisible && hasContent) {
                        console.log('\n  ✅ SUCCESS: Services section is working correctly!');
                        
                        // Show success alert
                        if (window.DOM && window.DOM.showMessage) {
                            window.DOM.showMessage('✅ SUCCESS: Available Services section is now visible and working!', 'success');
                        } else {
                            alert('✅ SUCCESS: Available Services section is now visible and working!');
                        }
                    } else {
                        console.log('\n  ❌ FAILED: Applying emergency fixes...');
                        
                        // Emergency fixes
                        if (!isVisible) {
                            console.log('    Fixing visibility...');
                            servicesSection.className = 'dashboard-section';
                            servicesSection.style.cssText = 'display: block !important; visibility: visible !important;';
                        }
                        
                        if (!hasContent) {
                            console.log('    Loading services content...');
                            if (window.userDashboard && window.userDashboard.loadAvailableServices) {
                                window.userDashboard.loadAvailableServices();
                            } else {
                                loadAvailableServicesFallback();
                            }
                        }
                        
                        // Recheck after fixes
                        setTimeout(() => {
                            const finalVisible = getComputedStyle(servicesSection).display !== 'none';
                            const finalContent = servicesGrid && servicesGrid.innerHTML.trim() !== '';
                            
                            if (finalVisible && finalContent) {
                                console.log('\n  ✅ FIXED: Emergency repairs successful!');
                                if (window.DOM && window.DOM.showMessage) {
                                    window.DOM.showMessage('🔧 FIXED: Services section repaired successfully!', 'success');
                                } else {
                                    alert('🔧 FIXED: Services section repaired successfully!');
                                }
                            } else {
                                console.log('\n  ❌ CRITICAL: Emergency repairs failed');
                                if (window.DOM && window.DOM.showMessage) {
                                    window.DOM.showMessage('❌ CRITICAL: Services section could not be repaired. Check console for details.', 'error');
                                } else {
                                    alert('❌ CRITICAL: Services section could not be repaired. Check console for details.');
                                }
                            }
                        }, 1000);
                    }
                } else {
                    console.log('\n  ❌ Services section element not found');
                    alert('❌ FAILED: Services section element not found.');
                }
            }, 1000);
            
        } catch (error) {
            console.error('\n  ❌ Error calling showSection:', error);
            alert('❌ ERROR: ' + error.message);
        }
    } else {
        console.log('\n  ❌ showSection function not found');
        alert('❌ ERROR: showSection function not available.');
    }
    
    // Step 4: Manual navigation test
    console.log('\nStep 4: Manual Navigation Test');
    if (navItem) {
        console.log('  Navigation item found, testing click...');
        
        // Simulate click
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        navItem.dispatchEvent(clickEvent);
        console.log('  Click event dispatched');
    } else {
        console.log('  Navigation item not found');
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
};

// Quick fix function for services section
window.quickFixServices = function() {
    console.log('\n🔧 QUICK FIX SERVICES ACTIVATED');
    
    const servicesSection = document.getElementById('services-section');
    const servicesGrid = document.getElementById('services-grid');
    
    if (!servicesSection) {
        console.error('Services section not found!');
        alert('❌ Services section not found!');
        return;
    }
    
    console.log('Step 1: Force showing services section...');
    
    // Hide all other sections first
    ['overview', 'applications', 'profile', 'support'].forEach(section => {
        const element = document.getElementById(section + '-section');
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('active');
            element.style.display = 'none';
        }
    });
    
    // Force show services section with maximum override
    servicesSection.className = 'dashboard-section';
    servicesSection.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
    
    console.log('Step 2: Updating navigation...');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const servicesNav = document.querySelector('[onclick*="showSection(\'services\')"]');
    if (servicesNav) {
        servicesNav.classList.add('active');
    }
    
    console.log('Step 3: Loading services content...');
    
    // Load services content with multiple attempts
    if (window.userDashboard && window.userDashboard.loadAvailableServices) {
        window.userDashboard.loadAvailableServices();
    }
    
    // Also try fallback
    if (typeof loadAvailableServicesFallback === 'function') {
        loadAvailableServicesFallback();
    }
    
    // Direct content insertion as backup
    if (servicesGrid && servicesGrid.innerHTML.trim() === '') {
        servicesGrid.innerHTML = `
            <div class="service-card">
                <h3 class="service-title">Birth Certificate</h3>
                <p class="service-description">Apply for official birth certificate with digital verification</p>
                <div class="service-footer">
                    <span class="service-fee">₹50</span>
                    <button class="btn-apply" onclick="alert('Service application would open here')">Apply Now</button>
                </div>
            </div>
            <div class="service-card">
                <h3 class="service-title">Death Certificate</h3>
                <p class="service-description">Apply for official death certificate documentation</p>
                <div class="service-footer">
                    <span class="service-fee">₹50</span>
                    <button class="btn-apply" onclick="alert('Service application would open here')">Apply Now</button>
                </div>
            </div>
            <div class="service-card">
                <h3 class="service-title">Property Tax Payment</h3>
                <p class="service-description">Pay your property tax online with instant receipt</p>
                <div class="service-footer">
                    <span class="service-fee">Variable</span>
                    <button class="btn-apply" onclick="alert('Service application would open here')">Apply Now</button>
                </div>
            </div>
            <div class="service-card">
                <h3 class="service-title">Trade License</h3>
                <p class="service-description">Apply for new trade license or renew existing license</p>
                <div class="service-footer">
                    <span class="service-fee">₹500</span>
                    <button class="btn-apply" onclick="alert('Service application would open here')">Apply Now</button>
                </div>
            </div>
        `;
    }
    
    console.log('Step 4: Final verification...');
    
    // Final verification
    setTimeout(() => {
        const isVisible = getComputedStyle(servicesSection).display !== 'none';
        const hasContent = servicesGrid && servicesGrid.innerHTML.trim() !== '';
        
        if (isVisible && hasContent) {
            console.log('✅ QUICK FIX SUCCESSFUL!');
            
            if (window.DOM && window.DOM.showMessage) {
                window.DOM.showMessage('✅ Services section fixed and displayed successfully!', 'success');
            } else {
                alert('✅ SUCCESS: Services section is now visible and working!');
            }
        } else {
            console.log('❌ QUICK FIX FAILED');
            console.log('  Visible:', isVisible);
            console.log('  Has content:', hasContent);
            
            if (window.DOM && window.DOM.showMessage) {
                window.DOM.showMessage('❌ Quick fix failed. Check console for details.', 'error');
            } else {
                alert('❌ Quick fix failed. Check console for details.');
            }
        }
    }, 500);
    
    console.log('🔧 QUICK FIX COMPLETE\n');
};

// Force show services section (for debugging)
window.forceShowServices = function() {
    console.log('Force showing services section...');
    if (window.userDashboard) {
        window.userDashboard.showSection('services');
    } else {
        // Manual show
        showSectionFallback('services');
    }
};

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDashboard;
}