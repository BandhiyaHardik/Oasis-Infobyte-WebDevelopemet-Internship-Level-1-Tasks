/**
 * Temperature Visualization with Three.js
 * This file handles the 3D visualization of temperature using WebGL
 */

// Global variables for Three.js
let scene, camera, renderer, controls;
let thermometerModel, particleSystem;
let thermometerMaterial, liquidMaterial;
let isInitialized = false;

// Environment variables
let currentTemperature = 25; // Default temperature in Celsius
let animationSpeed = 0.01;
let particles = [];

// Initialize the 3D scene
function initVisualization() {
    // Already initialized - don't duplicate
    if (isInitialized) return;
    
    const container = document.getElementById('temperature-3d-model');
    if (!container) return;
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x131a38);
    
    // Setup camera
    camera = new THREE.PerspectiveCamera(
        60, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 0, 5);
    
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    
    // Add lights
    addLights();
    
    // Create thermometer model
    createThermometer();
    
    // Create particle system
    createParticleSystem();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
    
    isInitialized = true;
    console.log('Temperature visualization initialized');
}

// Add lights to the scene
function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Directional light (sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    
    // Improve shadow quality
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    
    scene.add(directionalLight);
    
    // Add point lights for better visual effect
    const pointLight1 = new THREE.PointLight(0x4a80ff, 0.8, 10);
    pointLight1.position.set(-3, 2, 4);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff6b4a, 0.6, 10);
    pointLight2.position.set(3, -1, 2);
    scene.add(pointLight2);
}

// Create the 3D thermometer model
function createThermometer() {
    const thermometerGroup = new THREE.Group();
    
    // Thermometer bulb (sphere at bottom)
    const bulbGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const bulbMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xd1d1d1,
        transparent: true,
        opacity: 0.8,
        shininess: 100,
        specular: 0x333333
    });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.y = -2;
    bulb.castShadow = true;
    thermometerGroup.add(bulb);
    
    // Thermometer tube
    const tubeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 32);
    const tubeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xd1d1d1,
        transparent: true,
        opacity: 0.7,
        shininess: 100,
        specular: 0x333333
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.y = 0;
    tube.castShadow = true;
    thermometerGroup.add(tube);
    
    // Liquid inside tube
    const liquidGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
    liquidMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x52cc74, // Default mild temperature color
        emissive: 0x52cc74,
        emissiveIntensity: 0.2,
        shininess: 100
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -1.95; // Start at bottom
    thermometerModel = liquid; // Store reference to update later
    thermometerGroup.add(liquid);
    
    // Liquid inside bulb
    const bulbLiquidGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const bulbLiquid = new THREE.Mesh(bulbLiquidGeometry, liquidMaterial);
    bulbLiquid.position.y = -2;
    thermometerGroup.add(bulbLiquid);
    
    // Temperature markings
    const markingsGeometry = new THREE.PlaneGeometry(1.5, 4.4);
    const markingsTexture = createMarkingsTexture();
    const markingsMaterial = new THREE.MeshBasicMaterial({
        map: markingsTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const markings = new THREE.Mesh(markingsGeometry, markingsMaterial);
    markings.position.set(0.5, 0, 0);
    markings.rotation.y = Math.PI / 2;
    thermometerGroup.add(markings);
    
    // Add thermometer to scene
    thermometerGroup.rotation.z = Math.PI * 0.03; // Slight tilt
    scene.add(thermometerGroup);
}

// Create texture for thermometer markings
function createMarkingsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Fill with transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw temperature markings
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    
    // Draw major ticks and labels
    const majorTicks = [
        { temp: 100, label: '100°C' },
        { temp: 75, label: '75°C' },
        { temp: 50, label: '50°C' },
        { temp: 25, label: '25°C' },
        { temp: 0, label: '0°C' },
        { temp: -25, label: '-25°C' },
        { temp: -50, label: '-50°C' }
    ];
    
    majorTicks.forEach(tick => {
        // Map temperature (-50 to 100) to y-position
        const yPos = map(tick.temp, -50, 100, canvas.height - 100, 100);
        
        // Draw tick
        ctx.fillRect(canvas.width/2 - 60, yPos, 40, 3);
        
        // Draw label
        ctx.fillText(tick.label, canvas.width/2 + 30, yPos + 8);
    });
    
    // Draw minor ticks
    for (let temp = -50; temp <= 100; temp += 5) {
        if (temp % 25 !== 0) { // Skip major ticks
            const yPos = map(temp, -50, 100, canvas.height - 100, 100);
            ctx.fillRect(canvas.width/2 - 40, yPos, 20, 2);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Create particle system for environmental effects
function createParticleSystem() {
    const particlesGroup = new THREE.Group();
    const particleCount = 200;
    
    // Create particle geometry and material
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    // Initialize particle positions
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Randomly position particles in a spherical area
        const radius = 4 + Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i3 + 1] = radius * Math.cos(phi) - 5; // Start below scene
        particlePositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        
        // Randomize particle sizes
        particleSizes[i] = Math.random() * 0.1 + 0.05;
        
        // Store particle data for animation
        particles.push({
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                Math.random() * 0.02 + 0.01, // Upward velocity
                (Math.random() - 0.5) * 0.01
            ),
            initialY: particlePositions[i3 + 1]
        });
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    // Create shader material for particles
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x52cc74) }, // Default color
            pointTexture: { value: createParticleTexture() }
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            void main() {
                vColor = vec3(1.0, 1.0, 1.0);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(color * vColor, 1.0);
                gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
                if (gl_FragColor.a < 0.3) discard;
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });
    
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

