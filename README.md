# Mobile Movement Pattern Recognition (MMPR)

A modular, agent-based simulation system for analyzing pedestrian movement patterns on maps, with a focus on the Kista area in Stockholm.

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
src/
├── interfaces/           # Shared interfaces and contracts
│   ├── IMapAPI.ts       # Map data provider interface
│   ├── IMapRenderer.ts  # Map rendering interface
│   └── ISimulation.ts   # Simulation interface
├── map_api/             # Map API implementations
│   └── OpenStreetMapAPI.ts
├── map_renderer/        # Map rendering implementations
│   └── LeafletRenderer.ts
├── simulation/          # Simulation implementations
│   └── AgentBasedSimulation.ts
├── visualization/       # Visualization management
│   └── MapManager.ts
└── App.tsx             # Main React component
```

## Architecture Layers

1. **Map API Layer**: Provides map data (tiles, walkable areas, geocoding)
2. **Map Renderer Layer**: Handles map visualization and UI interactions
3. **Simulation Layer**: Manages agent-based pedestrian simulation
4. **Visualization Layer**: Orchestrates the other layers and manages state

## Features

- **Modular Design**: Easy to swap map providers or rendering engines
- **Agent-Based Simulation**: Realistic pedestrian movement with behavior flags
- **Walkable Areas**: Pedestrians move only on designated walkable paths
- **Real-time Visualization**: Live updates of pedestrian positions on the map
- **Kista Focus**: Pre-configured for the Kista area in Stockholm

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Current Implementation

- **Map Provider**: OpenStreetMap with predefined Kista walkable areas
- **Renderer**: Leaflet.js for interactive map visualization
- **Simulation**: Agent-based simulation with basic pedestrian movement
- **Pedestrians**: 3 initial pedestrians walking to random destinations

## Next Steps

- Add more realistic walkable areas using OSM Overpass API
- Implement behavior flags for different pedestrian states
- Add event system for panic/anomaly scenarios
- Integrate AI analytical tools for pattern recognition
- Add more sophisticated routing and pathfinding

## Technologies Used

- React + TypeScript
- Vite for build tooling
- Leaflet.js for map rendering
- OpenStreetMap for map data 