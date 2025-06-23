// Performance optimization for the gallery
// This file contains functions to optimize image loading and performance

// Progressive image loading
function setupProgressiveLoading() {
    // Create a low-quality texture loader for initial fast loading
    const lowQualityLoader = new THREE.TextureLoader();
    lowQualityLoader.setPath('images/');
    
    // Create a high-quality texture loader for detailed textures
    const highQualityLoader = new THREE.TextureLoader();
    highQualityLoader.setPath('images/');
    
    return {
        loadTexture: function(filename, onLoad) {
            // First load low-quality version (we'll use the same texture initially)
            lowQualityLoader.load(
                filename,
                function(lowQualityTexture) {
                    // Immediately use the low quality texture
                    if (onLoad) onLoad(lowQualityTexture);
                    
                    // Then load high-quality version
                    highQualityLoader.load(
                        filename,
                        function(highQualityTexture) {
                            // Replace with high quality when loaded
                            if (onLoad) onLoad(highQualityTexture);
                        }
                    );
                }
            );
        }
    };
}

// Device detection for performance adjustments
function detectDeviceCapabilities() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowPowerDevice = isMobile && window.devicePixelRatio < 2;
    const isHighEndDevice = !isMobile && window.devicePixelRatio >= 2;
    
    return {
        isMobile: isMobile,
        isLowPowerDevice: isLowPowerDevice,
        isHighEndDevice: isHighEndDevice
    };
}

// Adjust renderer settings based on device capabilities
function optimizeRendererForDevice(renderer, capabilities) {
    if (capabilities.isLowPowerDevice) {
        // Lower resolution for mobile devices
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
        
        // Disable shadows on low-power devices
        renderer.shadowMap.enabled = false;
    } else if (capabilities.isMobile) {
        // Medium settings for better mobile devices
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Less demanding shadow type
    } else {
        // Full quality for desktop
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
}

// Optimize scene complexity based on device capabilities
function optimizeSceneForDevice(scene, capabilities) {
    // Find all lights in the scene
    scene.traverse(function(object) {
        if (object.isLight) {
            if (capabilities.isLowPowerDevice) {
                // Reduce shadow quality on low-power devices
                object.castShadow = false;
            } else if (capabilities.isMobile) {
                // Medium shadow settings for mobile
                if (object.shadow) {
                    object.shadow.mapSize.width = 512;
                    object.shadow.mapSize.height = 512;
                }
            }
        }
    });
}

// Throttle function for performance-heavy operations
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Apply these optimizations to the gallery
window.addEventListener('load', function() {
    // Wait for the gallery to initialize
    const checkGalleryReady = setInterval(function() {
        if (typeof scene !== 'undefined' && typeof renderer !== 'undefined') {
            clearInterval(checkGalleryReady);
            
            // Apply optimizations
            const capabilities = detectDeviceCapabilities();
            optimizeRendererForDevice(renderer, capabilities);
            optimizeSceneForDevice(scene, capabilities);
            
            // Throttle resize handler for better performance
            const originalResizeHandler = onWindowResize;
            window.removeEventListener('resize', originalResizeHandler);
            window.addEventListener('resize', throttle(originalResizeHandler, 100));
            
            console.log('Performance optimizations applied');
        }
    }, 100);
});
