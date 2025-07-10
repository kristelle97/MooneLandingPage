// Mobile OS detection
function detectMobileOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'iOS';
    if (/android/i.test(userAgent)) return 'Android';
    return 'desktop';
}

// Analytics tracking
function trackClick(eventName, params = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
    }
}

// Batch DOM operations to prevent forced reflows
function batchDOMOperations(operations) {
    requestAnimationFrame(() => {
        operations.forEach(operation => operation());
    });
}

// Download button setup
function setupDownloadButtons() {
    const os = detectMobileOS();
    const iosButtons = document.querySelectorAll('.ios-download-btn');
    const androidButtons = document.querySelectorAll('.android-download-btn');
    
    if (os === 'Android') {
        // Batch visibility changes to prevent reflow
        batchDOMOperations([
            () => iosButtons.forEach(btn => btn.classList.add('hidden')),
            () => androidButtons.forEach(btn => btn.classList.remove('hidden'))
        ]);
        
        androidButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                trackClick('download_click', {
                    platform: 'android',
                    button_location: 'hero_google_play',
                    user_os: os
                });
                const modal = document.getElementById('google-play-modal');
                if (modal) {
                    batchDOMOperations([
                        () => modal.classList.remove('hidden'),
                        () => { document.body.style.overflow = 'hidden'; }
                    ]);
                }
            });
        });
    } else {
        // Batch visibility changes to prevent reflow
        batchDOMOperations([
            () => androidButtons.forEach(btn => btn.classList.add('hidden')),
            () => iosButtons.forEach(btn => btn.classList.remove('hidden'))
        ]);
    }
}

// Navigation setup with optimized DOM manipulation
function setupNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuIcon = mobileMenuButton?.querySelector('svg');
    
    if (!navbar || !mobileMenuButton || !mobileMenu) return;
    
    // Cache icon paths to avoid repeated string operations
    const hamburgerIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
    const closeIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
    
    // Mobile menu toggle with batched DOM operations
    mobileMenuButton.addEventListener('click', () => {
        const isCurrentlyHidden = mobileMenu.classList.contains('hidden');
        
        batchDOMOperations([
            () => mobileMenu.classList.toggle('hidden'),
            () => {
                if (mobileMenuIcon) {
                    mobileMenuIcon.innerHTML = isCurrentlyHidden ? closeIcon : hamburgerIcon;
                }
            }
        ]);
    });
    
    // Close mobile menu when link is clicked
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            batchDOMOperations([
                () => mobileMenu.classList.add('hidden'),
                () => {
                    if (mobileMenuIcon) {
                        mobileMenuIcon.innerHTML = hamburgerIcon;
                    }
                }
            ]);
        });
    });
}

// Modal setup with optimized DOM manipulation
function setupModals() {
    const modalToggles = document.querySelectorAll('[data-modal-toggle]');
    const modalHides = document.querySelectorAll('[data-modal-hide]');
    
    modalToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const modalId = toggle.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                batchDOMOperations([
                    () => modal.classList.remove('hidden'),
                    () => { document.body.style.overflow = 'hidden'; }
                ]);
            }
        });
    });
    
    modalHides.forEach(hide => {
        hide.addEventListener('click', () => {
            const modalId = hide.getAttribute('data-modal-hide');
            const modal = document.getElementById(modalId);
            if (modal) {
                batchDOMOperations([
                    () => modal.classList.add('hidden'),
                    () => { document.body.style.overflow = ''; }
                ]);
            }
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('[data-modal-backdrop]').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                batchDOMOperations([
                    () => modal.classList.add('hidden'),
                    () => { document.body.style.overflow = ''; }
                ]);
            }
        });
    });
}

// Track navigation clicks
function setupAnalytics() {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', function() {
            const navText = this.textContent.trim().toLowerCase();
            const href = this.getAttribute('href');
            
            let eventName = 'nav_click';
            if (navText.includes('how it works') || href === '#how-it-works') {
                eventName = 'features_nav_click';
            } else if (navText.includes('testimonials') || href === '#testimonials') {
                eventName = 'testimonials_nav_click';
            } else if (navText.includes('pricing') || href === '#pricing') {
                eventName = 'pricing_nav_click';
            } else if (navText.includes('blog') || href === '/blog/') {
                eventName = 'blog_nav_click';
            }
            
            trackClick(eventName, {
                nav_item: this.textContent.trim(),
                nav_type: this.classList.contains('mobile-nav-link') ? 'mobile' : 'desktop'
            });
        });
    });
}

// Initialize everything with performance optimizations
document.addEventListener('DOMContentLoaded', function() {
    // Use requestIdleCallback for non-critical initializations
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            setupAnalytics();
        });
    } else {
        setTimeout(setupAnalytics, 100);
    }
    
    // Critical initializations
    setupDownloadButtons();
    setupNavigation();
    setupModals();
}); 