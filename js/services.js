// Services Module for Digital E Gram Panchayat

class ServicesManager {
    constructor() {
        this.services = [];
        this.currentService = null;
        this.dummyServices = this.getDummyServices();
        this.init();
    }

    getDummyServices() {
        return [
            {
                id: 'birth-certificate',
                name: 'Birth Certificate',
                description: 'Apply for official birth certificate with digital verification and quick processing.',
                category: 'certificate',
                fee: 50,
                requirements: 'Hospital birth record, Parent ID proof, Address proof',
                isActive: true,
                createdAt: new Date('2024-01-01')
            },
            {
                id: 'death-certificate',
                name: 'Death Certificate',
                description: 'Apply for official death certificate for legal and administrative purposes.',
                category: 'certificate',
                fee: 50,
                requirements: 'Medical certificate, ID proof of deceased, Applicant ID proof',
                isActive: true,
                createdAt: new Date('2024-01-01')
            },
            {
                id: 'property-tax',
                name: 'Property Tax Payment',
                description: 'Pay your property tax online with instant receipt and payment history tracking.',
                category: 'payment',
                fee: 0,
                requirements: 'Property documents, Previous tax receipts',
                isActive: true,
                createdAt: new Date('2024-01-01')
            },
            {
                id: 'trade-license',
                name: 'Trade License',
                description: 'Apply for new trade license or renew existing license for your business.',
                category: 'license',
                fee: 500,
                requirements: 'Business registration, Shop/office address proof, ID proof',
                isActive: true,
                createdAt: new Date('2024-01-01')
            },
            {
                id: 'water-connection',
                name: 'Water Connection',
                description: 'Apply for new water connection or report issues with existing connection.',
                category: 'utility',
                fee: 200,
                requirements: 'Property ownership proof, Address proof, ID proof',
                isActive: true,
                createdAt: new Date('2024-01-01')
            },
            {
                id: 'building-permit',
                name: 'Building Permit',
                description: 'Apply for construction or renovation permits for residential and commercial buildings.',
                category: 'permit',
                fee: 1000,
                requirements: 'Building plans, Land ownership documents, NOC from neighbors',
                isActive: true,
                createdAt: new Date('2024-01-01')
            },
            {
                id: 'income-certificate',
                name: 'Income Certificate',
                description: 'Apply for income certificate for various government schemes and applications.',
                category: 'certificate',
                fee: 30,
                requirements: 'Salary slips, Bank statements, Employment certificate',
                isActive: true,
                createdAt: new Date('2024-01-01')
            },
            {
                id: 'caste-certificate',
                name: 'Caste Certificate',
                description: 'Apply for caste certificate for reservation benefits and government schemes.',
                category: 'certificate',
                fee: 30,
                requirements: 'Family tree documents, Previous caste certificates, ID proof',
                isActive: true,
                createdAt: new Date('2024-01-01')
            }
        ];
    }

    async init() {
        try {
            await this.loadServices();
            this.setupEventListeners();
            window.logger.info('Services manager initialized');
        } catch (error) {
            window.logger.error('Failed to initialize services manager', error);
        }
    }

    async loadServices() {
        try {
            // Try to load from database first
            if (window.dbManager && typeof window.dbManager.getServices === 'function') {
                this.services = await window.dbManager.getServices({ isActive: true });
            } else {
                this.services = [];
            }

            // If no services from database, use dummy data
            if (this.services.length === 0) {
                this.services = this.dummyServices;
                window.logger.info('Using dummy services data', { count: this.services.length });
            } else {
                window.logger.info('Services loaded from database', { count: this.services.length });
            }

            this.renderServices();
        } catch (error) {
            window.logger.error('Failed to load services from database, using dummy data', error);
            // Fallback to dummy data
            this.services = this.dummyServices;
            this.renderServices();
        }
    }

