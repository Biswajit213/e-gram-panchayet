// Applications Module for Digital E Gram Panchayat

class ApplicationsManager {
    constructor() {
        this.applications = [];
        this.currentApplication = null;
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            window.logger.info('Applications manager initialized');
        } catch (error) {
            window.logger.error('Failed to initialize applications manager', error);
        }
    }

    async loadUserApplications() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            this.applications = await window.dbManager.getApplications({ userId: user.uid });
            this.renderUserApplications();
            this.updateUserStats();
            
            window.logger.info('User applications loaded successfully', { count: this.applications.length });
        } catch (error) {
            window.logger.error('Failed to load user applications', error);
            this.showError('Failed to load applications. Please try again later.');
        }
    }

    async loadAllApplications() {
        try {
            this.applications = await window.dbManager.getApplications();
            this.renderAllApplications();
            
            window.logger.info('All applications loaded successfully', { count: this.applications.length });
        } catch (error) {
            window.logger.error('Failed to load all applications', error);
            this.showError('Failed to load applications. Please try again later.');
        }
    }

    async loadStaffApplications() {
        try {
            // Staff can see applications that are pending or processing
            this.applications = await window.dbManager.getApplications({
                status: ['pending', 'processing']
            });
            this.renderStaffApplications();
            
            window.logger.info('Staff applications loaded successfully', { count: this.applications.length });
        } catch (error) {
            window.logger.error('Failed to load staff applications', error);
            this.showError('Failed to load applications. Please try again later.');
        }
    }

    renderUserApplications() {
        const container = document.getElementById('user-applications-list');
        if (!container) return;

        if (this.applications.length === 0) {
            container.innerHTML = this.getEmptyApplicationsHTML();
            return;
        }

        container.innerHTML = this.applications.map(app => this.getApplicationCardHTML(app, 'user')).join('');
    }

    renderAllApplications() {
        const container = document.getElementById('admin-applications-list');
        if (!container) return;

        if (this.applications.length === 0) {
            container.innerHTML = this.getEmptyApplicationsHTML();
            return;
        }

        container.innerHTML = this.applications.map(app => this.getApplicationCardHTML(app, 'admin')).join('');
    }

    renderStaffApplications() {
        const container = document.getElementById('staff-applications-list');
        if (!container) return;

        if (this.applications.length === 0) {
            container.innerHTML = this.getEmptyApplicationsHTML();
            return;
        }

        container.innerHTML = this.applications.map(app => this.getApplicationCardHTML(app, 'staff')).join('');
    }

    getApplicationCardHTML(application, viewType) {
        const statusClass = this.getStatusClass(application.status);
        const statusText = this.getStatusText(application.status);
        const createdAt = window.DateTime.formatDateTime(application.createdAt);
        
        return `
            <div class="application-item" data-application-id="${application.id}">
                <div class="application-header">
                    <div class="application-title">
                        <h4>${application.serviceName}</h4>
                        <p class="application-number">${application.applicationNumber}</p>
                    </div>
                    <span class="application-status ${statusClass}">${statusText}</span>
                </div>
                <div class="application-details">
                    <p><strong>Reason:</strong> ${application.reason}</p>
                    <p><strong>Submitted:</strong> ${createdAt}</p>
                    ${application.remarks ? `<p><strong>Remarks:</strong> ${application.remarks}</p>` : ''}
                </div>
                ${this.getApplicationActionsHTML(application, viewType)}
            </div>
        `;
    }

    getApplicationActionsHTML(application, viewType) {
        const actions = [];

        if (viewType === 'user') {
            if (application.status === 'pending') {
                actions.push(`
                    <button class="btn btn-warning btn-small" onclick="applicationsManager.cancelApplication('${application.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                `);
            }
            actions.push(`
                <button class="btn btn-secondary btn-small" onclick="applicationsManager.viewApplicationDetails('${application.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            `);
        } else if (viewType === 'staff') {
            if (application.status === 'pending') {
                actions.push(`
                    <button class="btn btn-success btn-small" onclick="applicationsManager.updateApplicationStatus('${application.id}', 'processing')">
                        <i class="fas fa-play"></i> Start Processing
                    </button>
                `);
            } else if (application.status === 'processing') {
                actions.push(`
                    <button class="btn btn-success btn-small" onclick="applicationsManager.updateApplicationStatus('${application.id}', 'approved')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-small" onclick="applicationsManager.updateApplicationStatus('${application.id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                `);
            }
        } else if (viewType === 'admin') {
            actions.push(`
                <button class="btn btn-primary btn-small" onclick="applicationsManager.editApplication('${application.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-secondary btn-small" onclick="applicationsManager.viewApplicationDetails('${application.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            `);
        }

        return actions.length > 0 ? `<div class="application-actions">${actions.join('')}</div>` : '';
    }

    getStatusClass(status) {
        const statusMap = {
            'pending': 'pending',
            'processing': 'processing',
            'approved': 'approved',
            'rejected': 'rejected'
        };
        return statusMap[status] || 'pending';
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'processing': 'Processing',
            'approved': 'Approved',
            'rejected': 'Rejected'
        };
        return statusMap[status] || 'Pending';
    }

    getEmptyApplicationsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No Applications Found</h3>
                <p>You haven't submitted any applications yet.</p>
            </div>
        `;
    }

    async updateApplicationStatus(applicationId, newStatus, remarks = '') {
        try {
            await window.dbManager.updateApplicationStatus(applicationId, newStatus, remarks);
            
            // Update local application
            const application = this.applications.find(app => app.id === applicationId);
            if (application) {
                application.status = newStatus;
                application.remarks = remarks;
                application.updatedAt = new Date();
            }

            // Re-render applications
            const userRole = window.authManager.getUserRole();
            if (userRole === 'user') {
                this.renderUserApplications();
            } else if (userRole === 'staff') {
                this.renderStaffApplications();
            } else if (userRole === 'admin') {
                this.renderAllApplications();
            }

            window.DOM.showMessage(`Application ${newStatus} successfully`, 'success');
            window.logger.success('Application status updated', { applicationId, newStatus });

        } catch (error) {
            window.logger.error('Failed to update application status', error);
            this.showError(error.message);
        }
    }

    async cancelApplication(applicationId) {
        try {
            const confirmed = confirm('Are you sure you want to cancel this application?');
            if (!confirmed) return;

            await window.dbManager.updateApplicationStatus(applicationId, 'cancelled', 'Cancelled by user');
            
            // Remove from local array
            this.applications = this.applications.filter(app => app.id !== applicationId);
            this.renderUserApplications();
            this.updateUserStats();

            window.DOM.showMessage('Application cancelled successfully', 'success');
            window.logger.success('Application cancelled', { applicationId });

        } catch (error) {
            window.logger.error('Failed to cancel application', error);
            this.showError(error.message);
        }
    }

    async editApplication(applicationId) {
        try {
            const application = await window.dbManager.getApplicationById(applicationId);
            this.currentApplication = application;
            
            // Show edit modal (implement as needed)
            this.showEditApplicationModal(application);

        } catch (error) {
            window.logger.error('Failed to edit application', error);
            this.showError(error.message);
        }
    }

    showEditApplicationModal(application) {
        // Create and show edit modal
        const modalHTML = `
            <div class="modal" id="edit-application-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Application</h2>
                        <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    </div>
                    <form id="edit-application-form" class="application-form">
                        <div class="form-group">
                            <label>Application Number</label>
                            <input type="text" value="${application.applicationNumber}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Service</label>
                            <input type="text" value="${application.serviceName}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="edit-status" required>
                                <option value="pending" ${application.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="processing" ${application.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="approved" ${application.status === 'approved' ? 'selected' : ''}>Approved</option>
                                <option value="rejected" ${application.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Remarks</label>
                            <textarea id="edit-remarks">${application.remarks || ''}</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Update Application</button>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('edit-application-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        window.DOM.showModal('edit-application-modal');

        // Setup form submission
        const form = document.getElementById('edit-application-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const newStatus = document.getElementById('edit-status').value;
                const remarks = document.getElementById('edit-remarks').value;

                try {
                    await this.updateApplicationStatus(application.id, newStatus, remarks);
                    window.DOM.hideModal('edit-application-modal');
                } catch (error) {
                    this.showError(error.message);
                }
            });
        }

        window.logger.info('Edit application modal opened', { applicationId: application.id });
    }

    viewApplicationDetails(applicationId) {
        const application = this.applications.find(app => app.id === applicationId);
        if (!application) {
            this.showError('Application not found');
            return;
        }

        // Create and show details modal
        const detailsHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Application Details</h2>
                    <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>
                <div class="application-details-modal" style="padding: 30px;">
                    <div class="detail-item">
                        <strong>Application Number:</strong>
                        <span>${application.applicationNumber}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Service:</strong>
                        <span>${application.serviceName}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong>
                        <span class="application-status ${this.getStatusClass(application.status)}">${this.getStatusText(application.status)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Reason:</strong>
                        <p>${application.reason}</p>
                    </div>
                    ${application.remarks ? `
                        <div class="detail-item">
                            <strong>Remarks:</strong>
                            <p>${application.remarks}</p>
                        </div>
                    ` : ''}
                    <div class="detail-item">
                        <strong>Submitted:</strong>
                        <span>${window.DateTime.formatDateTime(application.createdAt)}</span>
                    </div>
                    ${application.updatedAt ? `
                        <div class="detail-item">
                            <strong>Last Updated:</strong>
                            <span>${window.DateTime.formatDateTime(application.updatedAt)}</span>
                        </div>
                    ` : ''}
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

        window.logger.info('Application details viewed', { applicationId });
    }

    updateUserStats() {
        if (!window.authManager.isAuthenticated()) return;

        const stats = {
            total: this.applications.length,
            pending: this.applications.filter(app => app.status === 'pending').length,
            approved: this.applications.filter(app => app.status === 'approved').length,
            rejected: this.applications.filter(app => app.status === 'rejected').length
        };

        // Update stats display
        const elements = {
            'total-applications': stats.total,
            'pending-applications': stats.pending,
            'approved-applications': stats.approved,
            'rejected-applications': stats.rejected
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        window.logger.info('User stats updated', stats);
    }

    async searchApplications(query) {
        try {
            const user = window.authManager.getCurrentUser();
            const results = await window.dbManager.searchApplications(query, user?.uid);
            
            // Update applications array with search results
            this.applications = results;
            
            // Re-render based on user role
            const userRole = window.authManager.getUserRole();
            if (userRole === 'user') {
                this.renderUserApplications();
            } else if (userRole === 'staff') {
                this.renderStaffApplications();
            } else if (userRole === 'admin') {
                this.renderAllApplications();
            }

            window.logger.info('Applications search completed', { query, results: results.length });
        } catch (error) {
            window.logger.error('Application search failed', error);
            this.showError('Search failed. Please try again.');
        }
    }

    showError(message) {
        window.DOM.showMessage(message, 'error');
    }

    setupEventListeners() {
        // Dashboard navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]')) {
                const section = e.target.getAttribute('data-section');
                this.handleSectionChange(section);
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchApplications(e.target.value);
                }, 300);
            });
        }
    }

    async handleSectionChange(section) {
        try {
            const userRole = window.authManager.getUserRole();
            
            if (section === 'applications' && userRole === 'user') {
                await this.loadUserApplications();
            } else if (section === 'staff-applications' && userRole === 'staff') {
                await this.loadStaffApplications();
            } else if (section === 'admin-applications' && userRole === 'admin') {
                await this.loadAllApplications();
            }
        } catch (error) {
            window.logger.error('Failed to handle section change', error);
        }
    }
}

// Initialize Applications Manager
window.applicationsManager = new ApplicationsManager();

// Log applications module initialization
window.logger.info('Applications module initialized'); 