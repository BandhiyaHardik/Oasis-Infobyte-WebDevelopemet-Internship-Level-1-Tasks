// filepath: d:\OIBSIP Level1\Task2\js\main.js
document.addEventListener('DOMContentLoaded', function() {
    // Remove any existing loading screen handlers first
    const oldLoadingScreen = document.querySelector('.loading-screen');
    if (oldLoadingScreen) {
        oldLoadingScreen.style.display = 'flex'; // Make sure it's visible initially
    }
    
    // Simple loading screen logic - no percentage display
    function handleLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (!loadingScreen) return;
        
        // Hide loader after a fixed delay - no percentage tracking
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                document.body.classList.remove('loading');
            }, 500);
        }, 2000);
    }
    
    // Call the loading screen handler
    handleLoadingScreen();
    
    // Smooth scroll functionality
    const smoothScroll = {
        // Store scroll target and current position
        targetY: 0,
        currentY: 0,
        // Smoothing factor (lower = smoother but slower)
        ease: 0.1,
        // Whether smooth scrolling is active
        isEnabled: true,
        // Elements to update during scroll
        scrollableElements: [],
        // Store original overflow settings
        originalBodyOverflow: '',
        originalHTMLOverflow: '',
        
        // Initialize smooth scroll
        init: function() {
            console.log("Initializing smooth scroll");
            
            // Store original overflow settings
            this.originalBodyOverflow = document.body.style.overflow;
            this.originalHTMLOverflow = document.documentElement.style.overflow;
            
            // Create content wrapper if it doesn't exist
            let contentWrapper = document.querySelector('.content-wrapper');
            
            if (!contentWrapper) {
                console.log("Creating content wrapper");
                // Wrap all body children except scripts in content wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'content-wrapper';
                
                // Create a temp array of children to avoid live collection issues
                const bodyChildren = Array.from(document.body.children);
                
                bodyChildren.forEach(child => {
                    if (child.tagName !== 'SCRIPT' && 
                        !child.classList.contains('virtual-scroller') && 
                        !child.classList.contains('loading-screen')) {
                        wrapper.appendChild(child);
                    }
                });
                
                document.body.appendChild(wrapper);
                contentWrapper = wrapper;
            }
            
            // Add essential styles to content wrapper
            if (contentWrapper) {
                contentWrapper.style.position = 'absolute';
                contentWrapper.style.width = '100%';
                contentWrapper.style.top = '0';
                contentWrapper.style.left = '0';
                contentWrapper.style.zIndex = '1';
                contentWrapper.style.willChange = 'transform';
                contentWrapper.style.transform = 'translate3d(0, 0, 0)';
            }
            
            // Check device for better performance
            this.isEnabled = window.innerWidth > 768;
            
            // Find scrollable sections
            this.scrollableElements = [...document.querySelectorAll('section, footer')];
            
            if (this.isEnabled) {
                console.log("Enabling smooth scroll for desktop");
                // Set up for smooth scrolling
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                
                // Fixed positioning approach for smoother scrolling
                document.body.classList.add('smooth-scrolling');
                
                // Create virtual scroller
                this.createVirtualScroller();
                
                // Set initial position
                this.currentY = window.scrollY;
                this.targetY = window.scrollY;
                
                // Start animation loop
                this.animate();
                
                // Add scroll event listeners
                window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
                window.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
                window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
                window.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
                
                // Add keyboard navigation
                window.addEventListener('keydown', this.keydownHandler.bind(this));
                
                // Handle nav link clicks for smooth scrolling
                this.setupNavLinkScrolling();
            } else {
                console.log("Using native scroll for mobile");
                // On mobile, use native scrolling with enhanced behavior
                this.setupMobileScrolling();
            }
        },
        
        // Create a virtual scroller element to maintain proper scroll height
        createVirtualScroller: function() {
            // Remove any existing virtual scroller
            const oldScroller = document.querySelector('.virtual-scroller');
            if (oldScroller) {
                oldScroller.remove();
            }
            
            const virtualScroller = document.createElement('div');
            virtualScroller.className = 'virtual-scroller';
            
            // Calculate total scroll height
            let totalHeight = 0;
            this.scrollableElements.forEach(el => {
                totalHeight += el.offsetHeight;
            });
            
            // Add extra padding for safety
            totalHeight += 100;
            
            // Set virtual scroller height
            virtualScroller.style.position = 'absolute';
            virtualScroller.style.top = '0';
            virtualScroller.style.left = '0';
            virtualScroller.style.width = '1px';
            virtualScroller.style.height = totalHeight + 'px';
            virtualScroller.style.pointerEvents = 'none';
            virtualScroller.style.visibility = 'hidden';
            virtualScroller.style.zIndex = '-999';
            
            document.body.appendChild(virtualScroller);
            console.log("Virtual scroller created with height:", totalHeight);
        },
        
        // Handle wheel events
        onWheel: function(e) {
            // Update scroll target
            this.targetY += e.deltaY;
            
            // Constrain target within document bounds
            const maxScroll = document.querySelector('.virtual-scroller').offsetHeight - window.innerHeight;
            this.targetY = Math.max(0, Math.min(this.targetY, maxScroll));
            
            // Prevent default only if we're handling the scroll
            e.preventDefault();
        },
        
        // Touch handling for mobile devices
        touchStartY: 0,
        touchMoveY: 0,
        isTouching: false,
        touchDistance: 0,
        
        onTouchStart: function(e) {
            this.isTouching = true;
            this.touchStartY = e.touches[0].clientY;
            this.touchMoveY = this.touchStartY;
        },
        
        onTouchMove: function(e) {
            if (!this.isTouching) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = this.touchMoveY - currentY;
            
            this.targetY += deltaY * 1.5; // Adjust touch sensitivity
            
            // Constrain target within document bounds
            const maxScroll = document.querySelector('.virtual-scroller').offsetHeight - window.innerHeight;
            this.targetY = Math.max(0, Math.min(this.targetY, maxScroll));
            
            this.touchMoveY = currentY;
            this.touchDistance += Math.abs(deltaY);
            
            // Prevent default if we've moved enough to determine it's a scroll
            if (this.touchDistance > 10) {
                e.preventDefault();
            }
        },
        
        onTouchEnd: function() {
            this.isTouching = false;
            this.touchDistance = 0;
        },
        
        // Handle keyboard events for arrow keys
        keydownHandler: function(e) {
            // Check for arrow keys
            switch(e.key) {
                case 'ArrowDown':
                    this.targetY += 50; // Scroll down by 50px
                    break;
                case 'ArrowUp':
                    this.targetY -= 50; // Scroll up by 50px
                    break;
                case 'PageDown':
                    this.targetY += window.innerHeight * 0.9;
                    break;
                case 'PageUp':
                    this.targetY -= window.innerHeight * 0.9;
                    break;
                case 'Home':
                    this.targetY = 0;
                    break;
                case 'End':
                    this.targetY = document.querySelector('.virtual-scroller').offsetHeight - window.innerHeight;
                    break;
                case ' ': // Space bar
                    this.targetY += window.innerHeight * 0.5;
                    break;
                default:
                    return; // Exit for other keys
            }
            
            // Constrain target within document bounds
            const maxScroll = document.querySelector('.virtual-scroller').offsetHeight - window.innerHeight;
            this.targetY = Math.max(0, Math.min(this.targetY, maxScroll));
            
            e.preventDefault();
        },
        
        // Set up smooth scrolling for navigation links
        setupNavLinkScrolling: function() {
            const navLinks = document.querySelectorAll('.nav-link, a[href^="#"]');
            
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const targetId = link.getAttribute('href');
                    
                    // Only handle internal links
                    if (targetId && targetId.startsWith('#')) {
                        e.preventDefault();
                        
                        // Get target element
                        const targetElement = document.querySelector(targetId);
                        
                        if (targetElement) {
                            // Scroll to target
                            this.scrollToElement(targetElement);
                            
                            // Update active navigation state
                            navLinks.forEach(link => link.classList.remove('active'));
                            link.classList.add('active');
                            
                            // Close mobile nav if open
                            const navToggle = document.querySelector('.nav-toggle');
                            const mainNav = document.querySelector('.main-nav');
                            if (navToggle && mainNav) {
                                navToggle.classList.remove('active');
                                mainNav.classList.remove('active');
                                document.body.classList.remove('nav-open');
                            }
                        }
                    }
                });
            });
        },
        
        // Mobile scrolling enhancement
        setupMobileScrolling: function() {
            // Add scroll detection for section transitions
            window.addEventListener('scroll', () => {
                this.detectCurrentSection();
                this.updateSectionEffects();
            });
            
            // Handle navigation clicks
            const navLinks = document.querySelectorAll('.nav-link, a[href^="#"]');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const targetId = link.getAttribute('href');
                    
                    if (targetId && targetId.startsWith('#')) {
                        e.preventDefault();
                        
                        const targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            // Smooth scroll with native browser API
                            targetElement.scrollIntoView({
                                behavior: 'smooth'
                            });
                            
                            // Update navigation
                            navLinks.forEach(link => link.classList.remove('active'));
                            link.classList.add('active');
                            
                            // Close mobile nav
                            const navToggle = document.querySelector('.nav-toggle');
                            const mainNav = document.querySelector('.main-nav');
                            if (navToggle && mainNav) {
                                navToggle.classList.remove('active');
                                mainNav.classList.remove('active');
                                document.body.classList.remove('nav-open');
                            }
                        }
                    }
                });
            });
        },
        
        // Animate scroll with smoothing
        animate: function() {
            if (!this.isEnabled) return;
            
            // Calculate new position with easing
            this.currentY += (this.targetY - this.currentY) * this.ease;
            
            // Apply transformations based on scroll position
            this.updateElements();
            
            // Detect current section for navigation and effects
            this.detectCurrentSection();
            
            // Update visual effects on scroll
            this.updateSectionEffects();
            
            // Continue animation loop
            requestAnimationFrame(this.animate.bind(this));
        },
        
        // Update element transforms for smooth scroll effect
        updateElements: function() {
            // Transform the content wrapper for better performance
            const contentWrapper = document.querySelector('.content-wrapper');
            if (!contentWrapper) return;
            
            const y = -(Math.round(this.currentY * 100) / 100);
            
            // Make sure content wrapper is visible before transforming
            contentWrapper.style.visibility = 'visible';
            contentWrapper.style.transform = `translate3d(0, ${y}px, 0)`;
            
            // Update scroll position for libraries that rely on scrollY
            window.scrollTo(0, this.currentY);
            
            // Dispatch scroll event for compatibility
            window.dispatchEvent(new CustomEvent('scroll'));
        },
        
        // Detect which section is currently visible
        detectCurrentSection: function() {
            const scrollPosition = this.currentY + window.innerHeight / 3;
            let currentSection = null;
            
            // Find which section the user is currently viewing
            this.scrollableElements.forEach(section => {
                const sectionTop = this.getOffsetTop(section);
                const sectionBottom = sectionTop + section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentSection = section.id;
                }
            });
            
            // Update navigation active state
            if (currentSection) {
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    if (link.getAttribute('href')) {
                        const href = link.getAttribute('href').substring(1); // Remove #
                        if (href === currentSection) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    }
                });
                
                // Update ThreeJS background if available
                if (window.threeJsControls && window.threeJsControls.focusOnSection) {
                    window.threeJsControls.focusOnSection(currentSection);
                }
            }
        },
        
        // Apply visual effects based on scroll position
        updateSectionEffects: function() {
            // Handle animations that trigger on scroll
            const animatedElements = document.querySelectorAll('[data-animation]');
            
            animatedElements.forEach(el => {
                if (this.isElementInView(el)) {
                    // Add animation class when element comes into view
                    const animationType = el.getAttribute('data-animation');
                    const delay = el.getAttribute('data-delay') || 0;
                    
                    if (!el.classList.contains('animated')) {
                        setTimeout(() => {
                            el.classList.add('animated', animationType);
                        }, delay * 1000);
                    }
                }
            });
            
            // Parallax effects
            const parallaxElements = document.querySelectorAll('[data-parallax]');
            parallaxElements.forEach(el => {
                const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
                const offsetTop = this.getOffsetTop(el);
                const windowCenter = this.currentY + (window.innerHeight / 2);
                const elCenter = offsetTop + (el.offsetHeight / 2);
                const distance = windowCenter - elCenter;
                
                const translateY = distance * speed;
                el.style.transform = `translateY(${translateY}px)`;
            });
        },
        
        // Helper function to get element's offset top considering scroll position
        getOffsetTop: function(el) {
            let top = 0;
            let current = el;
            
            while (current && !isNaN(current.offsetTop)) {
                top += current.offsetTop;
                current = current.offsetParent;
            }
            
            return top;
        },
        
        // Check if element is in viewport
        isElementInView: function(el) {
            // Alternative method that doesn't rely on getBoundingClientRect
            const elementTop = this.getOffsetTop(el) - this.currentY;
            const elementHeight = el.offsetHeight;
            const windowHeight = window.innerHeight;
            
            return (
                elementTop <= windowHeight * 0.8 &&
                elementTop + elementHeight >= 0
            );
        },
        
        // Scroll to specific element
        scrollToElement: function(element) {
            if (!element) return;
            
            const targetPosition = this.getOffsetTop(element);
            
            // Animate scroll with GSAP for extra smoothness
            if (window.gsap) {
                gsap.to(this, {
                    targetY: targetPosition,
                    duration: 1,
                    ease: "power3.out"
                });
            } else {
                // Fallback if GSAP not available
                this.targetY = targetPosition;
            }
        },
        
        // Disable smooth scrolling (for specific pages or situations)
        disable: function() {
            if (!this.isEnabled) return;
            
            // Restore original overflow settings
            document.body.style.overflow = this.originalBodyOverflow;
            document.documentElement.style.overflow = this.originalHTMLOverflow;
            document.body.classList.remove('smooth-scrolling');
            
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.style.transform = '';
                contentWrapper.style.position = '';
            }
            
            // Remove virtual scroller
            const virtualScroller = document.querySelector('.virtual-scroller');
            if (virtualScroller) virtualScroller.remove();
            
            // Stop animation
            this.isEnabled = false;
            
            // Remove event listeners
            window.removeEventListener('wheel', this.onWheel);
            window.removeEventListener('touchstart', this.onTouchStart);
            window.removeEventListener('touchmove', this.onTouchMove);
            window.removeEventListener('touchend', this.onTouchEnd);
            window.removeEventListener('keydown', this.keydownHandler);
        },
        
        // Re-enable smooth scrolling
        enable: function() {
            if (this.isEnabled) return;
            this.isEnabled = true;
            this.init();
        }
    };
    
    // Add critical CSS for fixing scroll issues
    const criticalCSS = document.createElement('style');
    criticalCSS.textContent = `
        .content-wrapper {
            position: absolute;
            width: 100%;
            min-height: 100%;
            top: 0;
            left: 0;
            z-index: 1;
            will-change: transform;
            transform: translate3d(0, 0, 0);
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        body.smooth-scrolling {
            overflow: hidden !important;
            position: fixed;
            width: 100%;
            height: 100%;
        }
        
        .virtual-scroller {
            position: absolute;
            top: 0;
            left: 0;
            width: 1px;
            z-index: -999;
            pointer-events: none;
        }
        
        #webgl-background {
            position: fixed !important;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }
        
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-color);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.5s;
        }
        
        /* Override any other styles that might hide content */
        section, header, footer {
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(criticalCSS);
    
    // Initialize smooth scrolling with a delay to ensure all elements are loaded
    setTimeout(() => {
        smoothScroll.init();
        console.log("Smooth scroll initialized with delay");
    }, 800);
    
    // Expose smooth scroll to window for other scripts
    window.smoothScroll = smoothScroll;
    
    // Skills Tabs
    document.querySelectorAll('.skills-container .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.skills-container .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.skills-container .tab-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.getAttribute('data-tab')).classList.add('active');
        });
    });

    // Experience/Education Tabs
    document.querySelectorAll('.experience-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.experience-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.experience-tabs .tab-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.getAttribute('data-tab')).classList.add('active');
        });
    });
    
    // Rotating "I create..." text
    document.querySelectorAll('.txt-rotate').forEach(function(el) {
        const toRotate = JSON.parse(el.getAttribute('data-rotate'));
        const period = parseInt(el.getAttribute('data-period'), 10) || 2000;
        let loopNum = 0;
        let txt = '';
        let isDeleting = false;

        function tick() {
            const i = loopNum % toRotate.length;
            const fullTxt = toRotate[i];

            if (isDeleting) {
                txt = fullTxt.substring(0, txt.length - 1);
            } else {
                txt = fullTxt.substring(0, txt.length + 1);
            }

            el.innerHTML = `<span class="wrap">${txt}</span>`;

            let delta = 150 - Math.random() * 100;
            if (isDeleting) { delta /= 2; }

            if (!isDeleting && txt === fullTxt) {
                delta = period;
                isDeleting = true;
            } else if (isDeleting && txt === '') {
                isDeleting = false;
                loopNum++;
                delta = 500;
            }

            setTimeout(tick, delta);
        }
        tick();
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all buttons and panes
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            // Add active to clicked button and corresponding pane
            this.classList.add('active');
            document.getElementById(this.getAttribute('data-tab')).classList.add('active');
        });
    });
});