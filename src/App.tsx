import React, { useEffect, useRef } from 'react';
import { MapboxAPI } from './map_api/MapboxAPI';
import { MapboxRenderer } from './map_renderer/MapboxRenderer';
import { AgentBasedSimulation, BehaviorFlag } from './simulation/AgentBasedSimulation';
import { MapManager } from './visualization/MapManager';
import { LatLng } from './interfaces/ISimulation';
import './App.css';
import { OpenStreetMapAPI } from './map_api/OpenStreetMapAPI';
import { LeafletRenderer } from './map_renderer/LeafletRenderer';

// Helper function to generate random pedestrians
function generateRandomPedestrians(count: number, walkableAreas: any[]): any[] {
  const pedestrians = [];
  
  for (let i = 0; i < count; i++) {
    // Pick a random walkable area
    const randomArea = walkableAreas[Math.floor(Math.random() * walkableAreas.length)];
    
    // Pick a random point within that area
    const randomIndex = Math.floor(Math.random() * randomArea.coordinates.length);
    const randomPosition = randomArea.coordinates[randomIndex];
    
    // Add some randomness to the position
    const jitteredPosition: LatLng = {
      lat: randomPosition.lat + (Math.random() - 0.5) * 0.001, // ±0.001 degrees
      lng: randomPosition.lng + (Math.random() - 0.5) * 0.001  // ±0.001 degrees
    };
    
    pedestrians.push(
      AgentBasedSimulation.createPedestrian(`ped_${i + 1}`, jitteredPosition)
    );
  }
  
  return pedestrians;
}

function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapManagerRef = useRef<MapManager | null>(null);
  const simulationRef = useRef<AgentBasedSimulation | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize the modular components
    const mapAPI = new OpenStreetMapAPI();
    const mapRenderer = new MapboxRenderer();
    const simulation = new AgentBasedSimulation();
    
    // Create the map manager
    const mapManager = new MapManager(mapAPI, mapRenderer, simulation);
    mapManagerRef.current = mapManager;
    simulationRef.current = simulation;

    // Initialize the map with Kista center
    const kistaCenter = { lat: 59.4032, lng: 17.9442 };
    console.log('Initializing map at:', kistaCenter);
    
    try {
      mapManager.initialize('map-container', kistaCenter, 16);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      return;
    }

    // Set up simulation after map is initialized
    const setupSimulation = async () => {
      const walkableAreas = mapManager.getWalkableAreas();
      
      // Generate random pedestrians
      const pedestrianCount = 1000; // Back to a larger number
      const initialPedestrians = generateRandomPedestrians(pedestrianCount, walkableAreas);
      console.log('Generated', initialPedestrians.length, 'pedestrians');
      console.log('Sample pedestrian:', initialPedestrians[0]);

      const config = {
        walkableAreas,
        initialEntities: initialPedestrians,
        tickRate: 200 // 200ms per tick - slower for better performance
      };

      simulation.initialize(config);

      // Start the simulation
      simulation.start();

      // Set up animation loop to update visualization with optimized throttling
      let lastUpdate = 0;
      const updateInterval = 33; // Update every 33ms (30 FPS) for smoother animation
      let animationId: number;
      
      const animate = () => {
        const now = Date.now();
        if (now - lastUpdate >= updateInterval) {
          const entities = simulation.getEntities();
          mapManager.updateEntities(entities);
          lastUpdate = now;
        }
        animationId = requestAnimationFrame(animate);
      };
      animate();

      // Store animation ID for cleanup
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    };

    // Wait a bit for map to initialize, then set up simulation
    setTimeout(setupSimulation, 1000);

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mobile Movement Pattern Recognition</h1>
        <p>Kista Simulation - Pedestrians Walking on Walkable Areas</p>
      </header>
      <div 
        id="map-container" 
        ref={mapContainerRef}
        style={{ 
          width: '100%', 
          height: '600px',
          border: '1px solid #ccc'
        }}
      />
      <div className="controls">
        <button onClick={() => simulationRef.current?.start()}>
          Start Simulation
        </button>
        <button onClick={() => simulationRef.current?.stop()}>
          Stop Simulation
        </button>
        <button onClick={() => simulationRef.current?.reset()}>
          Reset Simulation
        </button>
      </div>
    </div>
  );
}

export default App; 