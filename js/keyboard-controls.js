// Keyboard navigation controls for the gallery
let currentPaintingIndex = -1;

// Add keyboard event listener
window.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
    // Only handle keyboard navigation when gallery is loaded
    if (isLoading || paintings3D.length === 0) return;
    
    switch(event.key) {
        case 'ArrowLeft':
            // Navigate to previous painting
            navigateToPainting(-1);
            break;
        case 'ArrowRight':
            // Navigate to next painting
            navigateToPainting(1);
            break;
        case 'Home':
            // Navigate to first painting
            selectPaintingByIndex(0);
            break;
        case 'End':
            // Navigate to last painting
            selectPaintingByIndex(paintings3D.length - 1);
            break;
        case 'Escape':
            // Reset camera to overview position
            resetCameraPosition();
            break;
        case 'i':
        case 'I':
            // Toggle info panel
            toggleInfoPanel();
            break;
    }
}

// Navigate relative to current painting
function navigateToPainting(direction) {
    // If no painting is selected, select the first or last one
    if (currentPaintingIndex === -1) {
        currentPaintingIndex = direction > 0 ? 0 : paintings3D.length - 1;
    } else {
        // Calculate new index with wrapping
        currentPaintingIndex = (currentPaintingIndex + direction + paintings3D.length) % paintings3D.length;
    }
    
    selectPaintingByIndex(currentPaintingIndex);
}

// Select painting by index
function selectPaintingByIndex(index) {
    if (index >= 0 && index < paintings3D.length) {
        currentPaintingIndex = index;
        selectPainting(paintings3D[index]);
    }
}

// Reset camera to overview position
function resetCameraPosition() {
    const startPosition = camera.position.clone();
    const endPosition = new THREE.Vector3(0, 5, 15);
    const duration = 1000; // ms
    const startTime = Date.now();
    
    function animateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease function
        const ease = t => t<.5 ? 2*t*t : -1+(4-2*t)*t;
        const t = ease(progress);
        
        camera.position.lerpVectors(startPosition, endPosition, t);
        controls.target.set(0, 5, 0);
        
        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        }
    }
    
    animateCamera();
    
    // Reset selection
    if (selectedPainting) {
        selectedPainting.frame.material.color.set(0x8B4513);
        selectedPainting = null;
    }
    
    // Reset info panel
    document.getElementById('painting-title').textContent = "Gallery Overview";
    document.getElementById('painting-year').textContent = "";
    document.getElementById('painting-description').textContent = "Use arrow keys to navigate between paintings. Press ESC to return to this overview.";
    
    currentPaintingIndex = -1;
}

// Toggle info panel visibility
let infoPanelVisible = true;
function toggleInfoPanel() {
    const infoPanel = document.getElementById('info');
    infoPanelVisible = !infoPanelVisible;
    
    if (infoPanelVisible) {
        infoPanel.style.transform = 'translateY(0)';
        infoPanel.style.opacity = '1';
    } else {
        infoPanel.style.transform = 'translateY(100%)';
        infoPanel.style.opacity = '0';
    }
}

// Update the selectPainting function in gallery.js to track current index
const originalSelectPainting = selectPainting;
selectPainting = function(paintingObj) {
    // Call the original function
    originalSelectPainting(paintingObj);
    
    // Update current index
    currentPaintingIndex = paintings3D.findIndex(p => p === paintingObj);
};
