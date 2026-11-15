import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import {
  BreakingNewsItem,
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
  CityCellOpenShopData,
  CityCellStallData,
  CrowBirdRig,
  createCityGridCell,
  createCngModel,
  createDhakaBusModel,
  createDhakaCarModel,
  createDhakaCrowFlock,
  createDhakaKiteFlock,
  createDhakaMetroTrainModel,
  createDhakaMotorcycleModel,
  createDhakaTruckModel,
  createDriverModel,
  createLegunaModel,
  createMobModel,
  createPickupModel,
  createRickshawModel,
  createTrafficRickshawModel,
  DriverRig,
  KiteRig,
  MobRig,
  PedestrianRig,
  RickshawRig,
  SharedCellTemplateMap,
  TrafficLightRig,
} from './models';
import { createDiverseDhakaNpcModel } from './npcModels';
import { createProceduralTextures, ProceduralTexturePack } from './textures';
import { createBatchMaterialCache } from './meshBatcher';

// Module-scope reusable math helpers (Zero GC in animation loop)
const _v1 = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _colorTmp = new THREE.Color();

const CELL_SIZE = 96;
const GRID_SIZE = 5; // 5x5 = 25 seamless 96m super-cells (480m x 480m highest view range)
const HALF_GRID_SPAN = (CELL_SIZE * GRID_SIZE) / 2; // 240m
const ROAD_HALF_DRIVABLE = 7.95; // Allows brushing right up to the curb edge & crossing pedestrians
const BELL_COOLDOWN_SEC = 3.8;
const TURBO_DURATION_SEC = 4.5;
const COMBO_WINDOW_SEC = 4.2;
const HIGH_SCORE_STORAGE_KEY = 'dhandabaz_3d_highscore_v3';

const CROSSING_NAMES = [
  'নিউ মার্কেট গেট নং ১ মোড়',
  'গাউছিয়া মার্কেট — এলিফ্যান্ট রোড',
  'নীলক্ষেত বই বাজার ক্রসিং',
  'চন্দ্রিমা সুপার মার্কেট মোড়',
  'বাটা সিগন্যাল — সায়েন্স ল্যাব',
  'হকার্স মার্কেট ট্রাফিক জংশন',
];

const DISTRICT_NAMES = [
  'ঢাকা নিউ মার্কেট কমপ্লেক্স',
  'গাউছিয়া ও হকার্স মার্কেট',
  'নীলক্ষেত বই বাজার ও মোড়',
  'চন্দ্রিমা সুপার মার্কেট এলাকা',
  'এলিফ্যান্ট রোড ও বাটা সিগন্যাল',
  'বলাকা সিনেমা ও নিউ মার্কেট গেট',
  'নূরজাহান মার্কেট ও মিরপুর রোড',
  'সায়েন্স ল্যাব ও ঢাকা কলেজ গেট',
];

interface CityCell {
  group: THREE.Group;
  metroGroup: THREE.Group;
  gridX: number;
  gridZ: number;
  xCenter: number;
  zCenter: number;
  stalls: CityCellStallData[];
  openShops: CityCellOpenShopData[];
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
  vehicleType: 'bus' | 'truck' | 'cng' | 'rickshaw' | 'leguna' | 'car' | 'motorcycle';
  halfLen: number;
  isBus: boolean;
  isTruck: boolean;
  axis: 'Z' | 'X';
  aveBase: number; // Grid avenue coordinate (multiples of 96): X for 'Z' axis, Z for 'X' axis
  baseLaneOffset: number; // Preferred home lane offset to return to after evading
  laneOffset: number; // Lateral lane offset within [-5.8, +5.8]
  targetLaneOffset: number;
  baseSpeed: number;
  currentSpeed: number;
  direction: -1 | 1;
  nearMissAwarded: boolean;
  hitCooldown: number;
  hornCooldown: number;
  stoppedAtLight: boolean;
  overtakeCooldown: number;
  avoidTimer: number;
  swayPhase: number;
  hp: number;
  maxHp: number;
  mass: number;
  wrecked: boolean;
  wreckTimer: number;
  impactVelX: number;
  impactVelZ: number;
  spinVel: number;
  tiltRoll: number;
  tiltPitch: number;
  damageSmokeAcc: number;
}

const VEHICLE_COMBAT_SPECS: Record<
  TrafficVehicle['vehicleType'],
  { maxHp: number; mass: number }
> = {
  motorcycle: { maxHp: 35, mass: 0.75 },
  rickshaw: { maxHp: 40, mass: 1.0 },
  cng: { maxHp: 65, mass: 1.6 },
  leguna: { maxHp: 95, mass: 2.4 },
  car: { maxHp: 115, mass: 2.8 },
  bus: { maxHp: 175, mass: 4.6 },
  truck: { maxHp: 220, mass: 5.5 },
};

interface StreetPickup {
  mesh: THREE.Group;
  kind: 'biryani' | 'chai';
  active: boolean;
}

type NpcAiState =
  | 'WALK_SIDEWALK'
  | 'STOP_STALL_CHAT'
  | 'WAVE_RICKSHAW'
  | 'PHONE_IDLE'
  | 'JAYWALK'
  | 'PANIC_SCATTER';

interface PedestrianEntry {
  rig: PedestrianRig;
  axis: 'Z' | 'X';
  side: -1 | 1;
  aveBase: number;
  isCrosser: boolean;
  laneLateral: number;
  baseY: number;
  posY: number;
  fallenTimer: number;
  hitCooldown: number;
  knockVelX: number;
  knockVelZ: number;
  knockVelY: number;
  knockSpin: number;
  fallTiltX: number;
  fallYaw: number;
  stridePhase: number;
  currentYaw: number;
  targetYaw: number;
  aiState: NpcAiState;
  stateTimer: number;
  decisionCooldown: number;
  medianWaitTimer: number;
  jaywalkLatPos: number;
  jaywalkTargetLat: number;
  jaywalkSpeed: number;
  jaywalkDistracted: boolean;
  scatterX: number;
  scatterZ: number;
}

interface ActiveMob {
  rig: MobRig;
  stunTimer: number;
  fallenTimer: number;
  posY: number;
  velY: number;
  fallTiltX: number;
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

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const twoPi = Math.PI * 2;
  let diff = (target - current) % twoPi;
  if (diff > Math.PI) diff -= twoPi;
  else if (diff < -Math.PI) diff += twoPi;
  return current + diff * (1 - Math.exp(-lambda * dt));
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
  private crows: CrowBirdRig[] = [];
  private kites: KiteRig[] = [];
  private metroTrain?: THREE.Group;
  private metroTrainZ = -58;
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
  private pedHits = 0;
  private distanceMeters = 0;
  private bellCooldown = 0;
  private turboTimer = 0;
  private bellJiggleTimer = 0;
  private popupCounter = 1;
  private speedBumpCooldown = 0;

