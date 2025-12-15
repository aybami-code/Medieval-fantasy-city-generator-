// modules/Generator.js - COMPLETE PRODUCTION CODE

class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    random() {
        return this.next();
    }

    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max) {
        return this.random() * (max - min) + min;
    }

    pick(arr) {
        return arr[this.randomInt(0, arr.length - 1)];
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

class CityGenerator {
    constructor(seed, size, tags = []) {
        this.seed = seed || Math.floor(Math.random() * 999999) + 1;
        this.size = this.parseSize(size);
        this.tags = tags;
        this.random = new SeededRandom(this.seed);
        
        this.blocks = [];
        this.roads = [];
        this.waterAreas = [];
        this.pois = [];
        this.walls = [];
        this.props = [];
        this.labels = [];
        this.trees = [];
        this.buildings = [];
        
        this.center = { x: 400, y: 300 };
        this.buildingTypes = ['residential', 'commercial', 'religious', 'military', 'governmental'];
        this.poiTypes = ['Tavern', 'Temple', 'Market', 'Smithy', 'Stables', 'Inn', 'Keep', 'Gatehouse', 'Fountain', 'Statue'];
    }

    parseSize(size) {
        const sizes = {
            'small': { blocks: this.random.randomInt(3, 6), radius: 150 },
            'medium': { blocks: this.random.randomInt(6, 12), radius: 250 },
            'large': { blocks: this.random.randomInt(12, 25), radius: 400 },
            'custom': (val) => ({ blocks: Math.min(200, Math.max(1, val)), radius: Math.min(800, val * 20) })
        };
        
        if (typeof size === 'string' && sizes[size]) {
            return sizes[size];
        } else if (typeof size === 'number') {
            return sizes.custom(size);
        }
        return sizes.medium;
    }

    generate() {
        console.time('City Generation');
        
        // Reset all data
        this.blocks = [];
        this.roads = [];
        this.waterAreas = [];
        this.pois = [];
        this.walls = [];
        this.props = [];
        this.labels = [];
        this.trees = [];
        this.buildings = [];

        // Generate core city structure
        this.generateCentralBlock();
        this.growBranches(this.blocks[0], this.size.blocks, 0);
        
        // Apply tags
        this.applyTags();
        
        // Generate roads connecting blocks
        this.generateRoadNetwork();
        
        // Place buildings within blocks
        this.placeBuildings();
        
        // Add terrain features
        this.addTerrainFeatures();
        
        // Generate points of interest
        this.generatePOIs(5 + this.random.randomInt(0, 10));
        
        // Add optional features based on tags
        this.addOptionalFeatures();
        
        console.timeEnd('City Generation');
        
        return this.getCityData();
    }

    generateCentralBlock() {
        const sides = 4 + this.random.randomInt(0, 3); // 4-7 sides
        const radius = 40 + this.random.randomInt(0, 20);
        const vertices = [];
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) + this.random.randomFloat(-0.1, 0.1);
            const variance = this.random.randomFloat(0.8, 1.2);
            vertices.push({
                x: this.center.x + radius * variance * Math.cos(angle),
                y: this.center.y + radius * variance * Math.sin(angle)
            });
        }
        
        this.blocks.push({
            id: 0,
            vertices,
            type: 'central',
            depth: 0,
            children: []
        });
    }

    growBranches(parent, remaining, depth) {
        if (remaining <= 0 || depth > 8) return;
        
        const maxChildren = depth < 2 ? 3 : 2;
        const childCount = 1 + this.random.randomInt(0, maxChildren - 1);
        
        for (let i = 0; i < childCount; i++) {
            if (remaining <= 0) break;
            
            const shouldBranch = depth < 4 || this.random.random() > 0.4;
            if (!shouldBranch) continue;
            
            // Create child block
            const parentCenter = this.getPolygonCenter(parent.vertices);
            const angle = (i * (2 * Math.PI / childCount)) + 
                         this.random.randomFloat(-0.3, 0.3) + // Base asymmetry
                         (this.tags.includes('chaotic') ? this.random.randomFloat(-0.5, 0.5) : 0);
            
            const distance = 50 + this.random.randomInt(20, 60) * 
                           (this.tags.includes('compact') ? 0.7 : 1) *
                           (this.tags.includes('large') ? 1.3 : 1);
            
            const childCenter = {
                x: parentCenter.x + distance * Math.cos(angle),
                y: parentCenter.y + distance * Math.sin(angle)
            };
            
            // Irregular polygon for child
            const sides = 4 + this.random.randomInt(0, 2);
            const radius = 30 + this.random.randomInt(0, 25);
            const vertices = [];
            
            for (let j = 0; j < sides; j++) {
                const vertexAngle = (j * 2 * Math.PI / sides) + this.random.randomFloat(-0.2, 0.2);
                vertices.push({
                    x: childCenter.x + radius * Math.cos(vertexAngle),
                    y: childCenter.y + radius * Math.sin(vertexAngle)
                });
            }
            
            const childBlock = {
                id: this.blocks.length,
                vertices,
                type: depth === 0 ? 'district' : 'neighborhood',
                depth: depth + 1,
                children: [],
                parentId: parent.id
            };
            
            this.blocks.push(childBlock);
            parent.children.push(childBlock.id);
            
            remaining--;
            
            // Recursive growth with diminishing probability
            const growthProbability = 0.7 - (depth * 0.1);
            if (this.random.random() < growthProbability) {
                remaining = this.growBranches(childBlock, remaining, depth + 1);
            }
        }
        
        return remaining;
    }

    getPolygonCenter(vertices) {
        let sumX = 0, sumY = 0;
        vertices.forEach(v => {
            sumX += v.x;
            sumY += v.y;
        });
        return {
            x: sumX / vertices.length,
            y: sumY / vertices.length
        };
    }

    applyTags() {
        // City Walls
        if (this.tags.includes('city-walls')) {
            this.generateWalls();
        }
        
        // Waterfront/Docks
        if (this.tags.includes('waterfront') || this.tags.includes('docks')) {
            this.generateWaterfront();
        }
        
        // Central Plaza
        if (this.tags.includes('central-plaza')) {
            this.createCentralPlaza();
        }
        
        // Citadel
        if (this.tags.includes('citadel')) {
            this.createCitadel();
        }
        
        // Forest
        if (this.tags.includes('forests')) {
            this.generateForest();
        }
        
        // Coast/Lake
        if (this.tags.includes('coast') || this.tags.includes('lake')) {
            this.generateWaterBody();
        }
        
        // Dry (remove water)
        if (this.tags.includes('dry')) {
            this.waterAreas = [];
        }
        
        // Multi-level
        if (this.tags.includes('multi-level')) {
            this.addElevation();
        }
    }

    generateWalls() {
        // Get convex hull of all blocks for wall placement
        const allPoints = this.blocks.flatMap(block => block.vertices);
        const hull = this.computeConvexHull(allPoints);
        
        // Expand hull outward for walls
        const center = this.getPolygonCenter(hull);
        const expandedHull = hull.map(point => {
            const dx = point.x - center.x;
            const dy = point.y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const scale = 1.15; // 15% expansion
            return {
                x: center.x + dx * scale,
                y: center.y + dy * scale
            };
        });
        
        this.walls = expandedHull;
        
        // Add gate positions (at road intersections with walls)
        this.addGates();
    }

    computeConvexHull(points) {
        if (points.length < 3) return points;
        
        // Find point with lowest y (and leftmost if tie)
        let lowest = points[0];
        for (let i = 1; i < points.length; i++) {
            if (points[i].y < lowest.y || 
                (points[i].y === lowest.y && points[i].x < lowest.x)) {
                lowest = points[i];
            }
        }
        
        // Sort by polar angle
        const sorted = points.slice().sort((a, b) => {
            if (a === lowest) return -1;
            if (b === lowest) return 1;
            
            const angleA = Math.atan2(a.y - lowest.y, a.x - lowest.x);
            const angleB = Math.atan2(b.y - lowest.y, b.x - lowest.x);
            
            if (angleA < angleB) return -1;
            if (angleA > angleB) return 1;
            
            // If same angle, choose closer one
            const distA = (a.x - lowest.x) ** 2 + (a.y - lowest.y) ** 2;
            const distB = (b.x - lowest.x) ** 2 + (b.y - lowest.y) ** 2;
            return distA - distB;
        });
        
        // Graham scan
        const hull = [sorted[0], sorted[1]];
        
        for (let i = 2; i < sorted.length; i++) {
            while (hull.length >= 2) {
                const a = hull[hull.length - 2];
                const b = hull[hull.length - 1];
                const c = sorted[i];
                
                if (this.crossProduct(a, b, c) <= 0) {
                    hull.pop();
                } else {
                    break;
                }
            }
            hull.push(sorted[i]);
        }
        
        return hull;
    }

    crossProduct(a, b, c) {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    addGates() {
        if (this.walls.length === 0) return;
        
        const gateCount = this.random.randomInt(2, 4);
        const wallSegments = [];
        
        // Create wall segments
        for (let i = 0; i < this.walls.length; i++) {
            const start = this.walls[i];
            const end = this.walls[(i + 1) % this.walls.length];
            wallSegments.push({ start, end, index: i });
        }
        
        // Place gates on random segments
        for (let i = 0; i < gateCount; i++) {
            const segment = wallSegments[this.random.randomInt(0, wallSegments.length - 1)];
            const t = this.random.randomFloat(0.3, 0.7); // Position along segment
            
            const gate = {
                x: segment.start.x + t * (segment.end.x - segment.start.x),
                y: segment.start.y + t * (segment.end.y - segment.start.y),
                type: i === 0 ? 'main' : 'secondary'
            };
            
            this.pois.push({
                x: gate.x,
                y: gate.y,
                type: 'Gate',
                label: `${gate.type === 'main' ? 'Main' : 'Secondary'} Gate`,
                icon: 'gate'
            });
        }
    }

    generateWaterfront() {
        const center = this.center;
        const radius = this.size.radius * 0.8;
        const startAngle = this.random.randomFloat(0, Math.PI * 2);
        const arcLength = Math.PI / 2 + this.random.randomFloat(0, Math.PI / 4);
        
        const points = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (i / steps) * arcLength;
            const variance = this.random.randomFloat(0.9, 1.1);
            points.push({
                x: center.x + radius * variance * Math.cos(angle),
                y: center.y + radius * variance * Math.sin(angle)
            });
        }
        
        // Add some noise to make it more natural
        this.waterAreas.push(points.map(p => ({
            x: p.x + this.random.randomFloat(-15, 15),
            y: p.y + this.random.randomFloat(-15, 15)
        })));
        
        // Add docks along waterfront
        this.addDocks(points);
    }

    addDocks(waterfrontPoints) {
        const dockCount = this.random.randomInt(3, 8);
        
        for (let i = 0; i < dockCount; i++) {
            const t = this.random.randomFloat(0.1, 0.9);
            const index = Math.floor(t * (waterfrontPoints.length - 1));
            const point = waterfrontPoints[index];
            
            this.props.push({
                x: point.x,
                y: point.y,
                type: 'dock',
                width: 30 + this.random.randomInt(0, 20),
                height: 10,
                rotation: this.random.randomFloat(0, Math.PI * 2)
            });
        }
    }

    createCentralPlaza() {
        if (this.blocks.length === 0) return;
        
        const centralBlock = this.blocks[0];
        const center = this.getPolygonCenter(centralBlock.vertices);
        
        // Create plaza as open space
        const plazaRadius = 25 + this.random.randomInt(0, 15);
        
        // Add fountain in center
        this.pois.push({
            x: center.x,
            y: center.y,
            type: 'Fountain',
            label: 'Central Fountain',
            icon: 'fountain'
        });
        
        // Mark plaza area
        this.labels.push({
            x: center.x,
            y: center.y + plazaRadius + 10,
            text: 'Central Plaza',
            type: 'plaza',
            size: 14
        });
    }

    createCitadel() {
        const center = this.center;
        const citadelRadius = 40 + this.random.randomInt(0, 20);
        const sides = 6;
        
        const vertices = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides);
            vertices.push({
                x: center.x + citadelRadius * Math.cos(angle),
                y: center.y + citadelRadius * Math.sin(angle)
            });
        }
        
        // Add citadel as a special block
        this.blocks.push({
            id: this.blocks.length,
            vertices,
            type: 'citadel',
            depth: 0,
            children: []
        });
        
        // Add keep tower in center
        this.props.push({
            x: center.x,
            y: center.y,
            type: 'keep',
            width: 25,
            height: 40,
            rotation: 0
        });
    }

    generateForest() {
        const treeCount = 50 + this.random.randomInt(0, 100);
        const forestRadius = this.size.radius * 1.2;
        
        for (let i = 0; i < treeCount; i++) {
            const angle = this.random.randomFloat(0, Math.PI * 2);
            const distance = this.random.randomFloat(forestRadius * 0.8, forestRadius);
            
            this.trees.push({
                x: this.center.x + distance * Math.cos(angle),
                y: this.center.y + distance * Math.sin(angle),
                size: this.random.randomFloat(0.8, 1.5),
                type: this.random.pick(['oak', 'pine', 'maple'])
            });
        }
    }

    generateWaterBody() {
        const isLake = this.tags.includes('lake') || this.random.random() > 0.5;
        const center = {
            x: this.center.x + this.random.randomFloat(-100, 100),
            y: this.center.y + this.random.randomFloat(-100, 100)
        };
        
        const radius = 80 + this.random.randomInt(0, 120);
        const points = [];
        const steps = isLake ? 24 : 30;
        
        for (let i = 0; i < steps; i++) {
            const angle = (i * 2 * Math.PI / steps);
            const variance = 0.9 + this.random.randomFloat(0, 0.2);
            points.push({
                x: center.x + radius * variance * Math.cos(angle),
                y: center.y + radius * variance * Math.sin(angle)
            });
        }
        
        // For coast, only show half
        if (!isLake) {
            this.waterAreas.push(points.slice(0, Math.floor(points.length / 2)));
        } else {
            this.waterAreas.push(points);
        }
    }

    addElevation() {
        // Add elevation data to blocks
        this.blocks.forEach(block => {
            block.elevation = this.random.randomInt(0, 3);
        });
        
        // Add stairs between different elevations
        this.addStairs();
    }

    addStairs() {
        // Simplified stair placement
        for (let i = 0; i < 5; i++) {
            const block = this.random.pick(this.blocks);
            const center = this.getPolygonCenter(block.vertices);
            
            this.props.push({
                x: center.x,
                y: center.y,
                type: 'stairs',
                width: 15,
                height: 8,
                rotation: this.random.randomFloat(0, Math.PI * 2)
            });
        }
    }

    generateRoadNetwork() {
        // Connect block centers with roads
        const centers = this.blocks.map(block => ({
            id: block.id,
            point: this.getPolygonCenter(block.vertices)
        }));
        
        // Minimum spanning tree (Prim's algorithm)
        const visited = new Set([0]);
        const edges = [];
        
        while (visited.size < centers.length) {
            let minEdge = null;
            let minDist = Infinity;
            
            for (const visitedId of visited) {
                for (let i = 0; i < centers.length; i++) {
                    if (visited.has(i)) continue;
                    
                    const dist = this.distance(
                        centers[visitedId].point,
                        centers[i].point
                    );
                    
                    if (dist < minDist) {
                        minDist = dist;
                        minEdge = { from: visitedId, to: i, dist };
                    }
                }
            }
            
            if (minEdge) {
                visited.add(minEdge.to);
                edges.push(minEdge);
                
                // Create road
                this.roads.push({
                    from: centers[minEdge.from].point,
                    to: centers[minEdge.to].point,
                    width: 4 + this.random.randomInt(0, 3),
                    type: minEdge.dist < 80 ? 'main' : 'secondary'
                });
            }
        }
        
        // Add some extra connections for more organic feel
        this.addExtraConnections(centers);
    }

    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    addExtraConnections(centers) {
        const extraConnections = Math.floor(centers.length * 0.3);
        
        for (let i = 0; i < extraConnections; i++) {
            const from = this.random.randomInt(0, centers.length - 1);
            const to = this.random.randomInt(0, centers.length - 1);
            
            if (from === to) continue;
            
            const dist = this.distance(centers[from].point, centers[to].point);
            if (dist < 150) { // Only connect relatively close blocks
                this.roads.push({
                    from: centers[from].point,
                    to: centers[to].point,
                    width: 3 + this.random.randomInt(0, 2),
                    type: 'alley'
                });
            }
        }
    }

    placeBuildings() {
        this.blocks.forEach(block => {
            if (block.type === 'citadel') return; // Don't place buildings in citadel
            
            const center = this.getPolygonCenter(block.vertices);
            const buildingCount = 3 + this.random.randomInt(0, 7);
            
            for (let i = 0; i < buildingCount; i++) {
                // Position within block with some randomness
                const angle = this.random.randomFloat(0, Math.PI * 2);
                const distance = this.random.randomFloat(0, 25);
                
                const building = {
                    x: center.x + distance * Math.cos(angle),
                    y: center.y + distance * Math.sin(angle),
                    width: 12 + this.random.randomInt(0, 10),
                    height: 8 + this.random.randomInt(0, 12),
                    rotation: this.random.randomFloat(-0.3, 0.3),
                    type: this.random.pick(this.buildingTypes),
                    floors: 1 + this.random.randomInt(0, block.type === 'central' ? 3 : 2)
                };
                
                this.buildings.push(building);
            }
        });
    }

    addTerrainFeatures() {
        // Add random terrain props
        const propCount = 20 + this.random.randomInt(0, 30);
        const propTypes = ['well', 'statue', 'fountain', 'cart', 'bench', 'lamp'];
        
        for (let i = 0; i < propCount; i++) {
            const angle = this.random.randomFloat(0, Math.PI * 2);
            const distance = this.random.randomFloat(50, this.size.radius * 0.7);
            
            this.props.push({
                x: this.center.x + distance * Math.cos(angle),
                y: this.center.y + distance * Math.sin(angle),
                type: this.random.pick(propTypes),
                width: 8 + this.random.randomInt(0, 8),
                height: 8 + this.random.randomInt(0, 8),
                rotation: this.random.randomFloat(0, Math.PI * 2)
            });
        }
    }

    generatePOIs(count) {
        const usedPositions = new Set();
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position;
            
            // Find unique position
            do {
                const block = this.random.pick(this.blocks);
                const center = this.getPolygonCenter(block.vertices);
                const angle = this.random.randomFloat(0, Math.PI * 2);
                const distance = this.random.randomFloat(10, 30);
                
                position = {
                    x: center.x + distance * Math.cos(angle),
                    y: center.y + distance * Math.sin(angle)
                };
                
                attempts++;
            } while (this.isPositionTooClose(position, usedPositions) && attempts < 10);
            
            if (attempts >= 10) continue;
            
            usedPositions.add(`${Math.round(position.x)},${Math.round(position.y)}`);
            
            const poiType = this.random.pick(this.poiTypes);
            const adjectives = ['Old', 'Golden', 'Sleeping', 'Red', 'Blue', 'Silver', 'Royal', 'Black', 'White'];
            const nouns = ['Dragon', 'Lion', 'Swan', 'Bear', 'Eagle', 'Rose', 'Crown', 'Sword'];
            
            const poiName = `${this.random.pick(adjectives)} ${this.random.pick(nouns)} ${poiType}`;
            
            this.pois.push({
                x: position.x,
                y: position.y,
                type: poiType,
                label: poiName,
                icon: poiType.toLowerCase(),
                description: this.generatePoiDescription(poiType, poiName)
            });
        }
    }

    isPositionTooClose(position, usedPositions, minDistance = 25) {
        for (const posStr of usedPositions) {
            const [x, y] = posStr.split(',').map(Number);
            if (this.distance(position, { x, y }) < minDistance) {
                return true;
            }
        }
        return false;
    }

    generatePoiDescription(type, name) {
        const descriptions = {
            'Tavern': `A bustling ${name} where locals gather for ale and news`,
            'Temple': `Sacred ${name} dedicated to the gods, filled with worshippers`,
            'Market': `Busy ${name} where merchants sell goods from distant lands`,
            'Smithy': `The ${name} rings with the sound of hammer on anvil`,
            'Keep': `Imposing ${name} that watches over the city`,
            'Gate': `Heavily guarded ${name}, main entrance to the city`
        };
        
        return descriptions[type] || `The ${name}, an important location in the city`;
    }

    addOptionalFeatures() {
        // Backdoor/secret entrance
        if (this.tags.includes('backdoor')) {
            this.addSecretEntrance();
        }
        
        // Chaotic layout
        if (this.tags.includes('chaotic')) {
            this.makeLayoutChaotic();
        }
    }

    addSecretEntrance() {
        if (this.walls.length === 0) return;
        
        // Find a wall segment far from gates
        const wallIndex = this.random.randomInt(0, this.walls.length - 1);
        const start = this.walls[wallIndex];
        const end = this.walls[(wallIndex + 1) % this.walls.length];
        const t = this.random.randomFloat(0.2, 0.8);
        
        this.pois.push({
            x: start.x + t * (end.x - start.x),
            y: start.y + t * (end.y - start.y),
            type: 'Secret Entrance',
            label: 'Hidden Passage',
            icon: 'secret',
            secret: true
        });
    }

    makeLayoutChaotic() {
        // Add random offsets to make layout more chaotic
        this.blocks.forEach(block => {
            if (block.type !== 'citadel') {
                block.vertices.forEach(vertex => {
                    vertex.x += this.random.randomFloat(-10, 10);
                    vertex.y += this.random.randomFloat(-10, 10);
                });
            }
        });
        
        // Add more random props
        const extraProps = 10 + this.random.randomInt(0, 20);
        for (let i = 0; i < extraProps; i++) {
            const angle = this.random.randomFloat(0, Math.PI * 2);
            const distance = this.random.randomFloat(30, this.size.radius);
            
            this.props.push({
                x: this.center.x + distance * Math.cos(angle),
                y: this.center.y + distance * Math.sin(angle),
                type: 'rubble',
                width: 5 + this.random.randomInt(0, 10),
                height: 5 + this.random.randomInt(0, 10),
                rotation: this.random.randomFloat(0, Math.PI * 2)
            });
        }
    }

    getCityData() {
        return {
            meta: {
                seed: this.seed,
                generated: new Date().toISOString(),
                generator: 'Arcane Realm Builder v1.0'
            },
            city: {
                size: this.size,
                tags: this.tags,
                center: this.center,
                blocks: this.blocks,
                roads: this.roads,
                waterAreas: this.waterAreas,
                pois: this.pois,
                walls: this.walls,
                props: this.props,
                trees: this.trees,
                buildings: this.buildings,
                labels: this.labels
            },
            stats: {
                totalBlocks: this.blocks.length,
                totalRoads: this.roads.length,
                totalPOIs: this.pois.length,
                totalBuildings: this.buildings.length
            }
        };
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SeededRandom, CityGenerator };
} else {
    window.CityGenerator = CityGenerator;
    window.SeededRandom = SeededRandom;
}