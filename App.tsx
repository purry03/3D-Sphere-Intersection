import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Circle, Line, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { Point3D } from './types';
import Slider from './components/Slider';

// Define constants for the fixed points
const TOP_POINT_POS = new THREE.Vector3(0, 8, 0);
const LEFT_POINT_POS = new THREE.Vector3(-8, 0, 0);
const FRONT_POINT_POS = new THREE.Vector3(0, 0, 8); // New point

interface SceneProps {
  movablePoint: Point3D;
}

// The 3D Scene component, defined outside App to prevent unnecessary re-renders.
const Scene: React.FC<SceneProps> = ({ movablePoint }) => {
  const movablePointVec = useMemo(() => new THREE.Vector3(movablePoint.x, movablePoint.y, movablePoint.z), [movablePoint]);

  const { radiusTop, radiusLeft, radiusFront, intersectionCircle, intersectionPoints } = useMemo(() => {
    // Radii calculation
    const rTop = TOP_POINT_POS.distanceTo(movablePointVec);
    const rLeft = LEFT_POINT_POS.distanceTo(movablePointVec);
    const rFront = FRONT_POINT_POS.distanceTo(movablePointVec);

    // --- Sphere-sphere intersection (for the circle) ---
    const c1 = TOP_POINT_POS;
    const c2 = LEFT_POINT_POS;
    const r1 = rTop;
    const r2 = rLeft;
    const d_12 = c1.distanceTo(c2);

    let circleResult = {
      exists: false,
      center: new THREE.Vector3(),
      radius: 0,
      quaternion: new THREE.Quaternion(),
    };

    if (d_12 < r1 + r2 && d_12 > Math.abs(r1 - r2)) {
      const a = (r1 * r1 - r2 * r2 + d_12 * d_12) / (2 * d_12);
      const h = Math.sqrt(Math.max(0, r1 * r1 - a * a)); // Ensure non-negative

      const direction = new THREE.Vector3().subVectors(c2, c1).normalize();
      const center = new THREE.Vector3().copy(c1).add(direction.multiplyScalar(a));

      const defaultNormal = new THREE.Vector3(0, 0, 1);
      const planeNormal = new THREE.Vector3().subVectors(c2, c1).normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultNormal, planeNormal);

      circleResult = {
        exists: true,
        center,
        radius: h,
        quaternion,
      };
    }
    
    // --- Three-sphere intersection (for the points) ---
    const c3 = FRONT_POINT_POS;
    const r3 = rFront;
    let pointsResult: THREE.Vector3[] = [];

    // Find the radical line of the three spheres by intersecting two radical planes
    const n_A = new THREE.Vector3().subVectors(c2, c1);
    const d_A = (r1 * r1 - r2 * r2 - c1.lengthSq() + c2.lengthSq()) / 2;

    const n_B = new THREE.Vector3().subVectors(c3, c1);
    const d_B = (r1 * r1 - r3 * r3 - c1.lengthSq() + c3.lengthSq()) / 2;

    const L_dir = new THREE.Vector3().crossVectors(n_A, n_B);
    const L_dir_sq = L_dir.lengthSq();
    
    // Check if planes are not parallel (i.e. sphere centers are not collinear)
    if (L_dir_sq > 1e-6) {
      const tmp1 = new THREE.Vector3().crossVectors(n_B, L_dir).multiplyScalar(d_A);
      const tmp2 = new THREE.Vector3().crossVectors(L_dir, n_A).multiplyScalar(d_B);
      const L_p0 = new THREE.Vector3().addVectors(tmp1, tmp2).divideScalar(L_dir_sq);
      
      // Intersect line with sphere 1
      const delta_p = new THREE.Vector3().subVectors(L_p0, c1);
      
      const A = L_dir_sq;
      const B = 2 * delta_p.dot(L_dir);
      const C = delta_p.lengthSq() - r1 * r1;
      
      const discriminant = B * B - 4 * A * C;
      
      if (discriminant >= 0) {
        const sqrt_disc = Math.sqrt(discriminant);
        const t1 = (-B + sqrt_disc) / (2 * A);
        const t2 = (-B - sqrt_disc) / (2 * A);
        
        const p1 = new THREE.Vector3().copy(L_p0).addScaledVector(L_dir, t1);
        pointsResult.push(p1);
        
        if (discriminant > 1e-6) { // If not a tangent point
          const p2 = new THREE.Vector3().copy(L_p0).addScaledVector(L_dir, t2);
          pointsResult.push(p2);
        }
      }
    }

    return { 
      radiusTop: rTop, 
      radiusLeft: rLeft,
      radiusFront: rFront,
      intersectionCircle: circleResult,
      intersectionPoints: pointsResult
    };
  }, [movablePointVec]);

  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />

      {/* Fixed Points */}
      <Sphere args={[0.3]} position={TOP_POINT_POS}>
        <meshStandardMaterial color="cyan" />
      </Sphere>
      <Sphere args={[0.3]} position={LEFT_POINT_POS}>
        <meshStandardMaterial color="magenta" />
      </Sphere>
      <Sphere args={[0.3]} position={FRONT_POINT_POS}>
        <meshStandardMaterial color="#60a5fa" />
      </Sphere>

      {/* Movable Point */}
      <Sphere args={[0.3]} position={movablePointVec}>
        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} />
      </Sphere>

      {/* Radius Lines */}
      <Line points={[TOP_POINT_POS, movablePointVec]} color="cyan" lineWidth={2} dashed dashScale={5} />
      <Line points={[LEFT_POINT_POS, movablePointVec]} color="magenta" lineWidth={2} dashed dashScale={5} />
      <Line points={[FRONT_POINT_POS, movablePointVec]} color="#60a5fa" lineWidth={2} dashed dashScale={5} />

      {/* Intersecting Spheres (Wireframe) */}
      <Sphere args={[radiusTop, 64, 64]} position={TOP_POINT_POS}>
        <meshStandardMaterial color="cyan" wireframe transparent opacity={0.2} />
      </Sphere>
      <Sphere args={[radiusLeft, 64, 64]} position={LEFT_POINT_POS}>
        <meshStandardMaterial color="magenta" wireframe transparent opacity={0.2} />
      </Sphere>
      <Sphere args={[radiusFront, 64, 64]} position={FRONT_POINT_POS}>
        <meshStandardMaterial color="#60a5fa" wireframe transparent opacity={0.2} />
      </Sphere>

      {/* Intersection Circle (from first two spheres) */}
      {intersectionCircle.exists && (
        <Circle args={[intersectionCircle.radius, 64]} position={intersectionCircle.center} quaternion={intersectionCircle.quaternion}>
          <meshBasicMaterial color="white" wireframe transparent opacity={0.3} side={THREE.DoubleSide} />
        </Circle>
      )}

      {/* Intersection Points (from all three spheres) */}
      {intersectionPoints.map((point, index) => (
        <Sphere key={index} args={[0.35]} position={point}>
          <meshStandardMaterial color="lime" emissive="lime" emissiveIntensity={0.8} />
        </Sphere>
      ))}
    </>
  );
};


