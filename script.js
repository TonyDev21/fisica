const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 600;

let animationId = null;
let projectilePos = { x: 0, y: 0 };
let time = 0;
let isAnimating = false;
let isPaused = false;
let landingPoint = null;
let maxHeight = 0;
let trajectory = [];
let cannonTip = { x: 0, y: 0 };

const simulation = {
    initialVelocity: 18,
    angle: 20,
    mass: 24.35,
    gravity: 9.81,
    initialHeight: 0
};

function calculateTrajectoryPoint(t) {
    const angleRad = (simulation.angle * Math.PI) / 180;
    const v0x = simulation.initialVelocity * Math.cos(angleRad);
    const v0y = simulation.initialVelocity * Math.sin(angleRad);
    
    // Calculate x position using MRU
    const x = v0x * t;
    
    // Calculate y position using MRUV
    const y = v0y * t - (0.5 * simulation.gravity * t * t);
    
    return { x, y };
}

function calculateTimeOfFlight() {
    const angleRad = (simulation.angle * Math.PI) / 180;
    const v0y = simulation.initialVelocity * Math.sin(angleRad);
    
    // Time of flight = (2 * v0y) / g
    return (2 * v0y) / simulation.gravity;
}

function calculateDistance() {
    const angleRad = (simulation.angle * Math.PI) / 180;
    const v0x = simulation.initialVelocity * Math.cos(angleRad);
    const timeOfFlight = calculateTimeOfFlight();
    
    // Distance = v0x * t
    return v0x * timeOfFlight;
}

function calculateMaxHeight() {
    const angleRad = (simulation.angle * Math.PI) / 180;
    const v0y = simulation.initialVelocity * Math.sin(angleRad);
    
    // Maximum height = (v0y)² / (2g)
    return (v0y * v0y) / (2 * simulation.gravity);
}

