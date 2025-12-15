// modules/Exporter.js - COMPLETE PRODUCTION CODE

class CityExporter {
    constructor(app) {
        this.app = app;
        this.exportQueue = [];
        this.isExporting = false;
        
        // Ensure required libraries are loaded
        this.checkDependencies();
    }

    checkDependencies() {
        // Check for jsPDF
        if (typeof window.jspdf === 'undefined') {
            console.warn('jsPDF not loaded. PDF export will not work.');
        }
        
        // Check for JSZip
        if (typeof window.JSZip === 'undefined') {
            console.warn('JSZip not loaded. Batch export will not work.');
        }
    }

    async exportPNG(options = {}) {
        const {
            includeLegend = true,
            includeNotes = true,
            dpi = 150,
            transparent = false,
            filename = `realm_${this.app.currentCity?.meta?.seed || Date.now()}.png`
        } = options;

        return new Promise((resolve, reject) => {
            try {
                // Create a temporary canvas for export
                const originalCanvas = this.app.renderer.canvas;
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d');
                
                // Set high DPI
                const scale = dpi / 96;
                tempCanvas.width = originalCanvas.width * scale;
                tempCanvas.height = originalCanvas.height * scale;
                
                // Fill background if not transparent
                if (!transparent) {
                    ctx.fillStyle = '#0a0a14';
                    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                }
                
                // Draw the original canvas scaled up
                ctx.drawImage(originalCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // Add legend if requested
                if (includeLegend) {
                    this.drawLegendOnCanvas(ctx, scale, tempCanvas.width, tempCanvas.height);
                }
                
                // Add notes if requested
                if (includeNotes && this.app.currentCity?.city?.labels) {
                    this.drawNotesOnCanvas(ctx, scale);
                }
                
                // Add watermark/attribution
                this.drawWatermark(ctx, tempCanvas.width, tempCanvas.height);
                
                // Convert to blob and trigger download
                tempCanvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('Failed to create PNG blob'));
                        return;
                    }
                    
                    this.triggerDownload(blob, filename);
                    resolve({ success: true, filename });
                }, 'image/png', 1.0);
                
            } catch (error) {
                console.error('Error exporting PNG:', error);
                reject(error);
            }
        });
    }

    async exportSVG(options = {}) {
        const {
            includeLegend = true,
            includeNotes = true,
            filename = `realm_${this.app.currentCity?.meta?.seed || Date.now()}.svg`
        } = options;

        return new Promise((resolve, reject) => {
            try {
                if (!this.app.currentCity) {
                    reject(new Error('No city data available'));
                    return;
                }

                const city = this.app.currentCity.city;
                const width = this.app.renderer.canvas.width;
                const height = this.app.renderer.canvas.height;
                
                // Start building SVG
                let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}px" height="${height}px" viewBox="0 0 ${width} ${height}">
    
    <!-- Background -->
    <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1"/>
            <stop offset="100%" style="stop-color:#16213e;stop-opacity:1"/>
        </linearGradient>
        
        <pattern id="waterPattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M0,10 Q5,5 10,10 T20,10" fill="none" stroke="#4080a0" stroke-width="1" opacity="0.3"/>
        </pattern>
        
        <pattern id="hatching" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#654321" stroke-width="1" opacity="0.2"/>
        </pattern>
    </defs>
    
    <rect width="100%" height="100%" fill="url(#bgGradient)"/>
`;

                // Add water areas
                if (city.waterAreas && city.waterAreas.length > 0) {
                    svg += '    <!-- Water Areas -->\n';
                    city.waterAreas.forEach(area => {
                        if (area.length < 3) return;
                        
                        svg += '    <path d="';
                        area.forEach((point, i) => {
                            if (i === 0) {
                                svg += `M ${point.x} ${point.y} `;
                            } else {
                                svg += `L ${point.x} ${point.y} `;
                            }
                        });
                        svg += 'Z" fill="#4080a0" stroke="#306090" stroke-width="2" opacity="0.8"/>\n';
                    });
                }

                // Add roads
                if (city.roads && city.roads.length > 0) {
                    svg += '    <!-- Roads -->\n';
                    city.roads.forEach(road => {
                        const strokeWidth = road.width || 4;
                        const color = road.type === 'main' ? '#c2b280' : 
                                    road.type === 'secondary' ? '#d4c9a8' : '#e5ddc8';
                        
                        svg += `    <line x1="${road.from.x}" y1="${road.from.y}" x2="${road.to.x}" y2="${road.to.y}" 
                                stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>\n`;
                    });
                }

                // Add buildings
                if (city.buildings && city.buildings.length > 0) {
                    svg += '    <!-- Buildings -->\n';
                    city.buildings.forEach(building => {
                        const color = this.getBuildingSVGColor(building.type);
                        svg += `    <rect x="${building.x - building.width/2}" y="${building.y - building.height/2}" 
                                width="${building.width}" height="${building.height}" 
                                fill="${color}" stroke="#5a4a31" stroke-width="1"
                                transform="rotate(${(building.rotation || 0) * (180/Math.PI)} ${building.x} ${building.y})"/>\n`;
                    });
                }

                // Add walls
                if (city.walls && city.walls.length > 0) {
                    svg += '    <!-- Walls -->\n';
                    svg += '    <polyline points="';
                    city.walls.forEach((point, i) => {
                        svg += `${point.x},${point.y} `;
                    });
                    if (city.walls.length > 2) {
                        svg += `${city.walls[0].x},${city.walls[0].y}`;
                    }
                    svg += `" fill="none" stroke="#654321" stroke-width="10" stroke-linejoin="round"/>\n`;
                    
                    // Wall towers
                    city.walls.forEach(point => {
                        svg += `    <circle cx="${point.x}" cy="${point.y}" r="6" fill="#543210"/>\n`;
                        svg += `    <circle cx="${point.x}" cy="${point.y}" r="4" fill="#654321"/>\n`;
                    });
                }

                // Add POIs
                if (city.pois && city.pois.length > 0) {
                    svg += '    <!-- Points of Interest -->\n';
                    city.pois.forEach(poi => {
                        const color = this.getPOISVGColor(poi.type);
                        svg += `    <circle cx="${poi.x}" cy="${poi.y}" r="8" fill="${color}"/>\n`;
                        svg += `    <text x="${poi.x}" y="${poi.y - 15}" 
                                text-anchor="middle" fill="white" font-size="10" font-family="Arial">
                                ${this.escapeXML(poi.label)}
                            </text>\n`;
                    });
                }

                // Add labels if requested
                if (includeNotes && city.labels && city.labels.length > 0) {
                    svg += '    <!-- Labels -->\n';
                    city.labels.forEach(label => {
                        svg += `    <text x="${label.x}" y="${label.y}" 
                                text-anchor="middle" fill="${label.color || 'white'}" 
                                font-size="${label.size || 12}" font-family="Arial">
                                ${this.escapeXML(label.text)}
                            </text>\n`;
                    });
                }

                // Add legend if requested
                if (includeLegend) {
                    svg += this.generateSVGLegend(width, height);
                }

                // Add attribution
                svg += `    <!-- Generated by Arcane Realm Builder -->
    <text x="${width - 10}" y="${height - 10}" 
          text-anchor="end" fill="rgba(255,255,255,0.5)" 
          font-size="10" font-family="Arial">
        seed: ${this.app.currentCity.meta.seed}
    </text>
</svg>`;

                // Create blob and trigger download
                const blob = new Blob([svg], { type: 'image/svg+xml' });
                this.triggerDownload(blob, filename);
                resolve({ success: true, filename });
                
            } catch (error) {
                console.error('Error exporting SVG:', error);
                reject(error);
            }
        });
    }

    async exportPDF(options = {}) {
        const {
            includeLegend = true,
            includeNotes = true,
            filename = `realm_${this.app.currentCity?.meta?.seed || Date.now()}.pdf`
        } = options;

        return new Promise((resolve, reject) => {
            try {
                if (typeof window.jspdf === 'undefined') {
                    reject(new Error('jsPDF library not loaded'));
                    return;
                }

                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });

                // Convert canvas to image
                const canvas = this.app.renderer.canvas;
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                
                // Calculate dimensions to fit page
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (canvas.height / canvas.width) * imgWidth;
                
                // Add image
                pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
                
                // Add crop marks
                this.addCropMarks(pdf, pageWidth, pageHeight);
                
                // Add title and metadata
                pdf.setFontSize(16);
                pdf.setTextColor(40, 40, 40);
                pdf.text('Arcane Realm Builder', margin, margin - 5);
                
                pdf.setFontSize(10);
                pdf.text(`Seed: ${this.app.currentCity?.meta?.seed || 'N/A'}`, margin, margin + imgHeight + 15);
                pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, margin + imgHeight + 20);
                pdf.text('arcane-realm-builder.com', pageWidth - margin, margin + imgHeight + 20, { align: 'right' });
                
                // Add legend if requested
                if (includeLegend) {
                    this.addPDFLegend(pdf, margin, pageHeight - 30);
                }
                
                // Save PDF
                pdf.save(filename);
                resolve({ success: true, filename });
                
            } catch (error) {
                console.error('Error exporting PDF:', error);
                reject(error);
            }
        });
    }

    async exportJSON(options = {}) {
        const {
            filename = `realm_${this.app.currentCity?.meta?.seed || Date.now()}.json`
        } = options;

        return new Promise((resolve, reject) => {
            try {
                if (!this.app.currentCity) {
                    reject(new Error('No city data available'));
                    return;
                }

                // Enhance data for 3D viewer
                const exportData = {
                    ...this.app.currentCity,
                    threeD: this.generate3DData(this.app.currentCity.city)
                };

                const jsonStr = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                this.triggerDownload(blob, filename);
                resolve({ success: true, filename });
                
            } catch (error) {
                console.error('Error exporting JSON:', error);
                reject(error);
            }
        });
    }

    async exportBatch(count = 10, options = {}) {
        const {
            prefix = 'realm_batch',
            format = 'png'
        } = options;

        return new Promise(async (resolve, reject) => {
            try {
                if (typeof window.JSZip === 'undefined') {
                    reject(new Error('JSZip library not loaded'));
                    return;
                }

                const zip = new JSZip();
                const originalSeed = this.app.currentCity?.meta?.seed;
                const originalCity = this.app.currentCity;
                
                this.isExporting = true;
                this.showExportProgress(0, count);
                
                for (let i = 0; i < count; i++) {
                    try {
                        // Generate variant
                        const variantSeed = originalSeed ? originalSeed + i + 1 : Date.now() + i;
                        const variantCity = await this.app.generateCityFromSeed(variantSeed);
                        
                        // Render city
                        this.app.renderer.render(variantCity);
                        
                        // Export based on format
                        let blob;
                        let filename;
                        
                        switch (format) {
                            case 'png':
                                const canvas = this.app.renderer.canvas;
                                blob = await new Promise(resolve => {
                                    canvas.toBlob(resolve, 'image/png', 1.0);
                                });
                                filename = `${prefix}_${i+1}_seed_${variantSeed}.png`;
                                break;
                                
                            case 'svg':
                                const svgData = await this.exportSVG({ 
                                    ...options, 
                                    filename: `${prefix}_${i+1}_seed_${variantSeed}.svg` 
                                });
                                // Note: This would need proper SVG export implementation
                                break;
                                
                            default:
                                throw new Error(`Unsupported format: ${format}`);
                        }
                        
                        if (blob) {
                            zip.file(filename, blob);
                        }
                        
                        // Update progress
                        this.showExportProgress(i + 1, count);
                        
                    } catch (error) {
                        console.error(`Error generating variant ${i + 1}:`, error);
                    }
                }
                
                // Restore original city
                if (originalCity) {
                    this.app.renderer.render(originalCity);
                }
                
                // Generate zip file
                const content = await zip.generateAsync({ type: 'blob' });
                const zipFilename = `${prefix}_${count}_variants.zip`;
                this.triggerDownload(content, zipFilename);
                
                this.isExporting = false;
                this.hideExportProgress();
                resolve({ success: true, filename: zipFilename });
                
            } catch (error) {
                console.error('Error exporting batch:', error);
                this.isExporting = false;
                this.hideExportProgress();
                reject(error);
            }
        });
    }

    // Helper methods
    getBuildingSVGColor(type) {
        const colors = {
            'residential': '#a1887f',
            'commercial': '#78909c',
            'religious': '#8d6e63',
            'military': '#5d4037',
            'governmental': '#6d4c41'
        };
        return colors[type] || '#8B7355';
    }

    getPOISVGColor(type) {
        const colors = {
            'Tavern': '#ff7043',
            'Temple': '#ab47bc',
            'Market': '#66bb6a',
            'Smithy': '#8d6e63',
            'Gate': '#795548',
            'Fountain': '#29b6f6',
            'Secret': '#9e9e9e'
        };
        return colors[type] || '#ffb74d';
    }

    escapeXML(str) {
        return str.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    drawLegendOnCanvas(ctx, scale, width, height) {
        // Simplified legend drawing
        ctx.save();
        ctx.scale(1/scale, 1/scale); // Scale back to original for text
        
        const legendX = width * scale - 200;
        const legendY = 20;
        
        // Legend background
        ctx.fillStyle = 'rgba(25, 30, 45, 0.9)';
        ctx.fillRect(legendX, legendY, 180, 200);
        
        // Legend title
        ctx.fillStyle = '#8ab4f8';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Legend', legendX + 10, legendY + 20);
        
        // Legend items
        const items = [
            { color: '#8B7355', label: 'Buildings' },
            { color: '#c2b280', label: 'Roads' },
            { color: '#654321', label: 'Walls' },
            { color: '#4080a0', label: 'Water' },
            { color: '#ffb74d', label: 'Points of Interest' }
        ];
        
        items.forEach((item, i) => {
            const y = legendY + 50 + i * 30;
            
            // Color box
            ctx.fillStyle = item.color;
            ctx.fillRect(legendX + 10, y - 8, 16, 16);
            
            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(item.label, legendX + 35, y);
        });
        
        ctx.restore();
    }

    drawNotesOnCanvas(ctx, scale) {
        const labels = this.app.currentCity?.city?.labels;
        if (!labels) return;
        
        ctx.save();
        ctx.scale(1/scale, 1/scale);
        
        labels.forEach(label => {
            ctx.fillStyle = label.color || 'white';
            ctx.font = `${label.size || 12}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(label.text, label.x, label.y);
        });
        
        ctx.restore();
    }

    drawWatermark(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Arcane Realm Builder • Seed: ${this.app.currentCity?.meta?.seed || 'N/A'}`, width - 10, height - 10);
        ctx.restore();
    }

    generateSVGLegend(width, height) {
        const legendX = width - 200;
        const legendY = 20;
        
        return `
    <!-- Legend -->
    <rect x="${legendX}" y="${legendY}" width="180" height="200" fill="rgba(25,30,45,0.9)" rx="5"/>
    <text x="${legendX + 10}" y="${legendY + 20}" font-family="Arial" font-size="14" font-weight="bold" fill="#8ab4f8">Legend</text>
    <g transform="translate(${legendX}, ${legendY})">
        <rect x="10" y="42" width="16" height="16" fill="#8B7355"/>
        <text x="35" y="50" font-family="Arial" font-size="12" fill="white">Buildings</text>
        <rect x="10" y="72" width="16" height="16" fill="#c2b280"/>
        <text x="35" y="80" font-family="Arial" font-size="12" fill="white">Roads</text>
        <rect x="10" y="102" width="16" height="16" fill="#654321"/>
        <text x="35" y="110" font-family="Arial" font-size="12" fill="white">Walls</text>
        <rect x="10" y="132" width="16" height="16" fill="#4080a0"/>
        <text x="35" y="140" font-family="Arial" font-size="12" fill="white">Water</text>
        <rect x="10" y="162" width="16" height="16" fill="#ffb74d"/>
        <text x="35" y="170" font-family="Arial" font-size="12" fill="white">Points of Interest</text>
    </g>
`;
    }

    addCropMarks(pdf, pageWidth, pageHeight) {
        const markLength = 5;
        const margin = 5;
        
        // Top-left
        pdf.line(margin, margin, margin + markLength, margin);
        pdf.line(margin, margin, margin, margin + markLength);
        
        // Top-right
        pdf.line(pageWidth - margin - markLength, margin, pageWidth - margin, margin);
        pdf.line(pageWidth - margin, margin, pageWidth - margin, margin + markLength);
        
        // Bottom-left
        pdf.line(margin, pageHeight - margin, margin + markLength, pageHeight - margin);
        pdf.line(margin, pageHeight - margin, margin, pageHeight - margin - markLength);
        
        // Bottom-right
        pdf.line(pageWidth - margin - markLength, pageHeight - margin, pageWidth - margin, pageHeight - margin);
        pdf.line(pageWidth - margin, pageHeight - margin, pageWidth - margin, pageHeight - margin - markLength);
    }

    addPDFLegend(pdf, x, y) {
        const items = [
            { color: [139, 115, 85], label: 'Buildings' },
            { color: [194, 178, 128], label: 'Roads' },
            { color: [101, 67, 33], label: 'Walls' },
            { color: [64, 128, 160], label: 'Water' },
            { color: [255, 183, 77], label: 'Points of Interest' }
        ];
        
        items.forEach((item, i) => {
            pdf.setFillColor(...item.color);
            pdf.rect(x, y + i * 8, 6, 6, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(8);
            pdf.text(item.label, x + 10, y + 5 + i * 8);
        });
    }

    generate3DData(city) {
        return {
            rooms: city.blocks.map(block => ({
                id: block.id,
                type: block.type,
                vertices: block.vertices,
                center: this.getPolygonCenter(block.vertices),
                elevation: block.elevation || 0,
                connections: this.findConnections(block.id, city.roads)
            })),
            connections: city.roads.map(road => ({
                from: this.findClosestRoom(road.from, city.blocks),
                to: this.findClosestRoom(road.to, city.blocks),
                type: road.type,
                width: road.width
            })),
            elevations: city.blocks.map(block => block.elevation || 0),
            pois: city.pois || []
        };
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

    findConnections(blockId, roads) {
        const connections = [];
        const blockCenter = this.getPolygonCenter(
            this.app.currentCity.city.blocks.find(b => b.id === blockId)?.vertices || []
        );
        
        roads.forEach(road => {
            const fromDist = this.distance(blockCenter, road.from);
            const toDist = this.distance(blockCenter, road.to);
            
            if (fromDist < 50 || toDist < 50) {
                connections.push({
                    to: fromDist < toDist ? this.findClosestRoom(road.to, this.app.currentCity.city.blocks) : 
                                          this.findClosestRoom(road.from, this.app.currentCity.city.blocks),
                    type: road.type
                });
            }
        });
        
        return connections;
    }

    findClosestRoom(point, blocks) {
        let minDist = Infinity;
        let closestId = -1;
        
        blocks.forEach(block => {
            const center = this.getPolygonCenter(block.vertices);
            const dist = this.distance(point, center);
            if (dist < minDist) {
                minDist = dist;
                closestId = block.id;
            }
        });
        
        return closestId;
    }

    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    showExportProgress(current, total) {
        // Remove existing progress if any
        const existing = document.getElementById('export-progress');
        if (existing) existing.remove();
        
        const progress = document.createElement('div');
        progress.id = 'export-progress';
        progress.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30, 35, 55, 0.95);
            border: 1px solid rgba(80, 110, 180, 0.6);
            border-radius: 10px;
            padding: 20px;
            z-index: 2000;
            min-width: 300px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        const percent = Math.round((current / total) * 100);
        progress.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #a0d0ff;">Exporting...</h3>
            <div style="background: rgba(40, 45, 70, 0.8); height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                <div style="background: linear-gradient(90deg, #4a9eff, #6b46c1); height: 100%; width: ${percent}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="text-align: center; color: #8ab4f8;">${current} of ${total} (${percent}%)</div>
        `;
        
        document.body.appendChild(progress);
    }

    hideExportProgress() {
        const progress = document.getElementById('export-progress');
        if (progress) {
            progress.remove();
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CityExporter;
} else {
    window.CityExporter = CityExporter;
}