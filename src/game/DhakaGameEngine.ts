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
  TimeOfDay,
} from '../types/game';
import {
  createCngModel,
  createDhakaBusModel,
  createDriverModel,
  createFestiveBuntingGarland,
  createHeritageBuildingModel,
  createMobModel,
  createMosqueModel,
  createMetroViaductSegment,
  createPedestrianModel,
  createPickupModel,
  createRickshawModel,
  createRoadsideBlock,
  createShobjiStallModel,
  createStallModel,
  createTrafficRickshawModel,
  createTrashPileModel,
  DriverRig,
  MobRig,
  PedestrianRig,
  RickshawRig,
} from './models';
import { createProceduralTextures, ProceduralTexturePack } from './textures';

// Module-scope reusable math helpers (Zero GC in animation loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _colorTmp = new THREE.Color();

const SEGMENT_LENGTH = 28;
const NUM_SEGMENTS = 12;
const HALF_SPAN = (SEGMENT_LENGTH * NUM_SEGMENTS) / 2;
const ROAD_HALF_LIMIT = 8.5;
const BELL_COOLDOWN_SEC = 3.8;
const TURBO_DURATION_SEC = 4.5;
const COMBO_WINDOW_SEC = 4.2;
const HIGH_SCORE_STORAGE_KEY = 'dhandabaz_3d_highscore_v3';

interface StallInstance {
  mesh: THREE.Group;
  active: boolean;
  isVeggie: boolean;
  localSide: -1 | 1;
  localZOffset: number;
}

interface RoadSegment {
  group: THREE.Group;
  zCenter: number;
  stalls: StallInstance[];
  lampBulbs: THREE.Mesh[];
}

interface TrafficVehicle {
  mesh: THREE.Group;
  vehicleType: 'bus' | 'cng' | 'rickshaw';
  isBus: boolean;
  laneX: number;
  speed: number;
  direction: -1 | 1;
  nearMissAwarded: boolean;
  hitCooldown: number;
  hornCooldown: number;
}

interface StreetPickup {
  mesh: THREE.Group;
  kind: 'biryani' | 'chai';
  active: boolean;
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

  private segments: RoadSegment[] = [];
  private traffic: TrafficVehicle[] = [];
  private pedestrians: PedestrianRig[] = [];
  private pickups: StreetPickup[] = [];
  private mobs: ActiveMob[] = [];

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
  private timeOfDay: TimeOfDay = TimeOfDay.DUSK;

