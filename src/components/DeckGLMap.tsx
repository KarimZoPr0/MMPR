import React, { useEffect, useRef } from 'react';
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import mapboxgl from 'mapbox-gl';

interface DeckGLMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  entities: any[];
  onMapLoad?: () => void;
}

export const DeckGLMap: React.FC<DeckGLMapProps> = ({ 
  center, 
  zoom, 
  entities, 
  onMapLoad 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const deckRef = useRef<Deck | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWJkaWthcmltLWVsbWkiLCJhIjoiY21jc3doemtxMG40MzJrczlzcWRwemg1byJ9.0IaiGeP7t2zxJ7QR0VvDoA';

    // Create Mapbox map
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: zoom
    });

    mapRef.current = map;

    // Create deck.gl instance
    const deck = new Deck({
      canvas: 'deck-canvas',
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

    deckRef.current = deck;

    // Wait for map to load
    map.on('load', () => {
      if (onMapLoad) onMapLoad();
    });

    return () => {
      if (deck) deck.finalize();
      if (map) map.remove();
    };
  }, [center.lat, center.lng, zoom, onMapLoad]);

  // Update deck.gl layers when entities change
  useEffect(() => {
    if (!deckRef.current) return;

    const layers = [
      new ScatterplotLayer({
        id: 'pedestrians',
        data: entities.map(entity => ({
          position: [entity.position.lng, entity.position.lat],
          color: entity.properties?.color || '#ff0000',
          id: entity.id
        })),
        getPosition: (d: any) => d.position,
        getRadius: 3,
        getFillColor: (d: any) => d.color,
        getLineColor: [255, 255, 255],
        getLineWidth: 1,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 6,
        radiusMinPixels: 1,
        radiusMaxPixels: 100,
        lineWidthMinPixels: 1
      })
    ];

    deckRef.current.setProps({ layers });
  }, [entities]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <canvas 
        id="deck-canvas" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none'
        }} 
      />
    </div>
  );
}; 