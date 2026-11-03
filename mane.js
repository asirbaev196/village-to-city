import * as THREE from 'three';

// ---------- Сцена ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 90);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ---------- Свет ----------
const sun = new THREE.DirectionalLight(0xfff5e0, 2);
sun.position.set(10, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// ---------- Земля и дорога ----------
const grass = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x4a7c3a })
);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 200),
  new THREE.MeshStandardMaterial({ color: 0x8b7355 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;
road.receiveShadow = true;
scene.add(road);

// ---------- Дома ----------
function createHouse(x, z, rotationY = 0) {
  const house = new THREE.Group();

  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(5, 3, 4),
    new THREE.MeshStandardMaterial({ color: 0xd9c8a9 })
  );
  walls.position.y = 1.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  house.add(walls);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.8, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x8b3a2a })
  );
  roof.position.y = 4;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  house.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.8, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
  );
  door.position.set(0, 0.9, 2.01);
  house.add(door);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0x88ccee });
  [[-1.5, 1.8], [1.5, 1.8]].forEach(([wx, wy]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.1), windowMat);
    win.position.set(wx, wy, 2.01);
    house.add(win);
  });

  house.position.set(x, 0, z);
  house.rotation.y = rotationY;
  return house;
}

scene.add(createHouse(-5, -10));
scene.add(createHouse(6, 5, Math.PI));

// ---------- Деревья ----------
function createTree(x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
  );
  trunk.position.y = 0.75;
  trunk.castShadow = true;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0x2d6b2d })
  );
  crown.position.y = 2;
  crown.castShadow = true;
  tree.add(crown);

  tree.position.set(x, 0, z);
  return tree;
}

for (let i = -40; i <= 40; i += 8) {
  scene.add(createTree(-6 - Math.random() * 3, i + Math.random() * 4));
  scene.add(createTree(6 + Math.random() * 3, i + Math.random() * 4));
}

// ---------- Персонаж ----------
function createCharacter() {
  const character = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.6, 4, 8), clothMat);
  body.position.y = 0.9;
  body.castShadow = true;
  character.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
  head.position.y = 1.5;
  head.castShadow = true;
  character.add(head);

  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8);
  const leftArm = new THREE.Mesh(armGeo, clothMat);
  leftArm.position.set(-0.35, 0.95, 0);
  character.add(leftArm);
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.35;
  character.add(rightArm);

  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
  const leftLeg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x333366 }));
  leftLeg.position.set(-0.13, 0.3, 0);
  leftLeg.castShadow = true;
  character.add(leftLeg);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.13;
  character.add(rightLeg);

  character.userData = { leftLeg, rightLeg, leftArm, rightArm };
  return character;
}

const character = createCharacter();
scene.add(character);

// ---------- Управление кнопками ----------
const keys = { up: false, down: false, left: false, right: false };
const SPEED = 3;        // м/с
const TURN_SPEED = 8;   // плавность поворота

function setKey(dir, pressed) {
  if (dir in keys) keys[dir] = pressed;
}

document.querySelectorAll('.btn').forEach(btn => {
  const dir = btn.dataset.dir;

  // pointerevents работают и для мыши, и для тача
  const press = (e) => {
    e.preventDefault();
    btn.classList.add('pressed');
    setKey(dir, true);
  };
  const release = (e) => {
    e.preventDefault();
    btn.classList.remove('pressed');
    setKey(dir, false);
  };

  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
});

// На всякий случай сбрасываем всё при потере фокуса
addEventListener('blur', () => {
  Object.keys(keys).forEach(k => keys[k] = false);
  document.querySelectorAll('.btn').forEach(b => b.classList.remove('pressed'));
});

// ---------- Анимация ----------
const clock = new THREE.Clock();
let targetRotation = 0;       // куда хочет повернуться персонаж
let isWalking = false;

// Стартовая позиция камеры
camera.position.set(4, 4, -8);
camera.lookAt(character.position);

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1); // защита от больших скачков
  const t = clock.getElapsedTime();

  // --- Направление ввода ---
  let dx = 0, dz = 0;
  if (keys.up)    dz -= 1;
  if (keys.down)  dz += 1;
  if (keys.left)  dx -= 1;
  if (keys.right) dx += 1;

  isWalking = dx !== 0 || dz !== 0;

  if (isWalking) {
    // Нормализуем диагональ
    const len = Math.hypot(dx, dz);
    dx /= len;
    dz /= len;

    // Двигаем персонажа
    character.position.x += dx * SPEED * dt;
    character.position.z += dz * SPEED * dt;

    // Ограничим по карте (не улетает бесконечно)
    character.position.x = Math.max(-30, Math.min(30, character.position.x));
    character.position.z = Math.max(-90, Math.min(90, character.position.z));

    // Целевой угол поворота (модель смотрит в -Z)
    targetRotation = Math.atan2(dx, dz) + Math.PI;
  }

  // Плавный поворот к целевому углу
  let diff = targetRotation - character.rotation.y;
  while (diff > Math.PI)  diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  character.rotation.y += diff * Math.min(1, TURN_SPEED * dt);

  // --- Анимация ходьбы ---
  const { leftLeg, rightLeg, leftArm, rightArm } = character.userData;
  if (isWalking) {
    const swing = Math.sin(t * 10) * 0.6;
    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;
    leftArm.rotation.x = -swing * 0.7;
    rightArm.rotation.x = swing * 0.7;
    character.position.y = Math.abs(Math.sin(t * 10)) * 0.05;
  } else {
    // Плавно возвращаем в нейтраль
    leftLeg.rotation.x *= 0.85;
    rightLeg.rotation.x *= 0.85;
    leftArm.rotation.x *= 0.85;
    rightArm.rotation.x *= 0.85;
    character.position.y *= 0.85;
  }

  // --- Камера от третьего лица ---
  // Камера висит сзади относительно поворота персонажа
  const camOffset = new THREE.Vector3(0, 4, -8);
  camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);
  const targetCamPos = character.position.clone().add(camOffset);

  camera.position.lerp(targetCamPos, 1 - Math.pow(0.001, dt)); // плавное следование
  camera.lookAt(
    character.position.x,
    character.position.y + 1,
    character.position.z
  );

  renderer.render(scene, camera);
}
animate();

// ---------- Ресайз ----------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