  private speed = 0;
  private steerAngle = 0;
  private yaw = 0;
  private wheelSpin = 0;
  private menuOrbitAngle = 0.45;
  private cameraShake = 0;
  private currentLookAt = new THREE.Vector3(0, 1.4, 0);

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
    this.applyTimeOfDay(TimeOfDay.DUSK);
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
    this.scene.background = new THREE.Color(0x281938);
    this.scene.fog = new THREE.FogExp2(0x281938, 0.0105);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.15, 280);
    this.camera.position.set(3.8, 2.8, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Studio Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envMapTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMapTexture;
    pmremGenerator.dispose();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    // Enhanced Realistic 3-Point Lighting
    this.hemiLight = new THREE.HemisphereLight(0xfdba74, 0x1e293b, 0.95);
    this.hemiLight.position.set(0, 45, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    this.sunLight.position.set(28, 36, 22);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    const d = 36;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    this.rimLight.position.set(-22, 20, -30);
    this.scene.add(this.rimLight);
  }

  private buildWorld(): void {
    // 1. Rickshaw
    this.rickshaw = createRickshawModel(this.textures);
    this.scene.add(this.rickshaw.root);

    // 2. Bell Sonic Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.75, 1.05, 36);
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

    // 3. Road Segments
    const roadGeo = new THREE.PlaneGeometry(18, SEGMENT_LENGTH);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.asphalt,
      roughness: 0.86,
      metalness: 0.06,
    });

    const curbGeo = new THREE.BoxGeometry(0.6, 0.34, SEGMENT_LENGTH);
    const curbMat = new THREE.MeshStandardMaterial({
      map: this.textures.curb,
      roughness: 0.72,
    });

    const sidewalkGeo = new THREE.BoxGeometry(3.4, 0.28, SEGMENT_LENGTH);
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: this.textures.sidewalk,
      roughness: 0.85,
    });

    const wireMat = new THREE.LineBasicMaterial({ color: 0x09090b });

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const zCenter = HALF_SPAN - (i + 0.5) * SEGMENT_LENGTH;
      const segGroup = new THREE.Group();
      segGroup.position.z = zCenter;

      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.receiveShadow = true;
      segGroup.add(roadMesh);

      [-9.3, 9.3].forEach((cx) => {
        const curbMesh = new THREE.Mesh(curbGeo, curbMat);
        curbMesh.position.set(cx, 0.17, 0);
        curbMesh.receiveShadow = true;
        segGroup.add(curbMesh);
      });

      [-11.2, 11.2].forEach((sx) => {
        const swMesh = new THREE.Mesh(sidewalkGeo, sidewalkMat);
        swMesh.position.set(sx, 0.14, 0);
        swMesh.receiveShadow = true;
        segGroup.add(swMesh);
      });

      const lampBulbs: THREE.Mesh[] = [];
      ([-1, 1] as const).forEach((side) => {
        // Authentic Purana Dhaka Architectural Variation:
        // 1. Triple-domed Mughal Mosque (Tara Masjid style) on side === 1, i % 4 === 0
        if (side === 1 && i % 4 === 0) {
          const mosque = createMosqueModel(this.textures);
          mosque.position.set(side * 15.6, 0, 0);
          mosque.rotation.y = -Math.PI / 2;
          segGroup.add(mosque);
        } else if (side === -1 && i % 3 === 1) {
          // 2. Old Historical Red Brick Heritage Building (Shankhari Bazar / Ruplal House style)
          const heritage = createHeritageBuildingModel(side, i, this.textures);
          segGroup.add(heritage);
        } else {
          // 3. Dense commercial roadside blocks with posters & billboards
          const blockA = createRoadsideBlock(side, i * 2 + (side > 0 ? 1 : 0), this.textures);
          blockA.group.position.z = -6.5;
          segGroup.add(blockA.group);
          lampBulbs.push(blockA.lampBulb);

          const blockB = createRoadsideBlock(side, i * 2 + 3 + (side > 0 ? 1 : 0), this.textures);
          blockB.group.position.z = 6.5;
          segGroup.add(blockB.group);
          lampBulbs.push(blockB.lampBulb);
        }
      });

      // 100% COMPLETE, UNBROKEN DHAKA METRO RAIL (MRT LINE 6) OVERHEAD VIADUCT (Continuous across all segments!)
      const hasMetroTrain = i % 3 === 0;
      const viaduct = createMetroViaductSegment(this.textures, hasMetroTrain);
      viaduct.position.set(0, 0, 0);
      segGroup.add(viaduct);

      // FESTIVE COLORFUL BUNTING GARLANDS ("রঙিন ঝালর ও মেলা পতাকা") overhead on every segment
      const bunting = createFestiveBuntingGarland(22, this.textures);
      bunting.position.set(0, 0, (i % 2 === 0 ? -5.5 : 5.5));
      segGroup.add(bunting);

      // DHAKA CITY CORPORATION DUMPSTERS & ROADSIDE TRASH ("সিটি কর্পোরেশন ময়লার ডাস্টবিন")
      const trashDumpster = createTrashPileModel(this.textures);
      const tSide = i % 2 === 0 ? -1 : 1;
      trashDumpster.position.set(tSide * 9.15, 0, (i % 3 === 0 ? -11.0 : 11.0));
      trashDumpster.rotation.y = tSide < 0 ? Math.PI / 2 : -Math.PI / 2;
      segGroup.add(trashDumpster);

      // Overhead tangled wires
      const wireCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-9.7, 6.6, -0.7),
        new THREE.Vector3(0, 5.75, 0),
        new THREE.Vector3(9.7, 6.6, -0.7)
      );
      const wireGeo = new THREE.BufferGeometry().setFromPoints(wireCurve.getPoints(10));
      segGroup.add(new THREE.Line(wireGeo, wireMat));

      // DENSE PURANA DHAKA STREET LIFE: 4 Stalls per side (8 stalls/vendors per segment - NO EMPTY SPACES!)
      const stalls: StallInstance[] = [];
      const zOffsets = [-10.2, -3.6, 3.6, 10.2];

      ([-1, 1] as const).forEach((side) => {
        zOffsets.forEach((zOff, sIdx) => {
          const isVeggie = (i * 4 + sIdx + (side > 0 ? 1 : 0)) % 2 === 0;
          const stallVariant = (i * 3 + sIdx + (side > 0 ? 2 : 0)) % 6;
          const stallMesh = isVeggie
            ? createShobjiStallModel(this.textures)
            : createStallModel(stallVariant, this.textures);

          stallMesh.position.set(side * 7.55, 0, zOff);
          stallMesh.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          const keepClear = Math.abs(zCenter + zOff) < 14;
          stallMesh.visible = !keepClear;
          segGroup.add(stallMesh);
          stalls.push({
            mesh: stallMesh,
            active: !keepClear,
            isVeggie,
            localSide: side,
            localZOffset: zOff,
          });
        });
      });

      this.scene.add(segGroup);
      this.segments.push({
        group: segGroup,
        zCenter,
        stalls,
        lampBulbs,
      });
    }

    // 4. DHAKAR TRAFFIC: Green CNGs, Local Buses, & Traditional Cycle Rickshaws ("আরো রিকশা")
    const trafficConfigs = [
      { type: 'bus' as const, isBus: true, laneX: -4.5, dir: -1 as const, speed: 7.2 },
      { type: 'cng' as const, isBus: false, laneX: -2.0, dir: -1 as const, speed: 10.5 },
      { type: 'rickshaw' as const, isBus: false, laneX: -6.2, dir: -1 as const, speed: 5.5 },
      { type: 'cng' as const, isBus: false, laneX: 2.0, dir: 1 as const, speed: 9.8 },
      { type: 'rickshaw' as const, isBus: false, laneX: -1.6, dir: 1 as const, speed: 5.8 },
      { type: 'bus' as const, isBus: true, laneX: 4.5, dir: 1 as const, speed: 7.5 },
      { type: 'rickshaw' as const, isBus: false, laneX: 6.2, dir: 1 as const, speed: 5.2 },
      { type: 'cng' as const, isBus: false, laneX: -3.2, dir: -1 as const, speed: 11.2 },
      { type: 'cng' as const, isBus: false, laneX: 3.2, dir: 1 as const, speed: 10.2 },
      { type: 'rickshaw' as const, isBus: false, laneX: 5.8, dir: -1 as const, speed: 5.4 },
      { type: 'bus' as const, isBus: true, laneX: -4.2, dir: 1 as const, speed: 6.8 },
      { type: 'rickshaw' as const, isBus: false, laneX: -5.8, dir: -1 as const, speed: 5.6 },
      { type: 'cng' as const, isBus: false, laneX: 1.6, dir: -1 as const, speed: 11.0 },
      { type: 'bus' as const, isBus: true, laneX: 4.2, dir: -1 as const, speed: 7.0 },
    ];

    for (let i = 0; i < trafficConfigs.length; i++) {
      const cfg = trafficConfigs[i];
      let mesh: THREE.Group;
      if (cfg.type === 'bus') {
        mesh = createDhakaBusModel(this.textures);
      } else if (cfg.type === 'cng') {
        mesh = createCngModel(this.textures);
      } else {
        mesh = createTrafficRickshawModel(this.textures, i);
      }

      const startZ = -25 - i * 32;
      mesh.position.set(cfg.laneX, 0, startZ);
      mesh.rotation.y = cfg.dir === -1 ? 0 : Math.PI;
      this.scene.add(mesh);

      this.traffic.push({
        mesh,
        vehicleType: cfg.type,
        isBus: cfg.isBus,
        laneX: cfg.laneX,
        speed: cfg.speed,
        direction: cfg.dir,
        nearMissAwarded: false,
        hitCooldown: 0,
        hornCooldown: 1.0 + Math.random() * 4.0,
      });
    }

    // 5. ONEK MANUS: Animated Pedestrians on Sidewalks (18 people)
    for (let i = 0; i < 18; i++) {
      const ped = createPedestrianModel(i, this.textures);
      const side = i % 2 === 0 ? -1 : 1;
      const swX = side * (10.5 + (i % 3) * 0.4);
      const startZ = -90 + i * 14;
      ped.root.position.set(swX, 0.28, startZ);
      ped.root.rotation.y = ped.direction === 1 ? Math.PI : 0;
      this.scene.add(ped.root);
      this.pedestrians.push(ped);
    }

    // 6. Street Pickups (Biryani & Chai)
    for (let i = 0; i < 4; i++) {
      const kind: 'biryani' | 'chai' = i % 2 === 0 ? 'chai' : 'biryani';
      const pMesh = createPickupModel(kind);
      pMesh.position.set((i % 2 === 0 ? -1 : 1) * 3.5, 0, -48 - i * 52);
      this.scene.add(pMesh);
      this.pickups.push({ mesh: pMesh, kind, active: true });
    }

    // 7. Instanced Debris (Includes veggie colors: purple, orange, green, red!)
    const debGeo = new THREE.BoxGeometry(0.26, 0.16, 0.38);
    const debMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 });
    this.debrisInstanced = new THREE.InstancedMesh(debGeo, debMat, this.maxDebris);
    this.debrisInstanced.frustumCulled = false;

    const veggiePalette = [
      0x581c87, // Eggplant purple
      0xea580c, // Carrot orange
      0xdc2626, // Tomato red
      0x16a34a, // Gourd green
      0xa16207, // Potato golden brown
      0xfacc15, // Mango yellow
      0xd97706, // Wood crate
      0x94a3b8, // Tin shard
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

  public applyTimeOfDay(tod: TimeOfDay): void {
    this.timeOfDay = tod;
    if (tod === TimeOfDay.DUSK) {
      this.scene.background = new THREE.Color(0x311e3f);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x311e3f);
      (this.scene.fog as THREE.FogExp2).density = 0.0105;
      this.hemiLight.color.setHex(0xfdba74);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.95;
      this.sunLight.color.setHex(0xffb36b);
      this.sunLight.intensity = 2.4;
      this.sunOffset.set(28, 36, 22);
      this.rickshaw.headlightSpot.intensity = 3.2;
    } else if (tod === TimeOfDay.NIGHT) {
      this.scene.background = new THREE.Color(0x090d16);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x090d16);
      (this.scene.fog as THREE.FogExp2).density = 0.0135;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x09090b);
      this.hemiLight.intensity = 0.52;
      this.sunLight.color.setHex(0x93c5fd);
      this.sunLight.intensity = 0.85;
      this.sunOffset.set(-18, 42, 15);
      this.rickshaw.headlightSpot.intensity = 5.8;
    } else {
      // Sunny Noon
      this.scene.background = new THREE.Color(0x60a5fa);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x93c5fd);
      (this.scene.fog as THREE.FogExp2).density = 0.008;
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x475569);
      this.hemiLight.intensity = 1.25;
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 2.8;
      this.sunOffset.set(22, 55, 18);
      this.rickshaw.headlightSpot.intensity = 0.6;
    }

    const bulbHex = tod === TimeOfDay.NOON ? 0x94a3b8 : 0xfef08a;
    for (const seg of this.segments) {
      for (const bulb of seg.lampBulbs) {
        (bulb.material as THREE.MeshBasicMaterial).color.setHex(bulbHex);
      }
    }
  }

  public startGame(): void {
    soundEngine.init();
    soundEngine.playGameStartVoice();
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
    this.resetWorldForRun();
    this.phase = GamePhase.MENU;
    this.callbacks.onPhaseChange(GamePhase.MENU);
    this.emitHudSnapshot();
  }

  private resetWorldForRun(): void {
    soundEngine.stopCaughtVoice();
    this.speed = 0;
    this.steerAngle = 0;
    this.yaw = 0;
    this.cameraShake = 0;
    this.money = 0;
    this.health = 100;
    this.wantedLevel = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.stallsSmashed = 0;
    this.distanceMeters = 0;
    this.bellCooldown = 0;
    this.turboTimer = 0;

    this.rickshaw.root.position.set(0, 0, 0);
    this.rickshaw.root.rotation.set(0, 0, 0);
    this.rickshaw.chassisTilt.rotation.set(0, 0, 0);
    this.rickshaw.steeringColumn.rotation.set(0, 0, 0);
    this.rickshaw.turboFlameL.visible = false;
    this.rickshaw.turboFlameR.visible = false;

    for (const m of this.mobs) {
      this.scene.remove(m.rig.root);
    }
    this.mobs.length = 0;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const zCenter = HALF_SPAN - (i + 0.5) * SEGMENT_LENGTH;
      seg.zCenter = zCenter;
      seg.group.position.z = zCenter;
      for (const st of seg.stalls) {
        const keepClear = Math.abs(zCenter + st.localZOffset) < 14;
        st.active = !keepClear;
        st.mesh.visible = !keepClear;
      }
    }

    for (let i = 0; i < this.traffic.length; i++) {
      const tr = this.traffic[i];
      tr.mesh.position.set(tr.laneX, 0, -25 - i * 35);
      tr.nearMissAwarded = false;
      tr.hitCooldown = 0;
    }

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set((i % 2 === 0 ? -1 : 1) * 3.5, 0, -48 - i * 52);
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

    // Pedestrians also react to bell!
    for (const ped of this.pedestrians) {
      const dx = ped.root.position.x - rx;
      const dz = ped.root.position.z - rz;
      if (Math.hypot(dx, dz) < this.shockwaveMaxRadius) {
        ped.direction = Math.sign(dz || 1);
      }
    }

    if (stunnedCount > 0) {
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

      const targetMobTotal = [0, 4, 8, 12, 16, 22][this.wantedLevel];
      while (this.mobs.length < targetMobTotal) {
        this.spawnCrowdChaser(this.mobs.length);
      }
    }
  }

  private spawnCrowdChaser(seed: number): void {
    const rig = createMobModel(seed, this.textures);
    const side = seed % 2 === 0 ? -1 : 1;
    const rz = this.rickshaw.root.position.z;
    const zOffset = seed % 3 === 0 ? 20 + (seed % 4) * 6 : -28 - (seed % 5) * 6;
    rig.root.position.set(side * (6.6 + (seed % 3) * 0.7), 0, rz + zOffset);
    this.scene.add(rig.root);
    this.mobs.push({
      rig,
      stunTimer: 0,
      knockVelX: 0,
      knockVelZ: 0,
    });
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

    // Shadow light tracking player
    const px = this.rickshaw.root.position.x;
    const pz = this.rickshaw.root.position.z;
    this.sunLight.target.position.set(px, 0, pz - 8);
    this.sunLight.position.set(
      px + this.sunOffset.x,
      this.sunOffset.y,
      pz + this.sunOffset.z
    );

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  };

  private updateMenuShowcase(dt: number, elapsed: number): void {
    this.menuOrbitAngle += dt * 0.35;
    const radius = 5.4;
    this.camera.position.set(
      Math.sin(this.menuOrbitAngle) * radius,
      2.35 + Math.sin(elapsed * 0.9) * 0.18,
      Math.cos(this.menuOrbitAngle) * radius
    );
    this.camera.lookAt(0, 1.18, 0.1);

    if (this.bellJiggleTimer > 0) {
      this.bellJiggleTimer = Math.max(0, this.bellJiggleTimer - dt);
      this.rickshaw.bellMesh.rotation.z = Math.sin(elapsed * 55) * 0.32;
    } else {
      this.rickshaw.bellMesh.rotation.z = 0;
    }

    this.updateTraffic(dt, false);
    this.updatePedestrians(dt, elapsed);
  }

  private updatePlaying(dt: number, elapsed: number): void {
    const profile = DRIVER_PROFILES[this.selectedDriverId];

    if (this.bellCooldown > 0) {
      this.bellCooldown = Math.max(0, this.bellCooldown - dt);
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

    // Vehicle longitudinal acceleration
    const maxForwardSpeed = (isTurbo ? 32 : 23.5) * profile.topSpeedBonus;
    const maxReverseSpeed = -7.5;
    const accel = isTurbo ? 29 : 18.5;

    if (this.input.forward) {
      this.speed = Math.min(this.speed + accel * dt, maxForwardSpeed);
    } else if (this.input.backward) {
      this.speed = Math.max(this.speed - 15 * dt, maxReverseSpeed);
    } else {
      this.speed = THREE.MathUtils.damp(this.speed, 0, 2.2, dt);
    }

    if (this.input.brake) {
      this.speed = THREE.MathUtils.damp(this.speed, 0, 7.8, dt);
    }

    // Steering
    const targetSteer = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);
    const steerMax = (this.input.brake ? 0.65 : 0.48) * profile.steerResponseBonus;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer * steerMax, 11, dt);

    const speedFactor = Math.min(Math.abs(this.speed) / 6.5, 1.0);
    const dirSign = this.speed >= -0.05 ? 1 : -1;
    const turnRate = this.input.brake ? 2.95 : 2.25;
    this.yaw += this.steerAngle * speedFactor * dirSign * turnRate * dt;

    const moveStep = this.speed * dt;
    this.rickshaw.root.position.x -= Math.sin(this.yaw) * moveStep;
    this.rickshaw.root.position.z -= Math.cos(this.yaw) * moveStep;
    this.rickshaw.root.rotation.y = this.yaw;

    this.distanceMeters += Math.abs(moveStep);

    // Wall / Curb Collision
    if (Math.abs(this.rickshaw.root.position.x) > ROAD_HALF_LIMIT) {
      const sign = Math.sign(this.rickshaw.root.position.x);
      this.rickshaw.root.position.x = sign * ROAD_HALF_LIMIT;
      if (Math.abs(this.speed) > 8) {
        this.speed *= 0.72;
        this.cameraShake = Math.max(this.cameraShake, 0.22);
        this.spawnDebrisBurst(this.rickshaw.root.position.x, 0.5, this.rickshaw.root.position.z, 6);
        soundEngine.playHit();
        soundEngine.playCrashVoice();
      }
      this.yaw *= 0.85;
    }

    // Visual Tilts & Wheels
    this.rickshaw.steeringColumn.rotation.y = this.steerAngle * 0.95;
    const lateralRoll = -this.steerAngle * (this.speed / 22) * 0.22;
    const roadBump = Math.sin(this.distanceMeters * 2.8) * Math.min(Math.abs(this.speed) / 25, 1) * 0.015;
    this.rickshaw.chassisTilt.rotation.z = THREE.MathUtils.damp(
      this.rickshaw.chassisTilt.rotation.z,
      lateralRoll,
      10,
      dt
    );
    this.rickshaw.chassisTilt.position.y = roadBump;

    const wheelDelta = moveStep / 0.44;
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

    this.recycleRoadSegments();
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

  private recycleRoadSegments(): void {
    const playerZ = this.rickshaw.root.position.z;
    for (const seg of this.segments) {
      const dz = seg.zCenter - playerZ;
      if (dz > HALF_SPAN) {
        seg.zCenter -= NUM_SEGMENTS * SEGMENT_LENGTH;
        seg.group.position.z = seg.zCenter;
        this.respawnSegmentStalls(seg);
      } else if (dz < -HALF_SPAN) {
        seg.zCenter += NUM_SEGMENTS * SEGMENT_LENGTH;
        seg.group.position.z = seg.zCenter;
        this.respawnSegmentStalls(seg);
      }
    }
  }

  private respawnSegmentStalls(seg: RoadSegment): void {
    for (const st of seg.stalls) {
      st.active = true;
      st.mesh.visible = true;
    }
  }

  private checkStallCollisions(): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;

    for (const seg of this.segments) {
      if (Math.abs(seg.zCenter - rz) > SEGMENT_LENGTH) continue;

      for (const st of seg.stalls) {
        if (!st.active) continue;
        const sx = st.localSide * 7.55;
        const sz = seg.zCenter + st.localZOffset;
        const dx = rx - sx;
        const dz = rz - sz;

        if (dx * dx + dz * dz < 6.8) {
          st.active = false;
          st.mesh.visible = false;

          this.combo = Math.min(this.combo + 1, 10);
          this.comboTimer = COMBO_WINDOW_SEC;
          this.stallsSmashed++;

          const baseEarned = st.isVeggie ? 15000 : 10000;
          const earned = baseEarned * this.combo;
          this.addMoney(earned);

          if (st.isVeggie) {
            soundEngine.playVeggieSmash();
            this.emitPopup(
              `+৳${earned.toLocaleString('en-IN')}`,
              this.combo > 1 ? `${this.combo}x কম্বো! তাজা সবজি সাফ!` : 'সবজির আড়ৎ সাফ!',
              'veggie'
            );
          } else {
            soundEngine.playSmash(this.combo);
            this.emitPopup(
              `+৳${earned.toLocaleString('en-IN')}`,
              this.combo > 1 ? `${this.combo}x কম্বো!` : 'দোকান সাফ!',
              'cash'
            );
          }

          this.cameraShake = Math.max(this.cameraShake, 0.32);
          this.spawnDebrisBurst(sx, 0.9, sz, st.isVeggie ? 24 : 16);
          soundEngine.playCrashVoice();
          this.emitHudSnapshot();
        }
      }
    }
  }

  private updatePickups(dt: number, elapsed: number): void {
    const rx = this.rickshaw.root.position.x;
    const rz = this.rickshaw.root.position.z;

    for (const p of this.pickups) {
      if (p.mesh.position.z - rz > 35) {
        p.mesh.position.z = rz - 140 - Math.random() * 65;
        p.mesh.position.x = (Math.random() - 0.5) * 11;
        p.active = true;
        p.mesh.visible = true;
      } else if (rz - p.mesh.position.z > 210) {
        p.mesh.position.z = rz + 120 + Math.random() * 45;
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

    for (const tr of this.traffic) {
      tr.mesh.position.z += tr.direction * tr.speed * dt;
      if (tr.hitCooldown > 0) tr.hitCooldown = Math.max(0, tr.hitCooldown - dt);

      // Horn or Rickshaw Bell when approaching
      if (tr.hornCooldown > 0) {
        tr.hornCooldown -= dt;
      } else {
        const distZ = Math.abs(tr.mesh.position.z - rz);
        if (distZ < 25 && distZ > 6) {
          if (tr.vehicleType === 'rickshaw') {
            soundEngine.playBell();
          } else {
            soundEngine.playTrafficHorn(tr.isBus);
          }
          tr.hornCooldown = 5.0 + Math.random() * 6.0;
        }
      }

      // Recycle traffic ahead / behind
      const relZ = tr.mesh.position.z - rz;
      if (relZ > 75) {
        tr.mesh.position.z = rz - 150 - Math.random() * 45;
        tr.nearMissAwarded = false;
      } else if (relZ < -175) {
        tr.mesh.position.z = rz + 65 + Math.random() * 30;
        tr.nearMissAwarded = false;
      }

      if (!checkCollision) continue;

      const dx = rx - tr.mesh.position.x;
      const dz = rz - tr.mesh.position.z;
      const hitRadius = tr.isBus ? 4.2 : tr.vehicleType === 'cng' ? 3.1 : 2.4;
      const distSq = dx * dx + dz * dz;

      if (distSq < hitRadius && tr.hitCooldown <= 0) {
        tr.hitCooldown = 1.1;
        this.cameraShake = Math.max(this.cameraShake, tr.isBus ? 0.6 : 0.4);
        this.spawnDebrisBurst(
          (rx + tr.mesh.position.x) * 0.5,
          0.9,
          (rz + tr.mesh.position.z) * 0.5,
          tr.isBus ? 14 : 9
        );
        soundEngine.playHit();

        const vName = tr.isBus ? 'বাস' : tr.vehicleType === 'cng' ? 'সিএনজি' : 'রিকশা';
        if (this.turboTimer > 0) {
          tr.mesh.position.z -= 14;
          const reward = tr.isBus ? 8000 : tr.vehicleType === 'cng' ? 5000 : 3500;
          this.addMoney(reward);
          this.emitPopup(
            `টার্বো ধাক্কা! +৳${reward.toLocaleString('en-IN')}`,
            `${vName} কাত!`,
            'turbo'
          );
        } else {
          this.speed = -6.0;
          this.rickshaw.root.position.x += Math.sign(dx || 1) * (tr.isBus ? 1.4 : 0.9);
          const dmg = tr.isBus ? 22 : tr.vehicleType === 'cng' ? 14 : 9;
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
        distSq < (tr.isBus ? 9.5 : tr.vehicleType === 'cng' ? 7.5 : 6.0) &&
        Math.abs(this.speed) > 12
      ) {
        tr.nearMissAwarded = true;
        const reward = tr.isBus ? 3500 : tr.vehicleType === 'cng' ? 2500 : 1800;
        this.addMoney(reward);
        this.emitPopup(`নিয়ার মিস! +৳${reward.toLocaleString('en-IN')}`, 'একটুর জন্য বাঁচলেন!', 'cash');
      }
    }
  }

  private updatePedestrians(dt: number, elapsed: number): void {
    const rz = this.rickshaw.root.position.z;

    for (const ped of this.pedestrians) {
      // Walk along sidewalk
      ped.root.position.z += ped.direction * ped.walkingSpeed * dt;

      // Recycle if far behind or ahead
      if (Math.abs(ped.root.position.z - rz) > 110) {
        ped.root.position.z = rz - 80 + Math.random() * 160;
      }

      // Stride animation
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

      if (Math.abs(pos.z - rz) > 70) {
        const flank = i % 2 === 0 ? -1 : 1;
        pos.set(flank * (6.3 + (i % 3) * 0.6), 0, rz - 36 - (i % 5) * 7);
        m.stunTimer = 0;
      }

      if (m.stunTimer > 0) {
        m.stunTimer -= dt;
        pos.x = THREE.MathUtils.clamp(pos.x + m.knockVelX * dt, -8.8, 8.8);
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

      // Separation
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
      pos.x = THREE.MathUtils.clamp(pos.x + _v1.x * mobSpeed * dt, -8.8, 8.8);
      pos.z += _v1.z * mobSpeed * dt;

      m.rig.root.lookAt(rx, 0, rz);

      const stride = elapsed * 13 * m.rig.speedFactor + m.rig.phase;
      m.rig.legL.rotation.x = Math.sin(stride) * 0.65;
      m.rig.legR.rotation.x = -Math.sin(stride) * 0.65;
      m.rig.armL.rotation.x = -Math.sin(stride) * 0.55;
      m.rig.armR.rotation.x = Math.sin(stride * 1.2) * 0.55;

      if (dist < 1.95 && this.turboTimer <= 0) {
        this.applyDamage(20 * dt);
        this.cameraShake = Math.max(this.cameraShake, 0.14);
      } else if (dist < 2.2 && this.turboTimer > 0) {
        m.knockVelX = -_v1.x * 15;
        m.knockVelZ = -_v1.z * 15;
        m.stunTimer = 1.3;
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
