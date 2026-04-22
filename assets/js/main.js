import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();

let camera, scene, renderer, stats, object, loader, guiMorphsFolder;
let mixer, actions = {}, currentAction = null, animationsFolder;

const timer = new THREE.Timer();
timer.connect(document);

const isGitHub = window.location.hostname.includes('github.io');

const BASE_PATH = window.location.hostname.includes('github.io')
    ? '/Modelo-3D-Graficacion - copia/assets/models/fbx/'  // ← CAMBIA ESTO POR TU REPO REAL
    : './assets/models/fbx/';

const animationNames = [
    'Jump',
    'Jumping',
    'Martelo2',
    'SittingYell'
];

const animationFiles = [
    'Jump.fbx',
    'Jumping.fbx',
    'Martelo2.fbx',
    'MediumHit.fbx',
    'SittingYellx.fbx'
];

let modelLoaded = false;
let animationsLoaded = 0;

init();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100;
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    // ground
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader(manager);

    // Load base model
loader.load(BASE_PATH + 'character.fbx', function (group) {
        object = group;
        scene.add(object);
        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        mixer = new THREE.AnimationMixer(object);
        modelLoaded = true;
        loadAnimations();
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);

    // stats
    stats = new Stats();
    container.appendChild(stats.dom);

    // Create Footer
    createFooter();

    guiMorphsFolder = new GUI().addFolder('Morphs').hide();
    animationsFolder = new GUI().addFolder('Animations').hide();
}

function createFooter() {

    const footer = document.createElement('footer');
    footer.className = 'footer-custom';

    footer.innerHTML = `
        <div class="footer-container">

            <div class="footer-grid">

                <!-- DEV -->
                <div class="footer-section">
                    <h5>👨‍💻 Desarrollador</h5>
                    <p class="developer-name">Roman Resendiz Vargas</p>
                    <p class="developer-title">Ingeniería en Sistemas Computacionales</p>
                </div>

                <!-- ACADEMICO -->
                <div class="footer-section">
                    <h5>🎓 Académico</h5>
                    <p><strong>Maestro:</strong> Pinedo Fernandez Victor Manuel</p>
                    <p><strong>Materia:</strong> Graficación</p>
                </div>

                <!-- CONTACTO -->
                <div class="footer-section">
                    <h5>🌐 Contacto</h5>
                    <a href="https://github.com/resendizr722-star/Control-personalizado--de--modelos--3D" target="_blank">
                        GitHub: resendizr722-star
                    </a>
                    <p class="footer-location">México, 2026</p>
                </div>

            </div>

            <div class="footer-bottom">
                © 2026 Roman Resendiz — Proyecto de Animación 3D con Three.js
            </div>

        </div>
    `;

    document.body.appendChild(footer);
}


function loadAnimations() {
    animationFiles.forEach((file, index) => {
      loader.load(BASE_PATH + file, function (animGroup) {
            if (animGroup.animations && animGroup.animations.length > 0) {
                const clip = animGroup.animations[0];
                const action = mixer.clipAction(clip);
                actions[animationNames[index]] = action;
            }
            animationsLoaded++;
            if (animationsLoaded === animationFiles.length) {
                animationsFolder.show();
                animationsFolder.children.forEach((child) => child.destroy());
                animationNames.forEach((name) => {
                    animationsFolder.add({ [name]: () => switchAnimation(name) }, name);
                });
                switchAnimation(animationNames[0]);
            }
        });
    });
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function switchAnimation(clipName) {
    if (currentAction) {
        currentAction.fadeOut(0.25);
    }
    const action = actions[clipName];
    if (action) {
        action.reset().setEffectiveTimeScale(1).fadeIn(0.25).play();
        currentAction = action;
    }
}

function onKeyDown(event) {
    const key = parseInt(event.key);
    if (key >= 1 && key <= 5) {
        switchAnimation(animationNames[key - 1]);
    }
}

function animate() {

    timer.update();

    const delta = timer.getDelta();

    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);

    stats.update();

}