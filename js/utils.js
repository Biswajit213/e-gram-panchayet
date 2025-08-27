// Utility Functions for Digital E Gram Panchayat

// Logging System
class Logger {
    constructor() {
        this.logs = [];
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            userAgent: navigator.userAgent
        };

        this.logs.push(logEntry);
        
        // Console logging
        const logMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 
                         level === 'info' ? 'info' : 'log';
        
        console[logMethod](`[${level.toUpperCase()}] ${message}`, data || '');

        // Store in Firebase if user is authenticated
        if (window.currentUser) {
            this.storeLog(logEntry);
        }
    }

    info(message, data = null) {
        this.log('info', message, data);
    }

    warn(message, data = null) {
        this.log('warn', message, data);
    }

    error(message, data = null) {
        this.log('error', message, data);
    }

    success(message, data = null) {
        this.log('success', message, data);
    }

    async storeLog(logEntry) {
        try {
            await window.firebaseDB.collection('logs').add({
                ...logEntry,
                userId: window.currentUser?.uid || 'anonymous',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Failed to store log:', error);
        }
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }
}

// Initialize global logger
window.logger = new Logger();
console.log('Utils.js loaded - Logger initialized');

// DOM Utilities
const DOM = {
    // Show element
    show(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.classList.remove('hidden');
            element.style.display = '';
            console.log('Showing element:', element.id || element.className);
        }
    },

    // Hide element
    hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.classList.add('hidden');
            console.log('Hiding element:', element.id || element.className);
        }
    },

    // Toggle element visibility
    toggle(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.classList.toggle('hidden');
        }
    },

    // Add loading state to element
    setLoading(element, isLoading = true) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            if (isLoading) {
                element.classList.add('form-loading');
                element.disabled = true;
            } else {
                element.classList.remove('form-loading');
                element.disabled = false;
            }
        }
    },

    // Show modal
    showModal(modalId) {
        console.log('Showing modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            // Hide all other modals first
            const allModals = document.querySelectorAll('.modal');
            allModals.forEach(m => {
                if (m.id !== modalId) {
                    m.style.display = 'none';
                }
            });
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            setTimeout(() => {
                const firstInput = modal.querySelector('input, textarea, select');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
            
            console.log('Modal shown successfully:', modalId);
        } else {
            console.error('Modal not found:', modalId);
        }
    },

    // Hide modal
    hideModal(modalId) {
        console.log('Hiding modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('Modal hidden successfully:', modalId);
        } else {
            console.error('Modal not found:', modalId);
        }
    },

    // Show message
    showMessage(message, type = 'info', duration = 5000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto remove after duration
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, duration);
    },

    getMessageIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    // Scroll to element
    scrollTo(element, offset = 0) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }
};

// Validation Utilities
const Validation = {
    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Phone validation (Indian format)
    isValidPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    // Password strength validation
    getPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength < 3) return 'weak';
        if (strength < 5) return 'medium';
        return 'strong';
    },

    // Required field validation
    isRequired(value) {
        return value && value.toString().trim().length > 0;
    },

    // Form validation
    validateForm(formData, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            
            if (rule.required && !this.isRequired(value)) {
                errors[field] = rule.message || `${field} is required`;
                continue;
            }
            
            if (value && rule.email && !this.isValidEmail(value)) {
                errors[field] = 'Please enter a valid email address';
                continue;
            }
            
            if (value && rule.phone && !this.isValidPhone(value)) {
                errors[field] = 'Please enter a valid phone number';
                continue;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = `${field} must be at least ${rule.minLength} characters`;
                continue;
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `${field} must be less than ${rule.maxLength} characters`;
                continue;
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.patternMessage || `${field} format is invalid`;
            }
        }
        
        return errors;
    }
};

// Date and Time Utilities
const DateTime = {
    // Format date
    formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year);
    },

    // Format datetime
    formatDateTime(date) {
        const d = new Date(date);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Get relative time
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    },

    // Check if date is today
    isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    }
};

// File Utilities
const FileUtils = {
    // Get file extension
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    // Check if file is image
    isImage(file) {
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return imageTypes.includes(file.type);
    },

    // Check if file is PDF
    isPDF(file) {
        return file.type === 'application/pdf';
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Validate file size
    isValidFileSize(file, maxSizeMB = 5) {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    },

    // Create file preview
    createFilePreview(file) {
        return new Promise((resolve) => {
            if (this.isImage(file)) {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        });
    }
};

// String Utilities
const StringUtils = {
    // Capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Convert to title case
    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },

    // Truncate text
    truncate(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Generate random string
    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Slugify text
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
};

// Array Utilities
const ArrayUtils = {
    // Remove duplicates
    unique(array) {
        return [...new Set(array)];
    },

    // Group by property
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },

    // Sort by property
    sortBy(array, property, ascending = true) {
        return array.sort((a, b) => {
            if (a[property] < b[property]) return ascending ? -1 : 1;
            if (a[property] > b[property]) return ascending ? 1 : -1;
            return 0;
        });
    },

    // Filter by multiple criteria
    filterBy(array, filters) {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (typeof value === 'function') {
                    return value(item[key]);
                }
                return item[key] === value;
            });
        });
    }
};

// Export utilities to global scope
window.DOM = DOM;
window.Validation = Validation;
window.DateTime = DateTime;
window.FileUtils = FileUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;

// Log utility initialization
console.log('Utils.js - All utilities exported to global scope');
window.logger.info('Utility functions initialized'); 