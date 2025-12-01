/**
 * Interactive Animations for Portfolio Website
 * Includes:
 * 1. Constellation Canvas Background
 * 2. Spotlight Card Hover Effects
 */

class CanvasBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        
        // Configuration
        this.particleCount = 100; // Will be adjusted based on screen size
        this.connectionDistance = 100;
        this.mouseConnectionDistance = 150;
        this.baseColor = 'rgba(99, 102, 241, 0.5)'; // Indigo-500
        this.highlightColor = 'rgba(0, 212, 255, 0.8)'; // Cyan
        
        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        this.resize();
        this.createParticles();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Adjust particle count based on screen area
        const area = this.canvas.width * this.canvas.height;
        this.particleCount = Math.floor(area / 10000); // 1 particle per 10000px^2
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5, // Velocity X
                vy: (Math.random() - 0.5) * 0.5, // Velocity Y
                size: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? this.baseColor : this.highlightColor
            });
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateParticles();
        this.drawConnections();
        this.drawParticles();
    }

    updateParticles() {
        for (let particle of this.particles) {
            // Move particles
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

            // Mouse interaction
            if (this.mouse.x != null) {
                let dx = this.mouse.x - particle.x;
                let dy = this.mouse.y - particle.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    
                    // Gentle attraction/repulsion or just slight movement
                    // Let's make them move slightly away from mouse for a "ripple" effect
                    // or towards it for "magnetic" effect. Let's go with magnetic but clamped.
                    if (distance > 50) { // Don't collapse completely
                         particle.x += forceDirectionX * force * 0.5;
                         particle.y += forceDirectionY * force * 0.5;
                    }
                }
            }
        }
    }

    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
        }
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                let dx = this.particles[i].x - this.particles[j].x;
                let dy = this.particles[i].y - this.particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(99, 102, 241, ${1 - distance / this.connectionDistance})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
            
            // Connect to mouse
            if (this.mouse.x != null) {
                let dx = this.particles[i].x - this.mouse.x;
                let dy = this.particles[i].y - this.mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouseConnectionDistance) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(0, 212, 255, ${1 - distance / this.mouseConnectionDistance})`;
                    this.ctx.lineWidth = 1.5;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

class SpotlightEffect {
    constructor(selector) {
        this.elements = document.querySelectorAll(selector);
        this.init();
    }

    init() {
        this.elements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                el.style.setProperty('--mouse-x', `${x}px`);
                el.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if canvas exists before init
    if (document.getElementById('bg-canvas')) {
        new CanvasBackground('bg-canvas');
    }
    
    // Initialize spotlight for cards
    new SpotlightEffect('.service-card, .portfolio-item, .benefit-card, .pricing-card');
});