// Create texture for particles
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Draw gradient circle
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('temperature-3d-model');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Update the thermometer based on temperature
function updateTemperatureModel(celsius) {
    if (!isInitialized || !thermometerModel) {
        // Initialize if not already done
        initVisualization();
        if (!isInitialized) return; // Exit if initialization failed
    }
    
    // Store current temperature
    currentTemperature = celsius;
    
    // Update liquid color based on temperature
    let liquidColor;
    if (celsius < 0) {
        liquidColor = new THREE.Color(0x00c8ff); // Cold
    } else if (celsius > 40) {
        liquidColor = new THREE.Color(0xff6b4a); // Hot
    } else {
        liquidColor = new THREE.Color(0x52cc74); // Mild
    }
    
    // Update the material color
    if (liquidMaterial) {
        liquidMaterial.color = liquidColor;
        liquidMaterial.emissive = liquidColor;
    }
    
    // Update particle system color
    if (particleSystem && particleSystem.material.uniforms) {
        particleSystem.material.uniforms.color.value = liquidColor;
    }
    
    // Update thermometer liquid height
    if (thermometerModel) {
        // Map temperature to scale factor (height of liquid)
        // Temperature range: -50°C to 100°C
        // Position range: -1.95 (bottom) to 1.95 (top)
        const targetY = map(celsius, -50, 100, -1.95, 1.95);
        const targetHeight = map(celsius, -50, 100, 0.1, 4); // Min to max height
        
        // Animate the liquid height change
        animateThermometer(targetY, targetHeight);
    }
}

// Animate thermometer liquid rising/falling
function animateThermometer(targetY, targetHeight) {
    const currentY = thermometerModel.position.y;
    const currentHeight = thermometerModel.geometry.parameters.height;
    
    // Smoothly transition to new position and height
    thermometerModel.position.y += (targetY - currentY) * 0.05;
    
    // Update cylinder geometry for height change
    if (Math.abs(currentHeight - targetHeight) > 0.01) {
        const newGeometry = new THREE.CylinderGeometry(
            0.1, 0.1, // radius top and bottom
            currentHeight + (targetHeight - currentHeight) * 0.05, // height
            16 // radial segments
        );
        thermometerModel.geometry.dispose();
        thermometerModel.geometry = newGeometry;
        
        // Adjust position to keep bottom of liquid fixed
        const heightDifference = (targetHeight - currentHeight) * 0.05 / 2;
        thermometerModel.position.y += heightDifference;
    }
}

// Update particle effects based on temperature
function updateParticles() {
    if (!particleSystem) return;
    
    const positions = particleSystem.geometry.attributes.position.array;
    let visible = false;
    
    // Show particles only for certain temperature ranges
    if (currentTemperature < 0 || currentTemperature > 80) {
        visible = true;
    }
    
    particleSystem.visible = visible;
    if (!visible) return;
    
    // Update particle positions based on temperature
    for (let i = 0; i < particles.length; i++) {
        const i3 = i * 3;
        const particle = particles[i];
        
        // Add velocity to position
        positions[i3] += particle.velocity.x;
        positions[i3 + 1] += particle.velocity.y;
        positions[i3 + 2] += particle.velocity.z;
        
        // Reset particles that go too high
        if (positions[i3 + 1] > 5) {
            positions[i3 + 1] = particle.initialY;
        }
        
        // Add some randomness to movement
        particle.velocity.x += (Math.random() - 0.5) * 0.002;
        particle.velocity.z += (Math.random() - 0.5) * 0.002;
        
        // Temperature affects particle behavior
        if (currentTemperature < 0) {
            // Snow-like particles move slower and with more horizontal drift
            particle.velocity.y = Math.random() * 0.01 + 0.005;
            particle.velocity.x = (Math.random() - 0.5) * 0.02;
            particle.velocity.z = (Math.random() - 0.5) * 0.02;
        } else if (currentTemperature > 80) {
            // Steam-like particles move faster upward
            particle.velocity.y = Math.random() * 0.04 + 0.02;
        }
    }
    
    // Tell Three.js to update the particle positions
    particleSystem.geometry.attributes.position.needsUpdate = true;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    if (controls) controls.update();
    
    // Update particles
    updateParticles();
    
    // Render scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Helper function to map value from one range to another
function map(value, fromMin, fromMax, toMin, toMax) {
    // Clamp value to range
    value = Math.max(fromMin, Math.min(value, fromMax));
    
    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    const normalizedValue = (value - fromMin) / fromRange;
    
    return toMin + (normalizedValue * toRange);
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Delay initialization slightly to ensure all DOM elements are ready
    setTimeout(initVisualization, 500);
});

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', function() {
    if (renderer) {
        renderer.dispose();
    }
    
    // Dispose of geometries and materials
    scene.traverse(object => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        
        if (object.material) {
            if (Array.isArray(object.material)) {
                for (const material of object.material) {
                    disposeMaterial(material);
                }
            } else {
                disposeMaterial(object.material);
            }
        }
    });
});

// Helper function to dispose material and its textures
function disposeMaterial(material) {
    if (material.map) material.map.dispose();
    if (material.lightMap) material.lightMap.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    if (material.envMap) material.envMap.dispose();
    
    material.dispose();
}