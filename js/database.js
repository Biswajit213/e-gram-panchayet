// Database Module for Digital E Gram Panchayat

class DatabaseManager {
    constructor() {
        this.db = window.firebaseDB;
        this.storage = window.firebaseStorage;
    }

    // ==================== SERVICES ====================

    async createService(serviceData) {
        try {
            window.logger.info('Creating new service', serviceData);

            const serviceDoc = {
                ...serviceData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };

            const docRef = await this.db.collection('services').add(serviceDoc);
            
            window.logger.success('Service created successfully', { serviceId: docRef.id });
            return { success: true, serviceId: docRef.id };

        } catch (error) {
            window.logger.error('Failed to create service', error);
            throw error;
        }
    }

    async updateService(serviceId, updateData) {
        try {
            window.logger.info('Updating service', { serviceId, updateData });

            const updateDoc = {
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('services').doc(serviceId).update(updateDoc);
            
            window.logger.success('Service updated successfully', { serviceId });
            return { success: true };

        } catch (error) {
            window.logger.error('Failed to update service', error);
            throw error;
        }
    }

    async deleteService(serviceId) {
        try {
            window.logger.info('Deleting service', { serviceId });

            await this.db.collection('services').doc(serviceId).delete();
            
            window.logger.success('Service deleted successfully', { serviceId });
            return { success: true };

        } catch (error) {
            window.logger.error('Failed to delete service', error);
            throw error;
        }
    }

    async getServices(filters = {}) {
        try {
            let query = this.db.collection('services');

            // Apply filters
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.isActive !== undefined) {
                query = query.where('isActive', '==', filters.isActive);
            }

            const snapshot = await query.orderBy('createdAt', 'desc').get();
            const services = [];

            snapshot.forEach(doc => {
                services.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            window.logger.info('Services retrieved successfully', { count: services.length });
            return services;

        } catch (error) {
            window.logger.error('Failed to get services', error);
            throw error;
        }
    }

    async getServiceById(serviceId) {
        try {
            const doc = await this.db.collection('services').doc(serviceId).get();
            
            if (!doc.exists) {
                throw new Error('Service not found');
            }

            return {
                id: doc.id,
                ...doc.data()
            };

        } catch (error) {
            window.logger.error('Failed to get service by ID', error);
            throw error;
        }
    }

    // ==================== APPLICATIONS ====================

    async createApplication(applicationData) {
        try {
            window.logger.info('Creating new application', applicationData);

            const applicationDoc = {
                ...applicationData,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db.collection('applications').add(applicationDoc);
            
            window.logger.success('Application created successfully', { applicationId: docRef.id });
            return { success: true, applicationId: docRef.id };

        } catch (error) {
            window.logger.error('Failed to create application', error);
            throw error;
        }
    }

    async updateApplicationStatus(applicationId, status, remarks = '') {
        try {
            window.logger.info('Updating application status', { applicationId, status });

            const updateData = {
                status,
                remarks,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('applications').doc(applicationId).update(updateData);
            
            window.logger.success('Application status updated successfully', { applicationId, status });
            return { success: true };

        } catch (error) {
            window.logger.error('Failed to update application status', error);
            throw error;
        }
    }

    async getApplications(filters = {}) {
        try {
            let query = this.db.collection('applications');

            // Apply filters
            if (filters.userId) {
                query = query.where('userId', '==', filters.userId);
            }
            if (filters.serviceId) {
                query = query.where('serviceId', '==', filters.serviceId);
            }
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            const snapshot = await query.orderBy('createdAt', 'desc').get();
            const applications = [];

            snapshot.forEach(doc => {
                applications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            window.logger.info('Applications retrieved successfully', { count: applications.length });
            return applications;

        } catch (error) {
            window.logger.error('Failed to get applications', error);
            throw error;
        }
    }

    async getApplicationById(applicationId) {
        try {
            const doc = await this.db.collection('applications').doc(applicationId).get();
            
            if (!doc.exists) {
                throw new Error('Application not found');
            }

            return {
                id: doc.id,
                ...doc.data()
            };

        } catch (error) {
            window.logger.error('Failed to get application by ID', error);
            throw error;
        }
    }

    // ==================== USERS ====================

    async getUserProfile(userId) {
        try {
            // Check in all user collections
            const collections = ['users', 'staff', 'admins'];
            
            for (const collection of collections) {
                const doc = await this.db.collection(collection).doc(userId).get();
                if (doc.exists) {
                    return {
                        id: doc.id,
                        collection,
                        ...doc.data()
                    };
                }
            }

            throw new Error('User profile not found');

        } catch (error) {
            window.logger.error('Failed to get user profile', error);
            throw error;
        }
    }

    async updateUserProfile(userId, collection, updateData) {
        try {
            window.logger.info('Updating user profile', { userId, collection });

            const updateDoc = {
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection(collection).doc(userId).update(updateDoc);
            
            window.logger.success('User profile updated successfully', { userId });
            return { success: true };

        } catch (error) {
            window.logger.error('Failed to update user profile', error);
            throw error;
        }
    }

    async getAllUsers(role = null) {
        try {
            const collections = role ? [role + 's'] : ['users', 'staff', 'admins'];
            const allUsers = [];

            for (const collection of collections) {
                const snapshot = await this.db.collection(collection).get();
                snapshot.forEach(doc => {
                    allUsers.push({
                        id: doc.id,
                        collection,
                        ...doc.data()
                    });
                });
            }

            window.logger.info('Users retrieved successfully', { count: allUsers.length });
            return allUsers;

        } catch (error) {
            window.logger.error('Failed to get users', error);
            throw error;
        }
    }

    // ==================== LOGS ====================

    async getSystemLogs(filters = {}) {
        try {
            let query = this.db.collection('logs');

            // Apply filters
            if (filters.level) {
                query = query.where('level', '==', filters.level);
            }
            if (filters.userId) {
                query = query.where('userId', '==', filters.userId);
            }

            const snapshot = await query.orderBy('timestamp', 'desc').limit(100).get();
            const logs = [];

            snapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            window.logger.info('System logs retrieved successfully', { count: logs.length });
            return logs;

        } catch (error) {
            window.logger.error('Failed to get system logs', error);
            throw error;
        }
    }

    // ==================== STATISTICS ====================

    async getDashboardStats() {
        try {
            const stats = {};

            // Get total users
            const usersSnapshot = await this.db.collection('users').get();
            stats.totalUsers = usersSnapshot.size;

            // Get total applications
            const applicationsSnapshot = await this.db.collection('applications').get();
            stats.totalApplications = applicationsSnapshot.size;

            // Get applications by status
            const statusCounts = {};
            applicationsSnapshot.forEach(doc => {
                const status = doc.data().status || 'pending';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            stats.applicationStatuses = statusCounts;

            // Get active services
            const servicesSnapshot = await this.db.collection('services')
                .where('isActive', '==', true).get();
            stats.activeServices = servicesSnapshot.size;

            // Get today's activity
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayApplications = await this.db.collection('applications')
                .where('createdAt', '>=', today).get();
            stats.todayActivity = todayApplications.size;

            window.logger.info('Dashboard stats retrieved successfully', stats);
            return stats;

        } catch (error) {
            window.logger.error('Failed to get dashboard stats', error);
            throw error;
        }
    }

    async getUserStats(userId) {
        try {
            const userApplications = await this.getApplications({ userId });
            
            const stats = {
                totalApplications: userApplications.length,
                pendingApplications: userApplications.filter(app => app.status === 'pending').length,
                approvedApplications: userApplications.filter(app => app.status === 'approved').length,
                rejectedApplications: userApplications.filter(app => app.status === 'rejected').length
            };

            window.logger.info('User stats retrieved successfully', { userId, stats });
            return stats;

        } catch (error) {
            window.logger.error('Failed to get user stats', error);
            throw error;
        }
    }

    // ==================== FILE UPLOAD ====================

    async uploadFile(file, path) {
        try {
            window.logger.info('Uploading file', { fileName: file.name, path });

            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(path);
            
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            window.logger.success('File uploaded successfully', { 
                fileName: file.name, 
                downloadURL 
            });

            return {
                success: true,
                downloadURL,
                fileName: file.name,
                size: file.size
            };

        } catch (error) {
            window.logger.error('Failed to upload file', error);
            throw error;
        }
    }

    async deleteFile(path) {
        try {
            window.logger.info('Deleting file', { path });

            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(path);
            
            await fileRef.delete();

            window.logger.success('File deleted successfully', { path });
            return { success: true };

        } catch (error) {
            window.logger.error('Failed to delete file', error);
            throw error;
        }
    }

    // ==================== SEARCH ====================

    async searchServices(query) {
        try {
            const services = await this.getServices();
            
            return services.filter(service => 
                service.name.toLowerCase().includes(query.toLowerCase()) ||
                service.description.toLowerCase().includes(query.toLowerCase()) ||
                service.category.toLowerCase().includes(query.toLowerCase())
            );

        } catch (error) {
            window.logger.error('Failed to search services', error);
            throw error;
        }
    }

    async searchApplications(query, userId = null) {
        try {
            const filters = userId ? { userId } : {};
            const applications = await this.getApplications(filters);
            
            return applications.filter(application => 
                application.reason.toLowerCase().includes(query.toLowerCase()) ||
                application.serviceName.toLowerCase().includes(query.toLowerCase())
            );

        } catch (error) {
            window.logger.error('Failed to search applications', error);
            throw error;
        }
    }

    // ==================== BATCH OPERATIONS ====================

    async batchUpdateApplications(applicationIds, updateData) {
        try {
            window.logger.info('Batch updating applications', { 
                count: applicationIds.length, 
                updateData 
            });

            const batch = this.db.batch();
            
            applicationIds.forEach(id => {
                const docRef = this.db.collection('applications').doc(id);
                batch.update(docRef, {
                    ...updateData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();

            window.logger.success('Batch update completed successfully', { 
                count: applicationIds.length 
            });
            return { success: true };

        } catch (error) {
            window.logger.error('Failed to batch update applications', error);
            throw error;
        }
    }

    // ==================== REAL-TIME LISTENERS ====================

    onServicesChange(callback) {
        return this.db.collection('services')
            .where('isActive', '==', true)
            .orderBy('createdAt', 'desc')
            .onSnapshot(callback);
    }

    onApplicationsChange(userId, callback) {
        return this.db.collection('applications')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot(callback);
    }

    onUserProfileChange(userId, collection, callback) {
        return this.db.collection(collection)
            .doc(userId)
            .onSnapshot(callback);
    }

    // ==================== UTILITY METHODS ====================

    async generateApplicationNumber() {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            
            // Get count of applications for today
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const snapshot = await this.db.collection('applications')
                .where('createdAt', '>=', startOfDay)
                .get();
            
            const count = snapshot.size + 1;
            return `APP/${year}${month}${day}/${String(count).padStart(4, '0')}`;

        } catch (error) {
            window.logger.error('Failed to generate application number', error);
            throw error;
        }
    }

    async checkDuplicateApplication(userId, serviceId) {
        try {
            const snapshot = await this.db.collection('applications')
                .where('userId', '==', userId)
                .where('serviceId', '==', serviceId)
                .where('status', 'in', ['pending', 'processing'])
                .get();

            return !snapshot.empty;

        } catch (error) {
            window.logger.error('Failed to check duplicate application', error);
            throw error;
        }
    }
}

// Initialize Database Manager
window.dbManager = new DatabaseManager();

// Log database module initialization
window.logger.info('Database module initialized'); 