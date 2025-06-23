// Main gallery script
let scene, camera, renderer, controls;
let paintings3D = [];
let raycaster, mouse;
let selectedPainting = null;
let isLoading = true;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 1;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('gallery-container').appendChild(renderer.domElement);

    // Add controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;

    // Setup raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 10, 10);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.1;
    spotLight.decay = 2;
    spotLight.distance = 200;
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Create gallery walls
    createGallery();

    // Add paintings to the gallery
    addPaintings();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);

    // Start animation loop
    animate();
}

// Create gallery environment
function createGallery() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(30, 10);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf5f5f5,
        roughness: 1.0,
        metalness: 0.0
    });
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -5;
    backWall.position.y = 5;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(20, 10);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -15;
    leftWall.position.y = 5;
    leftWall.position.z = 5;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(20, 10);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.x = 15;
    rightWall.position.y = 5;
    rightWall.position.z = 5;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

// Add paintings to the gallery
function addPaintings() {
    const loader = new THREE.TextureLoader();
    const paintingWidth = 2;
    const spacing = 3.5;
    const startX = -((paintings.length - 1) * spacing) / 2;
    
    // Load each painting
    paintings.forEach((painting, index) => {
        const textureUrl = `images/${painting.filename}`;
        
        loader.load(
            textureUrl,
            function(texture) {
                const aspectRatio = texture.image.height / texture.image.width;
                const paintingHeight = paintingWidth * aspectRatio;
                
                // Create frame
                const frameWidth = paintingWidth + 0.1;
                const frameHeight = paintingHeight + 0.1;
                const frameDepth = 0.05;
                
                const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
                const frameMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.8,
                    metalness: 0.2
                });
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                
                // Create painting
                const paintingGeometry = new THREE.PlaneGeometry(paintingWidth, paintingHeight);
                const paintingMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    side: THREE.DoubleSide
                });
                const paintingMesh = new THREE.Mesh(paintingGeometry, paintingMaterial);
                
                // Position the painting
                const x = startX + index * spacing;
                const y = 1.5 + paintingHeight / 2;
                const z = -4.9;
                
                frame.position.set(x, y, z);
                paintingMesh.position.set(x, y, z + 0.03);
                
                // Add to scene
                scene.add(frame);
                scene.add(paintingMesh);
                
                // Store reference with metadata
                paintings3D.push({
                    mesh: paintingMesh,
                    frame: frame,
                    data: painting
                });
                
                // Check if all paintings are loaded
                if (paintings3D.length === paintings.length) {
                    isLoading = false;
                    document.getElementById('loading').style.display = 'none';
                }
            },
            undefined,
            function(error) {
                console.error('Error loading texture:', error);
            }
        );
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle click events for painting selection
function onClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(paintings3D.map(p => p.mesh));
    
    if (intersects.length > 0) {
        // Find the selected painting
        const selectedMesh = intersects[0].object;
        const paintingObj = paintings3D.find(p => p.mesh === selectedMesh);
        
        if (paintingObj) {
            selectPainting(paintingObj);
        }
    }
}

// Select a painting and display its information
function selectPainting(paintingObj) {
    // Reset previous selection
    if (selectedPainting) {
        selectedPainting.frame.material.color.set(0x8B4513);
    }
    
    // Set new selection
    selectedPainting = paintingObj;
    selectedPainting.frame.material.color.set(0xFFD700);
    
    // Update info panel
    document.getElementById('painting-title').textContent = paintingObj.data.title;
    document.getElementById('painting-year').textContent = paintingObj.data.year;
    document.getElementById('painting-description').textContent = paintingObj.data.description;
    
    // Animate camera to focus on the painting
    const paintingPosition = new THREE.Vector3().copy(paintingObj.mesh.position);
    paintingPosition.z += 5;
    
    // Use simple animation for camera movement
    const startPosition = camera.position.clone();
    const endPosition = paintingPosition;
    const duration = 1000; // ms
    const startTime = Date.now();
    
    function animateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease function
        const ease = t => t<.5 ? 2*t*t : -1+(4-2*t)*t;
        const t = ease(progress);
        
        camera.position.lerpVectors(startPosition, endPosition, t);
        controls.target.copy(paintingObj.mesh.position);
        
        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        }
    }
    
    animateCamera();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Start the gallery when the page loads
window.addEventListener('load', init);
