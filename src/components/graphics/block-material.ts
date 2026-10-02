import * as THREE from "three";

/**
 * Materiale dei moduli 3D del sito: facce piene, spigoli disegnati nello shader
 * (un solo draw call per InstancedMesh). L'attributo aLit per istanza va da 0 (grezzo)
 * a 1 (pieno); oltre 1 evidenzia: schiarisce con uBoost positivo, scurisce con uBoost negativo.
 */
export function blockMaterial(colors: { face: number; raw: number; edge: number; boost: number }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFace: { value: new THREE.Color(colors.face) },
      uRaw: { value: new THREE.Color(colors.raw) },
      uEdge: { value: new THREE.Color(colors.edge) },
      uLine: { value: 1.2 },
      uBoost: { value: colors.boost },
    },
    vertexShader: /* glsl */ `
      attribute float aLit;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vLit;
      void main() {
        vUv = uv;
        vLit = aLit;
        mat4 m = modelMatrix * instanceMatrix;
        vNormal = mat3(m) * normal;
        gl_Position = projectionMatrix * viewMatrix * m * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFace;
      uniform vec3 uRaw;
      uniform vec3 uEdge;
      uniform float uLine;
      uniform float uBoost;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vLit;
      void main() {
        // Distanza dal bordo della faccia in pixel: linea sottile e costante a ogni scala.
        vec2 px = min(vUv, 1.0 - vUv) / max(fwidth(vUv), vec2(1e-5));
        float line = 1.0 - smoothstep(uLine - 1.0, uLine, min(px.x, px.y));
        float light = clamp(dot(normalize(vNormal), normalize(vec3(-0.5, 1.0, 0.6))), 0.0, 1.0);
        float base = clamp(vLit, 0.0, 1.0);
        vec3 face = mix(uRaw, uFace * (0.75 + 0.6 * light), base) * (1.0 + max(vLit - 1.0, 0.0) * uBoost);
        gl_FragColor = vec4(mix(face, uEdge, line * mix(0.35, 0.8, base)), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}
