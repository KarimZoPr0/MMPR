import { IMapAPI, MapBounds, WalkableArea, LatLng, Route } from '../interfaces/IMapAPI';

// OpenStreetMap API implementation for Kista area
export class OpenStreetMapAPI implements IMapAPI {
  private readonly KISTA_CENTER: LatLng = { lat: 59.4032, lng: 17.9442 };
  private readonly KISTA_BOUNDS: MapBounds = {
    north: 59.4132,
    south: 59.3932,
    east: 17.9542,
    west: 17.9342
  };

  async getMapTiles(bounds: MapBounds): Promise<any[]> {
    // For now, return basic tile URLs - in real implementation, 
    // you'd fetch from OSM tile servers
    return [];
  }

  async getWalkableAreas(bounds: MapBounds): Promise<WalkableArea[]> {
    // For Kista, return some predefined walkable areas
    // In a real implementation, you'd fetch this from OSM Overpass API
    return [
      {
        id: 'kista_main_street',
        type: 'road',
        coordinates: [
          { lat: 59.4032, lng: 17.9342 },
          { lat: 59.4032, lng: 17.9542 }
        ],
        properties: { name: 'Kista Main Street', width: 8 }
      },
      {
        id: 'kista_plaza',
        type: 'plaza',
        coordinates: [
          { lat: 59.4032, lng: 17.9442 },
          { lat: 59.4052, lng: 17.9442 },
          { lat: 59.4052, lng: 17.9462 },
          { lat: 59.4032, lng: 17.9462 }
        ],
        properties: { name: 'Kista Plaza', area: 400 }
      },
      {
        id: 'kista_sidewalk_1',
        type: 'sidewalk',
        coordinates: [
          { lat: 59.4012, lng: 17.9442 },
          { lat: 59.4032, lng: 17.9442 }
        ],
        properties: { name: 'Sidewalk 1', width: 2 }
      },
      {
        id: 'kista_sidewalk_2',
        type: 'sidewalk',
        coordinates: [
          { lat: 59.4032, lng: 17.9422 },
          { lat: 59.4032, lng: 17.9442 }
        ],
        properties: { name: 'Sidewalk 2', width: 2 }
      }
    ];
  }

  async geocode(address: string): Promise<LatLng> {
    // For now, return Kista center for any address
    // In real implementation, you'd use OSM Nominatim API
    return this.KISTA_CENTER;
  }

  async reverseGeocode(latLng: LatLng): Promise<string> {
    // For now, return a generic address
    return 'Kista, Stockholm, Sweden';
  }

  async getRoute(from: LatLng, to: LatLng): Promise<Route> {
    // For now, return a simple straight line route
    // In real implementation, you'd use OSRM or similar routing service
    return {
      points: [from, to],
      distance: this.calculateDistance(from, to),
      duration: this.calculateDistance(from, to) / 1.4 // assuming 1.4 m/s walking speed
    };
  }

  private calculateDistance(from: LatLng, to: LatLng): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = from.lat * Math.PI / 180;
    const φ2 = to.lat * Math.PI / 180;
    const Δφ = (to.lat - from.lat) * Math.PI / 180;
    const Δλ = (to.lng - from.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
} 