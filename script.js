// script.js - MAIN APPLICATION - COMPLETE PRODUCTION CODE

document.addEventListener('DOMContentLoaded', () => {
    console.log('⚔️ Arcane Realm Builder v1.0 Initializing...');
    
    // Initialize application
    const app = new ArcaneRealmApp();
    window.arcaneRealmApp = app; // Make available globally for debugging
    
    // Show loading screen
    app.showLoading();
    
    // Initialize with a slight delay to ensure DOM is ready
    setTimeout(() => {
        app.init().then(() => {
            app.hideLoading();
            console.log('✅ Arcane Realm Builder Ready!');
        }).catch(error => {
            console.error('❌ Failed to initialize:', error);
            app.showError('Failed to initialize. Please refresh the page.');
            app.hideLoading();
        });
    }, 100);
});

class ArcaneRealmApp {
    constructor() {
        // Core components
        this.canvas = null;
        this.renderer = null;
        this.generator = null;
        this.ui = null;
        this.exporter = null;
        this.stateManager = null;
        this.loreGenerator = null;
        
        // Current state
        this.currentCity = null;
        this.waterLevel = 0.3;
        this.tags = [];
        this.size = 'medium';
        this.seed = Math.floor(Math.random() * 999999) + 1;
        this.customSize = 12;
        
        // UI state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastOffset = { x: 0, y: 0 };
        this.isGenerating = false;
        
        // Configuration
        this.config = {
            autoSave: true,
            showGrid: false,
            enableAnimations: true,
            defaultSize: 'medium',
            defaultWaterLevel: 0.3,
            maxZoom: 5.0,
            minZoom: 0.1
        };
        
        // Initialize immediately available DOM elements
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.canvasContainer = document.getElementById('canvas-container');
    }

    async init() {
        try {
            // Get canvas element
            this.canvas = document.getElementById('map-canvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            // Initialize renderer
            this.renderer = new CityRenderer(this.canvas);
            
            // Initialize generator
            this.generator = new CityGenerator();
            
            // Initialize state manager
            this.stateManager = new StateManager(this);
            
            // Initialize UI components
            this.ui = {
                contextMenu: new ContextMenu(this),
                legend: new Legend(this)
            };
            
            // Initialize exporter
            this.exporter = new CityExporter(this);
            
            // Initialize lore generator
            this.loreGenerator = new LoreGenerator(this);
            
            // Setup canvas size and events
            this.setupCanvas();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Check URL for initial state
            const urlState = this.stateManager.getStateFromURL();
            
            // Generate initial city
            await this.generateCity({
                seed: urlState.seed,
                size: urlState.size,
                tags: urlState.tags,
                waterLevel: urlState.water
            });
            
            // Update URL with current state
            this.stateManager.updateURL({
                seed: this.seed,
                size: this.size,
                tags: this.tags,
                water: this.waterLevel
            });
            
            // Start render loop
            this.startRenderLoop();
            
            // Load any saved state
            this.stateManager.loadState();
            
            return true;
            
        } catch (error) {
            console.error('Error initializing app:', error);
            throw error;
        }
    }

    setupCanvas() {
        // Set initial canvas size
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.renderer.needsRedraw = true;
        });
        
