import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Space = () => {
  const spaceRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    const space = spaceRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    space.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const asteroids = [];
    const numAsteroids = 50;
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < numAsteroids; i++) {
      const radius = Math.random() * 0.2 + 0.1;
      const geometry = new THREE.SphereGeometry(radius, 8, 8);
      const wireframeGeom = new THREE.WireframeGeometry(geometry);
      const asteroid = new THREE.LineSegments(wireframeGeom, wireframeMat);
      asteroid.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
      asteroids.push(asteroid);
      scene.add(asteroid);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      asteroids.forEach((asteroid) => {
        asteroid.rotation.x += 0.01;
        asteroid.rotation.y += 0.01;
      });

      if (isMouseDownRef.current) {
        const movementSpeed = 0.1;
        const moveVector = new THREE.Vector3(0, 0, -movementSpeed); // Move forward
        camera.translateZ(-movementSpeed);
        camera.updateProjectionMatrix();
      }
    };

    animate();

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    space.addEventListener('mousedown', handleMouseDown);
    space.addEventListener('mouseup', handleMouseUp);

    return () => {
      space.removeEventListener('mousedown', handleMouseDown);
      space.removeEventListener('mouseup', handleMouseUp);
      space.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={spaceRef} />;
};

export default Space;
