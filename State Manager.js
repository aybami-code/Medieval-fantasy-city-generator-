// modules/StateManager.js - COMPLETE PRODUCTION CODE

class StateManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'arcane-realm-builder-state';
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 20;
        this.isLoading = false;
        
        // Initialize
        this.init();
    }

    init() {
        // Load saved state
        this.loadState();
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Setup beforeunload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    getCurrentState() {
        if (!this.app.currentCity) return null;
        
        return {
            timestamp: Date.now(),
            city: this.app.currentCity,
            renderer: {
                scale: this.app.renderer.scale,
                offset: { ...this.app.renderer.offset },
                layers: { ...this.app.renderer.layers },
                style: { ...this.app.renderer.style }
            },
            ui: {
                waterLevel: this.app.waterLevel,
                tags: this.app.tags || [],
                size: this.app.size || 'medium'
            }
        };
    }

    saveState() {
        try {
            const state = this.getCurrentState();
            if (!state) return;
            
            // Add to history
            this.addToHistory(state);
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify({
                lastState: state,
                history: this.history.slice(-this.maxHistory)
            }));
            
            console.log('State saved');
            
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return null;
            
            const data = JSON.parse(saved);
            if (!data.lastState) return null;
            
            this.isLoading = true;
            
            // Restore history
            this.history = data.history || [];
            this.historyIndex = this.history.length - 1;
            
            // Load last state
            this.restoreState(data.lastState);
            
            this.isLoading = false;
            console.log('State loaded');
            
            return data.lastState;
            
        } catch (error) {
            console.error('Error loading state:', error);
            this.isLoading = false;
            return null;
        }
    }

    restoreState(state) {
        if (!state) return;
        
        // Restore city
        if (state.city) {
            this.app.currentCity = state.city;
            this.app.renderer.render(state.city);
        }
        
        // Restore renderer settings
        if (state.renderer) {
            this.app.renderer.scale = state.renderer.scale || 1.0;
            this.app.renderer.offset = state.renderer.offset || { x: 0, y: 0 };
            
            if (state.renderer.layers) {
                Object.assign(this.app.renderer.layers, state.renderer.layers);
            }
            
            if (state.renderer.style) {
                Object.assign(this.app.renderer.style, state.renderer.style);
            }
            
            this.app.renderer.needsRedraw = true;
        }
        
        // Restore UI settings
        if (state.ui) {
            this.app.waterLevel = state.ui.waterLevel || 0.3;
            this.app.tags = state.ui.tags || [];
            this.app.size = state.ui.size || 'medium';
        }
    }

    addToHistory(state) {
        // Don't add if loading
        if (this.isLoading) return;
        
        // Don't add duplicates (check if similar to last state)
        if (this.history.length > 0) {
            const lastState = this.history[this.historyIndex];
            if (this.areStatesSimilar(state, lastState)) {
                return;
            }
        }
        
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add new state
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
        
        // Trim history if too long
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(-this.maxHistory);
            this.historyIndex = this.history.length - 1;
        }
    }

    areStatesSimilar(state1, state2) {
        if (!state1 || !state2) return false;
        
        // Compare seeds
        if (state1.city?.meta?.seed !== state2.city?.meta?.seed) {
            return false;
        }
        
        // Compare tags
        const tags1 = state1.city?.city?.tags || [];
        const tags2 = state2.city?.city?.tags || [];
        
        if (tags1.length !== tags2.length) return false;
        if (!tags1.every(tag => tags2.includes(tag))) return false;
        
        // Compare size
        const size1 = state1.city?.city?.size;
        const size2 = state2.city?.city?.size;
        
        if (typeof size1 === 'object' && typeof size2 === 'object') {
            return size1.blocks === size2.blocks;
        }
        
        return size1 === size2;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.restoreState(state);
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.restoreState(state);
            return true;
        }
        return false;
    }

    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        localStorage.removeItem(this.storageKey);
    }

    hasUnsavedChanges() {
        // This is a simplified check - in production, you'd want more sophisticated logic
        const lastSaved = localStorage.getItem(this.storageKey);
        if (!lastSaved) return false;
        
        const currentState = this.getCurrentState();
        if (!currentState) return false;
        
        try {
            const savedData = JSON.parse(lastSaved);
            const lastState = savedData.lastState;
            
            return !this.areStatesSimilar(currentState, lastState);
        } catch {
            return true;
        }
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.saveState();
            }
        }, 30000);
        
        // Save on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.hasUnsavedChanges()) {
                this.saveState();
            }
        });
    }

    // URL State Management
    getStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        const state = {
            seed: parseInt(params.get('seed')) || Math.floor(Math.random() * 999999) + 1,
            size: params.get('size') || 'medium',
            tags: params.get('tags') ? params.get('tags').split(',') : [],
            water: parseFloat(params.get('water')) || 0.3,
            notes: params.get('notes') || 'off',
            layers: params.get('layers') ? params.get('layers').split(',') : [
                'buildings', 'roads', 'walls', 'water', 'trees', 'pois', 'labels'
            ]
        };
        
        return state;
    }

    updateURL(state) {
        if (!state) return;
        
        const params = new URLSearchParams();
        
        if (state.seed) params.set('seed', state.seed);
        if (state.size && state.size !== 'medium') params.set('size', state.size);
        if (state.tags && state.tags.length > 0) params.set('tags', state.tags.join(','));
        if (state.water && state.water !== 0.3) params.set('water', state.water.toFixed(1));
        if (state.notes && state.notes !== 'off') params.set('notes', state.notes);
        if (state.layers && state.layers.length < 7) params.set('layers', state.layers.join(','));
        
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newURL);
    }

    getShareableURL() {
        const state = this.getCurrentState();
        if (!state) return window.location.href;
        
        const params = new URLSearchParams();
        params.set('seed', state.city.meta.seed);
        
        if (state.city.city.tags && state.city.city.tags.length > 0) {
            params.set('tags', state.city.city.tags.join(','));
        }
        
        if (state.ui && state.ui.size !== 'medium') {
            params.set('size', state.ui.size);
        }
        
        if (state.ui && state.ui.waterLevel !== 0.3) {
            params.set('water', state.ui.waterLevel.toFixed(1));
        }
        
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }

    // Import/Export State
    exportStateToFile() {
        const state = this.getCurrentState();
        if (!state) return;
        
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `arcane-realm-state_${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    importStateFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const state = JSON.parse(e.target.result);
                    this.restoreState(state);
                    this.saveState();
                    resolve(state);
                } catch (error) {
                    reject(new Error('Invalid state file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Session Management
    startNewSession() {
        this.clearHistory();
        localStorage.removeItem(this.storageKey);
        
        // Reset to defaults
        this.app.waterLevel = 0.3;
        this.app.tags = [];
        this.app.size = 'medium';
        
        // Clear URL parameters
        window.history.replaceState({}, '', window.location.pathname);
    }

    getSessionStats() {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return null;
        
        try {
            const data = JSON.parse(saved);
            return {
                lastSaved: data.lastState?.timestamp ? new Date(data.lastState.timestamp) : null,
                historySize: data.history?.length || 0,
                seed: data.lastState?.city?.meta?.seed || null,
                tags: data.lastState?.city?.city?.tags || []
            };
        } catch {
            return null;
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
} else {
    window.StateManager = StateManager;
}