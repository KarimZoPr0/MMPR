import { IMapAPI } from '../interfaces/IMapAPI';
import { IMapRenderer } from '../interfaces/IMapRenderer';
import { ISimulation } from '../interfaces/ISimulation';
import { LatLng, MapBounds } from '../interfaces/IMapAPI';
import { MapboxRenderer } from '../map_renderer/MapboxRenderer';

export class MapManager {
  private mapAPI: IMapAPI;
  private mapRenderer: IMapRenderer;
  private simulation: ISimulation;
  private walkableAreas: any[] = [];
  private isInitialized: boolean = false;

  constructor(
    mapAPI: IMapAPI,
    mapRenderer: IMapRenderer,
    simulation: ISimulation
  ) {
    this.mapAPI = mapAPI;
    this.mapRenderer = mapRenderer;
    this.simulation = simulation;
  }

  async initialize(containerId: string, center: LatLng, zoom: number): Promise<void> {
    if (this.isInitialized) return;

    // Initialize the map renderer
    this.mapRenderer.initialize(containerId, center, zoom);

    // Get walkable areas from the map API
    const bounds = this.mapRenderer.getBounds();
    this.walkableAreas = await this.mapAPI.getWalkableAreas(bounds);

    // Render walkable areas
    this.renderWalkableAreas();

    // Set up event handlers
    this.mapRenderer.on('moveend', (bounds: MapBounds) => {
      this.onMapBoundsChanged(bounds);
    });

    this.isInitialized = true;
  }

  private renderWalkableAreas(): void {
    this.walkableAreas.forEach((area, index) => {
      const options = this.getPolygonOptionsForArea(area);
      this.mapRenderer.addPolygon(`area_${index}`, area.coordinates, options);
    });
  }

  private getPolygonOptionsForArea(area: any): any {
    // Check if this is from Mapbox API
    const isMapboxStyle = area.properties?.style === 'mapbox';
    
    switch (area.type) {
      case 'road':
        return isMapboxStyle ? {
          color: '#1a1a1a',
          fillColor: '#4a4a4a',
          fillOpacity: 0.4,
          weight: 3
        } : {
          color: '#666666',
          fillColor: '#999999',
          fillOpacity: 0.3,
          weight: 2
        };
      case 'sidewalk':
        return {
          color: '#cccccc',
          fillColor: '#eeeeee',
          fillOpacity: 0.5,
          weight: 1
        };
      case 'plaza':
        return isMapboxStyle ? {
          color: '#2E8B57',
          fillColor: '#90EE90',
          fillOpacity: 0.6,
          weight: 3
        } : {
          color: '#8B4513',
          fillColor: '#DEB887',
          fillOpacity: 0.4,
          weight: 2
        };
      default:
        return isMapboxStyle ? {
          color: '#4169E1',
          fillColor: '#87CEEB',
          fillOpacity: 0.3,
          weight: 2
        } : {
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          weight: 1
        };
    }
  }

  private async onMapBoundsChanged(bounds: MapBounds): Promise<void> {
    // Update walkable areas for new bounds
    this.walkableAreas = await this.mapAPI.getWalkableAreas(bounds);
    
    // Clear existing areas and re-render
    this.walkableAreas.forEach((_, index) => {
      this.mapRenderer.removePolygon(`area_${index}`);
    });
    
    this.renderWalkableAreas();
  }

  // Update simulation entities on the map
  updateEntities(entities: any[]): void {
    // For large numbers of entities, use batch update
    if (entities.length > 100) {
      // Cast to access the optimized method
      (this.mapRenderer as any).updateEntitiesBatch(entities);
      return;
    }

    // For smaller numbers, use individual updates
    // Track current entity IDs
    const currentEntityIds = new Set(entities.map(e => e.id));
    
    // Remove markers for entities that no longer exist
    this.existingEntityIds.forEach(entityId => {
      if (!currentEntityIds.has(entityId)) {
        const markerId = `entity_${entityId}`;
        this.mapRenderer.removeMarker(markerId);
      }
    });
    
    // Update or create markers for current entities
    entities.forEach(entity => {
      const markerId = `entity_${entity.id}`;
      
      if (this.existingEntityIds.has(entity.id)) {
        // Update existing marker
        this.mapRenderer.updateMarker(markerId, entity.position);
      } else {
        // Create new marker
        this.mapRenderer.addMarker(markerId, entity.position, {
          color: entity.properties?.color || '#ff0000',
          size: 8,
          popup: `Pedestrian ${entity.id}`
        });
      }
    });
    
    // Update our tracking set
    this.existingEntityIds = currentEntityIds;
  }

  private existingEntityIds: Set<string> = new Set();

  // Get the map renderer for direct access if needed
  getRenderer(): IMapRenderer {
    return this.mapRenderer;
  }

  // Get the map API for direct access if needed
  getAPI(): IMapAPI {
    return this.mapAPI;
  }

  // Get walkable areas
  getWalkableAreas(): any[] {
    return [...this.walkableAreas];
  }
} 