        // Setup canvas context
        const ctx = this.canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'high';
    }

    resizeCanvas() {
        const container = this.canvasContainer || document.body;
        const rect = container.getBoundingClientRect();
        
        // Account for device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        
        // Set canvas dimensions
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Set CSS dimensions
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale context
        const ctx = this.canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        this.renderer.needsRedraw = true;
    }

    setupEventListeners() {
        // Mouse events for panning and zooming
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.startDragging(e);
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.drag(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.stopDragging();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.stopDragging();
        });
        
        // Mouse wheel for zooming
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.startDragging(e.touches[0]);
            } else if (e.touches.length === 2) {
                this.handlePinchStart(e);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isDragging) {
                this.drag(e.touches[0]);
            } else if (e.touches.length === 2) {
                this.handlePinchMove(e);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            this.stopDragging();
        });
        
        // Double-click to reset view
        this.canvas.addEventListener('dblclick', () => {
            this.resetView();
        });
        
        // Right-click for context menu is handled by ContextMenu class
        
        // Button event listeners
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateNewCity());
        }
        
        const restoreBtn = document.getElementById('restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.restoreLastMap());
        }
        
        const supportBtn = document.getElementById('support-btn');
        if (supportBtn) {
            supportBtn.addEventListener('click', () => this.showSupportDialog());
        }
        
        const shortcutsBtn = document.getElementById('shortcuts-btn');
        if (shortcutsBtn) {
            shortcutsBtn.addEventListener('click', () => this.showShortcutsModal());
        }
        
        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || 
                e.target.closest('.modal-close')) {
                this.closeModals();
            }
            
            // Close modals when clicking outside
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
                this.ui.contextMenu.hide();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Check for Ctrl/Cmd combinations first
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.exportPNG();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.duplicateCity();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copySeed();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.stateManager.redo();
                        } else {
                            this.stateManager.undo();
                        }
                        break;
                    case 'g':
                        e.preventDefault();
                        this.generateNewCity();
                        break;
                }
            } else {
                // Single key shortcuts
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.generateNewCity();
                        break;
                    case '+':
                    case '=':
                        e.preventDefault();
                        this.renderer.zoomIn();
                        break;
                    case '-':
                    case '_':
                        e.preventDefault();
                        this.renderer.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        this.resetView();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetView();
                        break;
                    case 'g':
                        e.preventDefault();
                        this.toggleGrid();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.ui.legend.toggle();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.showAddPOIDialog();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.showShortcutsModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFullscreen();
                        break;
                }
            }
        });
    }

    startRenderLoop() {
        const render = () => {
            if (this.renderer.needsRedraw && this.currentCity) {
                this.renderer.render(this.currentCity);
            }
            requestAnimationFrame(render);
        };
        render();
    }

    async generateCity(options = {}) {
        this.isGenerating = true;
        this.showLoading();
        
        try {
            // Extract options with defaults
            const seed = options.seed || this.seed || Math.floor(Math.random() * 999999) + 1;
            const size = options.size || this.size || 'medium';
            const tags = options.tags || this.tags || [];
            const waterLevel = options.waterLevel || this.waterLevel || 0.3;
            
            // Update instance state
            this.seed = seed;
            this.size = size;
            this.tags = tags;
            this.waterLevel = waterLevel;
            
            // Parse custom size
            let parsedSize = size;
            if (size === 'custom') {
                parsedSize = this.customSize;
            }
            
            // Generate city
            const generator = new CityGenerator(seed, parsedSize, tags);
            this.currentCity = generator.generate();
            
            // Apply water level
            this.applyWaterLevel(waterLevel);
            
            // Update UI
            if (this.ui.legend) {
                this.ui.legend.update(this.currentCity);
            }
            
            if (this.ui.contextMenu) {
                this.ui.contextMenu.updateMenuState();
            }
            
            // Force redraw
            this.renderer.needsRedraw = true;
            
            // Save state
            if (this.stateManager && this.config.autoSave) {
                this.stateManager.saveState();
            }
            
            console.log(`City generated: seed=${seed}, size=${size}, tags=${tags.length}`);
            
            return this.currentCity;
            
        } catch (error) {
            console.error('Error generating city:', error);
            this.showError('Failed to generate city. Please try again.');
            throw error;
            
        } finally {
            this.isGenerating = false;
            this.hideLoading();
        }
    }

    async generateNewCity() {
        // Generate new random seed
        const newSeed = Math.floor(Math.random() * 999999) + 1;
        return this.generateCity({ seed: newSeed });
    }

    async generateCityFromSeed(seed) {
        return this.generateCity({ seed: seed });
    }

    duplicateCity() {
        if (!this.currentCity) return;
        
        // Create a copy with a new seed
        const newSeed = this.currentCity.meta.seed + 1;
        this.generateCity({
            seed: newSeed,
            size: this.size,
            tags: this.tags,
            waterLevel: this.waterLevel
        });
    }

    applyWaterLevel(level) {
        if (!this.currentCity || !this.currentCity.city.waterAreas) return;
        
        this.waterLevel = Math.max(0, Math.min(1, level));
        
        // Update water areas based on level
        // In a more complex implementation, this would adjust water height
        // For now, we'll just store the level
        this.renderer.needsRedraw = true;
    }

    addPOI(poiData) {
        if (!this.currentCity) return;
        
        if (!this.currentCity.city.pois) {
            this.currentCity.city.pois = [];
        }
        
        this.currentCity.city.pois.push(poiData);
        this.renderer.needsRedraw = true;
        
        // Save state
        if (this.stateManager) {
            this.stateManager.saveState();
        }
    }

    addLabel(labelData) {
        if (!this.currentCity) return;
        
        if (!this.currentCity.city.labels) {
            this.currentCity.city.labels = [];
        }
        
        this.currentCity.city.labels.push(labelData);
        this.renderer.needsRedraw = true;
        
        // Save state
        if (this.stateManager) {
            this.stateManager.saveState();
        }
    }

    startDragging(event) {
        this.isDragging = true;
        this.dragStart = {
            x: event.clientX - this.renderer.offset.x,
            y: event.clientY - this.renderer.offset.y
        };
        this.lastOffset = { ...this.renderer.offset };
        this.canvas.style.cursor = 'grabbing';
    }

    drag(event) {
        if (!this.isDragging) return;
        
        this.renderer.offset.x = event.clientX - this.dragStart.x;
        this.renderer.offset.y = event.clientY - this.dragStart.y;
        this.renderer.needsRedraw = true;
    }

    stopDragging() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
        
        // Save state if position changed significantly
        if (Math.abs(this.renderer.offset.x - this.lastOffset.x) > 10 ||
            Math.abs(this.renderer.offset.y - this.lastOffset.y) > 10) {
            if (this.stateManager) {
                this.stateManager.saveState();
            }
        }
    }

    handleZoom(event) {
        event.preventDefault();
        
        const zoomIntensity = 0.001;
        const zoomFactor = 1 + (event.deltaY * zoomIntensity);
        const newScale = this.renderer.scale * zoomFactor;
        
        // Clamp zoom level
        const clampedScale = Math.max(
            this.config.minZoom,
            Math.min(this.config.maxZoom, newScale)
        );
        
        // Zoom towards mouse position
        const mouseX = event.clientX - this.canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - this.canvas.getBoundingClientRect().top;
        
        const worldX = (mouseX - this.renderer.offset.x) / this.renderer.scale;
        const worldY = (mouseY - this.renderer.offset.y) / this.renderer.scale;
        
        this.renderer.scale = clampedScale;
        
        this.renderer.offset.x = mouseX - worldX * this.renderer.scale;
        this.renderer.offset.y = mouseY - worldY * this.renderer.scale;
        
        this.renderer.needsRedraw = true;
    }

    handlePinchStart(event) {
        if (event.touches.length !== 2) return;
        
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        this.pinchStartDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        this.pinchStartScale = this.renderer.scale;
        this.pinchCenter = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    handlePinchMove(event) {
        if (event.touches.length !== 2 || !this.pinchStartDistance) return;
        
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        const zoomFactor = currentDistance / this.pinchStartDistance;
        const newScale = this.pinchStartScale * zoomFactor;
        
        // Clamp zoom level
        const clampedScale = Math.max(
            this.config.minZoom,
            Math.min(this.config.maxZoom, newScale)
        );
        
        // Adjust offset to zoom towards pinch center
        const centerX = this.pinchCenter.x - this.canvas.getBoundingClientRect().left;
        const centerY = this.pinchCenter.y - this.canvas.getBoundingClientRect().top;
        
        const worldX = (centerX - this.renderer.offset.x) / this.pinchStartScale;
        const worldY = (centerY - this.renderer.offset.y) / this.pinchStartScale;
        
        this.renderer.scale = clampedScale;
        
        this.renderer.offset.x = centerX - worldX * this.renderer.scale;
        this.renderer.offset.y = centerY - worldY * this.renderer.scale;
        
        this.renderer.needsRedraw = true;
    }

    resetView() {
        this.renderer.resetView();
        
        // Save state
        if (this.stateManager) {
            this.stateManager.saveState();
        }
    }

    toggleGrid() {
        this.renderer.toggleLayer('grid');
        this.config.showGrid = this.renderer.layers.grid;
        
        // Save state
        if (this.stateManager) {
            this.stateManager.saveState();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Export methods
    async exportPNG() {
        try {
            await this.exporter.exportPNG({
                includeLegend: true,
                includeNotes: true,
                dpi: 150,
                filename: `arcane_realm_${this.seed}.png`
            });
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export PNG');
        }
    }

    async exportSVG() {
        try {
            await this.exporter.exportSVG({
                includeLegend: true,
                includeNotes: true,
                filename: `arcane_realm_${this.seed}.svg`
            });
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export SVG');
        }
    }

    async exportPDF() {
        try {
            await this.exporter.exportPDF({
                includeLegend: true,
                includeNotes: true,
                filename: `arcane_realm_${this.seed}.pdf`
            });
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export PDF');
        }
    }

    async exportJSON() {
        try {
            await this.exporter.exportJSON({
                filename: `arcane_realm_${this.seed}.json`
            });
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export JSON');
        }
    }

    async exportBatch() {
        try {
            await this.exporter.exportBatch(10, {
                prefix: 'arcane_realm_batch',
                format: 'png'
            });
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export batch');
        }
    }

    // UI Methods
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    showError(message) {
        // Create or show error modal
        let errorModal = document.getElementById('error-modal');
        if (!errorModal) {
            errorModal = document.createElement('div');
            errorModal.id = 'error-modal';
            errorModal.className = 'modal';
            errorModal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <h3 style="color: #ff6b6b;">⚠️ Error</h3>
                    <p style="color: #d0e0ff; margin: 15px 0;" id="error-message"></p>
                    <button class="modal-close" style="padding: 8px 20px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            `;
            document.body.appendChild(errorModal);
        }
        
        document.getElementById('error-message').textContent = message;
        errorModal.style.display = 'flex';
    }

    showSupportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'flex';
        dialog.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3 style="color: #ff6b6b;">❤️ Support the Creator</h3>
                <p style="color: #d0e0ff; margin: 15px 0;">
                    If you enjoy using Arcane Realm Builder, consider supporting its development!
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <a href="https://patreon.com" target="_blank" style="padding: 12px; background: #ff424d; color: white; text-align: center; border-radius: 6px; text-decoration: none;">
                        🏛️ Patreon
                    </a>
                    <a href="https://ko-fi.com" target="_blank" style="padding: 12px; background: #29abe0; color: white; text-align: center; border-radius: 6px; text-decoration: none;">
                        ☕ Ko-fi
                    </a>
                    <a href="https://buymeacoffee.com" target="_blank" style="padding: 12px; background: #ffdd00; color: #333; text-align: center; border-radius: 6px; text-decoration: none;">
                        🍵 Buy Me a Coffee
                    </a>
                    <a href="#" style="padding: 12px; background: #8ab4f8; color: white; text-align: center; border-radius: 6px; text-decoration: none;">
                        📦 Purchase Full Version
                    </a>
                </div>
                <p style="color: #8ab4f8; font-size: 12px; margin-top: 20px;">
                    Your support helps fund new features, bug fixes, and performance improvements!
                </p>
                <button class="modal-close" style="margin-top: 20px; padding: 8px 20px; background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Close button
        dialog.querySelector('.modal-close').addEventListener('click', () => {
            dialog.remove();
        });
        
        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    showShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal') || this.createShortcutsModal();
        modal.style.display = 'flex';
    }

    createShortcutsModal() {
        const modal = document.createElement('div');
        modal.id = 'shortcuts-modal';
        modal.className = 'modal';
        
        const shortcuts = [
            { key: 'Enter', description: 'Generate new map' },
            { key: 'Ctrl+S', description: 'Export as PNG' },
            { key: 'Ctrl+D', description: 'Duplicate current map' },
            { key: 'Ctrl+C', description: 'Copy seed to clipboard' },
            { key: 'Ctrl+Z', description: 'Undo' },
            { key: 'Ctrl+Shift+Z', description: 'Redo' },
            { key: '+ / -', description: 'Zoom in/out' },
            { key: '0 or R', description: 'Reset view' },
            { key: 'G', description: 'Toggle grid' },
            { key: 'L', description: 'Toggle legend' },
            { key: 'A', description: 'Add point of interest' },
            { key: 'F', description: 'Toggle fullscreen' },
            { key: 'H', description: 'Show this help' },
            { key: 'Right Click', description: 'Open context menu' },
            { key: 'Mouse Wheel', description: 'Zoom' },
            { key: 'Drag', description: 'Pan around map' }
        ];
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <h2><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h2>
                <div class="shortcuts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; margin: 20px 0;">
                    ${shortcuts.map(shortcut => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(40, 45, 70, 0.6); border-radius: 6px; border-left: 3px solid #4a9eff;">
                            <kbd style="background: rgba(20, 25, 40, 0.8); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(100, 120, 180, 0.4); font-family: 'Courier New', monospace; font-size: 14px; color: #c0e0ff; min-width: 100px; text-align: center;">${shortcut.key}</kbd>
                            <span style="color: #d0e0ff; margin-left: 15px;">${shortcut.description}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="modal-close" style="padding: 10px 30px; background: linear-gradient(135deg, #4a9eff, #6b46c1); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: block; margin: 0 auto;">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        return modal;
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showAddPOIDialog() {
        this.ui.contextMenu.showAddPOIDialog();
    }

    restoreLastMap() {
        const state = this.stateManager.loadState();
        if (state) {
            this.showNotification('Last map restored!');
        } else {
            this.showError('No saved map found');
        }
    }

    shareCity() {
        const url = this.stateManager.getShareableURL();
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('Shareable URL copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy URL: ', err);
            
            // Fallback: show URL in prompt
            prompt('Copy this URL to share:', url);
        });
    }

    copySeed() {
        if (!this.currentCity) return;
        
        const seed = this.currentCity.meta.seed;
        navigator.clipboard.writeText(seed.toString()).then(() => {
            this.showNotification(`Seed ${seed} copied to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy seed: ', err);
            prompt('Copy this seed:', seed);
        });
    }

    showNotification(message, duration = 3000) {
        // Remove existing notification
        const existing = document.getElementById('notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(35, 40, 65, 0.95);
            border: 1px solid rgba(80, 110, 180, 0.6);
            border-radius: 8px;
            padding: 12px 20px;
            color: #ffffff;
            font-size: 14px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    // Utility methods
    getCityStats() {
        if (!this.currentCity) return null;
        
        return {
            seed: this.currentCity.meta.seed,
            blocks: this.currentCity.city.blocks?.length || 0,
            buildings: this.currentCity.city.buildings?.length || 0,
            roads: this.currentCity.city.roads?.length || 0,
            pois: this.currentCity.city.pois?.length || 0,
            tags: this.currentCity.city.tags || []
        };
    }

    generateLore() {
        if (!this.currentCity) return null;
        return this.loreGenerator.generateCityLore(this.currentCity);
    }

    // Cleanup
    destroy() {
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        // Remove event listeners
        // (In a production app, you'd want to properly clean up all event listeners)
        
        console.log('Arcane Realm Builder destroyed');
    }
}

// Export for use in Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArcaneRealmApp;
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
`;
document.head.appendChild(style);