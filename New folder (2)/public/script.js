// Cosmic Galaxy Canvas Animation
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Star Particle System
const stars = [];
const numStars = 180;

for (let i = 0; i < numStars; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8,
        color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 200 + 55)}, 255, ${Math.random() * 0.8 + 0.2})`,
        velocity: Math.random() * 0.6 + 0.1,
        alpha: Math.random(),
        alphaSpeed: Math.random() * 0.02 + 0.005
    });
}

// Shooting Stars
const shootingStars = [];

function createShootingStar() {
    if (Math.random() < 0.03) {
        shootingStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height / 2),
            length: Math.random() * 80 + 40,
            speed: Math.random() * 10 + 6,
            angle: 45 * (Math.PI / 180),
            opacity: 1
        });
    }
}

function animateSpace() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render & Move Stars
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();

        star.y -= star.velocity;
        if (star.y < 0) {
            star.y = canvas.height;
            star.x = Math.random() * canvas.width;
        }

        // Twinkle effect
        star.alpha += star.alphaSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) {
            star.alphaSpeed = -star.alphaSpeed;
        }
    });

    // Render & Move Shooting Stars
    createShootingStar();
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        ctx.beginPath();
        const endX = s.x - s.length * Math.cos(s.angle);
        const endY = s.y + s.length * Math.sin(s.angle);
        
        const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
        gradient.addColorStop(0, `rgba(0, 242, 254, ${s.opacity})`);
        gradient.addColorStop(1, `rgba(255, 0, 127, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        s.x += s.speed * Math.cos(s.angle);
        s.y += s.speed * Math.sin(s.angle);
        s.opacity -= 0.02;

        if (s.opacity <= 0 || s.x > canvas.width || s.y > canvas.height) {
            shootingStars.splice(i, 1);
        }
    }

    requestAnimationFrame(animateSpace);
}

animateSpace();
