// modules/UI.js - COMPLETE PRODUCTION CODE

class ContextMenu {
    constructor(app) {
        this.app = app;
        this.menu = null;
        this.submenus = new Map();
        this.currentTarget = null;
        this.init();
    }

    init() {
        this.createMenu();
        this.attachEventListeners();
    }

    createMenu() {
        // Remove existing menu if any
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        this.menu.className = 'context-menu';
        this.menu.style.cssText = `
            position: fixed;
            background: rgba(35, 40, 65, 0.97);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(90, 120, 200, 0.5);
            border-radius: 8px;
            padding: 8px 0;
            min-width: 220px;
            max-width: 300px;
            box-shadow: 
                0 10px 40px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.05);
            z-index: 1500;
            display: none;
            animation: contextMenuAppear 0.15s ease;
            font-family: 'Segoe UI', sans-serif;
        `;

        // Add styles for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes contextMenuAppear {
                from {
                    opacity: 0;
                    transform: scale(0.95) translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            .context-menu-item {
                padding: 10px 20px;
                color: #d0e0ff;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.15s ease;
                position: relative;
                white-space: nowrap;
            }
            
            .context-menu-item:hover {
                background: rgba(60, 80, 140, 0.6);
                color: #ffffff;
                padding-left: 25px;
            }
            
            .context-menu-item:hover::before {
                content: '→';
                position: absolute;
                left: 10px;
                color: #4a9eff;
            }
            
            .context-menu-separator {
                height: 1px;
                background: rgba(80, 100, 150, 0.4);
                margin: 6px 15px;
            }
            
            .context-menu-item.disabled {
                color: #666;
                cursor: not-allowed;
            }
            
            .context-menu-item.disabled:hover {
                background: transparent;
                color: #666;
                padding-left: 20px;
            }
            
            .context-menu-item.disabled:hover::before {
                content: none;
            }
            
            .context-menu-item.has-submenu::after {
                content: '▶';
                font-size: 10px;
                color: #8ab4f8;
                margin-left: 10px;
            }
            
            .context-submenu {
                display: none;
                position: absolute;
                left: 100%;
                top: 0;
                background: rgba(40, 45, 75, 0.98);
                border: 1px solid rgba(100, 130, 210, 0.5);
                border-radius: 8px;
                min-width: 200px;
                box-shadow: 10px 0 30px rgba(0, 0, 0, 0.4);
                z-index: 1501;
            }
            
            .context-submenu-item {
                padding: 8px 15px;
                color: #c0d0ff;
                font-size: 13px;
                cursor: pointer;
            }
            
            .context-submenu-item label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                width: 100%;
            }
            
            .context-submenu-item:hover {
                background: rgba(60, 80, 140, 0.6);
            }
            
            .context-menu-checkbox {
                width: 16px;
                height: 16px;
                accent-color: #4a9eff;
            }
            
            .context-menu-slider {
                width: 100%;
                margin: 5px 0;
            }
            
            .context-menu-color-picker {
                width: 30px;
                height: 30px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);

        // Build menu structure
        this.buildMenuStructure();
        document.body.appendChild(this.menu);
    }

