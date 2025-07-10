import React, { useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { MapboxRenderer } from '../map_renderer/MapboxRenderer';

interface Map3DDemoProps {
  containerId: string;
}

export const Map3DDemo: React.FC<Map3DDemoProps> = ({ containerId }) => {
  const mapRendererRef = useRef<MapboxRenderer | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize the map
    const center = { lat: 59.4032, lng: 17.9442 }; // Kista center
    const zoom = 16;
    
    mapRendererRef.current = new MapboxRenderer();
    mapRendererRef.current.initialize(containerId, center, zoom);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [containerId]);

  const enable3DView = () => {
    if (mapRendererRef.current) {
      mapRendererRef.current.enable3DView(45, 0);
    }
  };

  const disable3DView = () => {
    if (mapRendererRef.current) {
      mapRendererRef.current.disable3DView();
    }
  };

  const setBirdEyeView = () => {
    if (mapRendererRef.current) {
      mapRendererRef.current.setView(
        { lat: 59.4032, lng: 17.9442 },
        18,
        60, // High pitch for bird's eye view
        0
      );
    }
  };

  const setStreetView = () => {
    if (mapRendererRef.current) {
      mapRendererRef.current.setView(
        { lat: 59.4032, lng: 17.9442 },
        17,
        15, // Low pitch for street view
        0
      );
    }
  };

  const animateRotation = () => {
    if (!mapRendererRef.current) return;

    let bearing = 0;
    const animate = () => {
      bearing += 1;
      mapRendererRef.current?.setBearing(bearing);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const animatePitch = () => {
    if (!mapRendererRef.current) return;

    let pitch = 0;
    let increasing = true;
    const animate = () => {
      if (increasing) {
        pitch += 1;
        if (pitch >= 60) increasing = false;
      } else {
        pitch -= 1;
        if (pitch <= 0) increasing = true;
      }
      mapRendererRef.current?.setPitch(pitch);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        3D Map Demo
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Basic 3D Controls
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={enable3DView}>
            Enable 3D
          </Button>
          <Button variant="outlined" onClick={disable3DView}>
            Disable 3D
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Preset Views
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={setBirdEyeView}>
            Bird's Eye View
          </Button>
          <Button variant="contained" onClick={setStreetView}>
            Street View
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Animations
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={animateRotation}>
            Rotate Map
          </Button>
          <Button variant="contained" onClick={animatePitch}>
            Animate Pitch
          </Button>
          <Button variant="outlined" onClick={stopAnimation}>
            Stop Animation
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tips
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Use the 3D controls panel on the map for interactive control<br/>
          • Pitch ranges from 0° (flat) to 60° (maximum tilt)<br/>
          • Bearing rotates the map from 0° to 360°<br/>
          • 3D buildings appear at zoom level 15+<br/>
          • Try different map styles for varied 3D effects
        </Typography>
      </Paper>
    </Box>
  );
}; 