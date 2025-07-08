// Interface for simulation layer
export interface ISimulation {
  // Initialize the simulation
  initialize(config: SimulationConfig): void;
  
  // Step the simulation forward
  step(): void;
  
  // Get current entities (pedestrians)
  getEntities(): SimulatedEntity[];
  
  // Add/remove entities
  addEntity(entity: SimulatedEntity): void;
  removeEntity(id: string): void;
  
  // Trigger events
  triggerEvent(event: SimulationEvent): void;
  
  // Reset simulation
  reset(): void;
  
  // Get simulation state
  getState(): SimulationState;
}

export interface SimulationConfig {
  walkableAreas: WalkableArea[];
  initialEntities: SimulatedEntity[];
  tickRate: number; // milliseconds per tick
}

export interface SimulatedEntity {
  id: string;
  position: LatLng;
  destination?: LatLng;
  speed: number;
  behaviorFlags: number;
  properties: Record<string, any>;
}

export interface SimulationEvent {
  type: string;
  location: LatLng;
  radius: number;
  properties: Record<string, any>;
}

export interface SimulationState {
  tick: number;
  entities: SimulatedEntity[];
  events: SimulationEvent[];
  timestamp: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface WalkableArea {
  id: string;
  type: 'sidewalk' | 'path' | 'road' | 'plaza';
  coordinates: LatLng[];
  properties: Record<string, any>;
} 