    buildMenuStructure() {
        const menuItems = [
            {
                label: 'Generate New Realm',
                icon: '🎲',
                action: () => this.app.generateNewCity(),
                shortcut: 'Enter'
            },
            {
                label: 'Duplicate Current',
                icon: '📋',
                action: () => this.app.duplicateCity(),
                shortcut: 'Ctrl+D'
            },
            { type: 'separator' },
            {
                label: 'Size',
                icon: '📏',
                submenu: this.createSizeSubmenu()
            },
            {
                label: 'Tags',
                icon: '🏷️',
                submenu: this.createTagsSubmenu()
            },
            {
                label: 'Style',
                icon: '🎨',
                submenu: this.createStyleSubmenu()
            },
            { type: 'separator' },
            {
                label: 'Add Point of Interest',
                icon: '📍',
                action: () => this.showAddPOIDialog(),
                shortcut: 'A'
            },
            {
                label: 'Add Label',
                icon: '🏷️',
                action: () => this.showAddLabelDialog(),
                shortcut: 'L'
            },
            { type: 'separator' },
            {
                label: 'Layers',
                icon: '📋',
                submenu: this.createLayersSubmenu()
            },
            {
                label: 'Water Level',
                icon: '💧',
                submenu: this.createWaterLevelSubmenu()
            },
            { type: 'separator' },
            {
                label: 'Export Options',
                icon: '💾',
                submenu: this.createExportSubmenu()
            },
            {
                label: 'Share Realm',
                icon: '🔗',
                action: () => this.app.shareCity(),
                shortcut: 'Ctrl+S'
            },
            { type: 'separator' },
            {
                label: 'Copy Seed',
                icon: '🔑',
                action: () => this.app.copySeed(),
                shortcut: 'Ctrl+C'
            },
            {
                label: 'Reset View',
                icon: '🗺️',
                action: () => this.app.resetView(),
                shortcut: 'R'
            }
        ];

        menuItems.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                this.menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                if (item.disabled) menuItem.classList.add('disabled');
                if (item.submenu) menuItem.classList.add('has-submenu');

                menuItem.innerHTML = `
                    <span>${item.icon ? `${item.icon} ` : ''}${item.label}</span>
                    ${item.shortcut ? `<span style="color: #8ab4f8; font-size: 12px;">${item.shortcut}</span>` : ''}
                `;

                if (item.action) {
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.action();
                        this.hide();
                    });
                }

                if (item.submenu) {
                    const submenu = document.createElement('div');
                    submenu.className = 'context-submenu';
                    submenu.innerHTML = item.submenu;
                    menuItem.appendChild(submenu);
                    
                    menuItem.addEventListener('mouseenter', () => {
                        this.showSubmenu(menuItem);
                    });
                    
                    menuItem.addEventListener('mouseleave', (e) => {
                        setTimeout(() => {
                            if (!submenu.matches(':hover') && !menuItem.matches(':hover')) {
                                submenu.style.display = 'none';
                            }
                        }, 100);
                    });
                    
                    submenu.addEventListener('mouseleave', () => {
                        submenu.style.display = 'none';
                    });
                }

                this.menu.appendChild(menuItem);
            }
        });
    }

    createSizeSubmenu() {
        return `
            <div class="context-submenu-item">
                <label>
                    <input type="radio" name="size" value="small" class="context-menu-checkbox">
                    Small (Village)
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="radio" name="size" value="medium" class="context-menu-checkbox" checked>
                    Medium (Town)
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="radio" name="size" value="large" class="context-menu-checkbox">
                    Large (City)
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="radio" name="size" value="custom" class="context-menu-checkbox">
                    Custom
                </label>
            </div>
            <div class="context-submenu-item" style="padding: 10px 15px;">
                <input type="range" min="1" max="200" value="12" class="context-menu-slider" id="custom-size-slider">
                <div style="text-align: center; font-size: 11px; color: #8ab4f8;" id="custom-size-value">12 blocks</div>
            </div>
        `;
    }

    createTagsSubmenu() {
        const tags = [
            { id: 'central-plaza', label: 'Central Plaza', icon: '⛲' },
            { id: 'citadel', label: 'Citadel', icon: '🏰' },
            { id: 'city-walls', label: 'City Walls', icon: '🧱' },
            { id: 'waterfront', label: 'Waterfront', icon: '⚓' },
            { id: 'forests', label: 'Forests', icon: '🌲' },
            { id: 'coast', label: 'Coast', icon: '🏝️' },
            { id: 'lake', label: 'Lake', icon: '🌊' },
            { id: 'backdoor', label: 'Secret Entrances', icon: '🚪' },
            { id: 'chaotic', label: 'Chaotic Layout', icon: '🌀' },
            { id: 'compact', label: 'Compact', icon: '📦' },
            { id: 'dry', label: 'Dry (No Water)', icon: '🏜️' },
            { id: 'multi-level', label: 'Multi-Level', icon: '🏗️' }
        ];

        return tags.map(tag => `
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" data-tag="${tag.id}" class="context-menu-checkbox">
                    ${tag.icon} ${tag.label}
                </label>
            </div>
        `).join('');
    }

    createStyleSubmenu() {
        return `
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-style="shadows" checked>
                    Shadows
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-style="grid">
                    Grid
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-style="hatching" checked>
                    Hatching
                </label>
            </div>
            <div class="context-submenu-item">
                <label style="display: block;">
                    <div>Hatching Density</div>
                    <input type="range" min="1" max="5" value="3" class="context-menu-slider" id="hatching-density-slider">
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-style="props" checked>
                    Props
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-style="water-animation" checked>
                    Water Animation
                </label>
            </div>
        `;
    }

    createLayersSubmenu() {
        return `
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-layer="buildings" checked>
                    Buildings
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-layer="roads" checked>
                    Roads
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-layer="walls" checked>
                    Walls
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-layer="water" checked>
                    Water
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-layer="trees" checked>
                    Trees
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-layer="pois" checked>
                    Points of Interest
                </label>
            </div>
            <div class="context-submenu-item">
                <label>
                    <input type="checkbox" class="context-menu-checkbox" data-layer="labels" checked>
                    Labels
                </label>
            </div>
        `;
    }

    createWaterLevelSubmenu() {
        return `
            <div class="context-submenu-item" style="padding: 10px 15px;">
                <div style="margin-bottom: 5px; color: #8ab4f8;">Water Level: <span id="water-level-value">0.3</span></div>
                <input type="range" min="0" max="100" value="30" class="context-menu-slider" id="water-level-slider">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 5px;">
                    <span>Dry</span>
                    <span>Normal</span>
                    <span>Flooded</span>
                </div>
            </div>
        `;
    }

    createExportSubmenu() {
        return `
            <div class="context-submenu-item" data-action="export-png">
                <span>📸 PNG Image</span>
                <span style="color: #8ab4f8; font-size: 12px;">High Quality</span>
            </div>
            <div class="context-submenu-item" data-action="export-svg">
                <span>🎨 SVG Vector</span>
                <span style="color: #8ab4f8; font-size: 12px;">Editable</span>
            </div>
            <div class="context-submenu-item" data-action="export-pdf">
                <span>📄 PDF Document</span>
                <span style="color: #8ab4f8; font-size: 12px;">Printable</span>
            </div>
            <div class="context-submenu-item" data-action="export-json">
                <span>📊 JSON Data</span>
                <span style="color: #8ab4f8; font-size: 12px;">For 3D Viewer</span>
            </div>
            <div class="context-submenu-item" data-action="export-batch">
                <span>📦 Batch Export</span>
                <span style="color: #8ab4f8; font-size: 12px;">10 Variants</span>
            </div>
        `;
    }

    attachEventListeners() {
        // Right-click on canvas
        this.app.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.show(e.clientX, e.clientY);
        });

        // Click anywhere to hide
        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target)) {
                this.hide();
            }
        });

        // Escape key to hide
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Update menu items based on current state
        this.updateMenuState();
    }

    show(x, y, target = null) {
        this.currentTarget = target;
        
        // Position menu
        const menuRect = this.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust if menu would go off-screen
        let adjustedX = x;
        let adjustedY = y;
        
        if (x + menuRect.width > viewportWidth) {
            adjustedX = viewportWidth - menuRect.width - 10;
        }
        
        if (y + menuRect.height > viewportHeight) {
            adjustedY = viewportHeight - menuRect.height - 10;
        }
        
        this.menu.style.left = adjustedX + 'px';
        this.menu.style.top = adjustedY + 'px';
        this.menu.style.display = 'block';
        
        // Update state
        this.updateMenuState();
    }

    hide() {
        this.menu.style.display = 'none';
        this.currentTarget = null;
        
        // Hide all submenus
        this.menu.querySelectorAll('.context-submenu').forEach(submenu => {
            submenu.style.display = 'none';
        });
    }

    showSubmenu(parentItem) {
        // Hide other submenus
        this.menu.querySelectorAll('.context-submenu').forEach(submenu => {
            submenu.style.display = 'none';
        });
        
        // Show this submenu
        const submenu = parentItem.querySelector('.context-submenu');
        if (submenu) {
            const parentRect = parentItem.getBoundingClientRect();
            const submenuRect = submenu.getBoundingClientRect();
            
            // Position submenu
            let left = parentRect.width;
            let top = 0;
            
            // Adjust if submenu would go off-screen
            if (parentRect.right + submenuRect.width > window.innerWidth) {
                left = -submenuRect.width;
            }
            
            if (parentRect.bottom + submenuRect.height > window.innerHeight) {
                top = -(submenuRect.height - parentRect.height);
            }
            
            submenu.style.left = left + 'px';
            submenu.style.top = top + 'px';
            submenu.style.display = 'block';
        }
    }

    updateMenuState() {
        // Update checkboxes based on current app state
        if (!this.app.currentCity) return;
        
        // Update size radio buttons
        const size = this.app.currentCity.city.size;
        const sizeRadios = this.menu.querySelectorAll('input[name="size"]');
        sizeRadios.forEach(radio => {
            radio.checked = radio.value === (typeof size === 'string' ? size : 'custom');
        });
        
        // Update custom size slider
        const customSlider = this.menu.querySelector('#custom-size-slider');
        const customValue = this.menu.querySelector('#custom-size-value');
        if (customSlider && customValue && typeof size === 'object') {
            customSlider.value = size.blocks;
            customValue.textContent = `${size.blocks} blocks`;
        }
        
        // Update tag checkboxes
        const tags = this.app.currentCity.city.tags || [];
        this.menu.querySelectorAll('input[data-tag]').forEach(checkbox => {
            checkbox.checked = tags.includes(checkbox.dataset.tag);
        });
        
        // Update style checkboxes
        const style = this.app.renderer?.style || {};
        this.menu.querySelectorAll('input[data-style]').forEach(checkbox => {
            const styleName = checkbox.dataset.style;
            checkbox.checked = style[styleName] !== undefined ? style[styleName] : true;
        });
        
        // Update layer checkboxes
        const layers = this.app.renderer?.layers || {};
        this.menu.querySelectorAll('input[data-layer]').forEach(checkbox => {
            const layerName = checkbox.dataset.layer;
            checkbox.checked = layers[layerName] !== undefined ? layers[layerName] : true;
        });
        
        // Update water level slider
        const waterSlider = this.menu.querySelector('#water-level-slider');
        const waterValue = this.menu.querySelector('#water-level-value');
        if (waterSlider && waterValue) {
            waterSlider.value = this.app.waterLevel * 100;
            waterValue.textContent = this.app.waterLevel.toFixed(1);
        }
    }

    showAddPOIDialog() {
        const x = this.currentTarget?.clientX || window.innerWidth / 2;
        const y = this.currentTarget?.clientY || window.innerHeight / 2;
        
        const dialog = this.createDialog('Add Point of Interest', `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #d0e0ff;">Name:</label>
                <input type="text" id="poi-name" style="width: 100%; padding: 8px; background: rgba(40, 45, 70, 0.8); border: 1px solid rgba(100, 130, 210, 0.5); color: white; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #d0e0ff;">Type:</label>
                <select id="poi-type" style="width: 100%; padding: 8px; background: rgba(40, 45, 70, 0.8); border: 1px solid rgba(100, 130, 210, 0.5); color: white; border-radius: 4px;">
                    <option value="tavern">Tavern</option>
                    <option value="temple">Temple</option>
                    <option value="market">Market</option>
                    <option value="smithy">Smithy</option>
                    <option value="gate">Gate</option>
                    <option value="fountain">Fountain</option>
                    <option value="secret">Secret Entrance</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #d0e0ff;">Description:</label>
                <textarea id="poi-description" rows="3" style="width: 100%; padding: 8px; background: rgba(40, 45, 70, 0.8); border: 1px solid rgba(100, 130, 210, 0.5); color: white; border-radius: 4px; resize: vertical;"></textarea>
            </div>
        `);
        
        dialog.querySelector('#confirm-dialog').addEventListener('click', () => {
            const name = dialog.querySelector('#poi-name').value || 'Unnamed POI';
            const type = dialog.querySelector('#poi-type').value;
            const description = dialog.querySelector('#poi-description').value;
            
            const canvasRect = this.app.canvas.getBoundingClientRect();
            const relativeX = ((this.currentTarget?.clientX || x) - canvasRect.left) / this.app.renderer.scale - this.app.renderer.offset.x;
            const relativeY = ((this.currentTarget?.clientY || y) - canvasRect.top) / this.app.renderer.scale - this.app.renderer.offset.y;
            
            this.app.addPOI({
                x: relativeX,
                y: relativeY,
                type: type.charAt(0).toUpperCase() + type.slice(1),
                label: name,
                icon: type,
                description: description
            });
            
            dialog.remove();
        });
    }

    showAddLabelDialog() {
        const dialog = this.createDialog('Add Label', `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #d0e0ff;">Text:</label>
                <input type="text" id="label-text" style="width: 100%; padding: 8px; background: rgba(40, 45, 70, 0.8); border: 1px solid rgba(100, 130, 210, 0.5); color: white; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #d0e0ff;">Font Size:</label>
                <input type="range" min="8" max="24" value="12" id="label-size" style="width: 100%;">
                <div style="text-align: center; font-size: 11px; color: #8ab4f8;" id="label-size-value">12px</div>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #d0e0ff;">Color:</label>
                <input type="color" id="label-color" value="#ffffff" style="width: 100%; height: 40px;">
            </div>
        `);
        
        // Update size display
        dialog.querySelector('#label-size').addEventListener('input', (e) => {
            dialog.querySelector('#label-size-value').textContent = `${e.target.value}px`;
        });
        
        dialog.querySelector('#confirm-dialog').addEventListener('click', () => {
            const text = dialog.querySelector('#label-text').value;
            const size = dialog.querySelector('#label-size').value;
            const color = dialog.querySelector('#label-color').value;
            
            const canvasRect = this.app.canvas.getBoundingClientRect();
            const relativeX = ((this.currentTarget?.clientX || window.innerWidth / 2) - canvasRect.left) / this.app.renderer.scale - this.app.renderer.offset.x;
            const relativeY = ((this.currentTarget?.clientY || window.innerHeight / 2) - canvasRect.top) / this.app.renderer.scale - this.app.renderer.offset.y;
            
            this.app.addLabel({
                x: relativeX,
                y: relativeY,
                text: text,
                size: parseInt(size),
                color: color
            });
            
            dialog.remove();
        });
    }

    createDialog(title, content) {
        const dialog = document.createElement('div');
        dialog.className = 'context-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30, 35, 55, 0.95);
            border: 1px solid rgba(80, 110, 180, 0.6);
            border-radius: 10px;
            padding: 25px;
            min-width: 300px;
            max-width: 500px;
            z-index: 2000;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #a0d0ff; font-size: 18px;">${title}</h3>
            ${content}
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button id="cancel-dialog" style="padding: 8px 16px; background: rgba(80, 80, 120, 0.6); border: 1px solid rgba(120, 120, 180, 0.4); color: #e0e0f0; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="confirm-dialog" style="padding: 8px 16px; background: linear-gradient(135deg, #4a9eff, #6b46c1); color: white; border: none; border-radius: 4px; cursor: pointer;">Confirm</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Close on cancel
        dialog.querySelector('#cancel-dialog').addEventListener('click', () => {
            dialog.remove();
        });
        
        // Close on escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Remove event listener when dialog is removed
        dialog.addEventListener('remove', () => {
            document.removeEventListener('keydown', escapeHandler);
        });
        
        return dialog;
    }
}

