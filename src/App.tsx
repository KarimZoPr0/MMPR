import React, { useEffect, useRef, useState } from 'react';
import { GraphologyPedestrianSimulation } from './simulation/GraphologyPedestrianSimulation';
import { MapboxRenderer } from './map_renderer/MapboxRenderer';
import './App.css';
import { LeafletRenderer } from './map_renderer/LeafletRenderer';
import { IMapRenderer } from './interfaces/IMapRenderer';
import ScenarioEditor from './components/ScenarioEditor';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  SkipNext,
  Refresh,
  Clear,
} from '@mui/icons-material';

const MAP_CONTAINER_ID = 'map-container';
const KISTA_CENTER = { lat: 59.4032, lng: 17.9442 };
const KISTA_ZOOM = 16;

function App() {
  const [tick, setTick] = useState(0);
  const [pedestrians, setPedestrians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [tab, setTab] = useState(0);
  const simulationRef = useRef<GraphologyPedestrianSimulation | null>(null);
  const mapRendererRef = useRef<IMapRenderer | null>(null);
  const markerMap = useRef<Map<string, boolean>>(new Map());
  const [running, setRunning] = useState(false);
  const [pedestrianCount] = useState(100);

  // Initialize simulation and map
  useEffect(() => {
    setIsLoading(true);
    setInitializationProgress(0);
    
    simulationRef.current = new GraphologyPedestrianSimulation(
      pedestrianCount, 
      (progress) => setInitializationProgress(progress)
    );
    setPedestrians(simulationRef.current.getPedestrianPositions());
 
    // Initialize MapRenderer only once
    if (!mapRendererRef.current) {
      mapRendererRef.current = new LeafletRenderer();
      mapRendererRef.current.initialize(MAP_CONTAINER_ID, KISTA_CENTER, KISTA_ZOOM);
    }
    // Clear marker map on reset
    markerMap.current.clear();

    // Monitor initialization completion
    const checkInitialization = () => {
      if (simulationRef.current?.isFullyInitialized()) {
        setIsLoading(false);
      } else {
        setTimeout(checkInitialization, 100);
      }
    };

    setTimeout(checkInitialization, 100);

    // Cleanup on unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.cleanup();
      }
    };
  }, [pedestrianCount]);

  // Update pedestrian markers on the map (no flicker)
  useEffect(() => {
    if (!mapRendererRef.current || isLoading) return;
    const renderer = mapRendererRef.current;
    const currentIds = new Set(pedestrians.map(p => p.id));

    // Remove markers for pedestrians that no longer exist
    for (const id of markerMap.current.keys()) {
      if (!currentIds.has(id)) {
        renderer.removeMarker(id);
        markerMap.current.delete(id);
      }
    }

    // Add or update markers for current pedestrians
    pedestrians.forEach(ped => {
      if (markerMap.current.has(ped.id)) {
        renderer.updateMarker(ped.id, { lat: ped.lat, lng: ped.lng });
      } else {
        renderer.addMarker(ped.id, { lat: ped.lat, lng: ped.lng }, {
          color: '#ff0000',
          size: 8,
          popup: `Pedestrian ${ped.id}`
        });
        markerMap.current.set(ped.id, true);
      }
    });
  }, [pedestrians, isLoading]);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    function animate() {
      if (simulationRef.current && running && !isLoading) {
        simulationRef.current.step();
        setPedestrians(simulationRef.current.getPedestrianPositions());
        setTick(simulationRef.current.getTickCount());
        animationId = requestAnimationFrame(animate);
      }
    }
    if (running && !isLoading) {
      animationId = requestAnimationFrame(animate);
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [running, isLoading]);

  const handleStart = () => {
    if (!isLoading) setRunning(true);
  };
  const handleStop = () => setRunning(false);
  const handleStep = () => {
    if (simulationRef.current && !isLoading) {
      simulationRef.current.step();
      setPedestrians(simulationRef.current.getPedestrianPositions());
      setTick(simulationRef.current.getTickCount());
    }
  };
  const handleReset = () => {
    if (simulationRef.current) {
      simulationRef.current.reset(pedestrianCount);
      setPedestrians(simulationRef.current.getPedestrianPositions());
      setTick(simulationRef.current.getTickCount());
    }
    setRunning(false);
    setIsLoading(true);
    setInitializationProgress(0);
    // Remove all markers
    if (mapRendererRef.current) {
      for (const id of markerMap.current.keys()) {
        mapRendererRef.current.removeMarker(id);
      }
      markerMap.current.clear();
    }
  };

  const handleClearCache = () => {
    if (simulationRef.current) {
      simulationRef.current.clearCache();
      alert('Cache cleared! Next refresh will recompute all paths.');
    }
  };

  const hasCachedPaths = () => {
    try {
      const cached = localStorage.getItem('kista_walk_paths_cache');
      if (!cached) return false;
      const pathCache = JSON.parse(cached);
      return pathCache.version === '1.0' && 
             Date.now() - pathCache.timestamp < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  // Tab content renderers
  function renderTabContent() {
    switch (tab) {
      case 0:
        return <ScenarioEditor />;
      case 1:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Results</Typography>
            <Typography variant="body2" color="text.secondary">Simulation results, statistics, and summaries will appear here.</Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Pedestrians</Typography>
            <Typography variant="body2" color="text.secondary">List and inspect pedestrian entities here.</Typography>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Import / Export</Typography>
            <Typography variant="body2" color="text.secondary">Import/export GeoJSON, scenario files, or simulation data here.</Typography>
          </Box>
        );
      default:
        return null;
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            color: 'white'
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>Initializing Simulation...</Typography>
          <Box sx={{ width: 300, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={initializationProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Computing paths for {pedestrianCount} pedestrians...
          </Typography>
          {hasCachedPaths() && (
            <Chip 
              label="✓ Using cached paths (fast startup)" 
              color="success" 
              size="small"
            />
          )}
        </Box>
      )}

      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mobile Movement Pattern Recognition
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`Tick: ${tick}`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              label={`Pedestrians: ${pedestrians.length}`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              label={hasCachedPaths() ? '✓ Cached' : '✗ Not cached'} 
              size="small" 
              color={hasCachedPaths() ? 'success' : 'warning'}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content: Responsive Two-Column Layout */}
      <Box sx={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}>
        {/* Left Panel: Editor with Tabs */}
        <Paper
          elevation={3}
          sx={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRadius: 0,
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Events" />
            <Tab label="Results" />
            <Tab label="Pedestrians" />
            <Tab label="Import/Export" />
          </Tabs>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', bgcolor: 'background.default' }}>
            {renderTabContent()}
          </Box>
        </Paper>

        {/* Right Panel: Map View */}
        <Box sx={{ width: '50%', position: 'relative', minWidth: 0 }}>
          <div
            id={MAP_CONTAINER_ID}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: '1px solid #e0e0e0'
            }}
          />
          {/* Control Buttons Overlay - Bottom Left */}
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: 1,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              zIndex: 1000,
            }}
          >
            <Tooltip title="Start Simulation" placement="right">
              <IconButton
                onClick={handleStart}
                disabled={running || isLoading}
                color="success"
                size="small"
              >
                <PlayArrow />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Stop Simulation" placement="right">
              <IconButton
                onClick={handleStop}
                disabled={!running}
                color="error"
                size="small"
              >
                <Stop />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Step Forward" placement="right">
              <IconButton
                onClick={handleStep}
                disabled={running || isLoading}
                color="primary"
                size="small"
              >
                <SkipNext />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Reset Simulation" placement="right">
              <IconButton
                onClick={handleReset}
                disabled={isLoading}
                color="warning"
                size="small"
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Clear Cache" placement="right">
              <IconButton
                onClick={handleClearCache}
                color="info"
                size="small"
              >
                <Clear />
              </IconButton>
            </Tooltip>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default App; 