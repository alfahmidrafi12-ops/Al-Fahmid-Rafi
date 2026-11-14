import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import {
  CameraMode,
  DRIVER_PROFILES,
  DriverId,
  GamePhase,
  HudSnapshot,
  InputState,
  ScreenPopup,
  SignalColor,
  TrafficSignalHudInfo,
  WeatherType,
} from '../types/game';
import {
  CityCellStallData,
  createCityGridCell,
  createCngModel,
  createDhakaBusModel,
  createDhakaTruckModel,
  createDriverModel,
  createLegunaModel,
  createMobModel,
  createBorkaWomanModel,
  createPedestrianModel,
  createPickupModel,
  createRickshawModel,
  createTrafficRickshawModel,
  DriverRig,
  MobRig,
  PedestrianRig,
  RickshawRig,
  TrafficLightRig,
} from './models';
import { createProceduralTextures, ProceduralTexturePack } from './textures';

// Module-scope reusable math helpers (Zero GC in animation loop)
const _v1 = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _colorTmp = new THREE.Color();

const CELL_SIZE = 96;
const GRID_SIZE = 3; // 3x3 = 9 seamless 96m super-cells (288m x 288m)
const HALF_GRID_SPAN = (CELL_SIZE * GRID_SIZE) / 2; // 144m
const ROAD_HALF_DRIVABLE = 7.35; // Curb inner edge is 8.0m
const BELL_COOLDOWN_SEC = 3.8;
const TURBO_DURATION_SEC = 4.5;
const COMBO_WINDOW_SEC = 4.2;
const HIGH_SCORE_STORAGE_KEY = 'dhandabaz_3d_highscore_v3';

const CROSSING_NAMES = [
  'গুলিস্তান জিরো পয়েন্ট মোড়',
  'ফার্মগেট চৌরাস্তা ক্রসিং',
  'শাহবাগ চত্বর ইন্টারসেকশন',
  'বাংলাবাজার মোড় ক্রসিং',
  'সায়দাবাদ ট্রাফিক জংশন',
  'মৌচাক ক্রসিং মোড়',
];

const DISTRICT_NAMES = [
  'মতিঝিল বাণিজ্যিক এলাকা',
  'ঢাকা জেলা জজ আদালত চত্বর',
  'বাংলাদেশ সচিবালয় পাড়া',
  'পুরান ঢাকা চকবাজার',
  'গুলিস্তান জিরো পয়েন্ট',
  'কাওরান বাজার মেট্রো রোড',
  'শাহবাগ ও টিএসসি এলাকা',
  'বংশাল ও নবাবপুর রোড',
];

interface CityCell {
  group: THREE.Group;
  metroGroup: THREE.Group;
  gridX: number;
  gridZ: number;
  xCenter: number;
  zCenter: number;
  stalls: CityCellStallData[];
  lampBulbs: THREE.Mesh[];
  asphaltMats: THREE.MeshStandardMaterial[];
  lightRig: TrafficLightRig;
  state: SignalColor;
  timer: number;
  crossingNameBn: string;
  playerViolated: boolean;
  playerRewarded: boolean;
}

interface TrafficVehicle {
  mesh: THREE.Group;
  vehicleType: 'bus' | 'truck' | 'cng' | 'rickshaw' | 'leguna';
  halfLen: number;
  isBus: boolean;
  isTruck: boolean;
  axis: 'Z' | 'X';
  aveBase: number; // Grid avenue coordinate (multiples of 96): X for 'Z' axis, Z for 'X' axis
  laneOffset: number; // Lateral lane offset within [-5.0, +5.0]
  targetLaneOffset: number;
  baseSpeed: number;
  currentSpeed: number;
  direction: -1 | 1;
  nearMissAwarded: boolean;
  hitCooldown: number;
  hornCooldown: number;
  stoppedAtLight: boolean;
  overtakeCooldown: number;
  swayPhase: number;
}

interface StreetPickup {
  mesh: THREE.Group;
  kind: 'biryani' | 'chai';
  active: boolean;
}

interface PedestrianEntry {
  rig: PedestrianRig;
  axis: 'Z' | 'X';
  side: -1 | 1;
  aveBase: number;
}

interface ActiveMob {
  rig: MobRig;
  stunTimer: number;
  knockVelX: number;
  knockVelZ: number;
}

interface DebrisParticle {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotVel: THREE.Vector3;
  scale: number;
  life: number;
  maxLife: number;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onPopup: (popup: ScreenPopup) => void;
}

function wrapCellLocal(val: number): number {
  const m = (((val + CELL_SIZE * 0.5) % CELL_SIZE) + CELL_SIZE) % CELL_SIZE;
  return m - CELL_SIZE * 0.5;
}

