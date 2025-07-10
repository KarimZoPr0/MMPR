import React, { useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { MapboxRenderer } from '../map_renderer/MapboxRenderer';

export const LightingTest: React.FC = () => {
  const mapRendererRef = useRef<MapboxRenderer | null>(null);

  useEffect(() => {
    // Initialize the map
    const center = { lat: 59.4032, lng: 17.9442 }; // Kista center
    const zoom = 16;
    
    mapRendererRef.current = new MapboxRenderer();
    mapRendererRef.current.initialize('lighting-test-container', center, zoom);

    // Enable 3D view to see lighting effects
    setTimeout(() => {
      if (mapRendererRef.current) {
        mapRendererRef.current.enable3DView(45, 0);
      }
    }, 2000);

    return () => {
      // Cleanup
    };
  }, []);

  const testLighting = (preset: 'dawn' | 'day' | 'dusk' | 'night') => {
    if (mapRendererRef.current) {
      console.log(`Testing ${preset} lighting...`);
      mapRendererRef.current.setLightPreset(preset);
    }
  };

  const testCustomLighting = () => {
    if (mapRendererRef.current) {
      console.log('Testing custom lighting...');
      mapRendererRef.current.setCustomLighting({
        type: '3d',
        lights: [
          {
            id: 'ambient-custom',
            type: 'ambient',
            properties: {
              color: '#ff0000',
              intensity: 0.3
            }
          },
          {
            id: 'directional-custom',
            type: 'directional',
            properties: {
              color: '#00ff00',
              intensity: 0.8,
              direction: [90, 45],
              castShadows: true,
              shadowIntensity: 0.6
            }
          }
        ]
      });
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Lighting Test
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => testLighting('dawn')}>
            Test Dawn
          </Button>
          <Button variant="contained" onClick={() => testLighting('day')}>
            Test Day
          </Button>
          <Button variant="contained" onClick={() => testLighting('dusk')}>
            Test Dusk
          </Button>
          <Button variant="contained" onClick={() => testLighting('night')}>
            Test Night
          </Button>
          <Button variant="outlined" onClick={testCustomLighting}>
            Test Custom
          </Button>
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Check the console for debugging information. The lighting effects will be most visible on 3D buildings.
        </Typography>
      </Paper>
      
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div
          id="lighting-test-container"
          style={{ 
            width: '100%', 
            height: '100%', 
            border: '1px solid #ccc'
          }}
        />
      </Box>
    </Box>
  );
}; 