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
  private is3DMode: boolean = false;
  private buildingLayerId: string | null = null;
  private terrainLayerId: string | null = null;
  private skyLayerId: string | null = null;
  private currentLightPreset: string = 'day';
  private showPlaceLabels: boolean = true;
  private showPOILabels: boolean = true;
  private showRoadLabels: boolean = true;
  private showTransitLabels: boolean = true;

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
      style: 'mapbox://styles/mapbox/standard', // Use Standard style for lighting support
      center: [center.lng, center.lat],
      zoom: zoom,
      pitch: 0, // Initial pitch (0 = flat, 60 = maximum tilt)
      bearing: 0, // Initial bearing (rotation)
      antialias: true // Enable antialiasing for smoother 3D rendering
    } as any);

    console.log('MapboxRenderer: Map created with style:', 'mapbox://styles/mapbox/standard');

    // Set initial lighting after map loads
    this.map.on('load', () => {
      console.log('MapboxRenderer: Map load event fired');
      if (this.map) {
        console.log('MapboxRenderer: Style loaded?', this.map.isStyleLoaded());
        
        // Set a timeout to check style loading
        setTimeout(() => {
          if (this.map && this.map.isStyleLoaded()) {
            console.log('MapboxRenderer: Style loaded after timeout');
            try {
              // Try to set initial light preset using new API
              this.map.setConfigProperty('basemap', 'lightPreset', 'day');
              console.log('MapboxRenderer: Initial light preset set successfully');
            } catch (error) {
              console.log('MapboxRenderer: New lighting API not available, using legacy method');
              // Fallback to legacy lighting
              this.map.setLight({
                anchor: 'viewport',
                color: '#ffffff',
                intensity: 0.6,
                position: [1.15, 210, 30]
              });
            }
          } else {
            console.log('MapboxRenderer: Style still not loaded after timeout');
          }
        }, 1000);
      }
    });

    // Also listen for style.load event
    this.map.on('style.load', () => {
      console.log('MapboxRenderer: Style load event fired');
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

  // 3D View Methods
  enable3DView(pitch: number = 45, bearing: number = 0, includeTerrain: boolean = true): void {
    if (!this.map) return;
    
    this.is3DMode = true;
    this.map.setPitch(pitch);
    this.map.setBearing(bearing);
    
    // Add 3D building layer if not already added
    this.add3DBuildings();
    
    // Add terrain and sky for immersive 3D experience
    if (includeTerrain) {
      this.addTerrain();
      this.addSky();
    }
  }

  disable3DView(): void {
    if (!this.map) return;
    
    this.is3DMode = false;
    this.map.setPitch(0);
    this.map.setBearing(0);
    
    // Remove 3D layers
    this.remove3DBuildings();
    this.removeTerrain();
    this.removeSky();
  }

  setPitch(pitch: number): void {
    if (!this.map) return;
    
    // Clamp pitch between 0 and 60 degrees
    const clampedPitch = Math.max(0, Math.min(60, pitch));
    this.map.setPitch(clampedPitch);
  }

  setBearing(bearing: number): void {
    if (!this.map) return;
    
    // Normalize bearing to 0-360 degrees
    const normalizedBearing = ((bearing % 360) + 360) % 360;
    this.map.setBearing(normalizedBearing);
  }

  getPitch(): number {
    return this.map ? this.map.getPitch() : 0;
  }

  getBearing(): number {
    return this.map ? this.map.getBearing() : 0;
  }

  is3DEnabled(): boolean {
    return this.is3DMode;
  }

  private add3DBuildings(): void {
    if (!this.map || this.buildingLayerId) return;

    // Wait for the map style to load
    if (!this.map.isStyleLoaded()) {
      this.map.once('style.load', () => this.add3DBuildings());
      return;
    }

    // Add 3D building layer
    this.map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    });

    this.buildingLayerId = '3d-buildings';
    console.log('3D buildings layer added');
  }

  private remove3DBuildings(): void {
    if (!this.map || !this.buildingLayerId) return;

    try {
      this.map.removeLayer(this.buildingLayerId);
      this.buildingLayerId = null;
      console.log('3D buildings layer removed');
    } catch (error) {
      console.warn('Could not remove 3D buildings layer:', error);
    }
  }

  private addTerrain(): void {
    if (!this.map || this.terrainLayerId) return;

    // Wait for the map style to load
    if (!this.map.isStyleLoaded()) {
      this.map.once('style.load', () => this.addTerrain());
      return;
    }

    // Add terrain source
    this.map.addSource('mapbox-terrain', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512
    });

    // Add terrain layer
    this.map.addLayer({
      'id': 'terrain',
      'type': 'hillshade',
      'source': 'mapbox-terrain',
      'paint': {
        'hillshade-shadow-color': '#000000',
        'hillshade-highlight-color': '#FFFFFF',
        'hillshade-accent-color': '#000000'
      }
    });

    this.terrainLayerId = 'terrain';
    console.log('Terrain layer added');
  }

  private removeTerrain(): void {
    if (!this.map || !this.terrainLayerId) return;

    try {
      this.map.removeLayer(this.terrainLayerId);
      this.map.removeSource('mapbox-terrain');
      this.terrainLayerId = null;
      console.log('Terrain layer removed');
    } catch (error) {
      console.warn('Could not remove terrain layer:', error);
    }
  }

  private addSky(): void {
    if (!this.map || this.skyLayerId) return;

    // Wait for the map style to load
    if (!this.map.isStyleLoaded()) {
      this.map.once('style.load', () => this.addSky());
      return;
    }

    // Add sky layer
    this.map.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 0.0],
        'sky-atmosphere-sun-intensity': 15
      }
    });

    this.skyLayerId = 'sky';
    console.log('Sky layer added');
  }

  private removeSky(): void {
    if (!this.map || !this.skyLayerId) return;

    try {
      this.map.removeLayer(this.skyLayerId);
      this.skyLayerId = null;
      console.log('Sky layer removed');
    } catch (error) {
      console.warn('Could not remove sky layer:', error);
    }
  }

  // Lighting Methods - Compatible with Mapbox GL JS v3.0+
  setLightPreset(preset: 'dawn' | 'day' | 'dusk' | 'night'): void {
    if (!this.map) {
      console.warn('Map not initialized');
      return;
    }
    
    this.currentLightPreset = preset;
    
    // Check if style is loaded before applying lighting
    if (!this.map.isStyleLoaded()) {
      console.log('Style not loaded yet, waiting...');
      this.map.once('style.load', () => {
        this.applyLightPreset(preset);
      });
      return;
    }
    
    this.applyLightPreset(preset);
  }

  private applyLightPreset(preset: 'dawn' | 'day' | 'dusk' | 'night'): void {
    if (!this.map) return;
    
    try {
      console.log(`Attempting to set light preset: ${preset}`);
      
      // Use the Standard style's setConfigProperty method for lighting
      console.log('Using Standard style setConfigProperty for lighting...');
      this.map.setConfigProperty('basemap', 'lightPreset', preset);
      console.log(`Light preset applied via Standard style: ${preset}`);
      
      // Also apply 3D lighting for buildings
      if (this.map.setLight) {
        console.log('Using setLight method for 3D lighting...');
        this.map.setLight({
          anchor: 'viewport',
          color: this.getPresetColor(preset),
          intensity: this.getPresetIntensity(preset)
        });
        console.log(`3D light preset applied via setLight: ${preset}`);
      }
      
    } catch (error) {
      console.error('Error setting light preset:', error);
      console.log('Falling back to CSS filter method...');
      // Fallback to CSS filter method if Standard style API fails
      this.applyOverallLighting(preset);
    }
  }

  private applyOverallLighting(preset: 'dawn' | 'day' | 'dusk' | 'night'): void {
    if (!this.map) return;
    
    try {
      // Apply lighting effect using CSS filters on the map container
      const mapContainer = this.map.getContainer();
      const currentFilter = mapContainer.style.filter || '';
      
      // Remove any existing lighting filter
      const filterWithoutLighting = currentFilter.replace(/brightness\([^)]*\)|contrast\([^)]*\)|hue-rotate\([^)]*\)/g, '').trim();
      
      // Apply new lighting filter
      let newFilter = filterWithoutLighting;
      switch (preset) {
        case 'dawn':
          newFilter += ' brightness(1.1) contrast(1.1) hue-rotate(15deg)';
          break;
        case 'day':
          newFilter += ' brightness(1.0) contrast(1.0)';
          break;
        case 'dusk':
          newFilter += ' brightness(0.8) contrast(1.2) hue-rotate(-15deg)';
          break;
        case 'night':
          newFilter += ' brightness(0.6) contrast(1.3) hue-rotate(-30deg)';
          break;
      }
      
      mapContainer.style.filter = newFilter;
      console.log(`Overall lighting applied for preset: ${preset} using CSS filters`);
      
    } catch (error) {
      console.log('Could not apply overall lighting:', error);
    }
  }

  private getPresetOpacity(preset: 'dawn' | 'day' | 'dusk' | 'night'): number {
    switch (preset) {
      case 'dawn': return 0.1;
      case 'day': return 0.0; // No overlay for day
      case 'dusk': return 0.2;
      case 'night': return 0.3;
      default: return 0.0;
    }
  }

  private getPresetColor(preset: 'dawn' | 'day' | 'dusk' | 'night'): string {
    switch (preset) {
      case 'dawn': return '#ffd700'; // Golden yellow
      case 'day': return '#ffffff'; // White
      case 'dusk': return '#ff8c00'; // Dark orange
      case 'night': return '#1e3a8a'; // Dark blue
      default: return '#ffffff';
    }
  }

  private getPresetIntensity(preset: 'dawn' | 'day' | 'dusk' | 'night'): number {
    switch (preset) {
      case 'dawn': return 0.6;
      case 'day': return 1.0;
      case 'dusk': return 0.4;
      case 'night': return 0.2;
      default: return 1.0;
    }
  }

  private setLegacyLightPreset(preset: 'dawn' | 'day' | 'dusk' | 'night'): void {
    if (!this.map) return;
    
    try {
      switch (preset) {
        case 'dawn':
          this.map.setLight({
            anchor: 'viewport',
            color: '#ff6b35',
            intensity: 0.4,
            position: [1.15, 45, 30]
          });
          break;
        case 'day':
          this.map.setLight({
            anchor: 'viewport',
            color: '#ffffff',
            intensity: 0.6,
            position: [1.15, 210, 30]
          });
          break;
        case 'dusk':
          this.map.setLight({
            anchor: 'viewport',
            color: '#ff8c42',
            intensity: 0.3,
            position: [1.15, 270, 20]
          });
          break;
        case 'night':
          this.map.setLight({
            anchor: 'viewport',
            color: '#1a1a2e',
            intensity: 0.2,
            position: [1.15, 180, 60]
          });
          break;
      }
    } catch (error) {
      console.error('Error setting legacy light preset:', error);
    }
  }

  setLabelVisibility(settings: {
    showPlaceLabels?: boolean;
    showPOILabels?: boolean;
    showRoadLabels?: boolean;
    showTransitLabels?: boolean;
  }): void {
    if (!this.map) return;
    
    // Check if style is loaded before applying label visibility
    if (!this.map.isStyleLoaded()) {
      console.log('Style not loaded yet, waiting for label visibility...');
      this.map.once('style.load', () => {
        this.applyLabelVisibility(settings);
      });
      return;
    }
    
    this.applyLabelVisibility(settings);
  }

  private applyLabelVisibility(settings: {
    showPlaceLabels?: boolean;
    showPOILabels?: boolean;
    showRoadLabels?: boolean;
    showTransitLabels?: boolean;
  }): void {
    if (!this.map) return;
    
    try {
      // Use the new v3.0+ API for label visibility
      if (settings.showPlaceLabels !== undefined) {
        this.showPlaceLabels = settings.showPlaceLabels;
        this.map.setConfigProperty('basemap', 'showPlaceLabels', settings.showPlaceLabels);
      }

      if (settings.showPOILabels !== undefined) {
        this.showPOILabels = settings.showPOILabels;
        this.map.setConfigProperty('basemap', 'showPointOfInterestLabels', settings.showPOILabels);
      }

      if (settings.showRoadLabels !== undefined) {
        this.showRoadLabels = settings.showRoadLabels;
        this.map.setConfigProperty('basemap', 'showRoadLabels', settings.showRoadLabels);
      }

      if (settings.showTransitLabels !== undefined) {
        this.showTransitLabels = settings.showTransitLabels;
        this.map.setConfigProperty('basemap', 'showTransitLabels', settings.showTransitLabels);
      }
      
      console.log('Label visibility applied:', settings);
    } catch (error) {
      console.error('Error setting label visibility:', error);
      // Fallback to legacy method if new API fails
      this.setLegacyLabelVisibility(settings);
    }
  }

  private setLegacyLabelVisibility(settings: {
    showPlaceLabels?: boolean;
    showPOILabels?: boolean;
    showRoadLabels?: boolean;
    showTransitLabels?: boolean;
  }): void {
    if (!this.map) return;
    
    if (settings.showPlaceLabels !== undefined) {
      this.toggleLayerVisibility('place-label', settings.showPlaceLabels);
    }

    if (settings.showPOILabels !== undefined) {
      this.toggleLayerVisibility('poi-label', settings.showPOILabels);
    }

    if (settings.showRoadLabels !== undefined) {
      this.toggleLayerVisibility('road-label', settings.showRoadLabels);
    }

    if (settings.showTransitLabels !== undefined) {
      this.toggleLayerVisibility('transit-label', settings.showTransitLabels);
    }
  }

  private toggleLayerVisibility(layerPrefix: string, visible: boolean): void {
    if (!this.map) return;
    
    const style = this.map.getStyle();
    if (!style || !style.layers) return;

    style.layers.forEach(layer => {
      if (layer.id && layer.id.includes(layerPrefix)) {
        this.map?.setLayoutProperty(
          layer.id,
          'visibility',
          visible ? 'visible' : 'none'
        );
      }
    });
  }

  // Advanced 3D Lighting with custom light sources - Compatible with v3.0+
  setCustomLighting(lighting: {
    type?: '3d' | 'flat';
    lights?: Array<{
      id: string;
      type: 'ambient' | 'directional' | 'flat';
      properties?: {
        color?: string;
        intensity?: number;
        direction?: [number, number]; // [azimuthal, polar]
        castShadows?: boolean;
        shadowIntensity?: number;
        shadowQuality?: number;
      };
    }>;
  }): void {
    if (!this.map) return;
    
    try {
      // Use the new v3.0+ lighting API
      if (lighting.type) {
        this.map.setConfigProperty('basemap', 'lighting', lighting.type);
      }

      if (lighting.lights) {
        this.map.setConfigProperty('basemap', 'lights', lighting.lights);
      }

      console.log('Custom lighting applied:', lighting);
    } catch (error) {
      console.error('Error applying custom lighting:', error);
      // Fallback to legacy method if new API fails
      this.setLegacyCustomLighting(lighting);
    }
  }

  private setLegacyCustomLighting(lighting: {
    type?: '3d' | 'flat';
    lights?: Array<{
      id: string;
      type: 'ambient' | 'directional' | 'flat';
      properties?: {
        color?: string;
        intensity?: number;
        direction?: [number, number];
        castShadows?: boolean;
        shadowIntensity?: number;
        shadowQuality?: number;
      };
    }>;
  }): void {
    if (!this.map) return;
    
    try {
      if (lighting.lights && lighting.lights.length > 0) {
        const directionalLight = lighting.lights.find(light => light.type === 'directional');
        
        if (directionalLight && directionalLight.properties) {
          const props = directionalLight.properties;
          this.map.setLight({
            anchor: 'viewport',
            color: props.color || '#ffffff',
            intensity: props.intensity || 0.5,
            position: [
              1.15,
              props.direction?.[0] || 210,
              props.direction?.[1] || 30
            ]
          });
        }
      }
    } catch (error) {
      console.error('Error applying legacy custom lighting:', error);
    }
  }

  // Preset lighting configurations
  setDawnLighting(): void {
    this.setCustomLighting({
      type: '3d',
      lights: [
        {
          id: 'ambient-dawn',
          type: 'ambient',
          properties: {
            color: '#ff6b35',
            intensity: 0.3
          }
        },
        {
          id: 'directional-dawn',
          type: 'directional',
          properties: {
            color: '#ff8c42',
            intensity: 0.6,
            direction: [45, 30],
            castShadows: true,
            shadowIntensity: 0.4
          }
        }
      ]
    });
  }

  setDayLighting(): void {
    this.setCustomLighting({
      type: '3d',
      lights: [
        {
          id: 'ambient-day',
          type: 'ambient',
          properties: {
            color: '#ffffff',
            intensity: 0.4
          }
        },
        {
          id: 'directional-day',
          type: 'directional',
          properties: {
            color: '#ffffff',
            intensity: 0.8,
            direction: [210, 30],
            castShadows: true,
            shadowIntensity: 0.6
          }
        }
      ]
    });
  }

  setDuskLighting(): void {
    this.setCustomLighting({
      type: '3d',
      lights: [
        {
          id: 'ambient-dusk',
          type: 'ambient',
          properties: {
            color: '#ff6b6b',
            intensity: 0.3
          }
        },
        {
          id: 'directional-dusk',
          type: 'directional',
          properties: {
            color: '#ff8c8c',
            intensity: 0.5,
            direction: [270, 20],
            castShadows: true,
            shadowIntensity: 0.5
          }
        }
      ]
    });
  }

  setNightLighting(): void {
    this.setCustomLighting({
      type: '3d',
      lights: [
        {
          id: 'ambient-night',
          type: 'ambient',
          properties: {
            color: '#1a1a2e',
            intensity: 0.2
          }
        },
        {
          id: 'directional-night',
          type: 'directional',
          properties: {
            color: '#16213e',
            intensity: 0.3,
            direction: [180, 60],
            castShadows: true,
            shadowIntensity: 0.8
          }
        }
      ]
    });
  }

  // Get current lighting state
  getLightingState(): {
    preset: string;
    labels: {
      showPlaceLabels: boolean;
      showPOILabels: boolean;
      showRoadLabels: boolean;
      showTransitLabels: boolean;
    };
  } {
    return {
      preset: this.currentLightPreset,
      labels: {
        showPlaceLabels: this.showPlaceLabels,
        showPOILabels: this.showPOILabels,
        showRoadLabels: this.showRoadLabels,
        showTransitLabels: this.showTransitLabels
      }
    };
  }

  // Debug function to test lighting API
  debugLightingAPI(): void {
    if (!this.map) {
      console.log('Map not available for debugging');
      return;
    }

    console.log('=== Lighting API Debug ===');
    console.log('Style loaded:', this.map.isStyleLoaded());
    console.log('Map style:', this.map.getStyle());
    console.log('setLight method available:', !!this.map.setLight);
    console.log('setConfigProperty method available:', !!this.map.setConfigProperty);
    
    try {
      // Test if we can get current light preset from Standard style
      const currentPreset = this.map.getConfigProperty('basemap', 'lightPreset');
      console.log('Current light preset from Standard style:', currentPreset);
    } catch (error) {
      console.log('Could not get current light preset from Standard style:', error);
    }

    try {
      // Test Standard style light preset
      console.log('Testing Standard style light preset...');
      this.map.setConfigProperty('basemap', 'lightPreset', 'night');
      console.log('Successfully set Standard style light preset to night');
    } catch (error) {
      console.log('Could not set Standard style light preset:', error);
    }

    try {
      // Test setLight method for 3D lighting
      if (this.map.setLight) {
        console.log('Testing setLight method for 3D lighting...');
        this.map.setLight({
          anchor: 'viewport',
          color: '#1e3a8a',
          intensity: 0.2
        });
        console.log('Successfully applied setLight with night lighting for 3D elements');
      }
    } catch (error) {
      console.log('Could not use setLight method:', error);
    }

    try {
      // Test Standard style label visibility
      this.map.setConfigProperty('basemap', 'showPlaceLabels', false);
      console.log('Successfully set Standard style showPlaceLabels to false');
    } catch (error) {
      console.log('Could not set Standard style showPlaceLabels:', error);
    }

    console.log('=== End Debug ===');
  }

  // Enhanced setView method with 3D support
  setView(center: LatLng, zoom: number, pitch?: number, bearing?: number): void {
    if (!this.map) return;
    
    const options: any = {
      center: [center.lng, center.lat],
      zoom: zoom
    };

    if (pitch !== undefined) {
      options.pitch = pitch;
    }

    if (bearing !== undefined) {
      options.bearing = bearing;
    }

    this.map.easeTo(options);
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

  getBounds(): MapBounds {
    if (!this.map) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    const bounds = this.map.getBounds();
    if (!bounds) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }
    
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