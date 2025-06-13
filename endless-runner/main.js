// Basic Three.js setup
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(0, 20, 10);
scene.add(directional);

// Player
const lanePositions = [-2, 0, 2];
let currentLane = 1; // middle
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x8888ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(lanePositions[currentLane], 0.5, 5);
scene.add(player);

// Ground segments
const groundGeometry = new THREE.BoxGeometry(6, 0.1, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
const ground1 = new THREE.Mesh(groundGeometry, groundMaterial);
const ground2 = ground1.clone();
scene.add(ground1, ground2);
ground1.position.z = 0;
ground2.position.z = -20;

// Obstacles
const obstacleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff });
const obstacles = [];
for (let i = 0; i < 5; i++) {
    const obs = new THREE.Mesh(obstacleGeometry, obstacleMaterial.clone());
    resetObstacle(obs);
    scene.add(obs);
    obstacles.push(obs);
}

let jumpVelocity = 0;
let isGrounded = true;
let score = 0;
const overlay = document.createElement('div');
overlay.id = 'overlay';
overlay.textContent = 'Score: 0';
document.body.appendChild(overlay);

function resetObstacle(obs) {
    const lane = lanePositions[Math.floor(Math.random() * lanePositions.length)];
    const z = -Math.random() * 80 - 20;
    obs.position.set(lane, 0.75, z);
    const hue = Math.random();
    obs.material.color.setHSL(hue, 1, 0.5);
    obs.material.emissive.setHSL(hue, 1, 0.5);
}

function handleInput(event) {
    if (event.key === 'ArrowLeft' && currentLane > 0) {
        currentLane--;
    } else if (event.key === 'ArrowRight' && currentLane < lanePositions.length - 1) {
        currentLane++;
    } else if (event.key === ' ' && isGrounded) {
        jumpVelocity = 0.2;
        isGrounded = false;
    }
}
window.addEventListener('keydown', handleInput);

function updateObstacles(delta) {
    for (const obs of obstacles) {
        obs.position.z += 0.1 * delta;
        if (obs.position.z > camera.position.z + 2) {
            score += 1;
            resetObstacle(obs);
        }
        if (obs.position.distanceTo(player.position) < 1) {
            overlay.textContent = `Game Over! Final Score: ${score}`;
            cancelAnimationFrame(animationId);
            window.removeEventListener('keydown', handleInput);
        }
    }
}

function updateGround(delta) {
    ground1.position.z += 0.1 * delta;
    ground2.position.z += 0.1 * delta;
    if (ground1.position.z > 20) ground1.position.z = ground2.position.z - 20;
    if (ground2.position.z > 20) ground2.position.z = ground1.position.z - 20;
}

function updatePlayer(delta) {
    player.position.x = THREE.MathUtils.lerp(player.position.x, lanePositions[currentLane], 0.1 * delta);
    if (!isGrounded) {
        player.position.y += jumpVelocity * delta;
        jumpVelocity -= 0.01 * delta;
        if (player.position.y <= 0.5) {
            player.position.y = 0.5;
            isGrounded = true;
            jumpVelocity = 0;
        }
    }
}

let previousTimestamp = 0;
let animationId;
function animate(timestamp) {
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    updateGround(delta);
    updateObstacles(delta);
    updatePlayer(delta);

    camera.position.set(player.position.x, 3, player.position.z + 5);
    camera.lookAt(player.position.x, player.position.y, player.position.z - 5);

    overlay.textContent = `Score: ${score}`;

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
}

animate(0);
