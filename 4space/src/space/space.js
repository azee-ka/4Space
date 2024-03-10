import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

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
    const numAsteroids = 2000; // Increase the number of asteroids

    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xffffff, // Initial color
      metalness: 0.8, // High metalness for metallic look
      roughness: 0.2 // Low roughness for slight shininess
    });
    for (let i = 0; i < numAsteroids; i++) {
      const radius = Math.random() * 0.2 + 0.1;
      const geometry = new THREE.SphereGeometry(radius, 8, 8);
      const wireframeGeom = new THREE.WireframeGeometry(geometry);
      const asteroid = new THREE.LineSegments(wireframeGeom, wireframeMat.clone()); // Clone material for each asteroid
      asteroid.position.set(Math.random() * 40 - 20, Math.random() * 40 - 20, Math.random() * 40 - 20); // Spread out asteroids more
      asteroids.push(asteroid);
      scene.add(asteroid);
      
      // Tween the color of each asteroid to a random color
      new TWEEN.Tween(asteroid.material.color)
        .to({ r: Math.random(), g: Math.random(), b: Math.random() }, 2000) // Transition to a random color over 2000ms
        .easing(TWEEN.Easing.Quadratic.InOut) // Use quadratic easing for smooth transition
        .repeat(Infinity) // Repeat the animation indefinitely
        .yoyo(true) // Ping-pong the animation (back and forth)
        .start(); // Start the animation
    }

    const animate = () => {
      requestAnimationFrame(animate);
      TWEEN.update(); // Update all tweens
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
        const movementSpeed = 0.05;
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
