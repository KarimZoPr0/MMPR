// Interface for map API providers (data layer)
export interface IMapAPI {
  // Get map tiles for a specific area
  getMapTiles(bounds: MapBounds): Promise<MapTile[]>;
  
  // Get walkable areas/paths
  getWalkableAreas(bounds: MapBounds): Promise<WalkableArea[]>;
  
  // Geocoding
  geocode(address: string): Promise<LatLng>;
  
  // Reverse geocoding
  reverseGeocode(latLng: LatLng): Promise<string>;
  
  // Get routing between two points
  getRoute(from: LatLng, to: LatLng): Promise<Route>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapTile {
  x: number;
  y: number;
  z: number;
  url: string;
}

export interface WalkableArea {
  id: string;
  type: 'sidewalk' | 'path' | 'road' | 'plaza';
  coordinates: LatLng[];
  properties: Record<string, any>;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Route {
  points: LatLng[];
  distance: number;
  duration: number;
} 