export class DhakaGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private textures!: ProceduralTexturePack;
  private envMapTexture: THREE.Texture | null = null;

  private hemiLight!: THREE.HemisphereLight;
  private sunLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private sunOffset = new THREE.Vector3(28, 36, 22);

  private rickshaw!: RickshawRig;
  private driver: DriverRig | null = null;
  private selectedDriverId: DriverId = 'kader';

  private cells: CityCell[] = [];
  private traffic: TrafficVehicle[] = [];
  private pedestrians: PedestrianEntry[] = [];
  private pickups: StreetPickup[] = [];
  private mobs: ActiveMob[] = [];
  private activeCrossingHudInfo?: TrafficSignalHudInfo;

  // Instanced debris system (Zero GC)
  private debrisInstanced!: THREE.InstancedMesh;
  private debrisPool: DebrisParticle[] = [];
  private readonly maxDebris = 96;

  // Bell shockwave visual ring
  private shockwaveRing!: THREE.Mesh;
  private shockwaveTimer = 0;
  private shockwaveMaxRadius = 9.0;

  // Game & Physics state
  private phase: GamePhase = GamePhase.MENU;
  private cameraMode: CameraMode = CameraMode.CHASE;
  private weather: WeatherType = 'SUNNY';
  private roadGrip = 1.0;

  private cloudGroup!: THREE.Group;
  private cloudMat!: THREE.MeshBasicMaterial;
  private clouds: { mesh: THREE.Group; speed: number; overcastOnly: boolean }[] = [];
  private ambientMotes!: THREE.Points;
  private ambientMotesMat!: THREE.PointsMaterial;
  private ambientMotesPos!: Float32Array;
  private readonly moteCount = 150;
  private skyDome!: THREE.Mesh;
  private skyUniforms!: {
    uZenithColor: { value: THREE.Color };
    uMidColor: { value: THREE.Color };
    uHorizonColor: { value: THREE.Color };
    uSunDir: { value: THREE.Vector3 };
    uSunGlow: { value: number };
  };

  private speed = 0;
  private lateralVel = 0;
  private angularVel = 0;
  private steerAngle = 0;
  private yaw = 0;
  private pitchAngle = 0;
  private bounceHeight = 0;
  private bounceVel = 0;
  private wheelSpin = 0;
  private menuOrbitAngle = 0.45;
  private cameraShake = 0;
  private curbHitCooldown = 0;
  private currentLookAt = new THREE.Vector3(0, 1.4, 0);
  private lastPlayerGridX = 0;
  private lastPlayerGridZ = 0;
  private cityGround!: THREE.Mesh;

  private money = 0;
  private highScore = 0;
  private health = 100;
  private wantedLevel = 0;
  private combo = 0;
  private comboTimer = 0;
  private stallsSmashed = 0;
  private distanceMeters = 0;
  private bellCooldown = 0;
  private turboTimer = 0;
  private bellJiggleTimer = 0;
  private popupCounter = 1;

  private input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  };

  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private hudEmitAccumulator = 0;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.highScore = this.loadHighScore();

    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.initScene();
    this.buildWorld();
    this.setDriver('kader', false);
    this.applyWeather('SUNNY');
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.emitHudSnapshot();
    this.clock.start();
    this.scheduleNextFrame();
  }

  private loadHighScore(): number {
    try {
      const val = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    try {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(Math.floor(score)));
    } catch {}
  }

  private initScene(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbce0fa);
    this.scene.fog = new THREE.FogExp2(0xc9e4f8, 0.0056);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.15, 260);
    this.camera.position.set(3.8, 2.8, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envMapTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMapTexture;
    this.scene.environmentIntensity = 0.68;
    pmremGenerator.dispose();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x475569, 1.15);
    this.hemiLight.position.set(0, 45, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d6, 2.55);
    this.sunLight.position.set(28, 46, 22);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    const d = 34;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 115;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 0.48);
    this.rimLight.position.set(-22, 20, -30);
    this.scene.add(this.rimLight);
  }

  private getCrossingName(gx: number, gz: number): string {
    const hash = Math.abs(gx * 7 + gz * 13);
    return CROSSING_NAMES[hash % CROSSING_NAMES.length];
  }

  private getDistrictName(gx: number, gz: number): string {
    const hash = Math.abs(gx * 11 + gz * 5 + 3);
    return DISTRICT_NAMES[hash % DISTRICT_NAMES.length];
  }

  private buildWorld(): void {
    // 1. Player Rickshaw
    this.rickshaw = createRickshawModel(this.textures);
    this.scene.add(this.rickshaw.root);

    // 2. Bell Sonic Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.75, 1.05, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.position.y = 0.14;
    this.shockwaveRing.visible = false;
    this.scene.add(this.shockwaveRing);

    // 2b. Infinite Ground Foundation following player (Zero horizon void anywhere)
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.94,
      metalness: 0.04,
    });
    this.cityGround = new THREE.Mesh(groundGeo, groundMat);
    this.cityGround.position.set(0, -0.02, 0);
    this.cityGround.receiveShadow = true;
    this.scene.add(this.cityGround);

    // 2c. Atmospheric Procedural Gradient Sky Dome (Sunny vs Cloudy monsoon sky — zero fog occlusion)
    this.skyUniforms = {
      uZenithColor: { value: new THREE.Color(0x2d6cb5) },
      uMidColor: { value: new THREE.Color(0x78b8ed) },
      uHorizonColor: { value: new THREE.Color(0xd2e9fa) },
      uSunDir: { value: new THREE.Vector3(26, 48, 20).normalize() },
      uSunGlow: { value: 0.48 },
    };
    const skyGeo = new THREE.SphereGeometry(195, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uZenithColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunDir;
        uniform float uSunGlow;
        varying vec3 vWorldDir;
        void main() {
          float h = clamp(vWorldDir.y, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
          col = mix(col, uZenithColor, smoothstep(0.24, 0.88, h));
          float sunAmt = max(dot(normalize(vWorldDir), uSunDir), 0.0);
          col += vec3(1.0, 0.94, 0.80) * pow(sunAmt, 14.0) * uSunGlow;
          col += vec3(1.0, 0.98, 0.92) * smoothstep(0.9965, 0.9994, sunAmt) * uSunGlow * 1.4;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);

    // 2d. Multi-Layered Drifting Sky Clouds (for Sunny & Cloudy Dhaka atmosphere)
    this.cloudGroup = new THREE.Group();
    this.cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const puffGeo = new THREE.SphereGeometry(1, 8, 6);
    for (let i = 0; i < 20; i++) {
      const cluster = new THREE.Group();
      const puffCount = 3 + (i % 4);
      for (let j = 0; j < puffCount; j++) {
        const puff = new THREE.Mesh(puffGeo, this.cloudMat);
        const rxScale = 6.2 + ((i * 7 + j * 3) % 6);
        const ryScale = 1.7 + ((i + j) % 3) * 0.5;
        const rzScale = 4.6 + ((i * 5 + j * 2) % 5);
        puff.scale.set(rxScale, ryScale, rzScale);
        puff.position.set(
          (j - (puffCount - 1) * 0.5) * 4.8,
          ((i + j) % 2) * 0.9,
          (((j * 3) % 3) - 1) * 2.4
        );
        cluster.add(puff);
      }
      const gridRow = Math.floor(i / 5);
      const gridCol = i % 5;
      cluster.position.set(
        -112 + gridCol * 56 + ((i * 19) % 22),
        46 + (i % 4) * 4.2,
        -112 + gridRow * 68 + ((i * 13) % 22)
      );
      this.cloudGroup.add(cluster);
      this.clouds.push({
        mesh: cluster,
        speed: 1.5 + (i % 4) * 0.55,
        overcastOnly: i % 2 === 1,
      });
    }
    this.scene.add(this.cloudGroup);

    // 2e. Subtle Atmospheric Sunbeam Dust / Humid Monsoon Breeze Motes (Zero-GC Points buffer)
    this.ambientMotesPos = new Float32Array(this.moteCount * 3);
    for (let i = 0; i < this.moteCount; i++) {
      this.ambientMotesPos[i * 3] = (Math.random() - 0.5) * 56;
      this.ambientMotesPos[i * 3 + 1] = 0.6 + Math.random() * 14;
      this.ambientMotesPos[i * 3 + 2] = (Math.random() - 0.5) * 56;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(this.ambientMotesPos, 3));
    this.ambientMotesMat = new THREE.PointsMaterial({
      color: 0xfef3c7,
      size: 0.22,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    this.ambientMotes = new THREE.Points(moteGeo, this.ambientMotesMat);
    this.ambientMotes.frustumCulled = false;
    this.scene.add(this.ambientMotes);

    // 3. 3x3 INFINITE 2D CITY SUPER-CELL GRID (Every cell = 96m x 96m)
    let cellIdx = 0;
    for (let gz = -1; gz <= 1; gz++) {
      for (let gx = -1; gx <= 1; gx++) {
        const res = createCityGridCell(cellIdx, this.textures);
        const xCenter = gx * CELL_SIZE;
        const zCenter = gz * CELL_SIZE;
        res.group.position.set(xCenter, 0, zCenter);
        // Metro viaduct appears ONLY along the central main corridor (gridX === 0)
        res.metroGroup.visible = gx === 0;
        this.scene.add(res.group);

        const initialSignal: SignalColor = (gx + gz) % 2 === 0 ? 'GREEN' : 'RED';
        res.lightRig.setSignal(initialSignal);

        this.cells.push({
          group: res.group,
          metroGroup: res.metroGroup,
          gridX: gx,
          gridZ: gz,
          xCenter,
          zCenter,
          stalls: res.stalls,
          lampBulbs: res.lampBulbs,
          asphaltMats: res.asphaltMats,
          lightRig: res.lightRig,
          state: initialSignal,
          timer: 6.0 + (cellIdx % 3) * 2.5,
          crossingNameBn: this.getCrossingName(gx, gz),
          playerViolated: false,
          playerRewarded: false,
        });
        cellIdx++;
      }
    }

    // 4. 2D INFINITE DHAKA TRAFFIC (Abundant Cycle Rickshaws + Buses, Trucks, Sculpted CNGs & Legunas)
    const zConfigs = [
      { type: 'rickshaw' as const, laneOffset: -5.2, dir: -1 as const, speed: 5.2, posOffset: -18 },
      { type: 'rickshaw' as const, laneOffset: -4.8, dir: -1 as const, speed: 4.8, posOffset: -54 },
      { type: 'rickshaw' as const, laneOffset: -5.3, dir: -1 as const, speed: 5.7, posOffset: 26 },
      { type: 'rickshaw' as const, laneOffset: -4.9, dir: -1 as const, speed: 5.0, posOffset: 76 },
      { type: 'rickshaw' as const, laneOffset: -5.1, dir: -1 as const, speed: 5.5, posOffset: -94 },
      { type: 'truck' as const, laneOffset: -3.7, dir: -1 as const, speed: 6.9, posOffset: -34 },
      { type: 'bus' as const, laneOffset: -3.8, dir: -1 as const, speed: 7.9, posOffset: -76 },
      { type: 'leguna' as const, laneOffset: -3.3, dir: -1 as const, speed: 9.2, posOffset: 42 },
      { type: 'cng' as const, laneOffset: -1.8, dir: -1 as const, speed: 12.2, posOffset: -46 },
      { type: 'cng' as const, laneOffset: -1.9, dir: -1 as const, speed: 11.4, posOffset: 62 },
      { type: 'rickshaw' as const, laneOffset: 5.2, dir: 1 as const, speed: 5.4, posOffset: -42 },
      { type: 'rickshaw' as const, laneOffset: 4.8, dir: 1 as const, speed: 4.9, posOffset: 16 },
      { type: 'rickshaw' as const, laneOffset: 5.3, dir: 1 as const, speed: 5.8, posOffset: 58 },
      { type: 'rickshaw' as const, laneOffset: 4.9, dir: 1 as const, speed: 5.1, posOffset: -84 },
      { type: 'truck' as const, laneOffset: 3.7, dir: 1 as const, speed: 6.7, posOffset: -60 },
      { type: 'bus' as const, laneOffset: 3.8, dir: 1 as const, speed: 7.6, posOffset: 28 },
      { type: 'leguna' as const, laneOffset: 3.3, dir: 1 as const, speed: 9.0, posOffset: -90 },
      { type: 'cng' as const, laneOffset: 1.8, dir: 1 as const, speed: 12.4, posOffset: -24 },
      { type: 'cng' as const, laneOffset: 1.9, dir: 1 as const, speed: 11.8, posOffset: 82 },
    ];

    const xConfigs = [
      { type: 'rickshaw' as const, laneOffset: -5.2, dir: 1 as const, speed: 5.3, posOffset: -82 },
      { type: 'rickshaw' as const, laneOffset: -4.9, dir: 1 as const, speed: 4.7, posOffset: -22 },
      { type: 'rickshaw' as const, laneOffset: -5.3, dir: 1 as const, speed: 5.6, posOffset: 48 },
      { type: 'truck' as const, laneOffset: -3.7, dir: 1 as const, speed: 6.8, posOffset: -52 },
      { type: 'bus' as const, laneOffset: -3.8, dir: 1 as const, speed: 7.8, posOffset: 32 },
      { type: 'cng' as const, laneOffset: -1.9, dir: 1 as const, speed: 12.0, posOffset: -32 },
      { type: 'leguna' as const, laneOffset: -3.3, dir: 1 as const, speed: 9.2, posOffset: 74 },
      { type: 'rickshaw' as const, laneOffset: 5.2, dir: -1 as const, speed: 5.1, posOffset: -64 },
      { type: 'rickshaw' as const, laneOffset: 4.9, dir: -1 as const, speed: 5.6, posOffset: 18 },
      { type: 'rickshaw' as const, laneOffset: 5.3, dir: -1 as const, speed: 4.8, posOffset: 84 },
      { type: 'truck' as const, laneOffset: 3.7, dir: -1 as const, speed: 6.7, posOffset: 52 },
      { type: 'bus' as const, laneOffset: 3.8, dir: -1 as const, speed: 7.7, posOffset: -36 },
      { type: 'cng' as const, laneOffset: 1.9, dir: -1 as const, speed: 11.8, posOffset: 24 },
      { type: 'leguna' as const, laneOffset: 3.3, dir: -1 as const, speed: 9.0, posOffset: -78 },
    ];

    const halfLengthByType: Record<TrafficVehicle['vehicleType'], number> = {
      truck: 3.8,
      bus: 4.9,
      leguna: 2.8,
      cng: 1.5,
      rickshaw: 1.3,
    };

    const buildVehicleMesh = (type: TrafficVehicle['vehicleType'], seed: number): THREE.Group => {
      if (type === 'truck') return createDhakaTruckModel(this.textures, seed % 5);
      if (type === 'bus') return createDhakaBusModel(this.textures);
      if (type === 'leguna') return createLegunaModel(this.textures);
      if (type === 'cng') return createCngModel(this.textures);
      return createTrafficRickshawModel(this.textures, seed);
    };

    zConfigs.forEach((cfg, i) => {
      const mesh = buildVehicleMesh(cfg.type, i);
      mesh.position.set(cfg.laneOffset, 0, cfg.posOffset);
      mesh.rotation.y = cfg.dir === -1 ? 0 : Math.PI;
      this.scene.add(mesh);

      this.traffic.push({
        mesh,
        vehicleType: cfg.type,
        halfLen: halfLengthByType[cfg.type],
        isBus: cfg.type === 'bus',
        isTruck: cfg.type === 'truck',
        axis: 'Z',
        aveBase: 0,
        laneOffset: cfg.laneOffset,
        targetLaneOffset: cfg.laneOffset,
        baseSpeed: cfg.speed,
        currentSpeed: cfg.speed,
        direction: cfg.dir,
        nearMissAwarded: false,
        hitCooldown: 0,
        hornCooldown: 1.5 + Math.random() * 4.5,
        stoppedAtLight: false,
        overtakeCooldown: 2.0 + Math.random() * 5.0,
        swayPhase: Math.random() * Math.PI * 2,
      });
    });

    xConfigs.forEach((cfg, i) => {
      const mesh = buildVehicleMesh(cfg.type, i + 3);
      mesh.position.set(cfg.posOffset, 0, cfg.laneOffset);
      mesh.rotation.y = cfg.dir === 1 ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(mesh);

      this.traffic.push({
        mesh,
        vehicleType: cfg.type,
        halfLen: halfLengthByType[cfg.type],
        isBus: cfg.type === 'bus',
        isTruck: cfg.type === 'truck',
        axis: 'X',
        aveBase: 0,
        laneOffset: cfg.laneOffset,
        targetLaneOffset: cfg.laneOffset,
        baseSpeed: cfg.speed,
        currentSpeed: cfg.speed,
        direction: cfg.dir,
        nearMissAwarded: false,
        hitCooldown: 0,
        hornCooldown: 2.0 + Math.random() * 5.0,
        stoppedAtLight: false,
        overtakeCooldown: 2.5 + Math.random() * 5.0,
        swayPhase: Math.random() * Math.PI * 2,
      });
    });

    // 5. Animated Pedestrians on both N-S and E-W Sidewalks (28 lively Dhaka commuters incl. Borka-clad women)
    for (let i = 0; i < 28; i++) {
      const rig =
        i % 3 === 1 || i % 7 === 0
          ? createBorkaWomanModel(i, this.textures)
          : createPedestrianModel(i, this.textures);
      const axis: 'Z' | 'X' = i < 15 ? 'Z' : 'X';
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      const offset = -84 + (i % 14) * 13;
      const laneLateral = 9.5 + (i % 3) * 0.55;

      if (axis === 'Z') {
        rig.root.position.set(side * laneLateral, 0.26, offset);
        rig.root.rotation.y = rig.direction === 1 ? Math.PI : 0;
      } else {
        rig.root.position.set(offset, 0.26, side * laneLateral);
        rig.root.rotation.y = rig.direction === 1 ? -Math.PI / 2 : Math.PI / 2;
      }
      this.scene.add(rig.root);
      this.pedestrians.push({ rig, axis, side, aveBase: 0 });
    }

    // 6. Street Pickups (Biryani & Chai across N-S and E-W avenues)
    const pickupStarts: Array<[number, number]> = [
      [-3.5, -36],
      [3.5, -82],
      [-36, 3.2],
      [48, -3.2],
      [-3.2, 54],
      [3.2, -124],
    ];
    pickupStarts.forEach(([px, pz], i) => {
      const kind: 'biryani' | 'chai' = i % 2 === 0 ? 'chai' : 'biryani';
      const pMesh = createPickupModel(kind);
      pMesh.position.set(px, 0, pz);
      this.scene.add(pMesh);
      this.pickups.push({ mesh: pMesh, kind, active: true });
    });

    // 7. Instanced Debris (Zero GC)
    const debGeo = new THREE.BoxGeometry(0.26, 0.16, 0.38);
    const debMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 });
    this.debrisInstanced = new THREE.InstancedMesh(debGeo, debMat, this.maxDebris);
    this.debrisInstanced.frustumCulled = false;

    const veggiePalette = [
      0x581c87,
      0xea580c,
      0xdc2626,
      0x16a34a,
      0xa16207,
      0xfacc15,
      0xd97706,
      0x94a3b8,
    ];

    for (let i = 0; i < this.maxDebris; i++) {
      _dummyObj.position.set(0, -50, 0);
      _dummyObj.scale.setScalar(0);
      _dummyObj.updateMatrix();
      this.debrisInstanced.setMatrixAt(i, _dummyObj.matrix);
      _colorTmp.setHex(veggiePalette[i % veggiePalette.length]);
      this.debrisInstanced.setColorAt(i, _colorTmp);

      this.debrisPool.push({
        active: false,
        pos: new THREE.Vector3(0, -50, 0),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        rotVel: new THREE.Vector3(),
        scale: 1,
        life: 0,
        maxLife: 1,
      });
    }
    this.debrisInstanced.instanceMatrix.needsUpdate = true;
    if (this.debrisInstanced.instanceColor) {
      this.debrisInstanced.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.debrisInstanced);
  }

  public setDriver(driverId: DriverId, playBellSound = true): void {
    this.selectedDriverId = driverId;
    if (this.driver) {
      this.rickshaw.driverSlot.remove(this.driver.root);
    }
    const profile = DRIVER_PROFILES[driverId];
    this.driver = createDriverModel(profile, this.textures);
    this.rickshaw.driverSlot.add(this.driver.root);

    if (playBellSound) {
      soundEngine.playBell();
      this.bellJiggleTimer = 0.35;
    }
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  public applyWeather(weather: WeatherType): void {
    this.weather = weather;
    if (weather === 'SUNNY') {
      this.scene.background = new THREE.Color(0xc4e3fa);
      (this.scene.fog as THREE.FogExp2).color.setHex(0xd4e8fa);
      (this.scene.fog as THREE.FogExp2).density = 0.0049;
      this.renderer.toneMappingExposure = 1.07;
      this.scene.environmentIntensity = 0.72;

      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x786d60);
      this.hemiLight.intensity = 1.18;
      this.sunLight.color.setHex(0xfff0cf);
      this.sunLight.intensity = 2.75;
      this.sunOffset.set(26, 48, 20);
      this.rimLight.color.setHex(0x93c5fd);
      this.rimLight.intensity = 0.5;
      this.rickshaw.headlightSpot.intensity = 0;
      this.roadGrip = 1.0;

      if (this.skyUniforms) {
        this.skyUniforms.uZenithColor.value.setHex(0x2867b2);
        this.skyUniforms.uMidColor.value.setHex(0x74b6ec);
        this.skyUniforms.uHorizonColor.value.setHex(0xd9ecfb);
        this.skyUniforms.uSunDir.value.set(26, 48, 20).normalize();
        this.skyUniforms.uSunGlow.value = 0.56;
      }

      if (this.ambientMotesMat) {
        this.ambientMotesMat.color.setHex(0xfef3c7);
        this.ambientMotesMat.opacity = 0.44;
      }

      if (this.cloudMat) {
        this.cloudMat.color.setHex(0xffffff);
        this.cloudMat.opacity = 0.72;
      }
      for (const c of this.clouds) {
        c.mesh.visible = !c.overcastOnly;
      }
      for (const cell of this.cells) {
        for (const am of cell.asphaltMats) {
          am.roughness = 0.84;
          am.metalness = 0.06;
        }
      }
    } else {
      // Monsoon overcast Cloudy Dhaka daylight (realistic diffused overcast + damp tarmac)
      this.scene.background = new THREE.Color(0x95a5b8);
      (this.scene.fog as THREE.FogExp2).color.setHex(0xa6b5c6);
      (this.scene.fog as THREE.FogExp2).density = 0.0082;
      this.renderer.toneMappingExposure = 0.98;
      this.scene.environmentIntensity = 0.6;

      this.hemiLight.color.setHex(0xd6e0ea);
      this.hemiLight.groundColor.setHex(0x4b5563);
      this.hemiLight.intensity = 1.36;
      this.sunLight.color.setHex(0xdbe4ef);
      this.sunLight.intensity = 1.2;
      this.sunOffset.set(16, 46, 12);
      this.rimLight.color.setHex(0x94a3b8);
      this.rimLight.intensity = 0.44;
      this.rickshaw.headlightSpot.intensity = 1.2;
      this.roadGrip = 0.9;

      if (this.skyUniforms) {
        this.skyUniforms.uZenithColor.value.setHex(0x526173);
        this.skyUniforms.uMidColor.value.setHex(0x8293a6);
        this.skyUniforms.uHorizonColor.value.setHex(0xa8b7c7);
        this.skyUniforms.uSunDir.value.set(16, 46, 12).normalize();
        this.skyUniforms.uSunGlow.value = 0.14;
      }

      if (this.ambientMotesMat) {
        this.ambientMotesMat.color.setHex(0xdbeafe);
        this.ambientMotesMat.opacity = 0.36;
      }

      if (this.cloudMat) {
        this.cloudMat.color.setHex(0xc8d2de);
        this.cloudMat.opacity = 0.9;
      }
      for (const c of this.clouds) {
        c.mesh.visible = true;
      }
      for (const cell of this.cells) {
        for (const am of cell.asphaltMats) {
          am.roughness = 0.52;
          am.metalness = 0.14;
        }
      }
    }

    const bulbHex = weather === 'SUNNY' ? 0x94a3b8 : 0xfde68a;
    for (const cell of this.cells) {
      for (const bulb of cell.lampBulbs) {
        (bulb.material as THREE.MeshBasicMaterial).color.setHex(bulbHex);
      }
    }

    this.emitHudSnapshot();
  }

  public startGame(): void {
    soundEngine.init();
    soundEngine.playGameStartVoice();
    soundEngine.startAmbience();
    window.setTimeout(() => {
      if (this.phase === GamePhase.PLAYING) {
        soundEngine.playDipjolVoice();
      }
    }, 1800);
    this.resetWorldForRun();
    this.phase = GamePhase.PLAYING;
    this.callbacks.onPhaseChange(GamePhase.PLAYING);
    this.emitHudSnapshot();
  }

  public togglePause(): void {
    if (this.phase === GamePhase.PLAYING) {
      this.phase = GamePhase.PAUSED;
      this.callbacks.onPhaseChange(GamePhase.PAUSED);
    } else if (this.phase === GamePhase.PAUSED) {
      this.phase = GamePhase.PLAYING;
      this.clock.getDelta();
      this.callbacks.onPhaseChange(GamePhase.PLAYING);
    }
  }

  public returnToMenu(): void {
    soundEngine.stopAmbience();
    this.resetWorldForRun();
    this.phase = GamePhase.MENU;
    this.callbacks.onPhaseChange(GamePhase.MENU);
    this.emitHudSnapshot();
  }

  private resetWorldForRun(): void {
    soundEngine.stopCaughtVoice();
    this.speed = 0;
    this.lateralVel = 0;
    this.angularVel = 0;
    this.steerAngle = 0;
    this.yaw = 0;
    this.pitchAngle = 0;
    this.bounceHeight = 0;
    this.bounceVel = 0;
    this.cameraShake = 0;
    this.curbHitCooldown = 0;
    this.money = 0;
    this.health = 100;
    this.wantedLevel = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.stallsSmashed = 0;
    this.distanceMeters = 0;
    this.bellCooldown = 0;
    this.turboTimer = 0;
    this.lastPlayerGridX = 0;
    this.lastPlayerGridZ = 0;

    this.rickshaw.root.position.set(0, 0, 0);
    this.rickshaw.root.rotation.set(0, 0, 0);
    this.rickshaw.chassisTilt.rotation.set(0, 0, 0);
    this.rickshaw.chassisTilt.position.y = 0;
    this.rickshaw.steeringColumn.rotation.set(0, 0, 0);
    this.rickshaw.turboFlameL.visible = false;
    this.rickshaw.turboFlameR.visible = false;
    this.cityGround.position.set(0, -0.02, 0);
    if (this.skyDome) {
      this.skyDome.position.set(0, 0, 0);
    }

    for (const m of this.mobs) {
      this.scene.remove(m.rig.root);
    }
    this.mobs.length = 0;

    // Reset 3x3 cell grid back around (0, 0)
    let idx = 0;
    for (let gz = -1; gz <= 1; gz++) {
      for (let gx = -1; gx <= 1; gx++) {
        const cell = this.cells[idx++];
        cell.gridX = gx;
        cell.gridZ = gz;
        cell.xCenter = gx * CELL_SIZE;
        cell.zCenter = gz * CELL_SIZE;
        cell.group.position.set(cell.xCenter, 0, cell.zCenter);
        cell.metroGroup.visible = gx === 0;
        cell.crossingNameBn = this.getCrossingName(gx, gz);
        cell.playerViolated = false;
        cell.playerRewarded = false;
        for (const st of cell.stalls) {
          st.active = true;
          st.mesh.visible = true;
        }
      }
    }

    // Reset traffic properly per lane/axis, well spaced out and clear of (0,0) spawn intersection
    let zNeg = 0;
    let zPos = 0;
    let xNeg = 0;
    let xPos = 0;
    for (const tr of this.traffic) {
      tr.aveBase = 0;
      tr.targetLaneOffset = tr.laneOffset;
      tr.currentSpeed = tr.baseSpeed;
      tr.nearMissAwarded = false;
      tr.hitCooldown = 0;
      tr.stoppedAtLight = false;

      if (tr.axis === 'Z') {
        const idxDir = tr.direction === -1 ? zNeg++ : zPos++;
        const sign = idxDir % 2 === 0 ? -1 : 1;
        const zOff = sign * (22 + Math.floor(idxDir / 2) * 20);
        tr.mesh.position.set(tr.laneOffset, 0, zOff);
        tr.mesh.rotation.y = tr.direction === -1 ? 0 : Math.PI;
      } else {
        const idxDir = tr.direction === -1 ? xNeg++ : xPos++;
        const sign = idxDir % 2 === 0 ? -1 : 1;
        const xOff = sign * (24 + Math.floor(idxDir / 2) * 24);
        tr.mesh.position.set(xOff, 0, tr.laneOffset);
        tr.mesh.rotation.y = tr.direction === 1 ? -Math.PI / 2 : Math.PI / 2;
      }
    }

    this.activeCrossingHudInfo = undefined;

    const pickupStarts: Array<[number, number]> = [
      [-3.5, -36],
      [3.5, -82],
      [-36, 3.2],
      [48, -3.2],
      [-3.2, 54],
      [3.2, -124],
    ];
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      const [px, pz] = pickupStarts[i % pickupStarts.length];
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(px, 0, pz);
    }
  }

  public setTouchInput(partial: Partial<InputState>): void {
    Object.assign(this.input, partial);
  }

  public triggerBell(): void {
    soundEngine.playBell();
    this.bellJiggleTimer = 0.4;

    if (this.phase !== GamePhase.PLAYING) return;
    if (this.bellCooldown > 0) return;

    this.bellCooldown = BELL_COOLDOWN_SEC;
    const profile = DRIVER_PROFILES[this.selectedDriverId];
    this.shockwaveMaxRadius = 9.0 * profile.bellRadiusBonus;
    this.shockwaveTimer = 0.5;
    this.shockwaveRing.visible = true;
    this.shockwaveRing.position.set(
      this.rickshaw.root.position.x,
      0.14,
      this.rickshaw.root.position.z
    );

    let stunnedCount = 0;
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;

    for (const mob of this.mobs) {
      const dx = mob.rig.root.position.x - rx;
      const dz = mob.rig.root.position.z - rz;
      const dist = Math.hypot(dx, dz);
      if (dist < this.shockwaveMaxRadius && dist > 0.001) {
        const pushStrength = (1 - dist / this.shockwaveMaxRadius) * 15 + 6;
        mob.knockVelX = (dx / dist) * pushStrength;
        mob.knockVelZ = (dz / dist) * pushStrength;
        mob.stunTimer = 1.8;
        stunnedCount++;
      }
    }

    for (const ped of this.pedestrians) {
      const dx = ped.rig.root.position.x - rx;
      const dz = ped.rig.root.position.z - rz;
      if (Math.hypot(dx, dz) < this.shockwaveMaxRadius) {
        ped.rig.direction = Math.sign((ped.axis === 'Z' ? dz : dx) || 1);
      }
    }

    if (stunnedCount > 0) {
      soundEngine.playDipjolVoice();
      const bonus = stunnedCount * 1500;
      this.addMoney(bonus);
      this.emitPopup(
        `ক্রিং ক্রিং শকওয়েভ! +৳${bonus.toLocaleString('en-IN')}`,
        `${stunnedCount} জন জনতা ছত্রভঙ্গ`,
        'bell'
      );
    }
  }

  private addMoney(amount: number): void {
    this.money += amount;
    if (this.money > this.highScore) {
      this.highScore = this.money;
      this.saveHighScore(this.highScore);
    }
    this.checkWantedProgression();
  }

  private checkWantedProgression(): void {
    const thresholds = [10000, 35000, 75000, 130000, 200000];
    let targetLevel = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (this.money >= thresholds[i]) targetLevel = i + 1;
    }

    if (targetLevel > this.wantedLevel) {
      this.wantedLevel = targetLevel;
      soundEngine.playWantedUp(this.wantedLevel);
      this.emitPopup(
        `ওয়ান্টেড লেভেল ${this.wantedLevel} ★`,
        'আরও বেশি ক্ষিপ্ত জনতা ধাওয়া করছে!',
        'warning'
      );

      const targetMobTotal = [0, 4, 8, 12, 16, 20][this.wantedLevel];
      while (this.mobs.length < targetMobTotal) {
        this.spawnCrowdChaser(this.mobs.length);
      }
    }
  }

  private spawnCrowdChaser(seed: number): void {
    const rig = createMobModel(seed, this.textures);
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const aveX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const aveZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;
    const flank = seed % 2 === 0 ? -1 : 1;

    // Spawn on whichever corridor player is closest to
    if (Math.abs(rx - aveX) <= Math.abs(rz - aveZ)) {
      const zOff = seed % 3 === 0 ? 18 + (seed % 4) * 5 : -26 - (seed % 5) * 5;
      rig.root.position.set(aveX + flank * (5.2 + (seed % 3) * 0.6), 0, rz + zOff);
    } else {
      const xOff = seed % 3 === 0 ? 18 + (seed % 4) * 5 : -26 - (seed % 5) * 5;
      rig.root.position.set(rx + xOff, 0, aveZ + flank * (5.2 + (seed % 3) * 0.6));
    }

    this.scene.add(rig.root);
    this.mobs.push({
      rig,
      stunTimer: 0,
      knockVelX: 0,
      knockVelZ: 0,
    });
  }

  /**
   * Immediately spawns angry shopkeepers/locals around ANY smashed stall anywhere in Dhaka
   */
  private spawnStallAngryMobs(sx: number, sz: number, isVeggie: boolean): void {
    const count = isVeggie ? 3 : 2;
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const relX = wrapCellLocal(sx);
    const relZ = wrapCellLocal(sz);
    const roadNudgeX = Math.abs(relX) < 12 ? -Math.sign(relX || 1) * 1.6 : 0;
    const roadNudgeZ = Math.abs(relZ) < 12 ? -Math.sign(relZ || 1) * 1.6 : 0;

    for (let k = 0; k < count; k++) {
      const spawnX = sx + roadNudgeX + (k - 0.5) * 1.4;
      const spawnZ = sz + roadNudgeZ + (k % 2 === 0 ? -1.1 : 1.1);

      if (this.mobs.length < 26) {
        const rig = createMobModel(this.stallsSmashed * 5 + k, this.textures);
        rig.root.position.set(spawnX, 0, spawnZ);
        this.scene.add(rig.root);
        this.mobs.push({
          rig,
          stunTimer: 0,
          knockVelX: 0,
          knockVelZ: 0,
        });
      } else {
        // Recycle the farthest active mob to surge from this freshly smashed stall
        let farthestIdx = 0;
        let maxDist = -1;
        for (let i = 0; i < this.mobs.length; i++) {
          const p = this.mobs[i].rig.root.position;
          const d = (p.x - rx) * (p.x - rx) + (p.z - rz) * (p.z - rz);
          if (d > maxDist) {
            maxDist = d;
            farthestIdx = i;
          }
        }
        const m = this.mobs[farthestIdx];
        m.rig.root.position.set(spawnX, 0, spawnZ);
        m.stunTimer = 0;
        m.knockVelX = 0;
        m.knockVelZ = 0;
      }
    }
  }

  private spawnDebrisBurst(worldX: number, worldY: number, worldZ: number, count: number): void {
    let spawned = 0;
    for (let i = 0; i < this.maxDebris && spawned < count; i++) {
      const p = this.debrisPool[i];
      if (!p.active) {
        p.active = true;
        p.pos.set(
          worldX + (Math.random() - 0.5) * 1.5,
          worldY + Math.random() * 1.2,
          worldZ + (Math.random() - 0.5) * 1.5
        );
        p.vel.set(
          (Math.random() - 0.5) * 12,
          5.0 + Math.random() * 7.0,
          (Math.random() - 0.5) * 12
        );
        p.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        p.rotVel.set(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14
        );
        p.scale = 0.65 + Math.random() * 0.9;
        p.life = 0;
        p.maxLife = 0.8 + Math.random() * 0.6;
        spawned++;
      }
    }
  }

  private emitPopup(
    text: string,
    subtext: string | undefined,
    tone: ScreenPopup['tone']
  ): void {
    this.callbacks.onPopup({
      id: this.popupCounter++,
      text,
      subtext,
      tone,
      xPercent: 46 + (Math.random() - 0.5) * 14,
      yPercent: 34 + (Math.random() - 0.5) * 10,
    });
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.renderer.domElement.addEventListener(
      'webglcontextrestored',
      this.handleContextRestored,
      false
    );
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
  };

  private handleContextRestored = (): void => {
    if (!this.disposed) {
      this.clock.getDelta();
      this.scheduleNextFrame();
    }
  };

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (k === 'w' || e.key === 'ArrowUp') this.input.forward = true;
    if (k === 's' || e.key === 'ArrowDown') this.input.backward = true;
    if (k === 'a' || e.key === 'ArrowLeft') this.input.left = true;
    if (k === 'd' || e.key === 'ArrowRight') this.input.right = true;
    if (e.code === 'Space') {
      this.input.brake = true;
    }
    if (k === 'b' && !e.repeat) {
      this.triggerBell();
    }
    if ((k === 'p' || e.key === 'Escape') && !e.repeat) {
      if (this.phase === GamePhase.PLAYING || this.phase === GamePhase.PAUSED) {
        this.togglePause();
      }
    }
    if (k === 'c' && !e.repeat && this.phase === GamePhase.PLAYING) {
      const order = [CameraMode.CHASE, CameraMode.ACTION, CameraMode.DRIVER];
      const next = order[(order.indexOf(this.cameraMode) + 1) % order.length];
      this.cameraMode = next;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (k === 'w' || e.key === 'ArrowUp') this.input.forward = false;
    if (k === 's' || e.key === 'ArrowDown') this.input.backward = false;
    if (k === 'a' || e.key === 'ArrowLeft') this.input.left = false;
    if (k === 'd' || e.key === 'ArrowRight') this.input.right = false;
    if (e.code === 'Space') this.input.brake = false;
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private tick = (): void => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const elapsed = this.clock.elapsedTime;

    if (this.phase === GamePhase.MENU) {
      this.updateMenuShowcase(dt, elapsed);
    } else if (this.phase === GamePhase.PLAYING) {
      this.updatePlaying(dt, elapsed);
    } else if (this.phase === GamePhase.GAME_OVER) {
      this.updateDebris(dt);
      this.menuOrbitAngle += dt * 0.28;
      const rx = this.rickshaw.root.position.x;
      const rz = this.rickshaw.root.position.z;
      _camDesired.set(
        rx + Math.sin(this.menuOrbitAngle) * 6.8,
        3.6,
        rz + Math.cos(this.menuOrbitAngle) * 6.8
      );
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-3 * dt));
      this.camera.lookAt(rx, 1.2, rz);
    }

    const px = this.rickshaw.root.position.x;
    const pz = this.rickshaw.root.position.z;
    if (this.skyDome) {
      this.skyDome.position.set(px, 0, pz);
    }
    this.sunLight.target.position.set(px, 0, pz);
    this.sunLight.position.set(
      px + this.sunOffset.x,
      this.sunOffset.y,
      pz + this.sunOffset.z
    );

    if (this.phase !== GamePhase.PAUSED) {
      this.updateClouds(dt, px, pz);
      this.updateAmbientMotes(dt, px, pz);
    }

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  };

  private updateClouds(dt: number, rx: number, rz: number): void {
    this.cloudGroup.position.y = 0;
    for (const c of this.clouds) {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x - rx > 144) c.mesh.position.x -= 288;
      else if (c.mesh.position.x - rx < -144) c.mesh.position.x += 288;

      if (c.mesh.position.z - rz > 144) c.mesh.position.z -= 288;
      else if (c.mesh.position.z - rz < -144) c.mesh.position.z += 288;
    }
  }

  private updateAmbientMotes(dt: number, rx: number, rz: number): void {
    if (!this.ambientMotes) return;
    this.ambientMotes.position.set(rx, 0, rz);
    const arr = this.ambientMotesPos;
    const breezeX = this.weather === 'CLOUDY' ? 1.8 : 0.65;
    const fallY = this.weather === 'CLOUDY' ? -0.9 : -0.22;
    for (let i = 0; i < this.moteCount; i++) {
      const idx = i * 3;
      arr[idx] += breezeX * dt;
      arr[idx + 1] += fallY * dt;
      if (arr[idx] > 28) arr[idx] -= 56;
      if (arr[idx + 1] < 0.4) arr[idx + 1] = 14.5;
    }
    (this.ambientMotes.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateMenuShowcase(dt: number, elapsed: number): void {
    const swing = Math.sin(elapsed * 0.42) * 0.65;
    const radius = 4.1;
    const camX = Math.sin(swing) * radius;
    const camZ = -Math.cos(swing) * radius - 0.35;
    const camY = 1.9 + Math.sin(elapsed * 0.75) * 0.12;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 1.25, -0.2);

    if (this.bellJiggleTimer > 0) {
      this.bellJiggleTimer = Math.max(0, this.bellJiggleTimer - dt);
      this.rickshaw.bellMesh.rotation.z = Math.sin(elapsed * 55) * 0.32;
    } else {
      this.rickshaw.bellMesh.rotation.z = 0;
    }

    this.updateIntersections(dt, false);
    this.updateTraffic(dt, false);
    this.updatePedestrians(dt, elapsed);
  }

  private updatePlaying(dt: number, elapsed: number): void {
    const profile = DRIVER_PROFILES[this.selectedDriverId];

    if (this.bellCooldown > 0) {
      this.bellCooldown = Math.max(0, this.bellCooldown - dt);
    }
    if (this.curbHitCooldown > 0) {
      this.curbHitCooldown = Math.max(0, this.curbHitCooldown - dt);
    }
    if (this.turboTimer > 0) {
      this.turboTimer = Math.max(0, this.turboTimer - dt);
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }
    if (this.bellJiggleTimer > 0) {
      this.bellJiggleTimer = Math.max(0, this.bellJiggleTimer - dt);
      this.rickshaw.bellMesh.rotation.z = Math.sin(elapsed * 60) * 0.35;
    } else {
      this.rickshaw.bellMesh.rotation.z = 0;
    }

    const isTurbo = this.turboTimer > 0;
    this.rickshaw.turboFlameL.visible = isTurbo;
    this.rickshaw.turboFlameR.visible = isTurbo;
    if (isTurbo) {
      const flicker = 0.8 + Math.sin(elapsed * 45) * 0.28;
      this.rickshaw.turboFlameL.scale.set(1, 1, flicker);
      this.rickshaw.turboFlameR.scale.set(1, 1, flicker);
    }

    // Upgraded 2D Driving & Grip Physics (torque taper, aerodynamic drag, tire slip, weight transfer & suspension bounce)
    const maxForwardSpeed = (isTurbo ? 33.5 : 24.5) * profile.topSpeedBonus;
    const maxReverseSpeed = -7.8;
    const speedRatio = Math.min(Math.abs(this.speed) / maxForwardSpeed, 1.0);
    const launchTorque = (isTurbo ? 34 : 21.5) * (1.18 - speedRatio * 0.48);

    let targetPitch = 0;
    if (this.input.forward) {
      this.speed = Math.min(this.speed + launchTorque * this.roadGrip * dt, maxForwardSpeed);
      targetPitch = 0.045 * (1.1 - speedRatio * 0.5); // Rearward squat under throttle
    } else if (this.input.backward) {
      this.speed = Math.max(this.speed - 17.5 * this.roadGrip * dt, maxReverseSpeed);
      targetPitch = this.speed > 0.5 ? -0.065 : -0.025; // Forward brake dive
    } else {
      const coastDrag = 1.65 + 0.022 * this.speed * this.speed * 0.1;
      this.speed = THREE.MathUtils.damp(this.speed, 0, coastDrag, dt);
    }

    if (this.input.brake) {
      this.speed = THREE.MathUtils.damp(this.speed, 0, 5.4 * this.roadGrip, dt);
      if (Math.abs(this.speed) > 1.5) {
        targetPitch = -0.08;
      }
    }

    // Progressive steering curve + smooth angular velocity + handbrake drift slip
    const steerInput = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);
    const highSpeedTaper = 1.0 - Math.min(Math.abs(this.speed) / 36, 0.32);
    const steerMax = (this.input.brake ? 0.62 : 0.46) * highSpeedTaper * profile.steerResponseBonus;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, steerInput * steerMax, 12.5, dt);

    const speedFactor = Math.min(Math.abs(this.speed) / 5.5, 1.0);
    const dirSign = this.speed >= -0.05 ? 1 : -1;
    const isDrifting = this.input.brake && Math.abs(this.speed) > 7.5 && Math.abs(this.steerAngle) > 0.06;
    const turnAuthority = isDrifting ? 3.25 : 2.35;
    const targetAngVel = this.steerAngle * speedFactor * dirSign * turnAuthority;
    this.angularVel = THREE.MathUtils.damp(this.angularVel, targetAngVel, 14, dt);
    this.yaw += this.angularVel * dt;

    // Centrifugal lateral slip transfer (stronger drift tail-out on SPACE brake or cloudy wet tarmac)
    const centrifugalForce = this.angularVel * this.speed * 0.38;
    const gripDecay = isDrifting ? 3.2 : 9.8 * this.roadGrip;
    this.lateralVel += (centrifugalForce - this.lateralVel * gripDecay) * dt;
    this.lateralVel = THREE.MathUtils.clamp(this.lateralVel, -10.5, 10.5);

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);
    const fwdStep = this.speed * dt;
    const latStep = this.lateralVel * dt;

    this.rickshaw.root.position.x -= sinY * fwdStep - cosY * latStep;
    this.rickshaw.root.position.z -= cosY * fwdStep + sinY * latStep;
    this.rickshaw.root.rotation.y = this.yaw;

    this.distanceMeters += Math.hypot(fwdStep, latStep);
    if (this.distanceMeters > 75 && this.speed > 8) {
      soundEngine.playDrivingMilonVoice();
    }

    // Seamless Infinite 2D City Grid Curb & Building Boundary Check with elastic glance
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;

    if (this.cityGround) {
      this.cityGround.position.set(rx, -0.02, rz);
    }

    const relX = wrapCellLocal(rx);
    const relZ = wrapCellLocal(rz);
    const cellCenterX = rx - relX;
    const cellCenterZ = rz - relZ;

    if (Math.abs(relX) > ROAD_HALF_DRIVABLE && Math.abs(relZ) > ROAD_HALF_DRIVABLE) {
      const penX = Math.abs(relX) - ROAD_HALF_DRIVABLE;
      const penZ = Math.abs(relZ) - ROAD_HALF_DRIVABLE;

      if (penX < penZ) {
        this.rickshaw.root.position.x = cellCenterX + Math.sign(relX) * ROAD_HALF_DRIVABLE;
        this.lateralVel *= -0.45;
      } else {
        this.rickshaw.root.position.z = cellCenterZ + Math.sign(relZ) * ROAD_HALF_DRIVABLE;
        this.lateralVel *= -0.45;
      }

      if (Math.abs(this.speed) > 7 && this.curbHitCooldown <= 0) {
        this.curbHitCooldown = 0.42;
        this.speed *= 0.76;
        this.bounceVel += 1.6;
        this.cameraShake = Math.max(this.cameraShake, 0.22);
        this.spawnDebrisBurst(
          this.rickshaw.root.position.x,
          0.5,
          this.rickshaw.root.position.z,
          5
        );
        soundEngine.playHit();
        soundEngine.playCrashVoice();
      }
    }

    // District Transition Banner when entering a new 96m super-cell
    const gridX = Math.round(rx / CELL_SIZE);
    const gridZ = Math.round(rz / CELL_SIZE);
    if (gridX !== this.lastPlayerGridX || gridZ !== this.lastPlayerGridZ) {
      this.lastPlayerGridX = gridX;
      this.lastPlayerGridZ = gridZ;
      const areaName = this.getDistrictName(gridX, gridZ);
      this.emitPopup(`📍 ${areaName}`, 'অসীম ঢাকা শহর — সব দিকে রাস্তা ও ট্রাফিক!', 'turbo');
    }

    // Suspension Spring-Damper, Body Roll & Pitch Weight Transfer
    const springK = 140;
    const damperC = 15;
    const springAccel = -springK * this.bounceHeight - damperC * this.bounceVel;
    this.bounceVel += springAccel * dt;
    this.bounceHeight = THREE.MathUtils.clamp(this.bounceHeight + this.bounceVel * dt, -0.08, 0.26);

    this.rickshaw.steeringColumn.rotation.y = this.steerAngle * 0.95;
    const lateralRoll = THREE.MathUtils.clamp(
      -this.angularVel * (Math.abs(this.speed) / 26) * 0.085 - this.lateralVel * 0.025,
      -0.28,
      0.28
    );
    this.pitchAngle = THREE.MathUtils.damp(this.pitchAngle, targetPitch, 9.5, dt);
    const roadBump =
      Math.sin(this.distanceMeters * 2.8) * Math.min(Math.abs(this.speed) / 25, 1) * 0.015;

    this.rickshaw.chassisTilt.rotation.z = THREE.MathUtils.damp(
      this.rickshaw.chassisTilt.rotation.z,
      lateralRoll,
      11,
      dt
    );
    this.rickshaw.chassisTilt.rotation.x = this.pitchAngle;
    this.rickshaw.chassisTilt.position.y = Math.max(0, roadBump + this.bounceHeight);

    const wheelDelta = fwdStep / 0.44;
    this.wheelSpin -= wheelDelta;
    this.rickshaw.frontWheel.rotation.x = this.wheelSpin;
    this.rickshaw.rearWheelL.rotation.x = this.wheelSpin;
    this.rickshaw.rearWheelR.rotation.x = this.wheelSpin;
    this.rickshaw.pedalCrank.rotation.x = this.wheelSpin * 0.65;

    if (this.driver) {
      const pedalPhase = -this.wheelSpin * 0.65;
      this.driver.legL.rotation.x = Math.sin(pedalPhase) * 0.42;
      this.driver.legR.rotation.x = Math.sin(pedalPhase + Math.PI) * 0.42;
      this.driver.headGroup.rotation.y = this.steerAngle * 0.55;
    }

    this.recycleWorldCells();
    this.updateIntersections(dt, true);
    this.checkStallCollisions();
    this.updatePickups(dt, elapsed);
    this.updateTraffic(dt, true);
    this.updatePedestrians(dt, elapsed);
    this.updateCrowdMobs(dt, elapsed);
    this.updateShockwave(dt);
    this.updateDebris(dt);
    this.updateGameplayCamera(dt);

    this.hudEmitAccumulator += dt;
    if (this.hudEmitAccumulator >= 0.065) {
      this.hudEmitAccumulator = 0;
      this.emitHudSnapshot();
    }
  }

  private recycleWorldCells(): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;

    for (const cell of this.cells) {
      let moved = false;

      if (cell.xCenter - rx > HALF_GRID_SPAN) {
        cell.gridX -= GRID_SIZE;
        cell.xCenter -= GRID_SIZE * CELL_SIZE;
        moved = true;
      } else if (cell.xCenter - rx < -HALF_GRID_SPAN) {
        cell.gridX += GRID_SIZE;
        cell.xCenter += GRID_SIZE * CELL_SIZE;
        moved = true;
      }

      if (cell.zCenter - rz > HALF_GRID_SPAN) {
        cell.gridZ -= GRID_SIZE;
        cell.zCenter -= GRID_SIZE * CELL_SIZE;
        moved = true;
      } else if (cell.zCenter - rz < -HALF_GRID_SPAN) {
        cell.gridZ += GRID_SIZE;
        cell.zCenter += GRID_SIZE * CELL_SIZE;
        moved = true;
      }

      if (moved) {
        cell.group.position.set(cell.xCenter, 0, cell.zCenter);
        cell.metroGroup.visible = cell.gridX === 0;
        cell.crossingNameBn = this.getCrossingName(cell.gridX, cell.gridZ);
        cell.playerViolated = false;
        cell.playerRewarded = false;
        for (const st of cell.stalls) {
          st.active = true;
          st.mesh.visible = true;
        }
      }
    }
  }

  private updateIntersections(dt: number, checkRules: boolean): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const fwdX = -Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const headingXDominant = Math.abs(fwdX) > Math.abs(fwdZ);

    let closestUpcomingDist = Infinity;
    let activeHudInfo: TrafficSignalHudInfo | undefined;

    for (const cell of this.cells) {
      cell.timer -= dt;
      if (cell.timer <= 0) {
        if (cell.state === 'RED') {
          cell.state = 'GREEN';
          cell.timer = 8.5;
        } else if (cell.state === 'GREEN') {
          cell.state = 'YELLOW';
          cell.timer = 2.5;
        } else {
          cell.state = 'RED';
          cell.timer = 8.0;
          cell.playerViolated = false;
          cell.playerRewarded = false;
        }
        cell.lightRig.setSignal(cell.state);
      }

      if (!checkRules) continue;

      const onThisCorridor = headingXDominant
        ? Math.abs(rz - cell.zCenter) < 9.0
        : Math.abs(rx - cell.xCenter) < 9.0;
      if (!onThisCorridor) continue;

      const ahead = (cell.xCenter - rx) * fwdX + (cell.zCenter - rz) * fwdZ;
      const distToStop = ahead - 11.8;

      // Cross-street gets opposite signal to main N-S gantry
      const effectiveState: SignalColor = headingXDominant
        ? cell.state === 'RED'
          ? 'GREEN'
          : 'RED'
        : cell.state;

      if (distToStop > -8 && distToStop < 45 && distToStop < closestUpcomingDist) {
        closestUpcomingDist = distToStop;
        activeHudInfo = {
          state: effectiveState,
          secondsRemaining: Math.max(1, Math.ceil(cell.timer)),
          distanceToStopLine: Math.max(0, Math.round(distToStop)),
          crossingNameBn: cell.crossingNameBn,
        };
      }

      // Signal Obedience Reward
      if (effectiveState === 'RED' && distToStop >= 0.5 && distToStop <= 13) {
        if (Math.abs(this.speed) < 1.5 && !cell.playerRewarded && cell.timer <= 0.8) {
          cell.playerRewarded = true;
          this.addMoney(1500);
          this.wantedLevel = Math.max(0, this.wantedLevel - 1);
          soundEngine.playTrafficComplianceChime();
          this.emitPopup(
            '🏆 ট্রাফিক নিয়ম মানার পুরস্কার! +৳১,৫০০',
            'সিগন্যালে দাঁড়ানোয় জ্যাম কমেছে!',
            'cash'
          );
        }
      }

      // Red Light Running Violation
      if (effectiveState === 'RED' && distToStop < 0 && distToStop > -8.0) {
        if (this.speed > 4.2 && !cell.playerViolated) {
          cell.playerViolated = true;
          soundEngine.playTrafficWhistle();
          this.wantedLevel = Math.min(5, this.wantedLevel + 1);
          const fine = Math.min(this.money, 1000);
          this.money -= fine;
          this.emitPopup(
            '🚨 সিগন্যাল অমান্য! ট্রাফিক পুলিশের মামলা!',
            '-৳১,০০০ জরিমানা | ওয়ান্টেড লেভেল +১!',
            'warning'
          );
          soundEngine.playCrashVoice();
        }
      }
    }

    this.activeCrossingHudInfo = activeHudInfo;
  }

  private checkStallCollisions(): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;

    for (const cell of this.cells) {
      if (Math.abs(cell.xCenter - rx) > 58 || Math.abs(cell.zCenter - rz) > 58) continue;

      for (const st of cell.stalls) {
        if (!st.active) continue;
        const sx = cell.xCenter + st.localX;
        const sz = cell.zCenter + st.localZ;
        const dx = rx - sx;
        const dz = rz - sz;

        if (dx * dx + dz * dz < 6.8) {
          st.active = false;
          st.mesh.visible = false;

          this.combo = Math.min(this.combo + 1, 10);
          this.comboTimer = COMBO_WINDOW_SEC;
          this.stallsSmashed++;

          const cat = st.category ?? (st.isVeggie ? 'veggie' : 'chai');
          const baseEarned = cat === 'veggie' || cat === 'flower' ? 15000 : 10000;
          const earned = baseEarned * this.combo;
          this.addMoney(earned);

          if (cat === 'veggie') {
            soundEngine.playVeggieSmash();
            this.emitPopup(
              `+৳${earned.toLocaleString('en-IN')}`,
              this.combo > 1 ? `${this.combo}x কম্বো! তাজা সবজি সাফ!` : 'সবজির আড়ৎ সাফ!',
              'veggie'
            );
          } else if (cat === 'flower') {
            soundEngine.playVeggieSmash();
            this.emitPopup(
              `+৳${earned.toLocaleString('en-IN')}`,
              this.combo > 1 ? `${this.combo}x কম্বো! ফুলের দোকান সাফ!` : '🌸 ফুলের দোকান সাফ!',
              'veggie'
            );
          } else if (cat === 'chai') {
            soundEngine.playSmash(this.combo);
            this.emitPopup(
              `+৳${earned.toLocaleString('en-IN')}`,
              this.combo > 1 ? `${this.combo}x কম্বো! চায়ের টং সাফ!` : '☕ চায়ের টং সাফ!',
              'cash'
            );
          } else {
            soundEngine.playSmash(this.combo);
            this.emitPopup(
              `+৳${earned.toLocaleString('en-IN')}`,
              this.combo > 1 ? `${this.combo}x কম্বো! হকার ভ্যান সাফ!` : '🛒 হকার ভ্যান সাফ!',
              'cash'
            );
          }

          this.cameraShake = Math.max(this.cameraShake, 0.34);
          this.bounceVel += 2.4;
          this.spawnDebrisBurst(sx, 0.9, sz, st.isVeggie ? 22 : 15);
          this.spawnStallAngryMobs(sx, sz, st.isVeggie);
          const stallWanted = Math.min(5, Math.ceil(this.stallsSmashed / 3));
          if (stallWanted > this.wantedLevel) {
            this.wantedLevel = stallWanted;
            soundEngine.playWantedUp(this.wantedLevel);
          }
          soundEngine.playCrashVoice();
          this.emitHudSnapshot();
        }
      }
    }
  }

  private updatePickups(dt: number, elapsed: number): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const aveX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const aveZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      const dist = Math.hypot(p.mesh.position.x - rx, p.mesh.position.z - rz);

      if (dist > 125) {
        const useNS = i % 2 === 0;
        const laneOff = (Math.random() - 0.5) * 9.0;
        const aheadSign = Math.random() < 0.7 ? -1 : 1;
        if (useNS) {
          p.mesh.position.set(
            aveX + laneOff,
            0,
            rz + aheadSign * (55 + Math.random() * 55)
          );
        } else {
          p.mesh.position.set(
            rx + aheadSign * (55 + Math.random() * 55),
            0,
            aveZ + laneOff
          );
        }
        p.active = true;
        p.mesh.visible = true;
      }

      if (!p.active) continue;

      p.mesh.rotation.y = elapsed * 2.4;
      p.mesh.position.y = Math.sin(elapsed * 4) * 0.08;

      const dx = rx - p.mesh.position.x;
      const dz = rz - p.mesh.position.z;
      if (dx * dx + dz * dz < 3.4) {
        p.active = false;
        p.mesh.visible = false;

        if (p.kind === 'biryani') {
          this.health = Math.min(100, this.health + 30);
          soundEngine.playPickup('heal');
          this.emitPopup('কাচ্চি বিরিয়ানি! +৩০ হেলথ', 'পুরান ঢাকার আসল শক্তি', 'heal');
        } else {
          this.turboTimer = TURBO_DURATION_SEC;
          this.speed = Math.max(this.speed, 26);
          soundEngine.playPickup('turbo');
          this.emitPopup('মালাই চা টার্বো বুস্ট!', '৪.৫ সেকেন্ড রকেট গতি ও শিল্ড', 'turbo');
        }
        this.emitHudSnapshot();
      }
    }
  }

  private updateTraffic(dt: number, checkCollision: boolean): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const nearestAveX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const nearestAveZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;

    for (const tr of this.traffic) {
      let targetSpeed = tr.baseSpeed;
      let shouldStop = false;

      if (tr.axis === 'Z') {
        // Check active intersection cells on this N-S avenue using vehicle front bumper to stop line (±11.8m)
        for (const cell of this.cells) {
          if (Math.abs(cell.xCenter - tr.aveBase) > 10) continue;
          if (cell.state === 'RED' || cell.state === 'YELLOW') {
            if (tr.direction === -1) {
              const distToStop = tr.mesh.position.z - tr.halfLen - (cell.zCenter + 11.8);
              if (distToStop > 0.3 && distToStop < 14.0) {
                shouldStop = true;
                break;
              }
            } else {
              const distToStop = cell.zCenter - 11.8 - (tr.mesh.position.z + tr.halfLen);
              if (distToStop > 0.3 && distToStop < 14.0) {
                shouldStop = true;
                break;
              }
            }
          }
        }

        // Bumper-to-bumper Queueing & Overtaking along Z
        if (tr.overtakeCooldown > 0) tr.overtakeCooldown -= dt;
        let blockedAhead = false;
        let leadingGap = Infinity;

        for (const other of this.traffic) {
          if (other === tr || other.axis !== 'Z') continue;
          if (
            Math.abs(other.aveBase - tr.aveBase) < 10 &&
            other.direction === tr.direction &&
            Math.abs(other.laneOffset - tr.laneOffset) < 1.5
          ) {
            const centerDist = (other.mesh.position.z - tr.mesh.position.z) * tr.direction;
            const bumperGap = centerDist - (tr.halfLen + other.halfLen);
            if (bumperGap > -1.0 && bumperGap < 12.0) {
              if (bumperGap < leadingGap) leadingGap = bumperGap;
              if (other.currentSpeed < tr.baseSpeed - 1.2 || bumperGap < 7.0) {
                blockedAhead = true;
              }
            }
          }
        }

        if (blockedAhead && tr.overtakeCooldown <= 0 && tr.vehicleType !== 'rickshaw') {
          const lanes = tr.direction === -1 ? [-1.8, -3.6, -5.0] : [1.8, 3.6, 5.0];
          for (const cand of lanes) {
            if (Math.abs(cand - tr.targetLaneOffset) > 0.5) {
              let occupied = false;
              for (const other of this.traffic) {
                if (other === tr || other.axis !== 'Z') continue;
                if (
                  Math.abs(other.aveBase - tr.aveBase) < 10 &&
                  other.direction === tr.direction &&
                  Math.abs(other.laneOffset - cand) < 1.4 &&
                  Math.abs(other.mesh.position.z - tr.mesh.position.z) < tr.halfLen + other.halfLen + 3.5
                ) {
                  occupied = true;
                  break;
                }
              }
              if (!occupied) {
                tr.targetLaneOffset = cand;
                tr.overtakeCooldown = 4.5 + Math.random() * 5.0;
                break;
              }
            }
          }
        }

        shouldStop = shouldStop || (blockedAhead && leadingGap < 2.2);
        tr.stoppedAtLight = shouldStop;
        targetSpeed = shouldStop
          ? 0
          : blockedAhead
          ? Math.min(tr.baseSpeed * 0.65, 5.0)
          : Math.max(3.5, tr.baseSpeed + Math.sin(tr.swayPhase) * 0.8);

        if (tr.currentSpeed > targetSpeed) {
          tr.currentSpeed = Math.max(targetSpeed, tr.currentSpeed - 15.0 * dt);
        } else if (tr.currentSpeed < targetSpeed) {
          tr.currentSpeed = Math.min(targetSpeed, tr.currentSpeed + 6.0 * dt);
        }

        tr.laneOffset = THREE.MathUtils.damp(tr.laneOffset, tr.targetLaneOffset, 3.2, dt);
        tr.mesh.position.x = tr.aveBase + tr.laneOffset;
        tr.mesh.position.z += tr.direction * tr.currentSpeed * dt;
        const deltaLane = tr.targetLaneOffset - tr.laneOffset;
        tr.mesh.rotation.y =
          tr.direction === -1 ? deltaLane * 0.12 : Math.PI - deltaLane * 0.12;

        // Migrate onto nearest N-S avenue only when far away in 2D fog (>85m) or beyond 118m longitudinal span
        const dzPlayer = tr.mesh.position.z - rz;
        const d2d = Math.hypot(tr.mesh.position.x - rx, dzPlayer);
        if (Math.abs(tr.aveBase - nearestAveX) > 10 && d2d > 85) {
          tr.aveBase = nearestAveX;
          tr.mesh.position.x = tr.aveBase + tr.laneOffset;
          tr.mesh.position.z = rz + (tr.direction === -1 ? 95 : -95);
          tr.nearMissAwarded = false;
        } else if (dzPlayer > 118) {
          tr.aveBase = nearestAveX;
          tr.mesh.position.x = tr.aveBase + tr.laneOffset;
          tr.mesh.position.z = rz - 115 - Math.random() * 15;
          tr.nearMissAwarded = false;
        } else if (dzPlayer < -118) {
          tr.aveBase = nearestAveX;
          tr.mesh.position.x = tr.aveBase + tr.laneOffset;
          tr.mesh.position.z = rz + 115 + Math.random() * 15;
          tr.nearMissAwarded = false;
        }
      } else {
        // East-West Avenue Traffic (axis === 'X') using vehicle front bumper to stop line (±11.8m)
        for (const cell of this.cells) {
          if (Math.abs(cell.zCenter - tr.aveBase) > 10) continue;
          // E-W stops when N-S is GREEN or YELLOW
          if (cell.state === 'GREEN' || cell.state === 'YELLOW') {
            if (tr.direction === 1) {
              const distToStop = cell.xCenter - 11.8 - (tr.mesh.position.x + tr.halfLen);
              if (distToStop > 0.3 && distToStop < 14.0) {
                shouldStop = true;
                break;
              }
            } else {
              const distToStop = tr.mesh.position.x - tr.halfLen - (cell.xCenter + 11.8);
              if (distToStop > 0.3 && distToStop < 14.0) {
                shouldStop = true;
                break;
              }
            }
          }
        }

        if (tr.overtakeCooldown > 0) tr.overtakeCooldown -= dt;
        let blockedAhead = false;
        let leadingGap = Infinity;

        for (const other of this.traffic) {
          if (other === tr || other.axis !== 'X') continue;
          if (
            Math.abs(other.aveBase - tr.aveBase) < 10 &&
            other.direction === tr.direction &&
            Math.abs(other.laneOffset - tr.laneOffset) < 1.5
          ) {
            const centerDist = (other.mesh.position.x - tr.mesh.position.x) * tr.direction;
            const bumperGap = centerDist - (tr.halfLen + other.halfLen);
            if (bumperGap > -1.0 && bumperGap < 12.0) {
              if (bumperGap < leadingGap) leadingGap = bumperGap;
              if (other.currentSpeed < tr.baseSpeed - 1.2 || bumperGap < 7.0) {
                blockedAhead = true;
              }
            }
          }
        }

        if (blockedAhead && tr.overtakeCooldown <= 0 && tr.vehicleType !== 'rickshaw') {
          const lanes = tr.direction === 1 ? [-1.8, -3.6, -5.0] : [1.8, 3.6, 5.0];
          for (const cand of lanes) {
            if (Math.abs(cand - tr.targetLaneOffset) > 0.5) {
              let occupied = false;
              for (const other of this.traffic) {
                if (other === tr || other.axis !== 'X') continue;
                if (
                  Math.abs(other.aveBase - tr.aveBase) < 10 &&
                  other.direction === tr.direction &&
                  Math.abs(other.laneOffset - cand) < 1.4 &&
                  Math.abs(other.mesh.position.x - tr.mesh.position.x) < tr.halfLen + other.halfLen + 3.5
                ) {
                  occupied = true;
                  break;
                }
              }
              if (!occupied) {
                tr.targetLaneOffset = cand;
                tr.overtakeCooldown = 4.5 + Math.random() * 5.0;
                break;
              }
            }
          }
        }

        shouldStop = shouldStop || (blockedAhead && leadingGap < 2.2);
        tr.stoppedAtLight = shouldStop;
        targetSpeed = shouldStop
          ? 0
          : blockedAhead
          ? Math.min(tr.baseSpeed * 0.65, 5.0)
          : Math.max(3.5, tr.baseSpeed + Math.sin(tr.swayPhase) * 0.8);

        if (tr.currentSpeed > targetSpeed) {
          tr.currentSpeed = Math.max(targetSpeed, tr.currentSpeed - 15.0 * dt);
        } else if (tr.currentSpeed < targetSpeed) {
          tr.currentSpeed = Math.min(targetSpeed, tr.currentSpeed + 6.0 * dt);
        }

        tr.laneOffset = THREE.MathUtils.damp(tr.laneOffset, tr.targetLaneOffset, 3.2, dt);
        tr.mesh.position.z = tr.aveBase + tr.laneOffset;
        tr.mesh.position.x += tr.direction * tr.currentSpeed * dt;
        const deltaLane = tr.targetLaneOffset - tr.laneOffset;
        tr.mesh.rotation.y =
          tr.direction === 1 ? -Math.PI / 2 - deltaLane * 0.12 : Math.PI / 2 + deltaLane * 0.12;

        // Migrate onto nearest E-W avenue only when far away in 2D fog (>85m) or beyond 118m longitudinal span
        const dxPlayer = tr.mesh.position.x - rx;
        const d2d = Math.hypot(dxPlayer, tr.mesh.position.z - rz);
        if (Math.abs(tr.aveBase - nearestAveZ) > 10 && d2d > 85) {
          tr.aveBase = nearestAveZ;
          tr.mesh.position.z = tr.aveBase + tr.laneOffset;
          tr.mesh.position.x = rx + (tr.direction === 1 ? -95 : 95);
          tr.nearMissAwarded = false;
        } else if (dxPlayer > 118) {
          tr.aveBase = nearestAveZ;
          tr.mesh.position.z = tr.aveBase + tr.laneOffset;
          tr.mesh.position.x = rx - 115 - Math.random() * 15;
          tr.nearMissAwarded = false;
        } else if (dxPlayer < -118) {
          tr.aveBase = nearestAveZ;
          tr.mesh.position.z = tr.aveBase + tr.laneOffset;
          tr.mesh.position.x = rx + 115 + Math.random() * 15;
          tr.nearMissAwarded = false;
        }
      }

      if (tr.hitCooldown > 0) tr.hitCooldown = Math.max(0, tr.hitCooldown - dt);

      // 2D distance-gated horn audio (only when actually close in both X and Z!)
      if (tr.hornCooldown > 0) {
        tr.hornCooldown -= dt;
      } else {
        const d2d = Math.hypot(tr.mesh.position.x - rx, tr.mesh.position.z - rz);
        if (d2d < 24 && d2d > 4) {
          if (tr.isTruck) {
            soundEngine.playTruckAirHorn();
          } else if (tr.vehicleType === 'rickshaw') {
            soundEngine.playBell();
          } else {
            soundEngine.playTrafficHorn(tr.isBus);
          }
          tr.hornCooldown = 4.0 + Math.random() * 5.0;
        }
      }

      if (!checkCollision) continue;

      const dx = rx - tr.mesh.position.x;
      const dz = rz - tr.mesh.position.z;
      const hitRadius = tr.isTruck
        ? 4.6
        : tr.isBus
        ? 4.2
        : tr.vehicleType === 'leguna'
        ? 3.4
        : tr.vehicleType === 'cng'
        ? 3.0
        : 2.3;
      const distSq = dx * dx + dz * dz;

      if (distSq < hitRadius && tr.hitCooldown <= 0) {
        tr.hitCooldown = 1.1;
        this.cameraShake = Math.max(
          this.cameraShake,
          tr.isTruck ? 0.75 : tr.isBus ? 0.6 : 0.4
        );
        this.spawnDebrisBurst(
          (rx + tr.mesh.position.x) * 0.5,
          0.9,
          (rz + tr.mesh.position.z) * 0.5,
          tr.isTruck ? 16 : tr.isBus ? 13 : 9
        );
        soundEngine.playHit();

        const vName = tr.isTruck
          ? 'হেভি ট্রাক'
          : tr.isBus
          ? 'বাস'
          : tr.vehicleType === 'leguna'
          ? 'লেগুনা'
          : tr.vehicleType === 'cng'
          ? 'সিএনজি'
          : 'রিকশা';
        if (this.turboTimer > 0) {
          if (tr.axis === 'X') {
            tr.mesh.position.x += tr.direction * 14;
          } else {
            tr.mesh.position.z += tr.direction * 14;
          }
          const reward = tr.isTruck
            ? 12000
            : tr.isBus
            ? 8000
            : tr.vehicleType === 'leguna'
            ? 6000
            : tr.vehicleType === 'cng'
            ? 5000
            : 3500;
          this.addMoney(reward);
          this.emitPopup(
            `টার্বো ধাক্কা! +৳${reward.toLocaleString('en-IN')}`,
            `${vName} কাত!`,
            'turbo'
          );
        } else {
          // Momentum-conserving 2D impact deflection + suspension jolt
          const distInv = 1 / Math.max(Math.sqrt(distSq), 0.35);
          const nx = dx * distInv;
          const nz = dz * distInv;
          const knock = tr.isTruck ? 1.85 : tr.isBus ? 1.55 : tr.vehicleType === 'cng' ? 1.25 : 1.05;

          this.rickshaw.root.position.x += nx * knock;
          this.rickshaw.root.position.z += nz * knock;

          // Project outward impulse onto rickshaw's forward and lateral axes
          const sinY = Math.sin(this.yaw);
          const cosY = Math.cos(this.yaw);
          const impactMag = Math.max(5.5, Math.abs(this.speed) * 0.45 + 3.2);
          const fwdBounce = -sinY * nx - cosY * nz;
          const latBounce = cosY * nx - sinY * nz;

          this.speed = THREE.MathUtils.clamp(
            this.speed * 0.28 + fwdBounce * impactMag,
            -9.0,
            10.0
          );
          this.lateralVel += latBounce * impactMag * 0.85;
          this.angularVel += latBounce * 2.2;
          this.bounceVel += tr.isTruck ? 3.4 : 2.5;

          const dmg = tr.isTruck
            ? 28
            : tr.isBus
            ? 21
            : tr.vehicleType === 'leguna'
            ? 15
            : tr.vehicleType === 'cng'
            ? 13
            : 8;
          this.applyDamage(dmg);
          soundEngine.playCrashVoice();
          this.emitPopup(
            `${vName} সংঘর্ষ! -${dmg} হেলথ`,
            'দেখে চালান ওস্তাদ!',
            'warning'
          );
        }
      } else if (
        !tr.nearMissAwarded &&
        distSq >= hitRadius &&
        distSq < (tr.isTruck ? 11.0 : tr.isBus ? 9.5 : tr.vehicleType === 'cng' ? 7.5 : 6.0) &&
        Math.abs(this.speed) > 12
      ) {
        tr.nearMissAwarded = true;
        const reward = tr.isTruck
          ? 4500
          : tr.isBus
          ? 3500
          : tr.vehicleType === 'cng'
          ? 2500
          : 1800;
        this.addMoney(reward);
        this.emitPopup(`নিয়ার মিস! +৳${reward.toLocaleString('en-IN')}`, 'একটুর জন্য বাঁচলেন!', 'cash');
      }
    }
  }

  private updatePedestrians(dt: number, elapsed: number): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const nearestAveX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const nearestAveZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;

    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      const ped = p.rig;
      const laneLateral = 9.5 + (i % 3) * 0.55;
      if (p.axis === 'Z') {
        ped.root.position.z += ped.direction * ped.walkingSpeed * dt;
        if (
          Math.abs(ped.root.position.z - rz) > 95 ||
          Math.abs(p.aveBase - nearestAveX) > 48
        ) {
          p.aveBase = nearestAveX;
          ped.root.position.x = p.aveBase + p.side * laneLateral;
          ped.root.position.z = rz - 75 + Math.random() * 150;
          ped.root.rotation.y = ped.direction === 1 ? Math.PI : 0;
        }
      } else {
        ped.root.position.x += ped.direction * ped.walkingSpeed * dt;
        if (
          Math.abs(ped.root.position.x - rx) > 95 ||
          Math.abs(p.aveBase - nearestAveZ) > 48
        ) {
          p.aveBase = nearestAveZ;
          ped.root.position.z = p.aveBase + p.side * laneLateral;
          ped.root.position.x = rx - 75 + Math.random() * 150;
          ped.root.rotation.y = ped.direction === 1 ? -Math.PI / 2 : Math.PI / 2;
        }
      }

      const stride = elapsed * 8 * ped.walkingSpeed + ped.phase;
      ped.legL.rotation.x = Math.sin(stride) * 0.5;
      ped.legR.rotation.x = -Math.sin(stride) * 0.5;
      ped.armL.rotation.x = -Math.sin(stride) * 0.45;
      ped.armR.rotation.x = Math.sin(stride) * 0.45;
    }
  }

  private updateCrowdMobs(dt: number, elapsed: number): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;

    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      const pos = m.rig.root.position;

      // 2D distance recycle around player (never clamped to x = ±8.8!)
      if (Math.hypot(pos.x - rx, pos.z - rz) > 75) {
        const angle = (i / Math.max(1, this.mobs.length)) * Math.PI * 2;
        pos.set(rx + Math.cos(angle) * 28, 0, rz + Math.sin(angle) * 28);
        m.stunTimer = 0;
      }

      if (m.stunTimer > 0) {
        m.stunTimer -= dt;
        pos.x += m.knockVelX * dt;
        pos.z += m.knockVelZ * dt;
        m.knockVelX = THREE.MathUtils.damp(m.knockVelX, 0, 5, dt);
        m.knockVelZ = THREE.MathUtils.damp(m.knockVelZ, 0, 5, dt);
        m.rig.root.rotation.y += dt * 9;
        continue;
      }

      _v1.set(rx - pos.x, 0, rz - pos.z);
      const dist = _v1.length();
      if (dist > 0.001) {
        _v1.divideScalar(dist);
      }

      for (let j = 0; j < this.mobs.length; j++) {
        if (i === j) continue;
        const other = this.mobs[j].rig.root.position;
        const sx = pos.x - other.x;
        const sz = pos.z - other.z;
        const sDistSq = sx * sx + sz * sz;
        if (sDistSq < 1.4 && sDistSq > 0.0001) {
          const inv = 1 / Math.sqrt(sDistSq);
          _v1.x += sx * inv * 0.75;
          _v1.z += sz * inv * 0.75;
        }
      }
      _v1.normalize();

      const mobSpeed = (9.0 + this.wantedLevel * 1.4) * m.rig.speedFactor;
      pos.x += _v1.x * mobSpeed * dt;
      pos.z += _v1.z * mobSpeed * dt;

      m.rig.root.lookAt(rx, 0, rz);

      const stride = elapsed * 13 * m.rig.speedFactor + m.rig.phase;
      m.rig.legL.rotation.x = Math.sin(stride) * 0.65;
      m.rig.legR.rotation.x = -Math.sin(stride) * 0.65;
      m.rig.armL.rotation.x = -Math.sin(stride) * 0.55;
      m.rig.armR.rotation.x = Math.sin(stride * 1.2) * 0.55;

      if (dist < 4.8 && this.phase === GamePhase.PLAYING) {
        soundEngine.playDangerDewVoice();
      }

      if (dist < 1.95 && this.turboTimer <= 0) {
        this.applyDamage(20 * dt);
        this.cameraShake = Math.max(this.cameraShake, 0.14);
      } else if (dist < 2.2 && this.turboTimer > 0) {
        m.knockVelX = -_v1.x * 15;
        m.knockVelZ = -_v1.z * 15;
        m.stunTimer = 1.3;
        soundEngine.playDipjolVoice();
      }
    }
  }

  private applyDamage(amount: number): void {
    if (this.phase !== GamePhase.PLAYING) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.health = 0;
      this.phase = GamePhase.GAME_OVER;
      soundEngine.playGameOver();
      soundEngine.playCaughtVoice();
      this.emitHudSnapshot();
      this.callbacks.onPhaseChange(GamePhase.GAME_OVER);
    }
  }

  private updateShockwave(dt: number): void {
    if (this.shockwaveTimer <= 0) {
      this.shockwaveRing.visible = false;
      return;
    }
    this.shockwaveTimer -= dt;
    const progress = 1 - Math.max(0, this.shockwaveTimer) / 0.5;
    const radius = THREE.MathUtils.lerp(0.8, this.shockwaveMaxRadius, progress);
    this.shockwaveRing.scale.setScalar(radius);
    const mat = this.shockwaveRing.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - progress) * 0.85;
  }

  private updateDebris(dt: number): void {
    let anyUpdated = false;
    for (let i = 0; i < this.maxDebris; i++) {
      const p = this.debrisPool[i];
      if (!p.active) continue;
      anyUpdated = true;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        _dummyObj.position.set(0, -50, 0);
        _dummyObj.scale.setScalar(0);
        _dummyObj.updateMatrix();
        this.debrisInstanced.setMatrixAt(i, _dummyObj.matrix);
        continue;
      }

      p.vel.y -= 22 * dt;
      p.pos.addScaledVector(p.vel, dt);
      if (p.pos.y < 0.08) {
        p.pos.y = 0.08;
        p.vel.y *= -0.45;
        p.vel.x *= 0.78;
        p.vel.z *= 0.78;
      }
      p.rot.x += p.rotVel.x * dt;
      p.rot.y += p.rotVel.y * dt;
      p.rot.z += p.rotVel.z * dt;

      const fadeScale = p.scale * (1 - (p.life / p.maxLife) * 0.45);
      _dummyObj.position.copy(p.pos);
      _dummyObj.rotation.copy(p.rot);
      _dummyObj.scale.setScalar(fadeScale);
      _dummyObj.updateMatrix();
      this.debrisInstanced.setMatrixAt(i, _dummyObj.matrix);
    }

    if (anyUpdated) {
      this.debrisInstanced.instanceMatrix.needsUpdate = true;
    }
  }

  private updateGameplayCamera(dt: number): void {
    const rx = this.rickshaw.root.position.x;
    const ry = this.rickshaw.root.position.y;
    const rz = this.rickshaw.root.position.z;

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);

    if (this.cameraMode === CameraMode.DRIVER) {
      _camDesired.set(rx - sinY * 0.55, ry + 1.88, rz - cosY * 0.55);
      _camLookTarget.set(rx - sinY * 14, ry + 1.35, rz - cosY * 14);
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-18 * dt));
      this.currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-18 * dt));
    } else if (this.cameraMode === CameraMode.FRONT) {
      const distFront = 3.4;
      _camDesired.set(
        rx - sinY * distFront - this.steerAngle * 0.6,
        ry + 1.82,
        rz - cosY * distFront
      );
      _camLookTarget.set(rx, ry + 1.25, rz);
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-14 * dt));
      this.currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-16 * dt));
    } else {
      const distBack = this.cameraMode === CameraMode.ACTION ? 5.2 : 7.4;
      const heightUp = this.cameraMode === CameraMode.ACTION ? 2.45 : 3.55;

      _camDesired.set(
        rx + sinY * distBack - this.steerAngle * 1.1,
        ry + heightUp,
        rz + cosY * distBack
      );
      _camLookTarget.set(rx - sinY * 4.5, ry + 1.25, rz - cosY * 4.5);

      this.camera.position.lerp(_camDesired, 1 - Math.exp(-9.5 * dt));
      this.currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-12 * dt));
    }

    if (this.cameraShake > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 0.7;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 9, dt);
    } else {
      this.cameraShake = 0;
    }

    const targetFov =
      60 +
      Math.min(Math.abs(this.speed) / 28, 1) * 11 +
      (this.turboTimer > 0 ? 7 : 0);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
      this.camera.updateProjectionMatrix();
    }

    this.camera.lookAt(this.currentLookAt);
  }

  public emitHudSnapshot(): void {
    this.callbacks.onHudUpdate({
      money: this.money,
      highScore: this.highScore,
      health: Math.ceil(this.health),
      wantedLevel: this.wantedLevel,
      speedKmh: Math.round(Math.abs(this.speed) * 3.6),
      combo: this.combo,
      comboTimerRatio: this.combo > 0 ? Math.max(0, this.comboTimer / COMBO_WINDOW_SEC) : 0,
      stallsSmashed: this.stallsSmashed,
      distanceMeters: Math.floor(this.distanceMeters),
      bellCooldownRatio: 1 - this.bellCooldown / BELL_COOLDOWN_SEC,
      turboRemainingRatio: this.turboTimer / TURBO_DURATION_SEC,
      activeMobCount: this.mobs.length,
      trafficCount: this.traffic.length,
      trafficSignal: this.activeCrossingHudInfo,
      weather: this.weather,
      roadGrip: this.roadGrip,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestored
    );

    this.textures.disposeAll();
    if (this.envMapTexture) {
      this.envMapTexture.dispose();
    }

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
