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
    const numAsteroids = 3000; // Increase the number of asteroids

    for (let i = 0; i < numAsteroids; i++) {
      const radius = Math.random() * 0.000001 + 0.09;
      const geometry = new THREE.SphereGeometry(radius, 8, 8);
      const wireframeGeometry = new THREE.WireframeGeometry(geometry);

      const color = new THREE.Color(Math.random(), Math.random(), Math.random()); // Random RGB color
      const material = new THREE.LineBasicMaterial({ color });

      const asteroid = new THREE.LineSegments(wireframeGeometry, material);
      asteroid.position.set(Math.random() * 40 - 20, Math.random() * 40 - 20, Math.random() * 40 - 20); // Spread out asteroids more
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

      const sensitivity = 0.00005; // Sensitivity for camera angle movement

      camera.rotation.y -= (mousePosRef.current.x - window.innerWidth / 2) * sensitivity; // Rotate around Y-axis
      camera.rotation.x -= (mousePosRef.current.y - window.innerHeight / 2) * sensitivity; // Rotate around X-axis
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x)); // Clamp rotation around X-axis to prevent camera flipping
      camera.updateProjectionMatrix();

      if (isMouseDownRef.current) {
        const movementSpeed = 0.1;
        camera.translateZ(-movementSpeed);
        camera.position.x += (mousePosRef.current.x - window.innerWidth / 2) * sensitivity; // Follow mouse X movement
        camera.position.y -= (mousePosRef.current.y - window.innerHeight / 2) * sensitivity; // Follow mouse Y movement
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

    const handleMouseMove = (event) => {
      mousePosRef.current.x = event.clientX;
      mousePosRef.current.y = event.clientY;
    };

    space.addEventListener('mousedown', handleMouseDown);
    space.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      space.removeEventListener('mousedown', handleMouseDown);
      space.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      space.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={spaceRef} />;
};

export default Space;
