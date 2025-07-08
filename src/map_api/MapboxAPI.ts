import { IMapAPI, MapBounds, WalkableArea, LatLng, Route } from '../interfaces/IMapAPI';

// Mapbox API implementation for Kista area
export class MapboxAPI implements IMapAPI {
  private readonly KISTA_CENTER: LatLng = { lat: 59.4032, lng: 17.9442 };
  private readonly KISTA_BOUNDS: MapBounds = {
    north: 59.4132,
    south: 59.3932,
    east: 17.9542,
    west: 17.9342
  };

  async getMapTiles(bounds: MapBounds): Promise<any[]> {
    // For Mapbox, return Mapbox tile URLs
    // In a real implementation, you'd use Mapbox Tile API
    return [];
  }

  async getWalkableAreas(bounds: MapBounds): Promise<WalkableArea[]> {
    // Mapbox API provides different walkable areas with different styling
    return [
      {
        id: 'mapbox_main_avenue',
        type: 'road',
        coordinates: [
          { lat: 59.4032, lng: 17.9342 },
          { lat: 59.4032, lng: 17.9542 }
        ],
        properties: { name: 'Mapbox Main Avenue', width: 12, style: 'mapbox' }
      },
      {
        id: 'mapbox_central_plaza',
        type: 'plaza',
        coordinates: [
          { lat: 59.4032, lng: 17.9442 },
          { lat: 59.4062, lng: 17.9442 },
          { lat: 59.4062, lng: 17.9472 },
          { lat: 59.4032, lng: 17.9472 }
        ],
        properties: { name: 'Mapbox Central Plaza', area: 500, style: 'mapbox' }
      },
      {
        id: 'mapbox_tech_district',
        type: 'plaza',
        coordinates: [
          { lat: 59.4082, lng: 17.9442 },
          { lat: 59.4102, lng: 17.9442 },
          { lat: 59.4102, lng: 17.9492 },
          { lat: 59.4082, lng: 17.9492 }
        ],
        properties: { name: 'Mapbox Tech District', area: 800, style: 'mapbox' }
      },
      {
        id: 'mapbox_residential_area',
        type: 'plaza',
        coordinates: [
          { lat: 59.4002, lng: 17.9442 },
          { lat: 59.4022, lng: 17.9442 },
          { lat: 59.4022, lng: 17.9462 },
          { lat: 59.4002, lng: 17.9462 }
        ],
        properties: { name: 'Mapbox Residential Area', area: 200, style: 'mapbox' }
      }
    ];
  }

  async geocode(address: string): Promise<LatLng> {
    // For now, return Kista center for any address
    // In real implementation, you'd use Mapbox Geocoding API
    return this.KISTA_CENTER;
  }

  async reverseGeocode(latLng: LatLng): Promise<string> {
    // For now, return a generic address
    // In real implementation, you'd use Mapbox Reverse Geocoding API
    return 'Kista, Stockholm, Sweden';
  }

  async getRoute(from: LatLng, to: LatLng): Promise<Route> {
    // For now, return a simple straight line route
    // In real implementation, you'd use Mapbox Directions API
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