export default function App() {
  const [point, setPoint] = useState<Point3D>({ x: 0, y: 0, z: 0 });

  const handleSliderChange = (axis: keyof Point3D, value: number) => {
    setPoint(prev => ({ ...prev, [axis]: value }));
  };

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      <div className="w-full md:w-80 lg:w-96 bg-gray-800 p-6 shadow-2xl overflow-y-auto z-10">
        <h1 className="text-2xl font-bold text-white mb-2">Sphere Intersection</h1>
        <p className="text-gray-400 mb-6">
          Move the yellow point to change the radii of the three spheres. The spheres are centered on the fixed points (cyan, magenta, blue). The bright green points show where all three spheres intersect.
        </p>
        <div className="space-y-6">
          <Slider 
            label="X Coordinate"
            value={point.x}
            min={-10}
            max={10}
            step={0.1}
            onChange={(val) => handleSliderChange('x', val)}
          />
          <Slider 
            label="Y Coordinate"
            value={point.y}
            min={-10}
            max={10}
            step={0.1}
            onChange={(val) => handleSliderChange('y', val)}
          />
          <Slider 
            label="Z Coordinate"
            value={point.z}
            min={-10}
            max={10}
            step={0.1}
            onChange={(val) => handleSliderChange('z', val)}
          />
        </div>
      </div>
      <div className="flex-1 h-full w-full">
        <Canvas camera={{ position: [10, 10, 20], fov: 50 }}>
          <Scene movablePoint={point} />
        </Canvas>
      </div>
    </div>
  );
}