  // Dynamic Camera & Breaking News states (Mob Chase & Vehicle Wreck Choreography)
  private accidentCamTimer = 0;
  private accidentCamFocal = new THREE.Vector3();
  private accidentRollTarget = 0;
  private mobChaseCamBlend = 0;
  private closestMobDist = Infinity;
  private currentCamRoll = 0;
  private activeNews?: BreakingNewsItem;
  private activeNewsTimer = 0;
  private newsCooldown = 0;
  private newsCounter = 1;
  private lastChaseNewsAt = 0;

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
    this.scene.fog = new THREE.FogExp2(0xc9e4f8, 0.0020);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.15, 520);
    this.camera.position.set(3.8, 2.8, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.35)
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
    const d = 32;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 105;
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
    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
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
    const skyGeo = new THREE.SphereGeometry(460, 24, 16);
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
    for (let i = 0; i < 28; i++) {
      const cluster = new THREE.Group();
      const puffCount = 3 + (i % 4);
      for (let j = 0; j < puffCount; j++) {
        const puff = new THREE.Mesh(puffGeo, this.cloudMat);
        const rxScale = 7.4 + ((i * 7 + j * 3) % 7);
        const ryScale = 2.0 + ((i + j) % 3) * 0.55;
        const rzScale = 5.4 + ((i * 5 + j * 2) % 6);
        puff.scale.set(rxScale, ryScale, rzScale);
        puff.position.set(
          (j - (puffCount - 1) * 0.5) * 5.2,
          ((i + j) % 2) * 1.0,
          (((j * 3) % 3) - 1) * 2.6
        );
        cluster.add(puff);
      }
      const gridRow = Math.floor(i / 7);
      const gridCol = i % 7;
      cluster.position.set(
        -210 + gridCol * 70 + ((i * 19) % 28),
        52 + (i % 5) * 5.0,
        -200 + gridRow * 125 + ((i * 13) % 28)
      );
      this.cloudGroup.add(cluster);
      this.clouds.push({
        mesh: cluster,
        speed: 1.6 + (i % 4) * 0.6,
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

    // 3. 5x5 INFINITE 2D CITY SUPER-CELL GRID (Instanced/shared templates & pre-baked geometry for instant load & max view distance)
    const batchCache = createBatchMaterialCache();
    const sharedTemplates: SharedCellTemplateMap = new Map();
    let cellIdx = 0;
    for (let gz = -2; gz <= 2; gz++) {
      for (let gx = -2; gx <= 2; gx++) {
        const res = createCityGridCell(cellIdx, this.textures, batchCache, sharedTemplates);
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
          openShops: res.openShops,
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

    // 3b. Dedicated Animated Overhead Dhaka Metro Rail (MRT-6) 4-Coach Train along gridX === 0
    this.metroTrain = createDhakaMetroTrainModel(this.textures);
    this.metroTrain.position.set(2.0, 10.26, this.metroTrainZ);
    this.scene.add(this.metroTrain);

    // 4. 2D INFINITE DHAKA TRAFFIC (Abundant Cycle Rickshaws + Motorcycles, Private Cars, CNGs, Legunas, Buses & Trucks)
    const zConfigs = [
      { type: 'rickshaw' as const, laneOffset: -5.2, dir: -1 as const, speed: 5.2, posOffset: -18 },
      { type: 'rickshaw' as const, laneOffset: -4.8, dir: -1 as const, speed: 4.8, posOffset: -54 },
      { type: 'rickshaw' as const, laneOffset: -5.3, dir: -1 as const, speed: 5.7, posOffset: 26 },
      { type: 'rickshaw' as const, laneOffset: -4.9, dir: -1 as const, speed: 5.0, posOffset: 76 },
      { type: 'rickshaw' as const, laneOffset: -5.1, dir: -1 as const, speed: 5.5, posOffset: -94 },
      { type: 'truck' as const, laneOffset: -3.7, dir: -1 as const, speed: 6.9, posOffset: -34 },
      { type: 'bus' as const, laneOffset: -3.8, dir: -1 as const, speed: 7.9, posOffset: -76 },
      { type: 'leguna' as const, laneOffset: -3.3, dir: -1 as const, speed: 9.2, posOffset: 42 },
      { type: 'car' as const, laneOffset: -2.2, dir: -1 as const, speed: 11.4, posOffset: -24 },
      { type: 'car' as const, laneOffset: -2.3, dir: -1 as const, speed: 10.8, posOffset: 88 },
      { type: 'motorcycle' as const, laneOffset: -1.4, dir: -1 as const, speed: 13.8, posOffset: -64 },
      { type: 'motorcycle' as const, laneOffset: -2.7, dir: -1 as const, speed: 14.5, posOffset: 12 },
      { type: 'cng' as const, laneOffset: -1.8, dir: -1 as const, speed: 12.2, posOffset: -46 },
      { type: 'cng' as const, laneOffset: -1.9, dir: -1 as const, speed: 11.4, posOffset: 62 },
      { type: 'rickshaw' as const, laneOffset: 5.2, dir: 1 as const, speed: 5.4, posOffset: -42 },
      { type: 'rickshaw' as const, laneOffset: 4.8, dir: 1 as const, speed: 4.9, posOffset: 16 },
      { type: 'rickshaw' as const, laneOffset: 5.3, dir: 1 as const, speed: 5.8, posOffset: 58 },
      { type: 'rickshaw' as const, laneOffset: 4.9, dir: 1 as const, speed: 5.1, posOffset: -84 },
      { type: 'truck' as const, laneOffset: 3.7, dir: 1 as const, speed: 6.7, posOffset: -60 },
      { type: 'bus' as const, laneOffset: 3.8, dir: 1 as const, speed: 7.6, posOffset: 28 },
      { type: 'leguna' as const, laneOffset: 3.3, dir: 1 as const, speed: 9.0, posOffset: -90 },
      { type: 'car' as const, laneOffset: 2.2, dir: 1 as const, speed: 11.6, posOffset: -10 },
      { type: 'car' as const, laneOffset: 2.3, dir: 1 as const, speed: 10.6, posOffset: 68 },
      { type: 'motorcycle' as const, laneOffset: 1.4, dir: 1 as const, speed: 14.2, posOffset: -50 },
      { type: 'motorcycle' as const, laneOffset: 2.7, dir: 1 as const, speed: 13.6, posOffset: 44 },
      { type: 'cng' as const, laneOffset: 1.8, dir: 1 as const, speed: 12.4, posOffset: -24 },
      { type: 'cng' as const, laneOffset: 1.9, dir: 1 as const, speed: 11.8, posOffset: 82 },
    ];

    const xConfigs = [
      { type: 'rickshaw' as const, laneOffset: -5.2, dir: 1 as const, speed: 5.3, posOffset: -82 },
      { type: 'rickshaw' as const, laneOffset: -4.9, dir: 1 as const, speed: 4.7, posOffset: -22 },
      { type: 'rickshaw' as const, laneOffset: -5.3, dir: 1 as const, speed: 5.6, posOffset: 48 },
      { type: 'truck' as const, laneOffset: -3.7, dir: 1 as const, speed: 6.8, posOffset: -52 },
      { type: 'bus' as const, laneOffset: -3.8, dir: 1 as const, speed: 7.8, posOffset: 32 },
      { type: 'car' as const, laneOffset: -2.2, dir: 1 as const, speed: 11.2, posOffset: -12 },
      { type: 'car' as const, laneOffset: -2.3, dir: 1 as const, speed: 10.8, posOffset: 88 },
      { type: 'motorcycle' as const, laneOffset: -1.4, dir: 1 as const, speed: 13.9, posOffset: -70 },
      { type: 'motorcycle' as const, laneOffset: -2.7, dir: 1 as const, speed: 14.6, posOffset: 14 },
      { type: 'cng' as const, laneOffset: -1.9, dir: 1 as const, speed: 12.0, posOffset: -32 },
      { type: 'leguna' as const, laneOffset: -3.3, dir: 1 as const, speed: 9.2, posOffset: 74 },
      { type: 'rickshaw' as const, laneOffset: 5.2, dir: -1 as const, speed: 5.1, posOffset: -64 },
      { type: 'rickshaw' as const, laneOffset: 4.9, dir: -1 as const, speed: 5.6, posOffset: 18 },
      { type: 'rickshaw' as const, laneOffset: 5.3, dir: -1 as const, speed: 4.8, posOffset: 84 },
      { type: 'truck' as const, laneOffset: 3.7, dir: -1 as const, speed: 6.7, posOffset: 52 },
      { type: 'bus' as const, laneOffset: 3.8, dir: -1 as const, speed: 7.7, posOffset: -36 },
      { type: 'car' as const, laneOffset: 2.2, dir: -1 as const, speed: 11.5, posOffset: -14 },
      { type: 'motorcycle' as const, laneOffset: 1.5, dir: -1 as const, speed: 14.0, posOffset: 62 },
      { type: 'cng' as const, laneOffset: 1.9, dir: -1 as const, speed: 11.8, posOffset: 24 },
      { type: 'leguna' as const, laneOffset: 3.3, dir: -1 as const, speed: 9.0, posOffset: -78 },
    ];

    const halfLengthByType: Record<TrafficVehicle['vehicleType'], number> = {
      truck: 3.8,
      bus: 4.9,
      leguna: 2.8,
      car: 2.25,
      cng: 1.5,
      rickshaw: 1.3,
      motorcycle: 1.05,
    };

    const buildVehicleMesh = (type: TrafficVehicle['vehicleType'], seed: number): THREE.Group => {
      if (type === 'truck') return createDhakaTruckModel(this.textures, seed % 5);
      if (type === 'bus') return createDhakaBusModel(this.textures);
      if (type === 'leguna') return createLegunaModel(this.textures);
      if (type === 'car') return createDhakaCarModel(this.textures, seed % 5);
      if (type === 'motorcycle') return createDhakaMotorcycleModel(this.textures, seed % 4);
      if (type === 'cng') return createCngModel(this.textures);
      return createTrafficRickshawModel(this.textures, seed);
    };

    zConfigs.forEach((cfg, i) => {
      const mesh = buildVehicleMesh(cfg.type, i);
      mesh.position.set(cfg.laneOffset, 0, cfg.posOffset);
      mesh.rotation.y = cfg.dir === -1 ? 0 : Math.PI;
      this.scene.add(mesh);

      const spec = VEHICLE_COMBAT_SPECS[cfg.type];
      this.traffic.push({
        mesh,
        vehicleType: cfg.type,
        halfLen: halfLengthByType[cfg.type],
        isBus: cfg.type === 'bus',
        isTruck: cfg.type === 'truck',
        axis: 'Z',
        aveBase: 0,
        baseLaneOffset: cfg.laneOffset,
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
        avoidTimer: 0,
        swayPhase: Math.random() * Math.PI * 2,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        mass: spec.mass,
        wrecked: false,
        wreckTimer: 0,
        impactVelX: 0,
        impactVelZ: 0,
        spinVel: 0,
        tiltRoll: 0,
        tiltPitch: 0,
        damageSmokeAcc: 0,
      });
    });

    xConfigs.forEach((cfg, i) => {
      const mesh = buildVehicleMesh(cfg.type, i + 3);
      mesh.position.set(cfg.posOffset, 0, cfg.laneOffset);
      mesh.rotation.y = cfg.dir === 1 ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(mesh);

      const spec = VEHICLE_COMBAT_SPECS[cfg.type];
      this.traffic.push({
        mesh,
        vehicleType: cfg.type,
        halfLen: halfLengthByType[cfg.type],
        isBus: cfg.type === 'bus',
        isTruck: cfg.type === 'truck',
        axis: 'X',
        aveBase: 0,
        baseLaneOffset: cfg.laneOffset,
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
        avoidTimer: 0,
        swayPhase: Math.random() * Math.PI * 2,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        mass: spec.mass,
        wrecked: false,
        wreckTimer: 0,
        impactVelX: 0,
        impactVelZ: 0,
        spinVel: 0,
        tiltRoll: 0,
        tiltPitch: 0,
        damageSmokeAcc: 0,
      });
    });

    // 5. Animated Diverse Dhaka NPCs (Gramin, Smart, City-Style, Murubbi, Feriwala, Borka) with Multi-State AI & Jaywalking
    for (let i = 0; i < 52; i++) {
      const rig = createDiverseDhakaNpcModel(i, this.textures);
      const isCrosser = i >= 40;
      const axis: 'Z' | 'X' = isCrosser ? (i % 2 === 0 ? 'X' : 'Z') : i < 20 ? 'Z' : 'X';
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      const offset = -90 + (i % 16) * 12;
      // Clear inner footpath lane between guardrails/poles (8.75..9.1m) and stalls (10.45m+)
      const laneLateral = 9.45 + (i % 3) * 0.25;
      const baseY = isCrosser ? 0.02 : 0.26;
      const initialJaywalk = !isCrosser && (i === 5 || i === 14 || i === 27);
      const jaywalkLatPos = side * laneLateral;

      if (isCrosser) {
        const crossOffset = side * 9.5; // Intersection Zebra Crossings
        const walkPos = ((i - 40) - 5.5) * 2.2;
        if (axis === 'X') {
          rig.root.position.set(walkPos, baseY, crossOffset);
          rig.root.rotation.y = rig.direction === 1 ? -Math.PI / 2 : Math.PI / 2;
        } else {
          rig.root.position.set(crossOffset, baseY, walkPos);
          rig.root.rotation.y = rig.direction === 1 ? Math.PI : 0;
        }
      } else if (axis === 'Z') {
        rig.root.position.set(jaywalkLatPos, baseY, offset);
        rig.root.rotation.y = rig.direction === 1 ? Math.PI : 0;
      } else {
        rig.root.position.set(offset, baseY, jaywalkLatPos);
        rig.root.rotation.y = rig.direction === 1 ? -Math.PI / 2 : Math.PI / 2;
      }
      this.scene.add(rig.root);
      this.pedestrians.push({
        rig,
        axis,
        side,
        aveBase: 0,
        isCrosser,
        laneLateral,
        baseY,
        posY: baseY,
        fallenTimer: 0,
        hitCooldown: 0,
        knockVelX: 0,
        knockVelZ: 0,
        knockVelY: 0,
        knockSpin: 0,
        fallTiltX: 0,
        fallYaw: rig.root.rotation.y,
        stridePhase: (i * 1.37) % (Math.PI * 2),
        currentYaw: rig.root.rotation.y,
        targetYaw: rig.root.rotation.y,
        aiState: initialJaywalk ? 'JAYWALK' : 'WALK_SIDEWALK',
        stateTimer: initialJaywalk ? 6.0 : 0,
        decisionCooldown: 1.0 + (i % 7) * 0.55,
        medianWaitTimer: 0,
        jaywalkLatPos,
        jaywalkTargetLat: -side * laneLateral,
        jaywalkSpeed: rig.archetype === 'smart' || rig.archetype === 'city_style' ? 2.15 : 2.85,
        jaywalkDistracted: rig.archetype === 'smart' || rig.archetype === 'city_style',
        scatterX: 0,
        scatterZ: 0,
      });
    }

    // Animated Circling Dhaka Crows & Colourful Sky Kites ("কাক ও রঙিন ঘুড়ি")
    this.crows = createDhakaCrowFlock(14);
    this.crows.forEach((c) => this.scene.add(c.root));
    this.kites = createDhakaKiteFlock(6);
    this.kites.forEach((k) => this.scene.add(k.root));

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
      this.scene.background = new THREE.Color(0xbce0fa);
      (this.scene.fog as THREE.FogExp2).color.setHex(0xd6e8f8);
      (this.scene.fog as THREE.FogExp2).density = 0.0018;
      this.renderer.toneMappingExposure = 1.1;
      this.scene.environmentIntensity = 0.76;

      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x8a725a);
      this.hemiLight.intensity = 1.24;
      this.sunLight.color.setHex(0xffe7bd);
      this.sunLight.intensity = 2.85;
      this.sunOffset.set(28, 44, 22);
      this.rimLight.color.setHex(0x93c5fd);
      this.rimLight.intensity = 0.54;
      this.rickshaw.headlightSpot.intensity = 0;
      this.roadGrip = 1.0;

      if (this.skyUniforms) {
        this.skyUniforms.uZenithColor.value.setHex(0x2563eb);
        this.skyUniforms.uMidColor.value.setHex(0x6fb7f0);
        this.skyUniforms.uHorizonColor.value.setHex(0xfce7c8);
        this.skyUniforms.uSunDir.value.set(28, 44, 22).normalize();
        this.skyUniforms.uSunGlow.value = 0.68;
      }

      if (this.ambientMotesMat) {
        this.ambientMotesMat.color.setHex(0xfde68a);
        this.ambientMotesMat.opacity = 0.52;
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
      (this.scene.fog as THREE.FogExp2).density = 0.0033;
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
    this.pedHits = 0;
    this.distanceMeters = 0;
    this.bellCooldown = 0;
    this.turboTimer = 0;
    this.speedBumpCooldown = 0;
    this.lastPlayerGridX = 0;
    this.lastPlayerGridZ = 0;
    this.accidentCamTimer = 0;
    this.accidentRollTarget = 0;
    this.mobChaseCamBlend = 0;
    this.closestMobDist = Infinity;
    this.currentCamRoll = 0;
    this.activeNews = undefined;
    this.activeNewsTimer = 0;
    this.newsCooldown = 0;
    this.lastChaseNewsAt = 0;

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
    this.metroTrainZ = -58;
    if (this.metroTrain) {
      this.metroTrain.position.set(2.0, 10.26, this.metroTrainZ);
      this.metroTrain.visible = true;
    }

    for (const m of this.mobs) {
      this.scene.remove(m.rig.root);
    }
    this.mobs.length = 0;

    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      p.fallenTimer = 0;
      p.hitCooldown = 0;
      p.knockVelX = 0;
      p.knockVelZ = 0;
      p.knockVelY = 0;
      p.fallTiltX = 0;
      p.medianWaitTimer = 0;
      p.aiState = 'WALK_SIDEWALK';
      p.stateTimer = 0;
      p.decisionCooldown = 1.0 + (i % 6) * 0.5;
      p.jaywalkLatPos = p.side * p.laneLateral;
      p.jaywalkTargetLat = -p.jaywalkLatPos;
      p.posY = p.baseY;
      p.rig.root.position.y = p.baseY;
      p.currentYaw = p.fallYaw;
      p.targetYaw = p.fallYaw;
      p.rig.root.rotation.set(0, p.fallYaw, 0);
      if (p.rig.head) p.rig.head.rotation.set(0, 0, 0);
    }

    // Reset 5x5 cell grid back around (0, 0)
    let idx = 0;
    for (let gz = -2; gz <= 2; gz++) {
      for (let gx = -2; gx <= 2; gx++) {
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
        for (const os of cell.openShops) {
          os.cooldown = 0;
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
      tr.laneOffset = tr.baseLaneOffset;
      tr.targetLaneOffset = tr.baseLaneOffset;
      tr.avoidTimer = 0;
      tr.currentSpeed = tr.baseSpeed;
      tr.nearMissAwarded = false;
      tr.hitCooldown = 0;
      tr.stoppedAtLight = false;
      tr.hp = tr.maxHp;
      tr.wrecked = false;
      tr.wreckTimer = 0;
      tr.impactVelX = 0;
      tr.impactVelZ = 0;
      tr.spinVel = 0;
      tr.tiltRoll = 0;
      tr.tiltPitch = 0;
      tr.damageSmokeAcc = 0;
      tr.mesh.visible = true;
      tr.mesh.scale.setScalar(1);

      if (tr.axis === 'Z') {
        const idxDir = tr.direction === -1 ? zNeg++ : zPos++;
        const sign = idxDir % 2 === 0 ? -1 : 1;
        const zOff = sign * (22 + Math.floor(idxDir / 2) * 20);
        tr.mesh.position.set(tr.laneOffset, 0, zOff);
        tr.mesh.rotation.set(0, tr.direction === -1 ? 0 : Math.PI, 0);
      } else {
        const idxDir = tr.direction === -1 ? xNeg++ : xPos++;
        const sign = idxDir % 2 === 0 ? -1 : 1;
        const xOff = sign * (24 + Math.floor(idxDir / 2) * 24);
        tr.mesh.position.set(xOff, 0, tr.laneOffset);
        tr.mesh.rotation.set(0, tr.direction === 1 ? -Math.PI / 2 : Math.PI / 2, 0);
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
        mob.stunTimer = 2.0;
        mob.fallenTimer = 1.9;
        mob.velY = 3.2;
        stunnedCount++;
      }
    }

    for (const ped of this.pedestrians) {
      const dx = ped.rig.root.position.x - rx;
      const dz = ped.rig.root.position.z - rz;
      const dist = Math.hypot(dx, dz);
      if (dist < this.shockwaveMaxRadius && ped.fallenTimer <= 0) {
        const inv = 1 / Math.max(dist, 0.2);
        ped.aiState = 'PANIC_SCATTER';
        ped.stateTimer = 1.55;
        ped.scatterX = dx * inv;
        ped.scatterZ = dz * inv;
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
      fallenTimer: 0,
      posY: 0,
      velY: 0,
      fallTiltX: 0,
      knockVelX: 0,
      knockVelZ: 0,
    });
  }

  private triggerBreakingNews(
    category: BreakingNewsItem['category'],
    headlineBn: string,
    tickerBn: string,
    force = false
  ): void {
    if (!force && this.newsCooldown > 0) return;
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const gx = Math.round(rx / CELL_SIZE);
    const gz = Math.round(rz / CELL_SIZE);
    const locationBn = this.getDistrictName(gx, gz);

    this.activeNews = {
      id: this.newsCounter++,
      category,
      headlineBn,
      tickerBn,
      locationBn,
    };
    this.activeNewsTimer = 5.6;
    this.newsCooldown = force ? 1.8 : 4.2;
    this.emitHudSnapshot();
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
          fallenTimer: 0,
          posY: 0,
          velY: 0,
          fallTiltX: 0,
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
        m.fallenTimer = 0;
        m.posY = 0;
        m.velY = 0;
        m.fallTiltX = 0;
        m.rig.root.rotation.set(0, 0, 0);
        m.knockVelX = 0;
        m.knockVelZ = 0;
      }
    }

    const driverName = DRIVER_PROFILES[this.selectedDriverId].nameBn;
    this.triggerBreakingNews(
      'MOB_CHASE',
      `দোকান ভেঙে পালানোয় ক্ষিপ্ত জনতার ধাওয়া!`,
      `${driverName}-কে ঘেরাও করতে ছুটছে বিক্ষুব্ধ দোকানদার ও পথচারীরা · পরিস্থিতি উত্তপ্ত`,
      false
    );
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
    if (k === 'r' && !e.repeat && this.phase === GamePhase.PLAYING) {
      const nextStation = soundEngine.toggleRadio();
      const label = soundEngine.getRadioStationLabel();
      this.emitPopup(
        nextStation === 'OFF' ? '📻 রেডিও বন্ধ' : `📻 ${label}`,
        nextStation === '88.8'
          ? 'বাংলা ক্লাসিক ও মাটির গান'
          : nextStation === '98.4'
            ? 'লাইভ ঢাকা টক-শো ও ট্রাফিক'
            : nextStation === '101.6'
              ? 'রিকশা-বিট ফিউশন'
              : 'আবার চালু করতে [R] চাপুন',
        'turbo'
      );
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
      if (c.mesh.position.x - rx > 240) c.mesh.position.x -= 480;
      else if (c.mesh.position.x - rx < -240) c.mesh.position.x += 480;

      if (c.mesh.position.z - rz > 240) c.mesh.position.z -= 480;
      else if (c.mesh.position.z - rz < -240) c.mesh.position.z += 480;
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

    this.updateMetroTrain(dt);
    this.updateIntersections(dt, false);
    this.updateTraffic(dt, false);
    this.updatePedestrians(dt, elapsed, false);
    this.updateCrows(elapsed);
  }

  private updateMetroTrain(dt: number): void {
    if (!this.metroTrain) return;
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const nearMetroCorridor = Math.abs(rx) < 220;
    this.metroTrain.visible = nearMetroCorridor;
    if (!nearMetroCorridor) return;

    this.metroTrainZ -= 24.5 * dt;
    if (this.metroTrainZ - rz < -230) {
      this.metroTrainZ = rz + 230;
    } else if (this.metroTrainZ - rz > 235) {
      this.metroTrainZ = rz - 230;
    }
    this.metroTrain.position.set(2.0, 10.26, this.metroTrainZ);
  }

  private updatePlaying(dt: number, elapsed: number): void {
    const profile = DRIVER_PROFILES[this.selectedDriverId];

    if (this.bellCooldown > 0) {
      this.bellCooldown = Math.max(0, this.bellCooldown - dt);
    }
    if (this.curbHitCooldown > 0) {
      this.curbHitCooldown = Math.max(0, this.curbHitCooldown - dt);
    }
    if (this.speedBumpCooldown > 0) {
      this.speedBumpCooldown = Math.max(0, this.speedBumpCooldown - dt);
    }
    if (this.accidentCamTimer > 0) {
      this.accidentCamTimer = Math.max(0, this.accidentCamTimer - dt);
    }
    if (this.newsCooldown > 0) {
      this.newsCooldown = Math.max(0, this.newsCooldown - dt);
    }
    if (this.activeNewsTimer > 0) {
      this.activeNewsTimer -= dt;
      if (this.activeNewsTimer <= 0) {
        this.activeNews = undefined;
      }
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

    // Dhaka Speed Breaker ("স্পিড ব্রেকার") + Center Median Planter Curb bump
    const hitCenterMedian =
      (Math.abs(relX) < 0.52 && (Math.abs(Math.abs(relZ) - 22.5) < 4.25 || Math.abs(Math.abs(relZ) - 38.0) < 4.25)) ||
      (Math.abs(relZ) < 0.52 && (Math.abs(Math.abs(relX) - 22.5) < 4.25 || Math.abs(Math.abs(relX) - 38.0) < 4.25));
    if (
      this.speedBumpCooldown <= 0 &&
      Math.abs(this.speed) > 4.0 &&
      (hitCenterMedian ||
        (Math.abs(relX) < ROAD_HALF_DRIVABLE && Math.abs(Math.abs(relZ) - 16.8) < 0.7) ||
        (Math.abs(relZ) < ROAD_HALF_DRIVABLE && Math.abs(Math.abs(relX) - 16.8) < 0.7))
    ) {
      this.speedBumpCooldown = hitCenterMedian ? 0.35 : 0.55;
      this.bounceVel += Math.min(2.6, Math.abs(this.speed) * 0.14);
      this.cameraShake = Math.max(this.cameraShake, hitCenterMedian ? 0.12 : 0.08);
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
    this.updateMetroTrain(dt);
    this.updateIntersections(dt, true);
    this.checkStallCollisions();
    this.updateOpenShops(dt);
    this.updatePickups(dt, elapsed);
    this.updateTraffic(dt, true);
    this.updatePedestrians(dt, elapsed, true);
    this.updateCrows(elapsed);
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
        for (const os of cell.openShops) {
          os.cooldown = 0;
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

  private updateOpenShops(dt: number): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const playerSlowOrStopped = Math.abs(this.speed) < 5.6;

    for (const cell of this.cells) {
      for (const os of cell.openShops) {
        if (os.cooldown > 0) {
          os.cooldown = Math.max(0, os.cooldown - dt);
        }
        if (!playerSlowOrStopped || os.cooldown > 0) continue;

        const sx = cell.xCenter + os.localX;
        const sz = cell.zCenter + os.localZ;
        const dx = rx - sx;
        const dz = rz - sz;
        // Road shoulder passes ~6.0-7.5m in front of the open shop doorway
        if (dx * dx + dz * dz < 68) {
          os.cooldown = 18.0;
          if (os.kind === 'pharmacy') {
            this.health = Math.min(100, this.health + 25);
            soundEngine.playPickup('heal');
            this.emitPopup(
              '💊 খোলা ফার্মেসি সার্ভিস! +২৫ হেলথ',
              'লাজ ফার্মা থেকে ফার্স্ট-এইড নেওয়া হলো',
              'heal'
            );
          } else if (os.kind === 'mudi') {
            this.health = Math.min(100, this.health + 15);
            this.addMoney(3000);
            soundEngine.playPickup('heal');
            this.emitPopup(
              '🏪 খোলা মুদি দোকান! +৳৩,০০০ ও +১৫ হেলথ',
              'মায়ের দোয়া কনফেকশনারি থেকে নাস্তা ও টিপস!',
              'cash'
            );
          } else if (os.kind === 'recharge') {
            this.addMoney(4500);
            soundEngine.playTrafficComplianceChime();
            this.emitPopup(
              '📱 খোলা বিকাশ পয়েন্ট! +৳৪,৫০০ ক্যাশ',
              'মোবাইল রিচার্জ ও বিকাশ ক্যাশব্যাক পাওয়া গেছে!',
              'turbo'
            );
          } else {
            this.addMoney(2500);
            this.turboTimer = Math.max(this.turboTimer, 2.5);
            soundEngine.playPickup('turbo');
            this.emitPopup(
              '🫖 খোলা হোটেলের মালাই চা! +৳২,৫০০ ও বুস্ট',
              'গরম চা-পরোটা খেয়ে ২.৫ সেকেন্ড রকেট গতি!',
              'turbo'
            );
          }
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

      if (dist > 175) {
        const useNS = i % 2 === 0;
        const laneOff = (Math.random() - 0.5) * 9.0;
        const aheadSign = Math.random() < 0.7 ? -1 : 1;
        if (useNS) {
          p.mesh.position.set(
            aveX + laneOff,
            0,
            rz + aheadSign * (85 + Math.random() * 75)
          );
        } else {
          p.mesh.position.set(
            rx + aheadSign * (85 + Math.random() * 75),
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

  private respawnTrafficVehicle(tr: TrafficVehicle, rx: number, rz: number): void {
    const spec = VEHICLE_COMBAT_SPECS[tr.vehicleType];
    tr.hp = spec.maxHp;
    tr.wrecked = false;
    tr.wreckTimer = 0;
    tr.impactVelX = 0;
    tr.impactVelZ = 0;
    tr.spinVel = 0;
    tr.tiltRoll = 0;
    tr.tiltPitch = 0;
    tr.damageSmokeAcc = 0;
    tr.nearMissAwarded = false;
    tr.hitCooldown = 0;
    tr.avoidTimer = 0;
    tr.laneOffset = tr.baseLaneOffset;
    tr.targetLaneOffset = tr.baseLaneOffset;
    tr.currentSpeed = tr.baseSpeed;
    tr.mesh.visible = true;
    tr.mesh.scale.setScalar(1);

    const nearestAveX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const nearestAveZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;
    if (tr.axis === 'Z') {
      tr.aveBase = nearestAveX;
      tr.mesh.position.set(tr.aveBase + tr.laneOffset, 0, rz + (tr.direction === -1 ? 165 : -165));
      tr.mesh.rotation.set(0, tr.direction === -1 ? 0 : Math.PI, 0);
    } else {
      tr.aveBase = nearestAveZ;
      tr.mesh.position.set(rx + (tr.direction === 1 ? -165 : 165), 0, tr.aveBase + tr.laneOffset);
      tr.mesh.rotation.set(0, tr.direction === 1 ? -Math.PI / 2 : Math.PI / 2, 0);
    }
  }

  private updateTraffic(dt: number, checkCollision: boolean): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const nearestAveX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const nearestAveZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;
    const playerVx = -Math.sin(this.yaw) * this.speed;
    const playerVz = -Math.cos(this.yaw) * this.speed;
    const playerSpeedAbs = Math.abs(this.speed);

    for (const tr of this.traffic) {
      // Handle actively wrecked / broken vehicles tumbling & smoking before fresh respawn
      if (tr.wrecked) {
        tr.wreckTimer -= dt;
        tr.mesh.position.x += tr.impactVelX * dt;
        tr.mesh.position.z += tr.impactVelZ * dt;
        tr.impactVelX = THREE.MathUtils.damp(tr.impactVelX, 0, 2.8, dt);
        tr.impactVelZ = THREE.MathUtils.damp(tr.impactVelZ, 0, 2.8, dt);
        tr.mesh.rotation.y += tr.spinVel * dt;
        tr.spinVel = THREE.MathUtils.damp(tr.spinVel, 0, 2.4, dt);
        tr.mesh.rotation.z = THREE.MathUtils.damp(tr.mesh.rotation.z, tr.tiltRoll, 6.5, dt);
        tr.mesh.rotation.x = THREE.MathUtils.damp(tr.mesh.rotation.x, tr.tiltPitch, 6.5, dt);

        tr.damageSmokeAcc += dt;
        if (tr.damageSmokeAcc > 0.16) {
          tr.damageSmokeAcc = 0;
          this.spawnDebrisBurst(tr.mesh.position.x, 0.65, tr.mesh.position.z, 2);
        }

        const d2d = Math.hypot(tr.mesh.position.x - rx, tr.mesh.position.z - rz);
        if (tr.wreckTimer <= 0 || d2d > 170) {
          this.respawnTrafficVehicle(tr, rx, rz);
        }
        continue;
      }

      // Apply decaying post-impact momentum and suspension wobble for damaged-but-intact vehicles
      if (Math.abs(tr.impactVelX) > 0.05 || Math.abs(tr.impactVelZ) > 0.05) {
        tr.mesh.position.x += tr.impactVelX * dt;
        tr.mesh.position.z += tr.impactVelZ * dt;
        tr.impactVelX = THREE.MathUtils.damp(tr.impactVelX, 0, 4.5, dt);
        tr.impactVelZ = THREE.MathUtils.damp(tr.impactVelZ, 0, 4.5, dt);
      }
      const damageRatio = 1 - tr.hp / tr.maxHp;
      if (damageRatio > 0.35) {
        tr.damageSmokeAcc += dt;
        if (tr.damageSmokeAcc > 0.36 - damageRatio * 0.2) {
          tr.damageSmokeAcc = 0;
          this.spawnDebrisBurst(tr.mesh.position.x, 0.85, tr.mesh.position.z, 1);
        }
      }

      let targetSpeed = tr.baseSpeed * (damageRatio > 0.5 ? 0.68 : 1.0);
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
          if (other === tr || other.wrecked || other.axis !== 'Z') continue;
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
                if (other === tr || other.wrecked || other.axis !== 'Z') continue;
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

        // Natural, Gentle Evasive Vehicle AI ("আস্তে করে এড়িয়ে যাওয়ার চেষ্টা করবে") along Z
        if (tr.avoidTimer > 0) tr.avoidTimer = Math.max(0, tr.avoidTimer - dt);
        let yieldFactor = 1.0;
        let emergencyYieldStop = false;

        const relX = rx - tr.mesh.position.x;
        const relZ = rz - tr.mesh.position.z;
        const distPlayerSq = relX * relX + relZ * relZ;

        // Only evaluate steering/yielding when moving & player is ahead within ~25m
        if (checkCollision && !shouldStop && tr.currentSpeed > 1.2 && distPlayerSq < 676) {
          const alongZ = relZ * tr.direction;
          const trVz = tr.direction * tr.currentSpeed;
          const relVx = playerVx;
          const relVz = playerVz - trVz;
          const relSpeedSq = relVx * relVx + relVz * relVz;
          const tca =
            relSpeedSq > 0.8
              ? Math.max(0, Math.min(1.5, -(relX * relVx + relZ * relVz) / relSpeedSq))
              : 0;
          const projX = relX + relVx * tca;
          const projZ = relZ + relVz * tca;
          const closestSq = projX * projX + projZ * projZ;

          const directAhead = alongZ > 1.5 && alongZ < 24.0 && Math.abs(relX) < 2.85;
          const closingTrajectory =
            alongZ > 0.5 && tca > 0.08 && closestSq < 7.8 && relSpeedSq > 4.5 && playerSpeedAbs > 1.5;

          if (directAhead || closingTrajectory) {
            // Pick one steady, subtle nudge inside this vehicle's own road half (never crossing center median)
            if (tr.avoidTimer <= 0) {
              const halfMin = tr.direction === -1 ? -5.15 : 1.65;
              const halfMax = tr.direction === -1 ? -1.65 : 5.15;
              const awayDir = projX >= 0 ? -1 : 1;
              const candA = THREE.MathUtils.clamp(tr.baseLaneOffset + awayDir * 1.65, halfMin, halfMax);
              const candB = THREE.MathUtils.clamp(tr.baseLaneOffset + awayDir * 0.95, halfMin, halfMax);
              const candC = THREE.MathUtils.clamp(tr.baseLaneOffset - awayDir * 1.15, halfMin, halfMax);
              const nudgeCandidates = [candA, candB, candC];

              let chosenLane = tr.targetLaneOffset;
              let bestScore = -Infinity;
              for (const cand of nudgeCandidates) {
                if (Math.abs(cand - tr.baseLaneOffset) < 0.35) continue;
                let occupied = false;
                for (const other of this.traffic) {
                  if (other === tr || other.wrecked || other.axis !== 'Z') continue;
                  if (
                    Math.abs(other.aveBase - tr.aveBase) < 10 &&
                    other.direction === tr.direction &&
                    Math.abs(other.laneOffset - cand) < 1.35 &&
                    Math.abs(other.mesh.position.z - tr.mesh.position.z) < tr.halfLen + other.halfLen + 3.2
                  ) {
                    occupied = true;
                    break;
                  }
                }
                if (!occupied) {
                  const clearance = Math.abs(tr.aveBase + cand - (rx + playerVx * tca * 0.5));
                  if (clearance > bestScore) {
                    bestScore = clearance;
                    chosenLane = cand;
                  }
                }
              }

              if (bestScore > 0.9) {
                tr.targetLaneOffset = chosenLane;
                tr.avoidTimer = 1.6;
              }
            }

            // Modulate speed subtly: slow gently while shifting aside, brake firmer only if very close dead ahead
            if (alongZ > 0 && alongZ < 5.5 && Math.abs(relX) < 1.85) {
              emergencyYieldStop = true;
            } else if (alongZ > 0 && alongZ < 10.5 && Math.abs(relX) < 2.15) {
              yieldFactor = 0.45;
            } else if (alongZ > 0 && alongZ < 22.0 && Math.abs(relX) < 2.65) {
              yieldFactor = 0.76;
            }

            if (distPlayerSq < 400 && distPlayerSq > 20 && tr.hornCooldown <= 0) {
              if (tr.isTruck) soundEngine.playTruckAirHorn();
              else if (tr.vehicleType === 'rickshaw') soundEngine.playBell();
              else soundEngine.playTrafficHorn(tr.isBus);
              tr.hornCooldown = 3.2 + Math.random() * 2.5;
            }
          }
        }

        // Gently return toward preferred home lane once well clear
        if (tr.avoidTimer <= 0 && Math.abs(tr.targetLaneOffset - tr.baseLaneOffset) > 0.3) {
          let homeBlocked = false;
          for (const other of this.traffic) {
            if (other === tr || other.wrecked || other.axis !== 'Z') continue;
            if (
              Math.abs(other.aveBase - tr.aveBase) < 10 &&
              other.direction === tr.direction &&
              Math.abs(other.laneOffset - tr.baseLaneOffset) < 1.35 &&
              Math.abs(other.mesh.position.z - tr.mesh.position.z) < tr.halfLen + other.halfLen + 4.0
            ) {
              homeBlocked = true;
              break;
            }
          }
          if (!homeBlocked && (!checkCollision || distPlayerSq > 260)) {
            tr.targetLaneOffset = tr.baseLaneOffset;
          }
        }

        shouldStop = shouldStop || (blockedAhead && leadingGap < 2.2) || emergencyYieldStop;
        tr.stoppedAtLight = shouldStop;
        targetSpeed = shouldStop
          ? 0
          : blockedAhead
          ? Math.min(targetSpeed * 0.65, 5.0) * yieldFactor
          : Math.max(2.6, (targetSpeed + Math.sin(tr.swayPhase) * 0.6) * yieldFactor);

        const brakeRate = emergencyYieldStop ? 13.5 : yieldFactor < 1.0 ? 8.5 : 14.0;
        if (tr.currentSpeed > targetSpeed) {
          tr.currentSpeed = Math.max(targetSpeed, tr.currentSpeed - brakeRate * dt);
        } else if (tr.currentSpeed < targetSpeed) {
          tr.currentSpeed = Math.min(targetSpeed, tr.currentSpeed + 5.5 * dt);
        }

        const laneDamp = tr.avoidTimer > 0 ? 2.1 : 1.75;
        tr.laneOffset = THREE.MathUtils.damp(tr.laneOffset, tr.targetLaneOffset, laneDamp, dt);
        tr.mesh.position.x = THREE.MathUtils.damp(tr.mesh.position.x, tr.aveBase + tr.laneOffset, 3.6, dt);
        tr.mesh.position.z += tr.direction * tr.currentSpeed * dt;
        const deltaLane = tr.targetLaneOffset - tr.laneOffset;
        tr.tiltRoll = THREE.MathUtils.damp(
          tr.tiltRoll,
          damageRatio * 0.16 * (tr.direction === -1 ? 1 : -1),
          4.0,
          dt
        );
        tr.tiltPitch = THREE.MathUtils.damp(tr.tiltPitch, 0, 4.0, dt);
        tr.mesh.rotation.z = tr.tiltRoll;
        tr.mesh.rotation.x = tr.tiltPitch;
        tr.mesh.rotation.y =
          tr.direction === -1 ? deltaLane * 0.08 : Math.PI - deltaLane * 0.08;

        // Migrate onto nearest N-S avenue when outside extended 5x5 horizon (>145m or ±185m longitudinal)
        const dzPlayer = tr.mesh.position.z - rz;
        const d2d = Math.hypot(tr.mesh.position.x - rx, dzPlayer);
        if (Math.abs(tr.aveBase - nearestAveX) > 10 && d2d > 145) {
          tr.aveBase = nearestAveX;
          tr.laneOffset = tr.baseLaneOffset;
          tr.targetLaneOffset = tr.baseLaneOffset;
          tr.mesh.position.x = tr.aveBase + tr.laneOffset;
          tr.mesh.position.z = rz + (tr.direction === -1 ? 165 : -165);
          tr.nearMissAwarded = false;
        } else if (dzPlayer > 185) {
          tr.aveBase = nearestAveX;
          tr.laneOffset = tr.baseLaneOffset;
          tr.targetLaneOffset = tr.baseLaneOffset;
          tr.mesh.position.x = tr.aveBase + tr.laneOffset;
          tr.mesh.position.z = rz - 175 - Math.random() * 25;
          tr.nearMissAwarded = false;
        } else if (dzPlayer < -185) {
          tr.aveBase = nearestAveX;
          tr.laneOffset = tr.baseLaneOffset;
          tr.targetLaneOffset = tr.baseLaneOffset;
          tr.mesh.position.x = tr.aveBase + tr.laneOffset;
          tr.mesh.position.z = rz + 175 + Math.random() * 25;
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
          if (other === tr || other.wrecked || other.axis !== 'X') continue;
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
                if (other === tr || other.wrecked || other.axis !== 'X') continue;
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

        // Natural, Gentle Evasive Vehicle AI ("আস্তে করে এড়িয়ে যাওয়ার চেষ্টা করবে") along X
        if (tr.avoidTimer > 0) tr.avoidTimer = Math.max(0, tr.avoidTimer - dt);
        let yieldFactor = 1.0;
        let emergencyYieldStop = false;

        const relX = rx - tr.mesh.position.x;
        const relZ = rz - tr.mesh.position.z;
        const distPlayerSq = relX * relX + relZ * relZ;

        if (checkCollision && !shouldStop && tr.currentSpeed > 1.2 && distPlayerSq < 676) {
          const alongX = relX * tr.direction;
          const trVx = tr.direction * tr.currentSpeed;
          const relVx = playerVx - trVx;
          const relVz = playerVz;
          const relSpeedSq = relVx * relVx + relVz * relVz;
          const tca =
            relSpeedSq > 0.8
              ? Math.max(0, Math.min(1.5, -(relX * relVx + relZ * relVz) / relSpeedSq))
              : 0;
          const projX = relX + relVx * tca;
          const projZ = relZ + relVz * tca;
          const closestSq = projX * projX + projZ * projZ;

          const directAhead = alongX > 1.5 && alongX < 24.0 && Math.abs(relZ) < 2.85;
          const closingTrajectory =
            alongX > 0.5 && tca > 0.08 && closestSq < 7.8 && relSpeedSq > 4.5 && playerSpeedAbs > 1.5;

          if (directAhead || closingTrajectory) {
            if (tr.avoidTimer <= 0) {
              const halfMin = tr.direction === 1 ? -5.15 : 1.65;
              const halfMax = tr.direction === 1 ? -1.65 : 5.15;
              const awayDir = projZ >= 0 ? -1 : 1;
              const candA = THREE.MathUtils.clamp(tr.baseLaneOffset + awayDir * 1.65, halfMin, halfMax);
              const candB = THREE.MathUtils.clamp(tr.baseLaneOffset + awayDir * 0.95, halfMin, halfMax);
              const candC = THREE.MathUtils.clamp(tr.baseLaneOffset - awayDir * 1.15, halfMin, halfMax);
              const nudgeCandidates = [candA, candB, candC];

              let chosenLane = tr.targetLaneOffset;
              let bestScore = -Infinity;
              for (const cand of nudgeCandidates) {
                if (Math.abs(cand - tr.baseLaneOffset) < 0.35) continue;
                let occupied = false;
                for (const other of this.traffic) {
                  if (other === tr || other.wrecked || other.axis !== 'X') continue;
                  if (
                    Math.abs(other.aveBase - tr.aveBase) < 10 &&
                    other.direction === tr.direction &&
                    Math.abs(other.laneOffset - cand) < 1.35 &&
                    Math.abs(other.mesh.position.x - tr.mesh.position.x) < tr.halfLen + other.halfLen + 3.2
                  ) {
                    occupied = true;
                    break;
                  }
                }
                if (!occupied) {
                  const clearance = Math.abs(tr.aveBase + cand - (rz + playerVz * tca * 0.5));
                  if (clearance > bestScore) {
                    bestScore = clearance;
                    chosenLane = cand;
                  }
                }
              }

              if (bestScore > 0.9) {
                tr.targetLaneOffset = chosenLane;
                tr.avoidTimer = 1.6;
              }
            }

            if (alongX > 0 && alongX < 5.5 && Math.abs(relZ) < 1.85) {
              emergencyYieldStop = true;
            } else if (alongX > 0 && alongX < 10.5 && Math.abs(relZ) < 2.15) {
              yieldFactor = 0.45;
            } else if (alongX > 0 && alongX < 22.0 && Math.abs(relZ) < 2.65) {
              yieldFactor = 0.76;
            }

            if (distPlayerSq < 400 && distPlayerSq > 20 && tr.hornCooldown <= 0) {
              if (tr.isTruck) soundEngine.playTruckAirHorn();
              else if (tr.vehicleType === 'rickshaw') soundEngine.playBell();
              else soundEngine.playTrafficHorn(tr.isBus);
              tr.hornCooldown = 3.2 + Math.random() * 2.5;
            }
          }
        }

        if (tr.avoidTimer <= 0 && Math.abs(tr.targetLaneOffset - tr.baseLaneOffset) > 0.3) {
          let homeBlocked = false;
          for (const other of this.traffic) {
            if (other === tr || other.wrecked || other.axis !== 'X') continue;
            if (
              Math.abs(other.aveBase - tr.aveBase) < 10 &&
              other.direction === tr.direction &&
              Math.abs(other.laneOffset - tr.baseLaneOffset) < 1.35 &&
              Math.abs(other.mesh.position.x - tr.mesh.position.x) < tr.halfLen + other.halfLen + 4.0
            ) {
              homeBlocked = true;
              break;
            }
          }
          if (!homeBlocked && (!checkCollision || distPlayerSq > 260)) {
            tr.targetLaneOffset = tr.baseLaneOffset;
          }
        }

        shouldStop = shouldStop || (blockedAhead && leadingGap < 2.2) || emergencyYieldStop;
        tr.stoppedAtLight = shouldStop;
        targetSpeed = shouldStop
          ? 0
          : blockedAhead
          ? Math.min(targetSpeed * 0.65, 5.0) * yieldFactor
          : Math.max(2.6, (targetSpeed + Math.sin(tr.swayPhase) * 0.6) * yieldFactor);

        const brakeRate = emergencyYieldStop ? 13.5 : yieldFactor < 1.0 ? 8.5 : 14.0;
        if (tr.currentSpeed > targetSpeed) {
          tr.currentSpeed = Math.max(targetSpeed, tr.currentSpeed - brakeRate * dt);
        } else if (tr.currentSpeed < targetSpeed) {
          tr.currentSpeed = Math.min(targetSpeed, tr.currentSpeed + 5.5 * dt);
        }

        const laneDamp = tr.avoidTimer > 0 ? 2.1 : 1.75;
        tr.laneOffset = THREE.MathUtils.damp(tr.laneOffset, tr.targetLaneOffset, laneDamp, dt);
        tr.mesh.position.z = THREE.MathUtils.damp(tr.mesh.position.z, tr.aveBase + tr.laneOffset, 3.6, dt);
        tr.mesh.position.x += tr.direction * tr.currentSpeed * dt;
        const deltaLane = tr.targetLaneOffset - tr.laneOffset;
        tr.tiltRoll = THREE.MathUtils.damp(
          tr.tiltRoll,
          damageRatio * 0.16 * tr.direction,
          4.0,
          dt
        );
        tr.tiltPitch = THREE.MathUtils.damp(tr.tiltPitch, 0, 4.0, dt);
        tr.mesh.rotation.z = tr.tiltRoll;
        tr.mesh.rotation.x = tr.tiltPitch;
        tr.mesh.rotation.y =
          tr.direction === 1 ? -Math.PI / 2 - deltaLane * 0.08 : Math.PI / 2 + deltaLane * 0.08;

        // Migrate onto nearest E-W avenue when outside extended 5x5 horizon (>145m or ±185m longitudinal)
        const dxPlayer = tr.mesh.position.x - rx;
        const d2d = Math.hypot(dxPlayer, tr.mesh.position.z - rz);
        if (Math.abs(tr.aveBase - nearestAveZ) > 10 && d2d > 145) {
          tr.aveBase = nearestAveZ;
          tr.laneOffset = tr.baseLaneOffset;
          tr.targetLaneOffset = tr.baseLaneOffset;
          tr.mesh.position.z = tr.aveBase + tr.laneOffset;
          tr.mesh.position.x = rx + (tr.direction === 1 ? -165 : 165);
          tr.nearMissAwarded = false;
        } else if (dxPlayer > 185) {
          tr.aveBase = nearestAveZ;
          tr.laneOffset = tr.baseLaneOffset;
          tr.targetLaneOffset = tr.baseLaneOffset;
          tr.mesh.position.z = tr.aveBase + tr.laneOffset;
          tr.mesh.position.x = rx - 175 - Math.random() * 25;
          tr.nearMissAwarded = false;
        } else if (dxPlayer < -185) {
          tr.aveBase = nearestAveZ;
          tr.laneOffset = tr.baseLaneOffset;
          tr.targetLaneOffset = tr.baseLaneOffset;
          tr.mesh.position.z = tr.aveBase + tr.laneOffset;
          tr.mesh.position.x = rx + 175 + Math.random() * 25;
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
        : tr.vehicleType === 'car'
        ? 3.3
        : tr.vehicleType === 'cng'
        ? 3.0
        : tr.vehicleType === 'motorcycle'
        ? 2.05
        : 2.3;
      const distSq = dx * dx + dz * dz;

      if (distSq < hitRadius && tr.hitCooldown <= 0) {
        tr.hitCooldown = 0.65;
        const distInv = 1 / Math.max(Math.sqrt(distSq), 0.35);
        const nx = dx * distInv;
        const nz = dz * distInv;

        const vName = tr.isTruck
          ? 'হেভি ট্রাক'
          : tr.isBus
          ? 'যাত্রীবাহী বাস'
          : tr.vehicleType === 'car'
          ? 'প্রাইভেট কার'
          : tr.vehicleType === 'leguna'
          ? 'লেগুনা'
          : tr.vehicleType === 'cng'
          ? 'সিএনজি'
          : tr.vehicleType === 'motorcycle'
          ? 'মোটরসাইকেল'
          : 'রিকশা';

        // Relative velocity kinetic damage calculation & mass-weighted vehicle physics
        const playerVx = -Math.sin(this.yaw) * this.speed;
        const playerVz = -Math.cos(this.yaw) * this.speed;
        const vehVx = tr.axis === 'X' ? tr.direction * tr.currentSpeed : 0;
        const vehVz = tr.axis === 'Z' ? tr.direction * tr.currentSpeed : 0;
        const relImpactSpeed = Math.hypot(playerVx - vehVx, playerVz - vehVz);

        const vehicleDealtDamage = Math.round(
          (this.turboTimer > 0 ? 95 : 18) + relImpactSpeed * (this.turboTimer > 0 ? 3.5 : 2.3)
        );
        tr.hp = Math.max(0, tr.hp - vehicleDealtDamage);

        // Apply mass-weighted physical knock & spin impulse to the struck vehicle
        const playerMass = this.turboTimer > 0 ? 4.2 : 1.5;
        const pushRatio = playerMass / (playerMass + tr.mass);
        const targetImpulse = Math.max(4.5, relImpactSpeed * 0.72) * pushRatio;
        tr.impactVelX += -nx * targetImpulse;
        tr.impactVelZ += -nz * targetImpulse;
        tr.tiltRoll = (nx > 0 ? -1 : 1) * (0.25 + pushRatio * 0.25);
        tr.tiltPitch = (nz > 0 ? 1 : -1) * 0.16;

        // Trigger Accident Camera Choreography pointing toward impact point
        this.accidentCamFocal.set(tr.mesh.position.x, 1.1, tr.mesh.position.z);
        this.accidentRollTarget = (nx * Math.cos(this.yaw) - nz * Math.sin(this.yaw)) * 0.085;
        this.accidentCamTimer = tr.hp <= 0 ? 1.65 : 0.95;

        this.cameraShake = Math.max(
          this.cameraShake,
          tr.hp <= 0 ? 0.85 : tr.isTruck ? 0.7 : tr.isBus ? 0.55 : 0.38
        );
        soundEngine.playHit();

        if (tr.hp <= 0) {
          // Vehicle Destroyed / Wrecked!
          tr.wrecked = true;
          tr.wreckTimer = 4.2;
          tr.currentSpeed = 0;
          tr.impactVelX = -nx * (11 + pushRatio * 8);
          tr.impactVelZ = -nz * (11 + pushRatio * 8);
          tr.spinVel = (Math.random() > 0.5 ? 1 : -1) * (4.5 + pushRatio * 5.0);
          tr.tiltRoll = (nx > 0 ? -1 : 1) * 0.62;
          tr.tiltPitch = 0.28;

          this.spawnDebrisBurst(tr.mesh.position.x, 1.0, tr.mesh.position.z, 26);

          const wreckReward = tr.isTruck
            ? 22000
            : tr.isBus
            ? 16000
            : tr.vehicleType === 'car'
            ? 12000
            : tr.vehicleType === 'leguna'
            ? 10000
            : tr.vehicleType === 'cng'
            ? 8000
            : tr.vehicleType === 'motorcycle'
            ? 6500
            : 5000;
          this.addMoney(wreckReward);
          this.emitPopup(
            `💥 ${vName} ভেঙে চুরমার! +৳${wreckReward.toLocaleString('en-IN')}`,
            'ভয়াবহ অ্যাক্সিডেন্ট! রাস্তায় জট লেগেছে!',
            'turbo'
          );
          soundEngine.playSmash(3);
          this.triggerBreakingNews(
            'ACCIDENT',
            `ভয়াবহ সড়ক দুর্ঘটনা: ${vName} দুমড়েমুচড়ে ভেঙে চুরমার!`,
            `নিউ মার্কেট — সায়েন্স ল্যাব সড়কে বেপরোয়া রিকশার ধাক্কায় ${vName} বিধ্বস্ত · এলাকায় তীব্র যানজট`,
            true
          );
        } else {
          // Damaged but intact (shows live vehicle HP!)
          this.spawnDebrisBurst(
            (rx + tr.mesh.position.x) * 0.5,
            0.9,
            (rz + tr.mesh.position.z) * 0.5,
            tr.isTruck ? 14 : tr.isBus ? 11 : 8
          );
        }

        if (this.turboTimer > 0) {
          if (tr.hp > 0) {
            const reward = tr.isTruck
              ? 12000
              : tr.isBus
              ? 8000
              : tr.vehicleType === 'car'
              ? 6500
              : tr.vehicleType === 'leguna'
              ? 6000
              : tr.vehicleType === 'cng'
              ? 5000
              : tr.vehicleType === 'motorcycle'
              ? 4000
              : 3500;
            this.addMoney(reward);
            this.emitPopup(
              `টার্বো ধাক্কা! +৳${reward.toLocaleString('en-IN')}`,
              `${vName} ক্ষতিগ্রস্ত (${tr.hp}/${tr.maxHp} HP)`,
              'turbo'
            );
          }
        } else {
          // Momentum-conserving 2D impact deflection + suspension jolt
          const knock = Math.min(2.1, 0.9 + (tr.mass / playerMass) * 0.35);

          this.rickshaw.root.position.x += nx * knock;
          this.rickshaw.root.position.z += nz * knock;

          // Project outward impulse onto rickshaw's forward and lateral axes
          const sinY = Math.sin(this.yaw);
          const cosY = Math.cos(this.yaw);
          const impactMag = Math.max(5.0, Math.abs(this.speed) * 0.42 + 2.8) * Math.min(1.4, tr.mass / 2.2);
          const fwdBounce = -sinY * nx - cosY * nz;
          const latBounce = cosY * nx - sinY * nz;

          this.speed = THREE.MathUtils.clamp(
            this.speed * 0.32 + fwdBounce * impactMag,
            -9.0,
            10.0
          );
          this.lateralVel += latBounce * impactMag * 0.85;
          this.angularVel += latBounce * 2.2;
          this.bounceVel += tr.isTruck ? 3.4 : 2.5;

          const dmg = tr.isTruck
            ? 24
            : tr.isBus
            ? 18
            : tr.vehicleType === 'car'
            ? 15
            : tr.vehicleType === 'leguna'
            ? 14
            : tr.vehicleType === 'cng'
            ? 12
            : tr.vehicleType === 'motorcycle'
            ? 8
            : 7;
          this.applyDamage(dmg);
          soundEngine.playCrashVoice();
          if (tr.hp > 0) {
            this.emitPopup(
              `${vName} সংঘর্ষ! -${dmg} হেলথ`,
              `${vName} হেলথ: ${tr.hp}/${tr.maxHp} · দেখে চালান ওস্তাদ!`,
              'warning'
            );
            this.triggerBreakingNews(
              'ACCIDENT',
              `সড়ক দুর্ঘটনা: ${vName}-এর সাথে মুখোমুখি সংঘর্ষ!`,
              `ধাক্কায় ${vName}-এর ব্যাপক ক্ষয়ক্ষতি (${tr.hp}/${tr.maxHp} HP বাকি) · সতর্ক থাকুন`,
              false
            );
          }
        }
      } else if (
        !tr.nearMissAwarded &&
        distSq >= hitRadius &&
        distSq <
          (tr.isTruck
            ? 11.0
            : tr.isBus
            ? 9.5
            : tr.vehicleType === 'car'
            ? 8.2
            : tr.vehicleType === 'cng'
            ? 7.5
            : tr.vehicleType === 'motorcycle'
            ? 6.4
            : 6.0) &&
        Math.abs(this.speed) > 12
      ) {
        tr.nearMissAwarded = true;
        const reward = tr.isTruck
          ? 4500
          : tr.isBus
          ? 3500
          : tr.vehicleType === 'car'
          ? 2800
          : tr.vehicleType === 'cng'
          ? 2500
          : tr.vehicleType === 'motorcycle'
          ? 2100
          : 1800;
        this.addMoney(reward);
        this.emitPopup(`নিয়ার মিস! +৳${reward.toLocaleString('en-IN')}`, 'একটুর জন্য বাঁচলেন!', 'cash');
      }
    }
  }

  private updatePedestrians(dt: number, elapsed: number, checkCollision: boolean): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const nearestAveX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const nearestAveZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;

    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      const ped = p.rig;

      if (p.hitCooldown > 0) {
        p.hitCooldown = Math.max(0, p.hitCooldown - dt);
      }

      // Knocked-down physics: tumble into air, splat flat onto ground ("রাস্তায় পড়ে যাওয়া"), then recover!
      if (p.fallenTimer > 0) {
        p.fallenTimer -= dt;
        ped.root.position.x += p.knockVelX * dt;
        ped.root.position.z += p.knockVelZ * dt;
        p.knockVelX = THREE.MathUtils.damp(p.knockVelX, 0, 4.2, dt);
        p.knockVelZ = THREE.MathUtils.damp(p.knockVelZ, 0, 4.2, dt);

        p.knockVelY -= 22 * dt;
        p.posY += p.knockVelY * dt;
        const floorY =
          Math.abs(wrapCellLocal(ped.root.position.x)) > 8.2 &&
          Math.abs(wrapCellLocal(ped.root.position.z)) > 8.2
            ? 0.26
            : 0.16;
        if (p.posY <= floorY) {
          p.posY = floorY;
          if (p.knockVelY < -2.2) {
            p.knockVelY = -p.knockVelY * 0.28;
          } else {
            p.knockVelY = 0;
          }
        }
        ped.root.position.y = p.posY;

        p.fallYaw += p.knockSpin * dt;
        p.knockSpin = THREE.MathUtils.damp(p.knockSpin, 0, 5.5, dt);
        p.fallTiltX = THREE.MathUtils.damp(p.fallTiltX, Math.PI / 2, 12, dt);
        ped.root.rotation.order = 'YXZ';
        ped.root.rotation.set(p.fallTiltX, p.fallYaw, 0);

        // Splayed limbs while knocked flat on road
        ped.legL.rotation.x = 0.25;
        ped.legR.rotation.x = -0.25;
        ped.armL.rotation.x = -0.9;
        ped.armR.rotation.x = 0.8;

        if (p.fallenTimer <= 0) {
          ped.root.rotation.set(0, p.fallYaw, 0);
          ped.root.position.y = p.baseY;
          p.posY = p.baseY;
          p.fallTiltX = 0;
          p.aiState = 'WALK_SIDEWALK';
          p.stateTimer = 0;
          p.decisionCooldown = 1.5;
        }
        continue;
      }

      // Smoothly stand back up after getting knocked down
      if (p.fallTiltX > 0.01) {
        p.fallTiltX = THREE.MathUtils.damp(p.fallTiltX, 0, 10, dt);
        ped.root.rotation.x = p.fallTiltX;
      } else {
        ped.root.rotation.x = 0;
      }

      const dx = ped.root.position.x - rx;
      const dz = ped.root.position.z - rz;
      const distSq = dx * dx + dz * dz;
      const laneLateral = p.laneLateral;
      let moveRate = ped.walkingSpeed;
      let isMoving = true;

      if (p.isCrosser) {
        // Intersection Zebra Crossing commuters + shockwave reaction
        if (p.aiState === 'PANIC_SCATTER') {
          p.stateTimer -= dt;
          moveRate = 3.8;
          ped.root.position.x += p.scatterX * moveRate * dt;
          ped.root.position.z += p.scatterZ * moveRate * dt;
          p.targetYaw = Math.atan2(-p.scatterX, -p.scatterZ);
          if (p.stateTimer <= 0) p.aiState = 'WALK_SIDEWALK';
        } else if (p.axis === 'X') {
          ped.root.position.x += ped.direction * ped.walkingSpeed * dt;
          const localX = ped.root.position.x - p.aveBase;
          if (localX > 9.4) ped.direction = -1;
          else if (localX < -9.4) ped.direction = 1;
          p.targetYaw = ped.direction === 1 ? -Math.PI / 2 : Math.PI / 2;

          if (Math.hypot(ped.root.position.x - rx, ped.root.position.z - rz) > 175) {
            p.aveBase = nearestAveX;
            const zCross = nearestAveZ + p.side * 9.5;
            ped.root.position.set(p.aveBase + ((i % 5) - 2) * 3.0, 0.02, zCross);
          }
        } else {
          ped.root.position.z += ped.direction * ped.walkingSpeed * dt;
          const localZ = ped.root.position.z - p.aveBase;
          if (localZ > 9.4) ped.direction = -1;
          else if (localZ < -9.4) ped.direction = 1;
          p.targetYaw = ped.direction === 1 ? Math.PI : 0;

          if (Math.hypot(ped.root.position.x - rx, ped.root.position.z - rz) > 175) {
            p.aveBase = nearestAveZ;
            const xCross = nearestAveX + p.side * 9.5;
            ped.root.position.set(xCross, 0.02, p.aveBase + ((i % 5) - 2) * 3.0);
          }
        }
      } else {
        // Rich Multi-State Dhaka NPC AI (Smooth Footpath Walk, Stall Chat, Rickshaw Hail, Phone Idle, Median-Check Jaywalk, Scatter)
        p.decisionCooldown -= dt;

        // Hazard detection while jaywalking across active asphalt
        if (
          p.aiState === 'JAYWALK' &&
          distSq < 68 &&
          Math.abs(this.speed) > 6.5 &&
          Math.abs(p.jaywalkLatPos) < 7.8
        ) {
          const inv = 1 / Math.max(Math.sqrt(distSq), 0.25);
          p.aiState = 'PANIC_SCATTER';
          p.stateTimer = 1.35;
          p.medianWaitTimer = 0;
          p.scatterX = dx * inv;
          p.scatterZ = dz * inv;
        }

        if (p.aiState === 'WALK_SIDEWALK') {
          if (p.decisionCooldown <= 0 && distSq < 6400) {
            p.decisionCooldown = 2.8 + ((i * 3 + Math.floor(elapsed)) % 5) * 0.75;
            const alongVal = p.axis === 'Z' ? ped.root.position.z : ped.root.position.x;
            const localAlong = Math.abs(wrapCellLocal(alongVal));
            const roll = ((i * 19 + Math.floor(elapsed * 7)) % 100) / 100;

            // Mid-block away from intersections & center median planters -> JAYWALK across road!
            if (localAlong > 14.5 && localAlong < 44.0 && roll < 0.32) {
              p.aiState = 'JAYWALK';
              p.jaywalkLatPos = p.side * laneLateral;
              p.jaywalkTargetLat = -p.side * laneLateral;
              p.medianWaitTimer = 0;
              p.jaywalkDistracted =
                (ped.archetype === 'smart' || ped.archetype === 'city_style') && roll < 0.16;
              p.jaywalkSpeed = p.jaywalkDistracted ? 1.95 : 2.65 + (i % 3) * 0.3;
              p.stateTimer = 8.5;
            } else if (distSq < 280 && Math.abs(this.speed) < 11.5 && roll < 0.58) {
              p.aiState = 'WAVE_RICKSHAW';
              p.stateTimer = 2.2 + (i % 3) * 0.45;
            } else if (
              (ped.archetype === 'smart' || ped.archetype === 'city_style') &&
              roll < 0.76
            ) {
              p.aiState = 'PHONE_IDLE';
              p.stateTimer = 2.1 + (i % 4) * 0.45;
            } else if (roll < 0.90) {
              p.aiState = 'STOP_STALL_CHAT';
              p.stateTimer = 2.2 + (i % 3) * 0.55;
            }
          }

          if (p.axis === 'Z') {
            ped.root.position.z += ped.direction * ped.walkingSpeed * dt;
            ped.root.position.x = THREE.MathUtils.damp(
              ped.root.position.x,
              p.aveBase + p.side * laneLateral,
              6.5,
              dt
            );
            p.targetYaw = ped.direction === 1 ? Math.PI : 0;
            if (
              Math.abs(ped.root.position.z - rz) > 178 ||
              Math.abs(p.aveBase - nearestAveX) > 110
            ) {
              p.aveBase = nearestAveX;
              ped.root.position.x = p.aveBase + p.side * laneLateral;
              ped.root.position.z = rz + (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 45);
            }
          } else {
            ped.root.position.x += ped.direction * ped.walkingSpeed * dt;
            ped.root.position.z = THREE.MathUtils.damp(
              ped.root.position.z,
              p.aveBase + p.side * laneLateral,
              6.5,
              dt
            );
            p.targetYaw = ped.direction === 1 ? -Math.PI / 2 : Math.PI / 2;
            if (
              Math.abs(ped.root.position.x - rx) > 178 ||
              Math.abs(p.aveBase - nearestAveZ) > 110
            ) {
              p.aveBase = nearestAveZ;
              ped.root.position.z = p.aveBase + p.side * laneLateral;
              ped.root.position.x = rx + (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 45);
            }
          }
        } else if (p.aiState === 'JAYWALK') {
          p.stateTimer -= dt;
          const prevLat = p.jaywalkLatPos;
          const stepDir = Math.sign(p.jaywalkTargetLat - p.jaywalkLatPos) || -p.side;

          // Realistic Dhaka center-median pause ("মধ্য রাস্তায় দাঁড়িয়ে গাড়ি দেখা")
          if (p.medianWaitTimer > 0) {
            p.medianWaitTimer -= dt;
            isMoving = false;
          } else {
            p.jaywalkLatPos += stepDir * p.jaywalkSpeed * dt;
            // Just reached center median? Pause briefly if approaching traffic or player is close!
            if (Math.sign(prevLat) !== Math.sign(p.jaywalkLatPos) && !p.jaywalkDistracted && distSq < 900) {
              p.medianWaitTimer = 0.42;
            }
            const slightDrift = ped.direction * 0.45 * dt;
            if (p.axis === 'Z') {
              ped.root.position.x = p.aveBase + p.jaywalkLatPos;
              ped.root.position.z += slightDrift;
              p.targetYaw = Math.atan2(-(stepDir * p.jaywalkSpeed), -ped.direction * 0.45);
            } else {
              ped.root.position.z = p.aveBase + p.jaywalkLatPos;
              ped.root.position.x += slightDrift;
              p.targetYaw = Math.atan2(-ped.direction * 0.45, -(stepDir * p.jaywalkSpeed));
            }
            moveRate = p.jaywalkSpeed;
          }

          if (
            Math.abs(p.jaywalkLatPos - p.jaywalkTargetLat) < 0.35 ||
            p.stateTimer <= 0
          ) {
            p.side = p.jaywalkTargetLat > 0 ? 1 : -1;
            p.jaywalkTargetLat = -p.side * laneLateral;
            p.aiState = 'WALK_SIDEWALK';
            p.decisionCooldown = 3.2;
          }
        } else if (p.aiState === 'STOP_STALL_CHAT') {
          isMoving = false;
          p.stateTimer -= dt;
          if (p.axis === 'Z') {
            p.targetYaw = Math.atan2(-p.side, 0);
          } else {
            p.targetYaw = Math.atan2(0, -p.side);
          }
          if (p.stateTimer <= 0) {
            p.aiState = 'WALK_SIDEWALK';
          }
        } else if (p.aiState === 'WAVE_RICKSHAW') {
          isMoving = false;
          p.stateTimer -= dt;
          const toPlayerLen = Math.max(Math.sqrt(distSq), 0.1);
          p.targetYaw = Math.atan2(dx / toPlayerLen, dz / toPlayerLen);
          if (p.stateTimer <= 0) {
            p.aiState = 'WALK_SIDEWALK';
          }
        } else if (p.aiState === 'PHONE_IDLE') {
          isMoving = false;
          p.stateTimer -= dt;
          if (p.stateTimer <= 0) {
            p.aiState = 'WALK_SIDEWALK';
          }
        } else if (p.aiState === 'PANIC_SCATTER') {
          p.stateTimer -= dt;
          moveRate = 3.9;
          ped.root.position.x += p.scatterX * moveRate * dt;
          ped.root.position.z += p.scatterZ * moveRate * dt;
          p.targetYaw = Math.atan2(-p.scatterX, -p.scatterZ);
          if (p.stateTimer <= 0) {
            p.aiState = 'WALK_SIDEWALK';
            p.decisionCooldown = 2.8;
            if (p.axis === 'Z') {
              p.aveBase = nearestAveX;
              p.side = ped.root.position.x - p.aveBase >= 0 ? 1 : -1;
            } else {
              p.aveBase = nearestAveZ;
              p.side = ped.root.position.z - p.aveBase >= 0 ? 1 : -1;
            }
          }
        }
      }

      // Soft pairwise crowd separation so nearby walking NPCs weave around each other instead of ghosting
      if (isMoving && distSq < 2500) {
        for (let j = i + 1; j < this.pedestrians.length; j++) {
          const other = this.pedestrians[j];
          if (other.fallenTimer > 0) continue;
          const sx = ped.root.position.x - other.rig.root.position.x;
          const sz = ped.root.position.z - other.rig.root.position.z;
          const sDistSq = sx * sx + sz * sz;
          if (sDistSq < 0.72 && sDistSq > 0.0004) {
            const push = (0.85 - Math.sqrt(sDistSq)) * 1.1 * dt;
            const inv = 1 / Math.sqrt(sDistSq);
            ped.root.position.x += sx * inv * push;
            ped.root.position.z += sz * inv * push;
          }
        }
      }

      // Ground-hugging curb elevation + natural step bob + silky smooth facing turn
      const localX = Math.abs(wrapCellLocal(ped.root.position.x));
      const localZ = Math.abs(wrapCellLocal(ped.root.position.z));
      const groundY = localX > 8.08 && localZ > 8.08 ? 0.26 : 0.02;
      if (isMoving) {
        p.stridePhase += dt * (moveRate * 3.85);
      }
      const walkBob = isMoving ? Math.abs(Math.sin(p.stridePhase)) * 0.032 : 0;
      ped.root.position.y = THREE.MathUtils.damp(ped.root.position.y, groundY + walkBob, 16, dt);

      p.currentYaw = dampAngle(p.currentYaw, p.targetYaw, 9.5, dt);
      ped.root.rotation.y = p.currentYaw;
      ped.root.rotation.z = THREE.MathUtils.damp(
        ped.root.rotation.z,
        isMoving ? Math.sin(p.stridePhase) * 0.026 : 0,
        12,
        dt
      );

      // Pedestrian Knockdown Collision ("মানুষকে ধাক্কা দিলে তারা পড়ে যায়")
      if (
        checkCollision &&
        p.hitCooldown <= 0 &&
        distSq < 1.95 &&
        (Math.abs(this.speed) > 1.5 || Math.abs(this.lateralVel) > 1.5)
      ) {
        const wasJaywalking = p.aiState === 'JAYWALK' || p.aiState === 'PANIC_SCATTER';
        const distInv = 1 / Math.max(Math.sqrt(distSq), 0.25);
        const nx = dx * distInv;
        const nz = dz * distInv;
        const launch = Math.max(5.5, Math.abs(this.speed) * 0.65);

        p.fallenTimer = 4.2;
        p.hitCooldown = 4.8;
        p.knockVelX = nx * launch;
        p.knockVelZ = nz * launch;
        p.knockVelY = 3.6 + Math.min(3.4, Math.abs(this.speed) * 0.2);
        p.knockSpin = (Math.random() > 0.5 ? 1 : -1) * 5.2;
        p.fallYaw = Math.atan2(-nx, -nz);
        p.posY = ped.root.position.y;

        this.speed *= 0.9;
        this.bounceVel += 1.15;
        this.cameraShake = Math.max(this.cameraShake, 0.22);
        this.pedHits++;
        this.spawnDebrisBurst(ped.root.position.x, 0.7, ped.root.position.z, 5);
        soundEngine.playHit();
        soundEngine.playCrashVoice();

        this.emitPopup(
          wasJaywalking
            ? '🚶 হুট করে রাস্তা পার! পথচারী ছিটকে পড়েছে!'
            : '🚶 ধাক্কা! পথচারী রাস্তায় ছিটকে পড়েছে!',
          wasJaywalking
            ? 'জেব্রা ক্রসিং না মেনেই রাস্তায় নেমে পড়েছিল!'
            : 'সাবধানে চালান ওস্তাদ · ফুটপাত ও ক্রসিংয়ে সতর্ক থাকুন',
          'warning'
        );

        if (this.pedHits % 2 === 1 && this.wantedLevel < 5) {
          this.wantedLevel = Math.min(5, this.wantedLevel + 1);
          soundEngine.playWantedUp(this.wantedLevel);
        }

        const driverName = DRIVER_PROFILES[this.selectedDriverId].nameBn;
        this.triggerBreakingNews(
          'ACCIDENT',
          wasJaywalking
            ? 'জেব্রা ক্রসিং ছাড়াই রাস্তা পার হতে গিয়ে রিকশার ধাক্কায় পথচারী আহত!'
            : 'বেপরোয়া রিকশার ধাক্কায় পথচারী রাস্তায় ছিটকে পড়ে আহত!',
          `${driverName}-এর সাথে সংঘর্ষ · রাস্তায় লোকজন জড়ো হচ্ছে`,
          false
        );
        continue;
      }

      // Expressive Smoothly-Damped Limb & Head Animation (zero frame snapping!)
      if (distSq < 3800) {
        let tgtLegL = 0;
        let tgtLegR = 0;
        let tgtArmL = 0;
        let tgtArmR = 0;
        let tgtHeadX = 0;
        let tgtHeadY = 0;

        if (p.aiState === 'PANIC_SCATTER') {
          tgtLegL = Math.sin(p.stridePhase * 1.35) * 0.68;
          tgtLegR = -tgtLegL;
          tgtArmL = -2.25 + Math.sin(elapsed * 16 + ped.phase) * 0.22;
          tgtArmR = -2.25 - Math.sin(elapsed * 16 + ped.phase) * 0.22;
        } else if (p.aiState === 'WAVE_RICKSHAW') {
          tgtArmL = 0.08;
          tgtArmR = -2.35 + Math.sin(elapsed * 10 + ped.phase) * 0.38;
        } else if (p.aiState === 'PHONE_IDLE') {
          tgtArmL = 0.06;
          tgtArmR = -1.25;
          tgtHeadX = 0.28;
        } else if (p.aiState === 'STOP_STALL_CHAT') {
          tgtArmL = -0.35 + Math.sin(elapsed * 4.5 + ped.phase) * 0.2;
          tgtArmR = -0.45 - Math.cos(elapsed * 4.0 + ped.phase) * 0.24;
          tgtHeadX = Math.sin(elapsed * 3.8 + ped.phase) * 0.14;
        } else if (p.medianWaitTimer > 0) {
          // Looking left-right at approaching traffic on center median!
          tgtArmL = -1.25;
          tgtHeadY = Math.sin(elapsed * 7.5 + ped.phase) * 0.55;
        } else if (isMoving) {
          const swingAmp = Math.min(0.56, 0.34 + moveRate * 0.08);
          tgtLegL = Math.sin(p.stridePhase) * swingAmp;
          tgtLegR = -tgtLegL;
          if (p.aiState === 'JAYWALK') {
            if (p.jaywalkDistracted) {
              tgtArmL = -Math.sin(p.stridePhase) * 0.32;
              tgtArmR = -1.24;
              tgtHeadX = 0.26;
            } else {
              tgtArmL = -1.32;
              tgtArmR = Math.sin(p.stridePhase) * 0.42;
            }
          } else {
            tgtArmL = -Math.sin(p.stridePhase) * 0.4;
            tgtArmR = Math.sin(p.stridePhase) * 0.4;
          }
        }

        if (ped.hasHeadBasket) {
          tgtArmL = -2.34;
        }

        const dampRate = 13;
        ped.legL.rotation.x = THREE.MathUtils.damp(ped.legL.rotation.x, tgtLegL, dampRate, dt);
        ped.legR.rotation.x = THREE.MathUtils.damp(ped.legR.rotation.x, tgtLegR, dampRate, dt);
        ped.armL.rotation.x = THREE.MathUtils.damp(ped.armL.rotation.x, tgtArmL, dampRate, dt);
        ped.armR.rotation.x = THREE.MathUtils.damp(ped.armR.rotation.x, tgtArmR, dampRate, dt);
        if (ped.head) {
          ped.head.rotation.x = THREE.MathUtils.damp(ped.head.rotation.x, tgtHeadX, dampRate, dt);
          ped.head.rotation.y = THREE.MathUtils.damp(ped.head.rotation.y, tgtHeadY, dampRate, dt);
        }
      }
    }
  }

  private updateCrows(elapsed: number): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    const anchorX = Math.round(rx / CELL_SIZE) * CELL_SIZE;
    const anchorZ = Math.round(rz / CELL_SIZE) * CELL_SIZE;

    for (let i = 0; i < this.crows.length; i++) {
      const c = this.crows[i];
      const angle = elapsed * c.orbitSpeed + c.phase;
      const cx = anchorX + c.centerX + Math.cos(angle) * c.orbitRadius;
      const cz = anchorZ + c.centerZ + Math.sin(angle) * c.orbitRadius;
      const cy = c.baseY + Math.sin(elapsed * 1.4 + c.phase) * 0.6;

      c.root.position.set(cx, cy, cz);
      const tx = -Math.sin(angle) * c.orbitSpeed;
      const tz = Math.cos(angle) * c.orbitSpeed;
      c.root.rotation.y = Math.atan2(tx, tz);

      const flap = Math.sin(elapsed * 8.8 + c.phase) * 0.42;
      c.wingL.rotation.z = flap;
      c.wingR.rotation.z = -flap;
    }

    for (let i = 0; i < this.kites.length; i++) {
      const k = this.kites[i];
      const swayX = Math.sin(elapsed * 0.95 + k.phase) * 2.2;
      const swayZ = Math.cos(elapsed * 0.75 + k.phase) * 1.8;
      const bobY = Math.sin(elapsed * 1.65 + k.phase) * 0.85;
      k.root.position.set(anchorX + k.centerX + swayX, k.baseY + bobY, anchorZ + k.centerZ + swayZ);
      k.root.rotation.z = Math.sin(elapsed * 1.8 + k.phase) * 0.24;
      k.tail.rotation.z = Math.sin(elapsed * 6.2 + k.phase) * 0.35;
    }
  }

  private updateCrowdMobs(dt: number, elapsed: number): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;
    let nearestDist = Infinity;

    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      const pos = m.rig.root.position;

      // 2D distance recycle around player (never clamped to x = ±8.8!)
      if (Math.hypot(pos.x - rx, pos.z - rz) > 75) {
        const angle = (i / Math.max(1, this.mobs.length)) * Math.PI * 2;
        pos.set(rx + Math.cos(angle) * 28, 0, rz + Math.sin(angle) * 28);
        m.stunTimer = 0;
        m.fallenTimer = 0;
        m.fallTiltX = 0;
        m.posY = 0;
        m.rig.root.rotation.set(0, 0, 0);
      }

      if (m.fallenTimer > 0) {
        m.fallenTimer -= dt;
        pos.x += m.knockVelX * dt;
        pos.z += m.knockVelZ * dt;
        m.knockVelX = THREE.MathUtils.damp(m.knockVelX, 0, 4.5, dt);
        m.knockVelZ = THREE.MathUtils.damp(m.knockVelZ, 0, 4.5, dt);

        m.velY -= 22 * dt;
        m.posY += m.velY * dt;
        if (m.posY <= 0.16) {
          m.posY = 0.16;
          m.velY = m.velY < -2 ? -m.velY * 0.25 : 0;
        }
        pos.y = m.posY;
        m.fallTiltX = THREE.MathUtils.damp(m.fallTiltX, Math.PI / 2, 12, dt);
        m.rig.root.rotation.x = m.fallTiltX;

        if (m.fallenTimer <= 0) {
          m.rig.root.rotation.x = 0;
          m.fallTiltX = 0;
          pos.y = 0;
          m.posY = 0;
        }
        continue;
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
      if (dist < nearestDist) nearestDist = dist;
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

      if (dist < 2.25 && (this.turboTimer > 0 || Math.abs(this.speed) > 6.2)) {
        const launchSpeed = Math.max(10.5, Math.abs(this.speed) * 0.85);
        m.knockVelX = -_v1.x * launchSpeed;
        m.knockVelZ = -_v1.z * launchSpeed;
        m.velY = 3.8;
        m.fallenTimer = 2.3;
        m.stunTimer = 2.3;
        soundEngine.playHit();
        soundEngine.playDipjolVoice();
        this.cameraShake = Math.max(this.cameraShake, 0.18);
      } else if (dist < 1.95 && this.turboTimer <= 0) {
        this.applyDamage(20 * dt);
        this.cameraShake = Math.max(this.cameraShake, 0.14);
      }
    }

    this.closestMobDist = nearestDist;
    const isClosePursuit = this.phase === GamePhase.PLAYING && this.mobs.length > 0 && nearestDist < 19.0;
    if (isClosePursuit && elapsed - this.lastChaseNewsAt > 11.0 && this.newsCooldown <= 0) {
      this.lastChaseNewsAt = elapsed;
      const driverName = DRIVER_PROFILES[this.selectedDriverId].nameBn;
      this.triggerBreakingNews(
        'MOB_CHASE',
        `লাইভ ধাওয়া: ${this.mobs.length} জন ক্ষিপ্ত জনতার পিছু ধাওয়া!`,
        `দ্রুত গতিতে রিকশা টানছেন ${driverName} · যেকোনো মুহূর্তে বড় বিশৃঙ্খলার আশঙ্কা!`,
        false
      );
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
    const rightX = cosY;
    const rightZ = -sinY;

    // 1. Mob Chase Camera Blend (frames angry chasing mob behind & rickshaw weaving ahead)
    const mobThreatTarget =
      this.mobs.length > 0 && this.closestMobDist < 19
        ? THREE.MathUtils.clamp((19 - this.closestMobDist) / 14, 0, 1)
        : 0;
    this.mobChaseCamBlend = THREE.MathUtils.damp(this.mobChaseCamBlend, mobThreatTarget, 3.6, dt);

    // 2. Accident Camera Blend (Dutch-angle low side swing framing collision/wreck focal point)
    const accidentBlend =
      this.accidentCamTimer > 0 ? THREE.MathUtils.clamp(this.accidentCamTimer / 0.65, 0, 1) : 0;

    let desiredRoll = 0;

    if (this.cameraMode === CameraMode.DRIVER) {
      _camDesired.set(rx - sinY * 0.55, ry + 1.88, rz - cosY * 0.55);
      _camLookTarget.set(rx - sinY * 14, ry + 1.35, rz - cosY * 14);
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-18 * dt));
      this.currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-18 * dt));
      desiredRoll = this.accidentRollTarget * accidentBlend * 0.45;
    } else if (this.cameraMode === CameraMode.FRONT) {
      const distFront = 3.4 + this.mobChaseCamBlend * 0.8;
      _camDesired.set(
        rx - sinY * distFront - this.steerAngle * 0.6,
        ry + 1.82 + this.mobChaseCamBlend * 0.3,
        rz - cosY * distFront
      );
      _camLookTarget.set(rx, ry + 1.25, rz);
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-14 * dt));
      this.currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-16 * dt));
      desiredRoll = this.accidentRollTarget * accidentBlend * 0.6;
    } else {
      const baseDist = this.cameraMode === CameraMode.ACTION ? 5.2 : 7.4;
      const baseHeight = this.cameraMode === CameraMode.ACTION ? 2.45 : 3.55;

      // Pursuit Camera dynamically widens, pulls back, and adds subtle shoulder sweep when mobs chase
      const mobSway = Math.sin(this.clock.elapsedTime * 2.1) * 0.85 * this.mobChaseCamBlend;
      const accidentSideOffset = accidentBlend * Math.sign(this.accidentRollTarget || 1) * 2.35;
      const distBack = baseDist + this.mobChaseCamBlend * 1.9 + accidentBlend * 0.9;
      const heightUp = baseHeight + this.mobChaseCamBlend * 0.65 - accidentBlend * 0.65;

      const lateralOff = -this.steerAngle * 1.1 + mobSway + accidentSideOffset;

      _camDesired.set(
        rx + sinY * distBack + rightX * lateralOff,
        ry + Math.max(1.75, heightUp),
        rz + cosY * distBack + rightZ * lateralOff
      );

      // Look between road ahead and either chasing crowd tension or accident focal point
      _camLookTarget.set(
        rx - sinY * (4.5 - this.mobChaseCamBlend * 1.8),
        ry + 1.22,
        rz - cosY * (4.5 - this.mobChaseCamBlend * 1.8)
      );
      if (accidentBlend > 0.02) {
        _camLookTarget.lerp(this.accidentCamFocal, accidentBlend * 0.35);
      }

      const camFollowRate = 9.5 + accidentBlend * 3.5;
      this.camera.position.lerp(_camDesired, 1 - Math.exp(-camFollowRate * dt));
      this.currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-12 * dt));

      desiredRoll =
        this.accidentRollTarget * accidentBlend +
        Math.sin(this.clock.elapsedTime * 3.6) * 0.024 * this.mobChaseCamBlend;
    }

    if (this.cameraShake > 0.005 || (this.mobChaseCamBlend > 0.65 && this.closestMobDist < 7.5)) {
      const tensionShake = this.closestMobDist < 7.5 ? 0.035 * this.mobChaseCamBlend : 0;
      const amp = this.cameraShake + tensionShake;
      this.camera.position.x += (Math.random() - 0.5) * amp;
      this.camera.position.y += (Math.random() - 0.5) * amp * 0.7;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 9, dt);
    } else {
      this.cameraShake = 0;
    }

    const targetFov =
      60 +
      Math.min(Math.abs(this.speed) / 28, 1) * 11 +
      (this.turboTimer > 0 ? 7 : 0) +
      this.mobChaseCamBlend * 5.0 +
      accidentBlend * 6.5;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
      this.camera.updateProjectionMatrix();
    }

    this.camera.lookAt(this.currentLookAt);
    this.currentCamRoll = THREE.MathUtils.damp(this.currentCamRoll, desiredRoll, 9.5, dt);
    if (Math.abs(this.currentCamRoll) > 0.0005) {
      this.camera.rotateZ(this.currentCamRoll);
    }
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
      breakingNews: this.activeNews,
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

    const disposedGeos = new Set<THREE.BufferGeometry>();
    const disposedMats = new Set<THREE.Material>();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry && !disposedGeos.has(mesh.geometry)) {
          disposedGeos.add(mesh.geometry);
          mesh.geometry.dispose();
        }
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if (m && !disposedMats.has(m)) {
              disposedMats.add(m);
              m.dispose();
            }
          });
        } else if (mesh.material && !disposedMats.has(mesh.material)) {
          disposedMats.add(mesh.material);
          mesh.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
