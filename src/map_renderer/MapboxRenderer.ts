import { IMapRenderer, LatLng, MapBounds, MarkerOptions, PathOptions, PolygonOptions } from '../interfaces/IMapRenderer';
import mapboxgl from 'mapbox-gl';
import { CSSLoader } from '../utils/CSSLoader';

export class MapboxRenderer implements IMapRenderer {
  private map: mapboxgl.Map | null = null;
  private markers: Map<string, mapboxgl.Marker> = new Map();
  private paths: Map<string, any> = new Map();
  private polygons: Map<string, any> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private mapContainer: HTMLDivElement | null = null;

  initialize(containerId: string, center: LatLng, zoom: number): void {
    // Load Mapbox CSS dynamically
    CSSLoader.loadMapboxCSS();
    
    // Set your Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWJkaWthcmltLWVsbWkiLCJhIjoiY21jc3doemtxMG40MzJrczlzcWRwemg1byJ9.0IaiGeP7t2zxJ7QR0VvDoA';

    this.mapContainer = document.getElementById(containerId) as HTMLDivElement;
    if (!this.mapContainer) {
      throw new Error(`Container ${containerId} not found`);
    }

    // Create the map
    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: zoom
    });

    // Set up event handlers
    this.map.on('moveend', () => {
      this.triggerEvent('moveend', this.getBounds());
    });

    this.map.on('zoomend', () => {
      this.triggerEvent('zoomend', this.getBounds());
    });

    // Wait for map to load before allowing operations
    this.map.on('load', () => {
      console.log('Mapbox map loaded successfully');
    });
  }

  addMarker(id: string, position: LatLng, options?: MarkerOptions): void {
    if (!this.map) return;

    // Create a DOM element for the marker
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = options?.color || '#ff0000';
    el.style.width = `${options?.size || 8}px`;
    el.style.height = `${options?.size || 8}px`;
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.cursor = 'pointer';

    // Create the marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([position.lng, position.lat]);

    if (options?.popup) {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(options.popup);
      marker.setPopup(popup);
    }

    marker.addTo(this.map);
    this.markers.set(id, marker);
  }

  removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker && this.map) {
      marker.remove();
      this.markers.delete(id);
    }
  }

  updateMarker(id: string, position: LatLng): void {
    const marker = this.markers.get(id);
    if (marker) {
      marker.setLngLat([position.lng, position.lat]);
    }
  }

  addPath(id: string, coordinates: LatLng[], options?: PathOptions): void {
    if (!this.map) return;

    const pathId = `path-${id}`;
    const pathCoordinates = coordinates.map(coord => [coord.lng, coord.lat]);

    this.map.addSource(pathId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: pathCoordinates
        }
      }
    });

    this.map.addLayer({
      id: pathId,
      type: 'line',
      source: pathId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': options?.color || '#3388ff',
        'line-width': options?.weight || 3,
        'line-opacity': options?.opacity || 1
      }
    });

    this.paths.set(id, { sourceId: pathId, layerId: pathId });
  }

  removePath(id: string): void {
    const path = this.paths.get(id);
    if (path && this.map) {
      this.map.removeLayer(path.layerId);
      this.map.removeSource(path.sourceId);
      this.paths.delete(id);
    }
  }

  updatePath(id: string, coordinates: LatLng[]): void {
    const path = this.paths.get(id);
    if (path && this.map) {
      const pathCoordinates = coordinates.map(coord => [coord.lng, coord.lat]);
      const source = this.map.getSource(path.sourceId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: pathCoordinates
          }
        });
      }
    }
  }

  addPolygon(id: string, coordinates: LatLng[], options?: PolygonOptions): void {
    if (!this.map) return;

    const polygonId = `polygon-${id}`;
    const polygonCoordinates = coordinates.map(coord => [coord.lng, coord.lat]);

    this.map.addSource(polygonId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoordinates]
        }
      }
    });

    this.map.addLayer({
      id: polygonId,
      type: 'fill',
      source: polygonId,
      paint: {
        'fill-color': options?.fillColor || '#3388ff',
        'fill-opacity': options?.fillOpacity || 0.2
      }
    });

    this.map.addLayer({
      id: `${polygonId}-border`,
      type: 'line',
      source: polygonId,
      paint: {
        'line-color': options?.color || '#3388ff',
        'line-width': options?.weight || 1
      }
    });

    this.polygons.set(id, { 
      sourceId: polygonId, 
      layerId: polygonId, 
      borderLayerId: `${polygonId}-border` 
    });
  }

  removePolygon(id: string): void {
    const polygon = this.polygons.get(id);
    if (polygon && this.map) {
      this.map.removeLayer(polygon.borderLayerId);
      this.map.removeLayer(polygon.layerId);
      this.map.removeSource(polygon.sourceId);
      this.polygons.delete(id);
    }
  }

  setView(center: LatLng, zoom: number): void {
    if (this.map) {
      this.map.setCenter([center.lng, center.lat]);
      this.map.setZoom(zoom);
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

  // Optimized method for large numbers of entities using Mapbox's native clustering
  updateEntitiesBatch(entities: any[]): void {
    if (!this.map || !this.map.isStyleLoaded()) {
      return;
    }

    // Initialize source and layer only once
    if (!this.map.getSource('entities')) {
      console.log('MapboxRenderer: Initializing entities source and layer');
      
      // Add the source
      this.map.addSource('entities', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add the layer for individual pedestrians with optimized settings
      this.map.addLayer({
        id: 'entities-layer',
        type: 'circle',
        source: 'entities',
        paint: {
          'circle-radius': 2, // Smaller circles for better performance
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 0, // No stroke for better performance
          'circle-opacity': 0.7
        },
        layout: {
          visibility: 'visible'
        }
      });
    }

    // Update only the data, not recreate the entire source
    const source = this.map.getSource('entities') as mapboxgl.GeoJSONSource;
    if (source) {
      // Optimize the data structure for better performance
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: entities.map(entity => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [entity.position.lng, entity.position.lat]
          },
          properties: {
            id: entity.id,
            color: entity.properties?.color || '#ff0000'
          }
        }))
      };
      
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        source.setData(geojsonData);
      });
    }
  }

  // Method to clear all entity markers efficiently
  clearAllEntities(): void {
    if (!this.map) return;

    if (this.map.getSource('entities')) {
      this.map.removeLayer('entities-layer');
      this.map.removeSource('entities');
    }
  }
} 