function updateCannonTip() {
    const cannonLength = 80;
    const cannonX = 40;
    const cannonY = canvas.height - 40;
    const angleRad = (simulation.angle * Math.PI) / 180;
    
    cannonTip.x = cannonX + cannonLength * Math.cos(angleRad);
    cannonTip.y = cannonY - cannonLength * Math.sin(angleRad);
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    updateCannonTip();
    
    // Draw cannon
    const cannonLength = 80;
    const cannonWidth = 20;
    const cannonX = 40;
    const cannonY = canvas.height - 40;
    
    ctx.save();
    ctx.translate(cannonX, cannonY);
    ctx.rotate(-simulation.angle * Math.PI / 180);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, -cannonWidth / 2, cannonLength, cannonWidth);
    
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(0, -cannonWidth / 2, 10, cannonWidth);
    ctx.fillRect(cannonLength - 10, -cannonWidth / 2, 10, cannonWidth);
    
    ctx.beginPath();
    ctx.arc(0, 0, cannonWidth, 0, Math.PI * 2);
    ctx.fillStyle = '#D2691E';
    ctx.fill();
    
    ctx.restore();
    
    // Draw target
    const targetX = simulation.targetDistance * (canvas.width / 30);
    ctx.beginPath();
    ctx.arc(targetX, canvas.height - 20, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(targetX, canvas.height - 20, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(targetX, canvas.height - 20, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    
    // Draw trajectory
    if (trajectory.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 2;
        ctx.moveTo(cannonTip.x, cannonTip.y);
        for (let point of trajectory) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }
    
    // Draw projectile
    if (isAnimating || landingPoint) {
        ctx.beginPath();
        ctx.arc(projectilePos.x, projectilePos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
    }
}

function animate() {
    if (!isPaused && isAnimating) {
        const dt = 0.05;
        time += dt;
        
        const totalTime = calculateTimeOfFlight();
        const totalDistance = calculateDistance();
        
        if (time <= totalTime) {
            const pos = calculateTrajectoryPoint(time);
            
            // Scale positions for canvas display
            projectilePos.x = cannonTip.x + pos.x * (canvas.width / 30);
            projectilePos.y = cannonTip.y - pos.y * (canvas.height / 15);
            
            trajectory.push({x: projectilePos.x, y: projectilePos.y});
            
            const currentHeight = pos.y;
            if (currentHeight > maxHeight) {
                maxHeight = currentHeight;
                document.getElementById('heightValue').textContent = maxHeight.toFixed(2);
            }
            
            document.getElementById('distanceValue').textContent = (pos.x).toFixed(2);
            
            drawScene();
            animationId = requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            landingPoint = { 
                x: totalDistance,
                y: 0 
            };
            document.getElementById('distanceValue').textContent = totalDistance.toFixed(2);
            drawScene();
        }
    }
}

document.getElementById('fireButton').addEventListener('click', () => {
    if (!isAnimating) {
        time = 0;
        isAnimating = true;
        isPaused = false;
        landingPoint = null;
        maxHeight = 0;
        trajectory = [];
        updateCannonTip();
        projectilePos.x = cannonTip.x;
        projectilePos.y = cannonTip.y;
        document.getElementById('heightValue').textContent = calculateMaxHeight().toFixed(2);
        document.getElementById('distanceValue').textContent = calculateDistance().toFixed(2);
        animate();
    }
});

document.getElementById('pauseButton').addEventListener('click', () => {
    isPaused = true;
});

document.getElementById('playButton').addEventListener('click', () => {
    if (isAnimating) {
        isPaused = false;
        animate();
    }
});

document.getElementById('resetButton').addEventListener('click', () => {
    isAnimating = false;
    isPaused = false;
    time = 0;
    landingPoint = null;
    maxHeight = 0;
    trajectory = [];
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    document.getElementById('heightValue').textContent = '0.00';
    document.getElementById('distanceValue').textContent = '0.00';
    updateCannonTip();
    projectilePos.x = cannonTip.x;
    projectilePos.y = cannonTip.y;
    drawScene();
});

function updateSliderValue(sliderId, valueId, value) {
    document.getElementById(sliderId).value = value;
    document.getElementById(valueId).textContent = value;
}

document.getElementById('initialSpeed').addEventListener('input', function() {
    simulation.initialVelocity = parseFloat(this.value);
    updateSliderValue('initialSpeed', 'initialSpeedValue', simulation.initialVelocity);
    document.getElementById('speedValue').textContent = simulation.initialVelocity;
    drawScene();
});

document.getElementById('angle').addEventListener('input', function() {
    simulation.angle = parseFloat(this.value);
    updateSliderValue('angle', 'angleLabelValue', simulation.angle);
    document.getElementById('angleValue').textContent = simulation.angle;
    updateCannonTip();
    drawScene();
});

document.getElementById('mass').addEventListener('input', function() {
    simulation.mass = parseFloat(this.value);
    updateSliderValue('mass', 'massValue', simulation.mass.toFixed(2));
});

document.getElementById('gravity').addEventListener('input', function() {
    simulation.gravity = parseFloat(this.value);
    updateSliderValue('gravity', 'gravityValue', simulation.gravity.toFixed(2));
});

function createArrowButtonListeners(sliderId, valueId, step, min, max) {
    document.getElementById(sliderId + 'DecreaseBtn').addEventListener('click', () => {
        const slider = document.getElementById(sliderId);
        slider.value = Math.max(parseFloat(slider.value) - step, min);
        slider.dispatchEvent(new Event('input'));
    });

    document.getElementById(sliderId + 'IncreaseBtn').addEventListener('click', () => {
        const slider = document.getElementById(sliderId);
        slider.value = Math.min(parseFloat(slider.value) + step, max);
        slider.dispatchEvent(new Event('input'));
    });
}

createArrowButtonListeners('mass', 'massValue', 0.01, 1, 31);
createArrowButtonListeners('gravity', 'gravityValue', 0.01, 0, 20);
createArrowButtonListeners('angle', 'angleLabelValue', 1, 0, 90);
createArrowButtonListeners('initialSpeed', 'initialSpeedValue', 0.1, 0, 30);

// Initial setup
updateCannonTip();
projectilePos.x = cannonTip.x;
projectilePos.y = cannonTip.y;
drawScene();