class Legend {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.isCollapsed = false;
        this.init();
    }

    init() {
        this.createContainer();
        this.attachEventListeners();
    }

    createContainer() {
        // Remove existing legend if any
        const existingLegend = document.getElementById('legend-panel');
        if (existingLegend) {
            existingLegend.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'legend-panel';
        this.container.className = 'legend-panel';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(25, 30, 45, 0.92);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(80, 100, 150, 0.4);
            border-radius: 8px;
            padding: 15px;
            max-width: 280px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 100;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            transition: all 0.3s ease;
            font-family: 'Segoe UI', sans-serif;
        `;

        // Add legend styles
        const style = document.createElement('style');
        style.textContent = `
            .legend-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(80, 100, 150, 0.3);
            }
            
            .legend-header h3 {
                color: #8ab4f8;
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }
            
            .legend-collapse-btn {
                background: transparent;
                border: none;
                color: #a0c0ff;
                font-size: 20px;
                cursor: pointer;
                padding: 0 8px;
                transition: transform 0.2s ease;
            }
            
            .legend-collapse-btn:hover {
                transform: scale(1.2);
                color: #c0e0ff;
            }
            
            .legend-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 6px 8px;
                border-radius: 4px;
                transition: background 0.2s ease;
            }
            
            .legend-item:hover {
                background: rgba(60, 70, 100, 0.4);
            }
            
            .legend-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }
            
            .legend-color {
                width: 20px;
                height: 20px;
                border-radius: 3px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .legend-label {
                color: #d0e0ff;
                font-size: 14px;
                flex: 1;
            }
            
            .legend-count {
                background: rgba(60, 70, 100, 0.6);
                color: #8ab4f8;
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 3px;
                min-width: 20px;
                text-align: center;
            }
            
            .legend-category {
                color: #a0c0ff;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 10px;
                margin-bottom: 5px;
                padding-left: 5px;
            }
        `;
        document.head.appendChild(style);

        this.buildLegend();
        document.body.appendChild(this.container);
    }

    buildLegend() {
        this.container.innerHTML = `
            <div class="legend-header">
                <h3>🗺️ Map Legend</h3>
                <button class="legend-collapse-btn">−</button>
            </div>
            <div class="legend-content" id="legend-content">
                <!-- Content will be generated dynamically -->
            </div>
        `;
    }

    attachEventListeners() {
        // Collapse button
        this.container.querySelector('.legend-collapse-btn').addEventListener('click', () => {
            this.toggleCollapse();
        });

        // Auto-position to avoid overlap
        this.positionLegend();
        window.addEventListener('resize', () => this.positionLegend());
    }

    positionLegend() {
        const canvasRect = this.app.canvas.getBoundingClientRect();
        const legendRect = this.container.getBoundingClientRect();
        
        // Check if legend overlaps with canvas too much
        const overlapThreshold = canvasRect.width * 0.2;
        
        if (legendRect.left < canvasRect.right - overlapThreshold) {
            this.container.style.right = '';
            this.container.style.left = '20px';
        } else {
            this.container.style.left = '';
            this.container.style.right = '20px';
        }
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        const content = this.container.querySelector('.legend-content');
        const button = this.container.querySelector('.legend-collapse-btn');
        
        if (this.isCollapsed) {
            content.style.display = 'none';
            button.textContent = '+';
        } else {
            content.style.display = 'flex';
            button.textContent = '−';
        }
    }

    update(cityData) {
        if (!cityData) return;
        
        const content = this.container.querySelector('#legend-content');
        if (!content) return;
        
        const items = [];
        
        // Buildings
        if (cityData.city.buildings && cityData.city.buildings.length > 0) {
            items.push({ type: 'category', label: 'Buildings' });
            
            const buildingTypes = {};
            cityData.city.buildings.forEach(building => {
                buildingTypes[building.type] = (buildingTypes[building.type] || 0) + 1;
            });
            
            Object.entries(buildingTypes).forEach(([type, count]) => {
                const color = this.getBuildingColor(type);
                items.push({
                    type: 'item',
                    color: color,
                    label: this.capitalize(type),
                    count: count,
                    icon: this.getBuildingIcon(type)
                });
            });
        }
        
        // Roads
        if (cityData.city.roads && cityData.city.roads.length > 0) {
            items.push({ type: 'category', label: 'Roads' });
            
            const roadTypes = {};
            cityData.city.roads.forEach(road => {
                const type = road.type || 'road';
                roadTypes[type] = (roadTypes[type] || 0) + 1;
            });
            
            Object.entries(roadTypes).forEach(([type, count]) => {
                items.push({
                    type: 'item',
                    color: '#c2b280',
                    label: this.capitalize(type) + ' Road',
                    count: count,
                    icon: '🛣️'
                });
            });
        }
        
        // Points of Interest
        if (cityData.city.pois && cityData.city.pois.length > 0) {
            items.push({ type: 'category', label: 'Points of Interest' });
            
            const poiTypes = {};
            cityData.city.pois.forEach(poi => {
                poiTypes[poi.type] = (poiTypes[poi.type] || 0) + 1;
            });
            
            Object.entries(poiTypes).forEach(([type, count]) => {
                items.push({
                    type: 'item',
                    color: '#ffb74d',
                    label: type,
                    count: count,
                    icon: this.getPOIIcon(type)
                });
            });
        }
        
        // Terrain
        items.push({ type: 'category', label: 'Terrain' });
        
        if (cityData.city.waterAreas && cityData.city.waterAreas.length > 0) {
            items.push({
                type: 'item',
                color: '#4080a0',
                label: 'Water',
                count: cityData.city.waterAreas.length,
                icon: '💧'
            });
        }
        
        if (cityData.city.trees && cityData.city.trees.length > 0) {
            items.push({
                type: 'item',
                color: '#2d5a27',
                label: 'Trees',
                count: cityData.city.trees.length,
                icon: '🌲'
            });
        }
        
        if (cityData.city.walls && cityData.city.walls.length > 0) {
            items.push({
                type: 'item',
                color: '#654321',
                label: 'Walls',
                count: Math.ceil(cityData.city.walls.length / 4),
                icon: '🧱'
            });
        }
        
        // Generate HTML
        content.innerHTML = items.map(item => {
            if (item.type === 'category') {
                return `<div class="legend-category">${item.label}</div>`;
            } else {
                return `
                    <div class="legend-item">
                        <div class="legend-icon">${item.icon}</div>
                        <div class="legend-color" style="background: ${item.color};"></div>
                        <div class="legend-label">${item.label}</div>
                        <div class="legend-count">${item.count}</div>
                    </div>
                `;
            }
        }).join('');
    }

    getBuildingColor(type) {
        const colors = {
            'residential': '#a1887f',
            'commercial': '#78909c',
            'religious': '#8d6e63',
            'military': '#5d4037',
            'governmental': '#6d4c41',
            'central': '#8B7355',
            'district': '#9e8b77',
            'neighborhood': '#ad9c88',
            'citadel': '#5d4037'
        };
        return colors[type] || '#8B7355';
    }

    getBuildingIcon(type) {
        const icons = {
            'residential': '🏠',
            'commercial': '🏪',
            'religious': '⛪',
            'military': '⚔️',
            'governmental': '🏛️',
            'citadel': '🏰'
        };
        return icons[type] || '🏢';
    }

    getPOIIcon(type) {
        const icons = {
            'Tavern': '🍺',
            'Temple': '⛪',
            'Market': '🛒',
            'Smithy': '⚒️',
            'Stables': '🐎',
            'Inn': '🛏️',
            'Keep': '🏰',
            'Gate': '🚪',
            'Fountain': '⛲',
            'Statue': '🗿',
            'Secret Entrance': '🚪'
        };
        return icons[type] || '📍';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    show() {
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }

    toggle() {
        if (this.container.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContextMenu, Legend };
} else {
    window.ContextMenu = ContextMenu;
    window.Legend = Legend;
}