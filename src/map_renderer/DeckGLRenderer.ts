import { IMapRenderer, LatLng, MapBounds, MarkerOptions, PathOptions, PolygonOptions } from '../interfaces/IMapRenderer';
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';

export class DeckGLRenderer implements IMapRenderer {
  private deck: Deck | null = null;
  private map: any = null;
  private markers: Map<string, any> = new Map();
  private paths: Map<string, any> = new Map();
  private polygons: Map<string, any> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private mapContainer: HTMLDivElement | null = null;
  private entityLayer: ScatterplotLayer | null = null;

  initialize(containerId: string, center: LatLng, zoom: number): void {
    this.mapContainer = document.getElementById(containerId) as HTMLDivElement;
    if (!this.mapContainer) {
      throw new Error(`Container ${containerId} not found`);
    }

    // Create a basic deck.gl instance
    this.deck = new Deck({
      canvas: containerId,
      initialViewState: {
        longitude: center.lng,
        latitude: center.lat,
        zoom: zoom,
        pitch: 0,
        bearing: 0
      },
      controller: true,
      style: { background: 'transparent' }
    });

    // Set up event handlers
    this.deck.on('viewStateChange', (viewState: any) => {
      this.triggerEvent('moveend', this.getBounds());
    });
  }

  addMarker(id: string, position: LatLng, options?: MarkerOptions): void {
    if (!this.deck) return;

    const layer = new ScatterplotLayer({
      id: `marker-${id}`,
      data: [{
        position: [position.lng, position.lat],
        color: options?.color || '#ff0000',
        radius: options?.size || 8
      }],
      getPosition: d => d.position,
      getRadius: d => d.radius,
      getFillColor: d => d.color,
      getLineColor: [255, 255, 255],
      getLineWidth: 2,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 1,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1
    });

    this.markers.set(id, layer);
    this.updateLayers();
  }

  removeMarker(id: string): void {
    this.markers.delete(id);
    this.updateLayers();
  }

  updateMarker(id: string, position: LatLng): void {
    const layer = this.markers.get(id);
    if (layer) {
      layer.props.data = [{
        position: [position.lng, position.lat],
        color: layer.props.data[0]?.color || '#ff0000',
        radius: layer.props.data[0]?.radius || 8
      }];
      this.updateLayers();
    }
  }

  addPath(id: string, coordinates: LatLng[], options?: PathOptions): void {
    // For now, we'll skip path rendering in deck.gl
    // Could be implemented with LineLayer if needed
  }

  removePath(id: string): void {
    // Implementation for path removal
  }

  updatePath(id: string, coordinates: LatLng[]): void {
    // Implementation for path updates
  }

  addPolygon(id: string, coordinates: LatLng[], options?: PolygonOptions): void {
    // For now, we'll skip polygon rendering in deck.gl
    // Could be implemented with PolygonLayer if needed
  }

  removePolygon(id: string): void {
    // Implementation for polygon removal
  }

  setView(center: LatLng, zoom: number): void {
    if (this.deck) {
      this.deck.setProps({
        initialViewState: {
          longitude: center.lng,
          latitude: center.lat,
          zoom: zoom,
          pitch: 0,
          bearing: 0
        }
      });
    }
  }

  getBounds(): MapBounds {
    if (!this.deck) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    const viewState = this.deck.getViewState();
    // Convert viewState to bounds (simplified)
    const lat = viewState.latitude;
    const lng = viewState.longitude;
    const zoom = viewState.zoom;
    const latDelta = 360 / Math.pow(2, zoom);
    const lngDelta = latDelta * 1.5;

    return {
      north: lat + latDelta / 2,
      south: lat - latDelta / 2,
      east: lng + lngDelta / 2,
      west: lng - lngDelta / 2
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

  // Optimized method for large numbers of entities using deck.gl's ScatterplotLayer
  updateEntitiesBatch(entities: any[]): void {
    if (!this.deck) return;

    // Create a single ScatterplotLayer for all entities
    this.entityLayer = new ScatterplotLayer({
      id: 'entities-layer',
      data: entities.map(entity => ({
        position: [entity.position.lng, entity.position.lat],
        color: entity.properties?.color || '#ff0000',
        id: entity.id
      })),
      getPosition: d => d.position,
      getRadius: 3,
      getFillColor: d => d.color,
      getLineColor: [255, 255, 255],
      getLineWidth: 1,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 1,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      updateTriggers: {
        getPosition: entities.length // Force update when entity count changes
      }
    });

    this.updateLayers();
  }

  // Method to clear all entity markers efficiently
  clearAllEntities(): void {
    this.entityLayer = null;
    this.updateLayers();
  }

  private updateLayers(): void {
    if (!this.deck) return;

    const layers = [
      ...this.markers.values(),
      ...this.paths.values(),
      ...this.polygons.values()
    ];

    if (this.entityLayer) {
      layers.push(this.entityLayer);
    }

    this.deck.setProps({ layers });
  }

  // Method to integrate with existing Mapbox map (placeholder)
  integrateWithMapbox(mapboxMap: any): void {
    // This would integrate deck.gl with Mapbox
    // For now, we'll use deck.gl standalone
    console.log('Deck.gl integration with Mapbox not implemented yet');
  }
} 