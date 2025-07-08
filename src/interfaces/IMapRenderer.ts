// Interface for map renderers (visualization layer)
export interface IMapRenderer {
  // Initialize the map
  initialize(containerId: string, center: LatLng, zoom: number): void;
  
  // Add/remove markers
  addMarker(id: string, position: LatLng, options?: MarkerOptions): void;
  removeMarker(id: string): void;
  updateMarker(id: string, position: LatLng): void;
  
  // Add/remove paths
  addPath(id: string, coordinates: LatLng[], options?: PathOptions): void;
  removePath(id: string): void;
  updatePath(id: string, coordinates: LatLng[]): void;
  
  // Add/remove polygons (for walkable areas)
  addPolygon(id: string, coordinates: LatLng[], options?: PolygonOptions): void;
  removePolygon(id: string): void;
  
  // Map controls
  setView(center: LatLng, zoom: number): void;
  getBounds(): MapBounds;
  
  // Event handlers
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MarkerOptions {
  color?: string;
  size?: number;
  icon?: string;
  popup?: string;
}

export interface PathOptions {
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
}

export interface PolygonOptions {
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  weight?: number;
} 