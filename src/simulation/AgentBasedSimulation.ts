import { ISimulation, SimulationConfig, SimulatedEntity, SimulationEvent, SimulationState, WalkableArea, LatLng } from '../interfaces/ISimulation';

// Behavior flags for pedestrians
export enum BehaviorFlag {
  NONE = 0,
  CAN_STEP = 1 << 0,
  // Add more flags as needed
}

export class AgentBasedSimulation implements ISimulation {
  private entities: SimulatedEntity[] = [];
  private events: SimulationEvent[] = [];
  private walkableAreas: WalkableArea[] = [];
  private tick: number = 0;
  private tickRate: number = 100; // milliseconds
  private isRunning: boolean = false;
  private animationId: number | null = null;

  initialize(config: SimulationConfig): void {
    this.walkableAreas = config.walkableAreas;
    this.entities = config.initialEntities;
    this.tickRate = config.tickRate;
    this.tick = 0;
    this.events = [];
  }

  step(): void {
    this.tick++;
    
    // Process all entities for movement
    for (const entity of this.entities) {
      this.updateEntity(entity);
    }
  }

  getEntities(): SimulatedEntity[] {
    return [...this.entities];
  }

  addEntity(entity: SimulatedEntity): void {
    this.entities.push(entity);
  }

  removeEntity(id: string): void {
    this.entities = this.entities.filter(e => e.id !== id);
  }

  triggerEvent(event: SimulationEvent): void {
    this.events.push(event);
  }

  reset(): void {
    this.tick = 0;
    this.events = [];
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getState(): SimulationState {
    return {
      tick: this.tick,
      entities: [...this.entities],
      events: [...this.events],
      timestamp: Date.now()
    };
  }

  // Start continuous simulation
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.runSimulation();
  }

  // Stop continuous simulation
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private runSimulation(): void {
    if (!this.isRunning) return;

    this.step();
    
    this.animationId = requestAnimationFrame(() => {
      setTimeout(() => this.runSimulation(), this.tickRate);
    });
  }

  private updateEntity(entity: SimulatedEntity): void {
    // Check if entity can move
    if (!(entity.behaviorFlags & BehaviorFlag.CAN_STEP)) {
      return;
    }

    // If no destination, pick a random one
    if (!entity.destination) {
      entity.destination = this.getRandomDestination();
    }

    // Move towards destination
    if (entity.destination) {
      this.moveTowardsDestination(entity);
    }
  }

  private getRandomDestination(): LatLng {
    // Pick a random walkable area
    const randomArea = this.walkableAreas[Math.floor(Math.random() * this.walkableAreas.length)];
    
    // Pick a random point within that area
    const randomIndex = Math.floor(Math.random() * randomArea.coordinates.length);
    return randomArea.coordinates[randomIndex];
  }

  private moveTowardsDestination(entity: SimulatedEntity): void {
    if (!entity.destination) return;

    const dx = entity.destination.lng - entity.position.lng;
    const dy = entity.destination.lat - entity.position.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If close enough to destination, pick a new one
    if (distance < 0.00001) { // Much smaller threshold for slower movement
      entity.destination = this.getRandomDestination();
      return;
    }

    // Move towards destination
    const stepSize = entity.speed * 0.000001; // Much smaller conversion factor for slower movement
    const normalizedDx = (dx / distance) * stepSize;
    const normalizedDy = (dy / distance) * stepSize;

    entity.position.lng += normalizedDx;
    entity.position.lat += normalizedDy;
  }

  // Helper method to create a pedestrian entity
  static createPedestrian(id: string, position: LatLng): SimulatedEntity {
    return {
      id,
      position,
      speed: 0.5, // 0.5 m/s - slower, more realistic walking speed
      behaviorFlags: BehaviorFlag.CAN_STEP,
      properties: {
        type: 'pedestrian',
        color: '#ff0000'
      }
    };
  }
} 