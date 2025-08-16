// Staff Module for Digital E Gram Panchayat

class StaffManager {
    constructor() {
        this.staffProfile = null;
        this.staffStats = null;
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            window.logger.info('Staff manager initialized');
        } catch (error) {
            window.logger.error('Failed to initialize staff manager', error);
        }
    }

    async loadStaffProfile() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            this.staffProfile = await window.dbManager.getUserProfile(user.uid);
            
            window.logger.info('Staff profile loaded successfully', { userId: user.uid });
        } catch (error) {
            window.logger.error('Failed to load staff profile', error);
            this.showError('Failed to load profile. Please try again later.');
        }
    }

    async loadStaffStats() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            // Get staff-specific stats
            const pendingApplications = await window.dbManager.getApplications({ status: 'pending' });
            const processingApplications = await window.dbManager.getApplications({ status: 'processing' });
            
            // Get today's processed applications
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayApplications = await window.dbManager.getApplications();
            const processedToday = todayApplications.filter(app => 
                app.status === 'approved' || app.status === 'rejected'
            ).filter(app => {
                const appDate = new Date(app.updatedAt);
                return appDate >= today;
            }).length;

            this.staffStats = {
                pendingApplications: pendingApplications.length,
                processingApplications: processingApplications.length,
                processedToday: processedToday
            };

            this.updateStaffDashboardStats();
            
            window.logger.info('Staff stats loaded successfully', { userId: user.uid });
        } catch (error) {
            window.logger.error('Failed to load staff stats', error);
        }
    }

    updateStaffDashboardStats() {
        if (!this.staffStats) return;

        const stats = {
            'staff-pending-applications': this.staffStats.pendingApplications,
            'staff-processed-today': this.staffStats.processedToday
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        window.logger.info('Staff dashboard stats updated', this.staffStats);
    }

    async handleStaffDashboardNavigation(section) {
        try {
            switch (section) {
                case 'staff-overview':
                    await this.loadStaffStats();
                    break;
                case 'staff-applications':
                    await window.applicationsManager.loadStaffApplications();
                    break;
                case 'staff-services':
                    await window.servicesManager.loadServices();
                    break;
                default:
                    window.logger.warn('Unknown staff dashboard section', { section });
            }
        } catch (error) {
            window.logger.error('Failed to handle staff dashboard navigation', error);
        }
    }

    setupStaffDashboardNavigation() {
        const navItems = document.querySelectorAll('#staff-dashboard .dashboard-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Hide all sections
                const sections = document.querySelectorAll('#staff-dashboard .dashboard-section');
                sections.forEach(section => section.classList.remove('active'));
                
                // Show target section
                const targetSection = item.getAttribute('data-section');
                const section = document.getElementById(targetSection + '-section');
                if (section) {
                    section.classList.add('active');
                }
                
                // Handle section-specific logic
                this.handleStaffDashboardNavigation(targetSection);
            });
        });
    }

    async processApplication(applicationId, action, remarks = '') {
        try {
            let newStatus;
            let message;

            switch (action) {
                case 'start':
                    newStatus = 'processing';
                    message = 'Application processing started';
                    break;
                case 'approve':
                    newStatus = 'approved';
                    message = 'Application approved successfully';
                    break;
                case 'reject':
                    newStatus = 'rejected';
                    message = 'Application rejected';
                    break;
                default:
                    throw new Error('Invalid action');
            }

            await window.dbManager.updateApplicationStatus(applicationId, newStatus, remarks);
            
            // Update local applications
            const application = window.applicationsManager.applications.find(app => app.id === applicationId);
            if (application) {
                application.status = newStatus;
                application.remarks = remarks;
                application.updatedAt = new Date();
            }

            // Re-render applications
            window.applicationsManager.renderStaffApplications();
            
            // Update stats
            await this.loadStaffStats();

            window.DOM.showMessage(message, 'success');
            window.logger.success('Application processed', { applicationId, action, newStatus });

        } catch (error) {
            window.logger.error('Failed to process application', error);
            this.showError(error.message);
        }
    }

    async batchProcessApplications(applicationIds, action, remarks = '') {
        try {
            let newStatus;
            let message;

            switch (action) {
                case 'approve':
                    newStatus = 'approved';
                    message = 'Applications approved successfully';
                    break;
                case 'reject':
                    newStatus = 'rejected';
                    message = 'Applications rejected';
                    break;
                default:
                    throw new Error('Invalid action');
            }

            await window.dbManager.batchUpdateApplications(applicationIds, {
                status: newStatus,
                remarks: remarks
            });

            // Update local applications
            applicationIds.forEach(id => {
                const application = window.applicationsManager.applications.find(app => app.id === id);
                if (application) {
                    application.status = newStatus;
                    application.remarks = remarks;
                    application.updatedAt = new Date();
                }
            });

            // Re-render applications
            window.applicationsManager.renderStaffApplications();
            
            // Update stats
            await this.loadStaffStats();

            window.DOM.showMessage(message, 'success');
            window.logger.success('Applications batch processed', { count: applicationIds.length, action });

        } catch (error) {
            window.logger.error('Failed to batch process applications', error);
            this.showError(error.message);
        }
    }

    async addApplicationRemarks(applicationId, remarks) {
        try {
            const application = window.applicationsManager.applications.find(app => app.id === applicationId);
            if (!application) {
                throw new Error('Application not found');
            }

            await window.dbManager.updateApplicationStatus(applicationId, application.status, remarks);
            
            // Update local application
            application.remarks = remarks;
            application.updatedAt = new Date();

            // Re-render applications
            window.applicationsManager.renderStaffApplications();

            window.DOM.showMessage('Remarks added successfully', 'success');
            window.logger.success('Application remarks added', { applicationId });

        } catch (error) {
            window.logger.error('Failed to add application remarks', error);
            this.showError(error.message);
        }
    }

    async generateProcessingReport() {
        try {
            const applications = await window.dbManager.getApplications();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const report = {
                totalApplications: applications.length,
                pendingApplications: applications.filter(app => app.status === 'pending').length,
                processingApplications: applications.filter(app => app.status === 'processing').length,
                approvedApplications: applications.filter(app => app.status === 'approved').length,
                rejectedApplications: applications.filter(app => app.status === 'rejected').length,
                processedToday: applications.filter(app => {
                    if (app.status !== 'approved' && app.status !== 'rejected') return false;
                    const appDate = new Date(app.updatedAt);
                    return appDate >= today;
                }).length,
                generatedAt: new Date().toISOString(),
                generatedBy: window.authManager.getCurrentUser()?.email || 'Staff'
            };

            // Create downloadable report
            const reportStr = JSON.stringify(report, null, 2);
            const reportBlob = new Blob([reportStr], { type: 'application/json' });
            const url = URL.createObjectURL(reportBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `processing-report-${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);

            window.DOM.showMessage('Processing report generated successfully!', 'success');
            window.logger.success('Processing report generated', report);

        } catch (error) {
            window.logger.error('Failed to generate processing report', error);
            this.showError('Failed to generate report. Please try again.');
        }
    }

    setupEventListeners() {
        // Staff dashboard navigation
        this.setupStaffDashboardNavigation();

        // Real-time updates for staff
        this.setupRealTimeUpdates();

        // Application processing shortcuts
        this.setupProcessingShortcuts();
    }

    setupRealTimeUpdates() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

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
            window.applicationsManager.renderStaffApplications();
            
            // Update staff stats
            this.loadStaffStats();
            
            window.logger.info('Staff applications updated in real-time', { count: applications.length });
        });
    }

    setupProcessingShortcuts() {
        // Add keyboard shortcuts for processing
        document.addEventListener('keydown', (e) => {
            // Only activate shortcuts when staff dashboard is visible
            const staffDashboard = document.getElementById('staff-dashboard');
            if (!staffDashboard || staffDashboard.classList.contains('hidden')) return;

            // Ctrl/Cmd + A to approve selected applications
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.approveSelectedApplications();
            }

            // Ctrl/Cmd + R to reject selected applications
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.rejectSelectedApplications();
            }

            // Ctrl/Cmd + S to start processing selected applications
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.startProcessingSelectedApplications();
            }
        });
    }

    async approveSelectedApplications() {
        const selectedApplications = this.getSelectedApplications();
        if (selectedApplications.length === 0) {
            window.DOM.showMessage('No applications selected', 'warning');
            return;
        }

        const remarks = prompt('Enter approval remarks (optional):');
        await this.batchProcessApplications(selectedApplications, 'approve', remarks);
    }

    async rejectSelectedApplications() {
        const selectedApplications = this.getSelectedApplications();
        if (selectedApplications.length === 0) {
            window.DOM.showMessage('No applications selected', 'warning');
            return;
        }

        const remarks = prompt('Enter rejection remarks (optional):');
        await this.batchProcessApplications(selectedApplications, 'reject', remarks);
    }

    async startProcessingSelectedApplications() {
        const selectedApplications = this.getSelectedApplications();
        if (selectedApplications.length === 0) {
            window.DOM.showMessage('No applications selected', 'warning');
            return;
        }

        for (const applicationId of selectedApplications) {
            await this.processApplication(applicationId, 'start');
        }
    }

    getSelectedApplications() {
        const checkboxes = document.querySelectorAll('#staff-applications-list input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    showError(message) {
        window.DOM.showMessage(message, 'error');
    }

    // Staff dashboard initialization
    async initializeStaffDashboard() {
        try {
            await this.loadStaffProfile();
            await this.loadStaffStats();
            await window.servicesManager.loadServices();
            await window.applicationsManager.loadStaffApplications();
            
            window.logger.info('Staff dashboard initialized successfully');
        } catch (error) {
            window.logger.error('Failed to initialize staff dashboard', error);
        }
    }
}

// Initialize Staff Manager
window.staffManager = new StaffManager();

// Global staff functions
window.generateProcessingReport = function() {
    window.staffManager.generateProcessingReport();
};

// Log staff module initialization
window.logger.info('Staff module initialized'); 