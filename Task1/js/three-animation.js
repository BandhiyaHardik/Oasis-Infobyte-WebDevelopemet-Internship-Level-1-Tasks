document.addEventListener('DOMContentLoaded', function() {
    // Create a scene
    const scene = new THREE.Scene();
    
    // Create a camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    
    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('three-background').appendChild(renderer.domElement);
    
    // Add stars/particles
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 3000; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Create nebula-like effect
    const nebulaGeometry = new THREE.SphereGeometry(10, 32, 32);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
        color: 0x6c63ff,
        transparent: true,
        opacity: 0.1
    });
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);
    
    // Add animated wave geometry
    const waveGeometry = new THREE.PlaneGeometry(60, 60, 32, 32);
    const waveMaterial = new THREE.MeshBasicMaterial({
        color: 0x00f7ff,
        wireframe: true,
        transparent: true,
        opacity: 0.2
    });
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.rotation.x = Math.PI / 2;
    wave.position.y = -15;
    scene.add(wave);
    
    // Animation function
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate stars slowly
        stars.rotation.y += 0.0005;
        stars.rotation.z += 0.0003;
        
        // Rotate nebula
        nebula.rotation.y += 0.001;
        
        // Animate wave vertices
        const positions = waveGeometry.attributes.position.array;
        const time = Date.now() * 0.0005;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            positions[i + 2] = Math.sin((x + time) * 0.3) * Math.sin((y + time) * 0.3) * 3;
        }
        
        waveGeometry.attributes.position.needsUpdate = true;
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Start animation
    animate();
});