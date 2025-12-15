// modules/Renderer.js - COMPLETE PRODUCTION CODE

class CityRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1.0;
        this.offset = { x: 0, y: 0 };
        this.lastRenderTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        // Layer visibility
        this.layers = {
            water: true,
            terrain: true,
            shadows: true,
            grid: false,
            hatching: true,
            buildings: true,
            roads: true,
            walls: true,
            props: true,
            trees: true,
            labels: true,
            pois: true
        };
        
        // Style settings
        this.style = {
            buildingColor: '#8B7355',
            roadColor: '#c2b280',
            wallColor: '#654321',
            waterColor: '#4080a0',
            treeColor: '#2d5a27',
            gridColor: 'rgba(100, 100, 100, 0.2)',
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            hatchingDensity: 3,
            waterAnimation: true
        };
        
        // Performance optimization
        this.cache = new Map();
        this.needsRedraw = true;
        this.animationId = null;
        this.waterPhase = 0;
        
        // Initialize
        this.setupCanvas();
        this.startAnimationLoop();
    }
    
    setupCanvas() {
        // Set canvas to high DPI for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Set default styles
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
    }
    
    startAnimationLoop() {
        const animate = (timestamp) => {
            this.animationId = requestAnimationFrame(animate);
            
            // Throttle to target FPS
            if (timestamp - this.lastRenderTime < 1000 / this.fps) {
                return;
            }
            
            this.lastRenderTime = timestamp;
            this.frameCount++;
            
            // Update animations
            if (this.style.waterAnimation) {
                this.waterPhase = (this.waterPhase + 0.01) % (Math.PI * 2);
            }
            
            // Render if needed
            if (this.needsRedraw && this.currentCity) {
                this.render(this.currentCity);
                this.needsRedraw = false;
            }
        };
        
        animate(0);
    }
    
    stopAnimationLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    render(cityData) {
        if (!cityData) return;
        
        this.currentCity = cityData;
        
        // Clear canvas
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Apply transformations
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);
        
        // Render layers in correct order
        this.renderBackground();
        
        if (this.layers.water) this.renderWater(cityData.city.waterAreas);
        if (this.layers.grid) this.renderGrid();
        if (this.layers.terrain) this.renderTerrain(cityData.city);
        if (this.layers.shadows) this.renderShadows(cityData.city.blocks);
        if (this.layers.roads) this.renderRoads(cityData.city.roads);
        if (this.layers.buildings) this.renderBuildings(cityData.city.buildings);
        if (this.layers.walls) this.renderWalls(cityData.city.walls);
        if (this.layers.trees) this.renderTrees(cityData.city.trees);
        if (this.layers.props) this.renderProps(cityData.city.props);
        if (this.layers.hatching) this.renderHatching(cityData.city);
        if (this.layers.pois) this.renderPOIs(cityData.city.pois);
        if (this.layers.labels) this.renderLabels(cityData.city.labels);
        
        this.ctx.restore();
        
        // Draw performance overlay (debug)
        if (window.DEBUG_MODE) {
            this.drawPerformanceOverlay();
        }
    }
    
    renderBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height / this.scale);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            -this.offset.x / this.scale,
            -this.offset.y / this.scale,
            this.canvas.width / this.scale,
            this.canvas.height / this.scale
        );
    }
    
    renderWater(waterAreas) {
        if (!waterAreas || waterAreas.length === 0) return;
        
        waterAreas.forEach(area => {
            if (!area || area.length < 3) return;
            
            this.ctx.save();
            
            // Create water gradient
            const waterGradient = this.ctx.createLinearGradient(0, 0, 0, 100);
            waterGradient.addColorStop(0, 'rgba(64, 164, 223, 0.8)');
            waterGradient.addColorStop(1, 'rgba(32, 82, 111, 0.9)');
            
            this.ctx.fillStyle = waterGradient;
            this.ctx.beginPath();
            
            // Draw with wave effect
            area.forEach((point, i) => {
                const waveOffset = this.style.waterAnimation 
                    ? Math.sin(point.x * 0.01 + this.waterPhase) * 3
                    : 0;
                
                if (i === 0) {
                    this.ctx.moveTo(point.x, point.y + waveOffset);
                } else {
                    this.ctx.lineTo(point.x, point.y + waveOffset);
                }
            });
            
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add wave lines
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            
            for (let i = 0; i < area.length - 1; i++) {
                const waveOffset1 = Math.sin(area[i].x * 0.01 + this.waterPhase) * 3;
                const waveOffset2 = Math.sin(area[i + 1].x * 0.01 + this.waterPhase) * 3;
                
                this.ctx.beginPath();
                this.ctx.moveTo(area[i].x, area[i].y + waveOffset1);
                this.ctx.lineTo(area[i + 1].x, area[i + 1].y + waveOffset2);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    renderGrid() {
        const gridSize = 20;
        const startX = Math.floor((-this.offset.x / this.scale) / gridSize) * gridSize;
        const startY = Math.floor((-this.offset.y / this.scale) / gridSize) * gridSize;
        const endX = startX + (this.canvas.width / this.scale) + gridSize;
        const endY = startY + (this.canvas.height / this.scale) + gridSize;
        
        this.ctx.strokeStyle = this.style.gridColor;
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }
    
    renderTerrain(city) {
        // Render base terrain if any
        // This is a placeholder for future terrain features
    }
    
    renderShadows(blocks) {
        if (!this.layers.shadows || !blocks) return;
        
        this.ctx.save();
        this.ctx.fillStyle = this.style.shadowColor;
        
        blocks.forEach(block => {
            if (!block.vertices || block.vertices.length < 3) return;
            
            this.ctx.beginPath();
            block.vertices.forEach((vertex, i) => {
                if (i === 0) {
                    this.ctx.moveTo(vertex.x + 4, vertex.y + 4);
                } else {
                    this.ctx.lineTo(vertex.x + 4, vertex.y + 4);
                }
            });
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    renderRoads(roads) {
        if (!roads) return;
        
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        roads.forEach(road => {
            if (!road.from || !road.to) return;
            
            // Set road color based on type
            switch (road.type) {
                case 'main':
                    this.ctx.strokeStyle = '#c2b280';
                    this.ctx.lineWidth = road.width || 6;
                    break;
                case 'secondary':
                    this.ctx.strokeStyle = '#d4c9a8';
                    this.ctx.lineWidth = road.width || 4;
                    break;
                case 'alley':
                    this.ctx.strokeStyle = '#e5ddc8';
                    this.ctx.lineWidth = road.width || 2;
                    break;
                default:
                    this.ctx.strokeStyle = this.style.roadColor;
                    this.ctx.lineWidth = road.width || 4;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(road.from.x, road.from.y);
            this.ctx.lineTo(road.to.x, road.to.y);
            this.ctx.stroke();
        });
        
        this.ctx.restore();
    }
    
    renderBuildings(buildings) {
        if (!buildings) return;
        
        this.ctx.save();
        
        buildings.forEach(building => {
            // Draw building base
            this.ctx.save();
            this.ctx.translate(building.x, building.y);
            this.ctx.rotate(building.rotation || 0);
            
            // Set building color based on type
            switch (building.type) {
                case 'residential':
                    this.ctx.fillStyle = '#a1887f';
                    break;
                case 'commercial':
                    this.ctx.fillStyle = '#78909c';
                    break;
                case 'religious':
                    this.ctx.fillStyle = '#8d6e63';
                    break;
                case 'military':
                    this.ctx.fillStyle = '#5d4037';
                    break;
                case 'governmental':
                    this.ctx.fillStyle = '#6d4c41';
                    break;
                default:
                    this.ctx.fillStyle = this.style.buildingColor;
            }
            
            // Draw building shape
            this.ctx.fillRect(
                -building.width / 2,
                -building.height / 2,
                building.width,
                building.height
            );
            
            // Draw building outline
            this.ctx.strokeStyle = '#5a4a31';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                -building.width / 2,
                -building.height / 2,
                building.width,
                building.height
            );
            
            // Draw windows/doors for multi-story buildings
            if (building.floors > 1) {
                this.ctx.fillStyle = '#ffcc80';
                for (let floor = 0; floor < building.floors; floor++) {
                    // Draw windows
                    for (let i = 0; i < 2; i++) {
                        const windowSize = 1.5;
                        this.ctx.fillRect(
                            -building.width / 2 + 3 + (i * 4),
                            -building.height / 2 + 3 + (floor * 5),
                            windowSize,
                            windowSize
                        );
                    }
                }
            }
            
            this.ctx.restore();
        });
        
        this.ctx.restore();
    }
    
    renderWalls(walls) {
        if (!walls || walls.length < 2) return;
        
        this.ctx.save();
        
        // Draw wall line
        this.ctx.strokeStyle = this.style.wallColor;
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        walls.forEach((point, i) => {
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        
        // Close the wall if it's a loop
        if (walls.length > 2) {
            this.ctx.closePath();
        }
        
        this.ctx.stroke();
        
        // Draw wall towers
        this.ctx.fillStyle = '#543210';
        walls.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Tower detail
            this.ctx.fillStyle = '#654321';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    renderTrees(trees) {
        if (!trees) return;
        
        this.ctx.save();
        
        trees.forEach(tree => {
            // Draw tree trunk
            this.ctx.fillStyle = '#5d4037';
            this.ctx.beginPath();
            this.ctx.rect(
                tree.x - 1.5 * tree.size,
                tree.y - 8 * tree.size,
                3 * tree.size,
                8 * tree.size
            );
            this.ctx.fill();
            
            // Draw tree foliage
            this.ctx.fillStyle = this.style.treeColor;
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.arc(
                    tree.x,
                    tree.y - (i * 3 * tree.size),
                    5 * tree.size * (1 - i * 0.2),
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
    }
    
    renderProps(props) {
        if (!props) return;
        
        this.ctx.save();
        
        props.forEach(prop => {
            this.ctx.save();
            this.ctx.translate(prop.x, prop.y);
            this.ctx.rotate(prop.rotation || 0);
            
            switch (prop.type) {
                case 'well':
                    this.ctx.fillStyle = '#795548';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, prop.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Well detail
                    this.ctx.strokeStyle = '#5d4037';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, prop.width / 3, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;
                    
                case 'statue':
                    this.ctx.fillStyle = '#bdbdbd';
                    // Base
                    this.ctx.fillRect(-prop.width / 2, -prop.height / 2, prop.width, 3);
                    // Pedestal
                    this.ctx.fillRect(-prop.width / 3, -prop.height / 2 + 3, prop.width / 1.5, prop.height - 10);
                    // Figure
                    this.ctx.beginPath();
                    this.ctx.arc(0, -prop.height / 2 + 10, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'fountain':
                    this.ctx.fillStyle = '#80deea';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, prop.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Fountain center
                    this.ctx.fillStyle = '#4dd0e1';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, prop.width / 4, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'dock':
                    this.ctx.fillStyle = '#795548';
                    this.ctx.fillRect(-prop.width / 2, -prop.height / 2, prop.width, prop.height);
                    
                    // Dock posts
                    this.ctx.fillStyle = '#5d4037';
                    for (let i = -1; i <= 1; i += 2) {
                        this.ctx.fillRect(
                            i * (prop.width / 2 - 3),
                            -prop.height / 2,
                            3,
                            prop.height
                        );
                    }
                    break;
                    
                case 'keep':
                    this.ctx.fillStyle = '#5d4037';
                    // Tower base
                    this.ctx.fillRect(-prop.width / 2, -prop.height / 2, prop.width, prop.height);
                    
                    // Battlements
                    this.ctx.fillStyle = '#4a3428';
                    for (let i = -prop.width / 2 + 2; i < prop.width / 2; i += 6) {
                        this.ctx.fillRect(i, -prop.height / 2, 4, 3);
                    }
                    
                    // Windows
                    this.ctx.fillStyle = '#ffcc80';
                    for (let i = 0; i < 2; i++) {
                        for (let j = 0; j < 3; j++) {
                            this.ctx.fillRect(
                                -prop.width / 2 + 5 + (i * (prop.width - 10)),
                                -prop.height / 2 + 10 + (j * 10),
                                3,
                                5
                            );
                        }
                    }
                    break;
                    
                default:
                    // Generic prop
                    this.ctx.fillStyle = '#795548';
                    this.ctx.fillRect(-prop.width / 2, -prop.height / 2, prop.width, prop.height);
            }
            
            this.ctx.restore();
        });
        
        this.ctx.restore();
    }
    
    renderHatching(city) {
        if (this.style.hatchingDensity <= 0) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        // Hatch walls
        if (city.walls && city.walls.length > 1) {
            for (let i = 0; i < city.walls.length; i++) {
                const start = city.walls[i];
                const end = city.walls[(i + 1) % city.walls.length];
                const length = Math.sqrt(
                    Math.pow(end.x - start.x, 2) + 
                    Math.pow(end.y - start.y, 2)
                );
                
                const steps = Math.floor(length / this.style.hatchingDensity);
                for (let j = 0; j < steps; j++) {
                    const t = j / steps;
                    const x = start.x + t * (end.x - start.x);
                    const y = start.y + t * (end.y - start.y);
                    
                    // Draw diagonal hatch lines
                    this.ctx.beginPath();
                    this.ctx.moveTo(x - 5, y - 5);
                    this.ctx.lineTo(x + 5, y + 5);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.restore();
    }
    
    renderPOIs(pois) {
        if (!pois) return;
        
        this.ctx.save();
        
        pois.forEach(poi => {
            // Draw POI marker
            switch (poi.icon) {
                case 'tavern':
                    this.ctx.fillStyle = '#ff7043';
                    this.drawTavernMarker(poi.x, poi.y);
                    break;
                case 'temple':
                    this.ctx.fillStyle = '#ab47bc';
                    this.drawTempleMarker(poi.x, poi.y);
                    break;
                case 'market':
                    this.ctx.fillStyle = '#66bb6a';
                    this.drawMarketMarker(poi.x, poi.y);
                    break;
                case 'gate':
                    this.ctx.fillStyle = '#795548';
                    this.drawGateMarker(poi.x, poi.y);
                    break;
                case 'fountain':
                    this.ctx.fillStyle = '#29b6f6';
                    this.drawFountainMarker(poi.x, poi.y);
                    break;
                case 'secret':
                    this.ctx.fillStyle = '#9e9e9e';
                    this.drawSecretMarker(poi.x, poi.y);
                    break;
                default:
                    this.ctx.fillStyle = '#ffb74d';
                    this.drawGenericMarker(poi.x, poi.y);
            }
            
            // Draw label
            if (poi.label && this.ctx.measureText(poi.label).width < 100) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(poi.label, poi.x, poi.y - 12);
            }
        });
        
        this.ctx.restore();
    }
    
    drawTavernMarker(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 8);
        this.ctx.lineTo(x - 6, y + 4);
        this.ctx.lineTo(x + 6, y + 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Mug detail
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTempleMarker(x, y) {
        // Cross shape
        this.ctx.fillRect(x - 1, y - 8, 2, 16);
        this.ctx.fillRect(x - 8, y - 1, 16, 2);
    }
    
    drawMarketMarker(x, y) {
        // Coin/bag shape
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 8px Arial';
        this.ctx.fillText('$', x, y + 2);
    }
    
    drawGateMarker(x, y) {
        // Arch shape
        this.ctx.beginPath();
        this.ctx.arc(x, y - 3, 6, 0, Math.PI, true);
        this.ctx.lineTo(x - 6, y + 4);
        this.ctx.lineTo(x + 6, y + 4);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawFountainMarker(x, y) {
        // Water droplet
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 8);
        this.ctx.quadraticCurveTo(x + 5, y, x, y + 8);
        this.ctx.quadraticCurveTo(x - 5, y, x, y - 8);
        this.ctx.fill();
    }
    
    drawSecretMarker(x, y) {
        // Question mark in circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 8px Arial';
        this.ctx.fillText('?', x, y + 2);
    }
    
    drawGenericMarker(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderLabels(labels) {
        if (!labels) return;
        
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        labels.forEach(label => {
            if (label.text) {
                this.ctx.fillText(label.text, label.x, label.y);
            }
        });
        
        this.ctx.restore();
    }
    
    drawPerformanceOverlay() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`FPS: ${Math.round(this.fps)}`, 20, 30);
        this.ctx.fillText(`Scale: ${this.scale.toFixed(2)}x`, 20, 50);
        this.ctx.fillText(`Offset: ${Math.round(this.offset.x)}, ${Math.round(this.offset.y)}`, 20, 70);
        
        this.ctx.restore();
    }
    
    // Public methods
    setScale(scale) {
        this.scale = Math.max(0.1, Math.min(5, scale));
        this.needsRedraw = true;
    }
    
    setOffset(x, y) {
        this.offset.x = x;
        this.offset.y = y;
        this.needsRedraw = true;
    }
    
    toggleLayer(layerName) {
        if (this.layers.hasOwnProperty(layerName)) {
            this.layers[layerName] = !this.layers[layerName];
            this.needsRedraw = true;
        }
    }
    
    setStyle(styleName, value) {
        if (this.style.hasOwnProperty(styleName)) {
            this.style[styleName] = value;
            this.needsRedraw = true;
        }
    }
    
    zoomIn() {
        this.setScale(this.scale * 1.2);
    }
    
    zoomOut() {
        this.setScale(this.scale / 1.2);
    }
    
    resetView() {
        this.scale = 1.0;
        this.offset = { x: 0, y: 0 };
        this.needsRedraw = true;
    }
    
    getCanvasDataURL(type = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(type, quality);
    }
    
    getCanvasBlob(type = 'image/png', quality = 1.0) {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, type, quality);
        });
    }
    
    destroy() {
        this.stopAnimationLoop();
        this.cache.clear();
        this.currentCity = null;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CityRenderer;
} else {
    window.CityRenderer = CityRenderer;
}