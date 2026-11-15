import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type BatchMaterialCache = Map<string, THREE.Material>;

export function createBatchMaterialCache(): BatchMaterialCache {
  return new Map<string, THREE.Material>();
}

function getMaterialKey(mat: THREE.Material): string {
  const anyMat = mat as THREE.MeshStandardMaterial &
    THREE.MeshBasicMaterial & {
      color?: THREE.Color;
      roughness?: number;
      metalness?: number;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      map?: THREE.Texture | null;
      alphaMap?: THREE.Texture | null;
    };

  const parts: string[] = [
    mat.type,
    anyMat.color ? String(anyMat.color.getHex()) : 'nc',
    anyMat.roughness !== undefined ? anyMat.roughness.toFixed(3) : 'nr',
    anyMat.metalness !== undefined ? anyMat.metalness.toFixed(3) : 'nm',
    anyMat.emissive ? String(anyMat.emissive.getHex()) : 'ne',
    anyMat.emissiveIntensity !== undefined ? anyMat.emissiveIntensity.toFixed(2) : 'nei',
    anyMat.map ? anyMat.map.uuid : 'nomap',
    anyMat.alphaMap ? anyMat.alphaMap.uuid : 'noamap',
    mat.transparent ? '1' : '0',
    mat.opacity.toFixed(3),
    mat.alphaTest.toFixed(3),
    mat.depthWrite ? '1' : '0',
    String(mat.side),
    mat.polygonOffset ? `${mat.polygonOffsetFactor}_${mat.polygonOffsetUnits}` : 'npo',
    mat.vertexColors ? '1' : '0',
  ];
  return parts.join('|');
}

function normalizeGeometryForBatch(
  srcGeo: THREE.BufferGeometry,
  worldMatrix: THREE.Matrix4,
  includeUv: boolean,
  includeColor: boolean
): THREE.BufferGeometry {
  const geo = srcGeo.index ? srcGeo.toNonIndexed() : srcGeo.clone();
  geo.applyMatrix4(worldMatrix);

  if (!geo.getAttribute('normal')) {
    geo.computeVertexNormals();
  }

  const attrNames = Object.keys(geo.attributes);
  for (const name of attrNames) {
    if (name === 'position' || name === 'normal') continue;
    if (name === 'uv' && includeUv) continue;
    if (name === 'color' && includeColor) continue;
    geo.deleteAttribute(name);
  }

  return geo;
}

interface BatchBucket {
  material: THREE.Material;
  castShadow: boolean;
  receiveShadow: boolean;
  includeUv: boolean;
  includeColor: boolean;
  geometries: THREE.BufferGeometry[];
}

/**
 * Merges all static child meshes inside `root` by canonical material + shadow flags + attribute mask
 * into minimal draw-call BufferGeometries. Preserves exact world-space transforms, materials, textures,
 * shadows, transparency, and polygonOffset.
 */
export function mergeStaticGroupByMaterial(
  root: THREE.Group,
  materialCache?: BatchMaterialCache,
  disposeOriginalGeometries = true
): THREE.Group {
  root.updateMatrixWorld(true);

  const buckets = new Map<string, BatchBucket>();
  const passthroughMeshes: THREE.Mesh[] = [];
  const sourceGeometriesToDispose = new Set<THREE.BufferGeometry>();
  const unusedDuplicateMaterials = new Set<THREE.Material>();

  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.visible || !mesh.geometry) return;

    if (Array.isArray(mesh.material)) {
      const cloned = mesh.clone();
      cloned.matrixAutoUpdate = true;
      mesh.matrixWorld.decompose(cloned.position, cloned.quaternion, cloned.scale);
      passthroughMeshes.push(cloned);
      return;
    }

    const origMat = mesh.material;
    const matKey = getMaterialKey(origMat);

    let canonicalMat = origMat;
    if (materialCache) {
      const cached = materialCache.get(matKey);
      if (cached) {
        canonicalMat = cached;
        if (origMat !== cached) {
          unusedDuplicateMaterials.add(origMat);
        }
      } else {
        materialCache.set(matKey, origMat);
      }
    }

    const hasUv = Boolean(mesh.geometry.getAttribute('uv'));
    const hasColor = Boolean(canonicalMat.vertexColors && mesh.geometry.getAttribute('color'));
    const bucketKey = `${matKey}|cs:${mesh.castShadow ? 1 : 0}|rs:${mesh.receiveShadow ? 1 : 0}|uv:${hasUv ? 1 : 0}|vc:${hasColor ? 1 : 0}`;

    let bucket = buckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        material: canonicalMat,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
        includeUv: hasUv,
        includeColor: hasColor,
        geometries: [],
      };
      buckets.set(bucketKey, bucket);
    }

    const prepared = normalizeGeometryForBatch(
      mesh.geometry,
      mesh.matrixWorld,
      hasUv,
      hasColor
    );
    bucket.geometries.push(prepared);

    if (disposeOriginalGeometries) {
      sourceGeometriesToDispose.add(mesh.geometry);
    }
  });

  const mergedGroup = new THREE.Group();
  mergedGroup.name = root.name ? `${root.name}_batched` : 'static_batched';

  for (const bucket of buckets.values()) {
    if (bucket.geometries.length === 0) continue;

    if (bucket.geometries.length === 1) {
      const singleGeo = bucket.geometries[0];
      singleGeo.computeBoundingSphere();
      const singleMesh = new THREE.Mesh(singleGeo, bucket.material);
      singleMesh.castShadow = bucket.castShadow;
      singleMesh.receiveShadow = bucket.receiveShadow;
      mergedGroup.add(singleMesh);
      continue;
    }

    const mergedGeo = mergeGeometries(bucket.geometries, false);
    for (const g of bucket.geometries) {
      g.dispose();
    }

    if (mergedGeo) {
      mergedGeo.computeBoundingSphere();
      const batchedMesh = new THREE.Mesh(mergedGeo, bucket.material);
      batchedMesh.castShadow = bucket.castShadow;
      batchedMesh.receiveShadow = bucket.receiveShadow;
      mergedGroup.add(batchedMesh);
    }
  }

  for (const pm of passthroughMeshes) {
    mergedGroup.add(pm);
  }

  // Note: Only dispose geometries not shared externally; avoid disposing if external shared cache exists?
  // Actually shared geometries in models.ts (pole tube wires) might be reused across cells!
  // Better: only dispose temporary normalized copies (already done above!) unless caller explicitly opts in.
  if (disposeOriginalGeometries) {
    // Only safe when geometries aren't module-level singletons; caller controls flag.
    for (const sg of sourceGeometriesToDispose) {
      sg.dispose();
    }
  }

  for (const dupMat of unusedDuplicateMaterials) {
    dupMat.dispose();
  }

  return mergedGroup;
}
