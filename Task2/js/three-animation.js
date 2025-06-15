document.addEventListener('DOMContentLoaded', function() {
    // Check if WebGL is available
    if (!THREE.WEBGL.isWebGLAvailable()) {
        document.getElementById('webgl-background').innerHTML = 
            '<div class="webgl-error">WebGL is not supported by your browser or device.</div>';
        return;
    }
    
    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance' 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    
    const container = document.getElementById('webgl-background');
    container.appendChild(renderer.domElement);
    
    // Loading manager for tracking load progress
    const loadingManager = new THREE.LoadingManager();
    
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progressPercent = Math.round((itemsLoaded / itemsTotal) * 100);
        const progressBar = document.querySelector('.loader-progress .progress-bar');
        const progressText = document.querySelector('.loader-progress .progress-text');
        
        if (progressBar && progressText) {
            progressBar.style.width = `${progressPercent}%`;
            progressText.textContent = `${progressPercent}%`;
        }
    };
    
    loadingManager.onLoad = function() {
        setTimeout(() => {
            document.body.classList.remove('loading');
            animateIntro();
        }, 500);
    };
    
    // Textures
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const particleTexture = textureLoader.load('assets/images/particle.png');
    
    // Advanced controls
    let controls;
    if (window.innerWidth > 768) {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enablePan = false;
    }
    
    // Create a dynamic, interactive particle system
    function createParticleSystem() {
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = window.innerWidth < 768 ? 3000 : 6000;
        
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        const scales = new Float32Array(particlesCount);
        const randomness = new Float32Array(particlesCount * 3);
        
        const colorChoices = [
            new THREE.Color(0x6e00ff), // Primary
            new THREE.Color(0x00c3ff), // Secondary
            new THREE.Color(0xff3c78), // Accent
            new THREE.Color(0xffffff), // White
        ];
        
        for (let i = 0; i < particlesCount; i++) {
            // Position
            const distance = Math.random() * 50 + 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = distance * Math.cos(phi);
            
            // Randomness for animation
            randomness[i * 3] = Math.random() * 2 - 1;
            randomness[i * 3 + 1] = Math.random() * 2 - 1;
            randomness[i * 3 + 2] = Math.random() * 2 - 1;
            
            // Color
            const colorIndex = Math.floor(Math.random() * colorChoices.length);
            const color = colorChoices[colorIndex];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Scale
            scales[i] = Math.random() * 1.5 + 0.5;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        particlesGeometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));
        
        // Particle material
        const particlesMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec3 color;
                attribute float aScale;
                attribute vec3 aRandomness;
                
                uniform float uTime;
                uniform float uScale;
                
                varying vec3 vColor;
                
                void main() {
                    vec3 pos = position;
                    
                    // Animation
                    float angle = uTime * 0.2;
                    pos.x += sin(angle + aRandomness.x * 100.0) * aRandomness.x * 2.0;
                    pos.y += cos(angle + aRandomness.y * 100.0) * aRandomness.y * 2.0;
                    pos.z += sin(angle + aRandomness.z * 100.0) * aRandomness.z * 2.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    gl_PointSize = aScale * uScale * (30.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    vColor = color;
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                
                varying vec3 vColor;
                
                void main() {
                    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
                    vec4 texColor = texture2D(uTexture, uv);
                    
                    if(texColor.a < 0.1) discard;
                    
                    gl_FragColor = vec4(vColor, texColor.a);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: 1 },
                uTexture: { value: particleTexture }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        return particles;
    }
    
    // Create a galaxy-like visualization
    const particles = createParticleSystem();
    scene.add(particles);
    
    // Create a connection system to connect nearby particles with lines
    function createConnectionSystem() {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x6e00ff,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        
        const lineGeometry = new THREE.BufferGeometry();
        const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
        
        return lineSystem;
    }
    
    const connections = createConnectionSystem();
    scene.add(connections);
    
    // Interactive light orb that follows mouse
    const orbGeometry = new THREE.SphereGeometry(3, 32, 32);
    const orbMaterial = new THREE.MeshBasicMaterial({
        color: 0x6e00ff,
        transparent: true,
        opacity: 0.6
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);
    
    // Light source
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x6e00ff, 1, 100);
    pointLight.position.set(0, 10, 20);
    scene.add(pointLight);
    
    // Mouse tracking for interactive elements
    const mouse = {
        x: 0,
        y: 0,
        target: {
            x: 0,
            y: 0
        }
    };
    
    document.addEventListener('mousemove', (event) => {
        // Normalized device coordinates
        mouse.target.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.target.y = - (event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Handle touch events for mobile
    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouse.target.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.target.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;
            event.preventDefault();
        }
    }, { passive: false });
    
    // Handle scroll interactions
    let scrollY = 0;
    let currentSection = 'home';
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        
        // Detect current section
        const sections = document.querySelectorAll('section');
        for (const section of sections) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollY >= sectionTop - 300 && scrollY < sectionTop + sectionHeight - 300) {
                const sectionId = section.getAttribute('id');
                if (currentSection !== sectionId) {
                    currentSection = sectionId;
                    updateBackgroundForSection(currentSection);
                }
                break;
            }
        }
    });
    
    // Update background based on current section
    function updateBackgroundForSection(sectionId) {
        // Change particle colors and behavior based on section
        const uniforms = particles.material.uniforms;
        const transitionDuration = 1; // seconds
        
        gsap.to(camera.position, {
            z: sectionId === 'contact' ? 70 : 50,
            duration: transitionDuration,
            ease: 'power2.inOut'
        });
        
        gsap.to(uniforms.uScale, {
            value: sectionId === 'skills' ? 1.5 : 1,
            duration: transitionDuration,
            ease: 'power2.inOut'
        });
    }
    
    // Create animated intro sequence
    function animateIntro() {
        gsap.from(camera.position, {
            z: 150,
            duration: 2.5,
            ease: 'power3.out'
        });
        
        gsap.from(particles.material.uniforms.uScale, {
            value: 0,
            duration: 2.5,
            ease: 'power3.out'
        });
    }
    
    // Update connections between particles
    function updateConnections() {
        const particlePositions = particles.geometry.attributes.position.array;
        const linePositions = [];
        const particlesCount = particlePositions.length / 3;
        
        const connectionThreshold = window.innerWidth < 768 ? 8 : 10;
        const maxConnections = 300; // Limit for performance
        let connectionCount = 0;
        
        for (let i = 0; i < particlesCount; i++) {
            const ix = particlePositions[i * 3];
            const iy = particlePositions[i * 3 + 1];
            const iz = particlePositions[i * 3 + 2];
            
            for (let j = i + 1; j < particlesCount; j++) {
                if (connectionCount >= maxConnections) break;
                
                const jx = particlePositions[j * 3];
                const jy = particlePositions[j * 3 + 1];
                const jz = particlePositions[j * 3 + 2];
                
                const distance = Math.sqrt(
                    Math.pow(ix - jx, 2) +
                    Math.pow(iy - jy, 2) +
                    Math.pow(iz - jz, 2)
                );
                
                if (distance < connectionThreshold) {
                    linePositions.push(ix, iy, iz);
                    linePositions.push(jx, jy, jz);
                    connectionCount++;
                }
            }
            
            // Stop after checking enough particles for performance
            if (i > 500) break;
        }
        
        connections.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Update camera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Smooth mouse movement
        mouse.x += (mouse.target.x - mouse.x) * 0.1;
        mouse.y += (mouse.target.y - mouse.y) * 0.1;
        
        // Update particle animations
        if (particles.material.uniforms) {
            particles.material.uniforms.uTime.value = performance.now() * 0.001;
        }
        
        // Move interactive orb
        orb.position.x = mouse.x * 30;
        orb.position.y = mouse.y * 20;
        orb.position.z = 20 + Math.sin(performance.now() * 0.001) * 5;
        
        // Update point light position
        pointLight.position.x = orb.position.x;
        pointLight.position.y = orb.position.y;
        pointLight.position.z = orb.position.z;
        
        // Update connections only every few frames for performance
        if (Math.random() > 0.95) {
            updateConnections();
        }
        
        // Rotate particle system slightly for ambient movement
        particles.rotation.y += 0.0005;
        particles.rotation.z += 0.0002;
        
        // Update controls if available
        if (controls) controls.update();
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    // Start animation
    animate();
    
    // Create section-specific particle effects
    function createSectionParticles(sectionId) {
        const container = document.getElementById(`${sectionId}-particles`);
        if (!container) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        const particles = [];
        const particleCount = window.innerWidth < 768 ? 30 : 50;
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        
        // Animation function
        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Move particle
                p.x += p.speedX;
                p.y += p.speedY;
                
                // Boundary check
                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(110, 0, 255, ${p.opacity})`;
                ctx.fill();
            }
            
            requestAnimationFrame(animateParticles);
        }
        
        animateParticles();
    }
    
    // Create section particles
    createSectionParticles('about');
    createSectionParticles('skills');
    createSectionParticles('works');
    createSectionParticles('experience');
    createSectionParticles('contact');
    
    // Create Skill Globe for Skills Section
    function createSkillGlobe() {
        const container = document.getElementById('skill-globe');
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        const scene = new THREE.Scene();
        
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 200;
        
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        
        // Create globe
        const globeGeometry = new THREE.SphereGeometry(80, 64, 64);
        const globeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x6e00ff,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        scene.add(globe);
        
        // Add skill icons around the globe
        const skills = [
            { name: 'HTML', icon: '🌐' },
            { name: 'CSS', icon: '🎨' },
            { name: 'JavaScript', icon: '⚡' },
            { name: 'React', icon: '⚛️' },
            { name: 'Node.js', icon: '🟢' },
            { name: 'Three.js', icon: '🔮' },
            { name: 'WebGL', icon: '🌈' },
            { name: 'UI/UX', icon: '✨' }
        ];
        
        const skillObjects = [];
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 128;
        textureCanvas.height = 128;
        const textureCtx = textureCanvas.getContext('2d');
        
        skills.forEach((skill, index) => {
            // Create text texture
            textureCtx.clearRect(0, 0, 128, 128);
            textureCtx.fillStyle = '#ffffff';
            textureCtx.font = 'bold 80px Arial';
            textureCtx.textAlign = 'center';
            textureCtx.textBaseline = 'middle';
            textureCtx.fillText(skill.icon, 64, 64);
            
            const texture = new THREE.CanvasTexture(textureCanvas);
            
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(20, 20, 1);
            
            // Position on globe
            const phi = Math.acos(-1 + (2 * index) / skills.length);
            const theta = Math.sqrt(skills.length * Math.PI) * phi;
            
            const radius = 90;
            sprite.position.x = radius * Math.sin(phi) * Math.cos(theta);
            sprite.position.y = radius * Math.sin(phi) * Math.sin(theta);
            sprite.position.z = radius * Math.cos(phi);
            
            sprite.userData = { 
                orbitalSpeed: 0.001 + Math.random() * 0.002,
                orbitalAngle: Math.random() * Math.PI * 2,
                orbitalDistance: 5 + Math.random() * 10,
                orbitalAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize()
            };
            
            scene.add(sprite);
            skillObjects.push(sprite);
        });
        
        function animate() {
            requestAnimationFrame(animate);
            
            globe.rotation.y += 0.002;
            globe.rotation.x += 0.001;
            
            // Animate skill icons
            skillObjects.forEach(sprite => {
                const orbit = sprite.userData;
                orbit.orbitalAngle += orbit.orbitalSpeed;
                
                const axis = new THREE.Vector3()
                    .copy(orbit.orbitalAxis)
                    .applyQuaternion(globe.quaternion);
                    
                const orbitalQuat = new THREE.Quaternion()
                    .setFromAxisAngle(axis, orbit.orbitalAngle);
                    
                const offset = new THREE.Vector3(0, orbit.orbitalDistance, 0)
                    .applyQuaternion(orbitalQuat);
                
                sprite.position.copy(
                    new THREE.Vector3()
                        .copy(sprite.position)
                        .normalize()
                        .multiplyScalar(90)
                        .add(offset)
                );
            });
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (!container) return;
            
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            
            renderer.setSize(width, height);
        });
    }
    
    // Initialize skill globe with delay
    setTimeout(createSkillGlobe, 1000);
    
    // Export control functions for other scripts
    window.threeJsControls = {
        focusOnSection: updateBackgroundForSection,
    };
});