import { IMapRenderer, LatLng, MapBounds, MarkerOptions, PathOptions, PolygonOptions } from '../interfaces/IMapRenderer';
import L from 'leaflet';
import { CSSLoader } from '../utils/CSSLoader';

export class LeafletRenderer implements IMapRenderer {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private paths: Map<string, L.Polyline> = new Map();
  private polygons: Map<string, L.Polygon> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private entityLayerGroup: L.LayerGroup | null = null; // For batch operations

  initialize(containerId: string, center: LatLng, zoom: number): void {
    // Load Leaflet CSS dynamically
    CSSLoader.loadLeafletCSS();
    
    // Clean up any existing map in the container
    const container = document.getElementById(containerId);
    if (container) {
      // Remove any existing Leaflet elements
      const existingMap = container.querySelector('.leaflet-container');
      if (existingMap) {
        existingMap.remove();
      }
    }

    this.map = L.map(containerId).setView([center.lat, center.lng], zoom);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Create a layer group for entities (more efficient for large numbers)
    this.entityLayerGroup = L.layerGroup().addTo(this.map);

    // Set up event handlers
    this.map.on('moveend', () => {
      this.triggerEvent('moveend', this.getBounds());
    });

    this.map.on('zoomend', () => {
      this.triggerEvent('zoomend', this.getBounds());
    });
  }

  addMarker(id: string, position: LatLng, options?: MarkerOptions): void {
    if (!this.map) return;

    const markerOptions: L.MarkerOptions = {};
    if (options?.icon) {
      markerOptions.icon = L.icon({
        iconUrl: options.icon,
        iconSize: [options.size || 25, options.size || 25],
        iconAnchor: [12, 12]
      });
    }

    const marker = L.marker([position.lat, position.lng], markerOptions);
    
    if (options?.popup) {
      marker.bindPopup(options.popup);
    }

    // Add to layer group instead of map directly
    if (this.entityLayerGroup) {
      marker.addTo(this.entityLayerGroup);
    } else {
      marker.addTo(this.map);
    }
    
    this.markers.set(id, marker);
  }

  removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker && this.map) {
      if (this.entityLayerGroup) {
        this.entityLayerGroup.removeLayer(marker);
      } else {
        this.map.removeLayer(marker);
      }
      this.markers.delete(id);
    }
  }

  updateMarker(id: string, position: LatLng): void {
    const marker = this.markers.get(id);
    if (marker) {
      marker.setLatLng([position.lat, position.lng]);
    }
  }

  addPath(id: string, coordinates: LatLng[], options?: PathOptions): void {
    if (!this.map) return;

    const latlngs = coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
    const pathOptions: L.PolylineOptions = {
      color: options?.color || '#3388ff',
      weight: options?.weight || 3,
      opacity: options?.opacity || 1
    };

    if (options?.dashArray) {
      pathOptions.dashArray = options.dashArray;
    }

    const path = L.polyline(latlngs, pathOptions);
    path.addTo(this.map);
    this.paths.set(id, path);
  }

  removePath(id: string): void {
    const path = this.paths.get(id);
    if (path && this.map) {
      this.map.removeLayer(path);
      this.paths.delete(id);
    }
  }

  updatePath(id: string, coordinates: LatLng[]): void {
    const path = this.paths.get(id);
    if (path) {
      const latlngs = coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
      path.setLatLngs(latlngs);
    }
  }

  addPolygon(id: string, coordinates: LatLng[], options?: PolygonOptions): void {
    if (!this.map) return;

    const latlngs = coordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
    const polygonOptions: any = {
      color: options?.color || '#3388ff',
      fillColor: options?.fillColor || '#3388ff',
      fillOpacity: options?.fillOpacity || 0.2,
      weight: options?.weight || 1
    };

    const polygon = L.polygon(latlngs, polygonOptions);
    polygon.addTo(this.map);
    this.polygons.set(id, polygon);
  }

  removePolygon(id: string): void {
    const polygon = this.polygons.get(id);
    if (polygon && this.map) {
      this.map.removeLayer(polygon);
      this.polygons.delete(id);
    }
  }

  setView(center: LatLng, zoom: number): void {
    if (this.map) {
      this.map.setView([center.lat, center.lng], zoom);
    }
  }

  getBounds(): MapBounds {
    if (!this.map) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    const bounds = this.map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private triggerEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Optimized method for large numbers of entities
  updateEntitiesBatch(entities: any[]): void {
    if (!this.entityLayerGroup) return;

    // Track which entity IDs are present in this update
    const newEntityIds = new Set<string>();

    // Update or create markers for each entity
    entities.forEach(entity => {
      const markerId = `entity_${entity.id}`;
      newEntityIds.add(markerId);
      let marker = this.markers.get(markerId) as L.CircleMarker | undefined;
      if (marker) {
        // Update position and color if changed
        marker.setLatLng([entity.position.lat, entity.position.lng]);
        if (marker.options.fillColor !== (entity.properties?.color || '#ff0000')) {
          marker.setStyle({ fillColor: entity.properties?.color || '#ff0000' });
        }
      } else {
        // Create new marker
        marker = L.circleMarker([entity.position.lat, entity.position.lng], {
          radius: 4,
          fillColor: entity.properties?.color || '#ff0000',
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
        marker.addTo(this.entityLayerGroup!);
        this.markers.set(markerId, marker as any);
      }
    });

    // Remove markers that are no longer present
    for (const [markerId, marker] of this.markers.entries()) {
      if (markerId.startsWith('entity_') && !newEntityIds.has(markerId)) {
        this.entityLayerGroup.removeLayer(marker);
        this.markers.delete(markerId);
      }
    }
  }

  // Method to clear all entity markers efficiently
  clearAllEntities(): void {
    if (this.entityLayerGroup) {
      this.entityLayerGroup.clearLayers();
      this.markers.clear();
    }
  }

  // Method to properly destroy the map
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
    this.paths.clear();
    this.polygons.clear();
    this.entityLayerGroup = null;
  }
} 