    renderServices(services = this.services) {
        const containers = [
            'services-grid',
            'user-services-list',
            'staff-services-list'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (services.length === 0) {
                container.innerHTML = this.getEmptyStateHTML();
                return;
            }

            container.innerHTML = services.map(service => this.getServiceCardHTML(service)).join('');
        });
    }

    getServiceCardHTML(service) {
        const categoryClass = this.getCategoryClass(service.category);
        const feeDisplay = service.fee ? `₹${service.fee}` : 'Free';
        const serviceImage = this.getServiceImage(service.id);

        return `
            <div class="service-card" data-service-id="${service.id}" style="max-width:340px; margin:24px auto; box-shadow:0 2px 12px rgba(0,0,0,0.08); border-radius:16px; overflow:hidden; background:#fff;">
                <img src="${serviceImage}" alt="${service.name}" style="width:100%; height:180px; object-fit:cover;">
                <div style="padding:20px;">
                    <h3 style="margin-bottom:8px; color:#2563eb;">${service.name}</h3>
                    <p style="color:#444; margin-bottom:12px;">${service.description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <span class="service-category ${categoryClass}">${service.category}</span>
                        <span class="service-fee">${feeDisplay}</span>
                    </div>
                    ${this.getServiceActionsHTML(service)}
                </div>
            </div>
        `;
    }

    getServiceImage(serviceId) {
        const imageMap = {
            'birth-certificate': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop',
            'death-certificate': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
            'property-tax': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
            'trade-license': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=200&fit=crop',
            'water-connection': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=200&fit=crop',
            'building-permit': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=200&fit=crop',
            'income-certificate': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=200&fit=crop',
            'caste-certificate': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=200&fit=crop'
        };
        return imageMap[serviceId] || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop';
    }

    getServiceActionsHTML(service) {
        // Default to showing apply button if authManager is not available
        const userRole = (window.authManager && typeof window.authManager.getUserRole === 'function')
            ? window.authManager.getUserRole()
            : 'guest';

        if (userRole === 'user' || userRole === 'guest') {
            return `
                <div class="service-actions">
                    <button class="btn btn-primary btn-small" onclick="servicesManager.applyForService('${service.id}')">
                        <i class="fas fa-edit"></i> Apply Now
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="servicesManager.viewServiceDetails('${service.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            `;
        } else if (userRole === 'admin') {
            return `
                <div class="service-actions">
                    <button class="btn btn-primary btn-small" onclick="servicesManager.editService('${service.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="servicesManager.deleteService('${service.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
        }

        return `
            <div class="service-actions">
                <button class="btn btn-primary btn-small" onclick="servicesManager.applyForService('${service.id}')">
                    <i class="fas fa-edit"></i> Apply Now
                </button>
                <button class="btn btn-secondary btn-small" onclick="servicesManager.viewServiceDetails('${service.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        `;
    }

    getCategoryClass(category) {
        const categoryMap = {
            'certificate': 'bg-primary',
            'license': 'bg-success',
            'permit': 'bg-warning',
            'document': 'bg-info',
            'other': 'bg-secondary'
        };
        return categoryMap[category] || 'bg-secondary';
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state" id="no-services-message" style="text-align: center; padding: 40px 0; color: #888;">
                <i class="fas fa-info-circle" style="font-size: 2rem;"></i>
                <h3>No available services at the moment.</h3>
                <p>Please check back later.</p>
            </div>
        `;
    }

    async searchServices(query) {
        try {
            if (!query.trim()) {
                this.renderServices();
                return;
            }

            const results = await window.dbManager.searchServices(query);
            this.renderServices(results);
            
            window.logger.info('Services search completed', { query, results: results.length });
        } catch (error) {
            window.logger.error('Service search failed', error);
            this.showError('Search failed. Please try again.');
        }
    }

    async applyForService(serviceId) {
        try {
            const service = this.services.find(s => s.id === serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

            // Check if user is authenticated
            if (!window.authManager.isAuthenticated()) {
                window.DOM.showMessage('Please login to apply for services', 'warning');
                window.showLoginModal();
                return;
            }

            // Check for duplicate application
            const isDuplicate = await window.dbManager.checkDuplicateApplication(
                window.authManager.getCurrentUser().uid,
                serviceId
            );

            if (isDuplicate) {
                window.DOM.showMessage('You already have a pending application for this service', 'warning');
                return;
            }

            // Show application modal
            this.showApplicationModal(service);

        } catch (error) {
            window.logger.error('Failed to apply for service', error);
            this.showError(error.message);
        }
    }

    showApplicationModal(service) {
        // Populate service dropdown
        const serviceSelect = document.getElementById('application-service');
        if (serviceSelect) {
            serviceSelect.innerHTML = `<option value="${service.id}">${service.name}</option>`;
        }

        // Show modal
        window.DOM.showModal('application-modal');
        window.logger.info('Application modal opened', { serviceId: service.id });
    }

    async submitApplication(formData) {
        try {
            const user = window.authManager.getCurrentUser();
            const service = this.services.find(s => s.id === formData.serviceId);

            if (!service) {
                throw new Error('Service not found');
            }

            // Generate application number
            const applicationNumber = await window.dbManager.generateApplicationNumber();

            // Prepare application data
            const applicationData = {
                applicationNumber,
                userId: user.uid,
                userName: user.displayName || user.email,
                serviceId: formData.serviceId,
                serviceName: service.name,
                reason: formData.reason,
                documents: formData.documents || [],
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Create application
            await window.dbManager.createApplication(applicationData);

            // Close modal and show success message
            window.DOM.hideModal('application-modal');
            window.DOM.showMessage('Application submitted successfully!', 'success');

            // Reset form
            const form = document.getElementById('application-form');
            if (form) form.reset();

            window.logger.success('Application submitted successfully', { 
                applicationNumber, 
                serviceId: formData.serviceId 
            });

        } catch (error) {
            window.logger.error('Failed to submit application', error);
            this.showError(error.message);
        }
    }

    async editService(serviceId) {
        try {
            const service = await window.dbManager.getServiceById(serviceId);
            this.currentService = service;
            
            // Populate form fields
            document.getElementById('service-name').value = service.name;
            document.getElementById('service-description').value = service.description;
            document.getElementById('service-category').value = service.category;
            document.getElementById('service-requirements').value = service.requirements || '';
            document.getElementById('service-fee').value = service.fee || '';

            // Show modal
            window.DOM.showModal('add-service-modal');
            
            // Update modal title
            const modalTitle = document.querySelector('#add-service-modal .modal-header h2');
            if (modalTitle) modalTitle.textContent = 'Edit Service';

            window.logger.info('Edit service modal opened', { serviceId });

        } catch (error) {
            window.logger.error('Failed to edit service', error);
            this.showError(error.message);
        }
    }

    async deleteService(serviceId) {
        try {
            const confirmed = confirm('Are you sure you want to delete this service? This action cannot be undone.');
            if (!confirmed) return;

            await window.dbManager.deleteService(serviceId);
            
            // Remove from local array
            this.services = this.services.filter(s => s.id !== serviceId);
            this.renderServices();

            window.DOM.showMessage('Service deleted successfully', 'success');
            window.logger.success('Service deleted successfully', { serviceId });

        } catch (error) {
            window.logger.error('Failed to delete service', error);
            this.showError(error.message);
        }
    }

    async createService(formData) {
        try {
            const serviceData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                requirements: formData.requirements,
                fee: parseFloat(formData.fee) || 0,
                isActive: true
            };

            await window.dbManager.createService(serviceData);
            
            // Reload services
            await this.loadServices();

            // Close modal and show success message
            window.DOM.hideModal('add-service-modal');
            window.DOM.showMessage('Service created successfully!', 'success');

            // Reset form
            const form = document.getElementById('add-service-form');
            if (form) form.reset();

            window.logger.success('Service created successfully', serviceData);

        } catch (error) {
            window.logger.error('Failed to create service', error);
            this.showError(error.message);
        }
    }

    async updateService(formData) {
        try {
            if (!this.currentService) {
                throw new Error('No service selected for editing');
            }

            const updateData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                requirements: formData.requirements,
                fee: parseFloat(formData.fee) || 0
            };

            await window.dbManager.updateService(this.currentService.id, updateData);
            
            // Reload services
            await this.loadServices();

            // Close modal and show success message
            window.DOM.hideModal('add-service-modal');
            window.DOM.showMessage('Service updated successfully!', 'success');

            // Reset current service
            this.currentService = null;

            window.logger.success('Service updated successfully', { 
                serviceId: this.currentService.id, 
                updateData 
            });

        } catch (error) {
            window.logger.error('Failed to update service', error);
            this.showError(error.message);
        }
    }

    viewServiceDetails(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) {
            this.showError('Service not found');
            return;
        }

        // Create and show details modal
        const detailsHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${service.name}</h2>
                    <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>
                <div class="service-details" style="padding: 30px;">
                    <div class="detail-item">
                        <strong>Description:</strong>
                        <p>${service.description}</p>
                    </div>
                    <div class="detail-item">
                        <strong>Category:</strong>
                        <span class="service-category ${this.getCategoryClass(service.category)}">${service.category}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Processing Fee:</strong>
                        <span>${service.fee ? `₹${service.fee}` : 'Free'}</span>
                    </div>
                    ${service.requirements ? `
                        <div class="detail-item">
                            <strong>Requirements:</strong>
                            <p>${service.requirements}</p>
                        </div>
                    ` : ''}
                    <div class="detail-item">
                        <strong>Created:</strong>
                        <span>${window.DateTime.formatDate(service.createdAt)}</span>
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

        window.logger.info('Service details viewed', { serviceId });
    }

    showAddServiceModal() {
        // Reset form
        const form = document.getElementById('add-service-form');
        if (form) form.reset();

        // Reset modal title
        const modalTitle = document.querySelector('#add-service-modal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Add New Service';

        // Reset current service
        this.currentService = null;

        // Show modal
        window.DOM.showModal('add-service-modal');
        window.logger.info('Add service modal opened');
    }

    showError(message) {
        window.DOM.showMessage(message, 'error');
    }

    setupEventListeners() {
        // Service form submission
        const serviceForm = document.getElementById('add-service-form');
        if (serviceForm) {
            serviceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    name: document.getElementById('service-name').value,
                    description: document.getElementById('service-description').value,
                    category: document.getElementById('service-category').value,
                    requirements: document.getElementById('service-requirements').value,
                    fee: document.getElementById('service-fee').value
                };

                try {
                    window.DOM.setLoading(serviceForm, true);
                    
                    if (this.currentService) {
                        await this.updateService(formData);
                    } else {
                        await this.createService(formData);
                    }
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    window.DOM.setLoading(serviceForm, false);
                }
            });
        }

        // Application form submission
        const applicationForm = document.getElementById('application-form');
        if (applicationForm) {
            applicationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    serviceId: document.getElementById('application-service').value,
                    reason: document.getElementById('application-reason').value,
                    documents: [] // Handle file uploads if needed
                };

                try {
                    window.DOM.setLoading(applicationForm, true);
                    await this.submitApplication(formData);
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    window.DOM.setLoading(applicationForm, false);
                }
            });
        }

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchServices(e.target.value);
                }, 300);
            });
        }
    }
}

// Initialize Services Manager
window.servicesManager = new ServicesManager();

// Global functions
window.showAddServiceModal = function() {
    window.servicesManager.showAddServiceModal();
};

window.scrollToServices = function() {
    window.DOM.scrollTo('services', 70);
};

// Log services module initialization
window.logger.info('Services module initialized'); 