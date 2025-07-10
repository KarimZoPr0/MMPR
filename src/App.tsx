import React, { useEffect, useRef, useState } from 'react';
import { GraphologyPedestrianSimulation } from './simulation/GraphologyPedestrianSimulation';
import { MapboxRenderer } from './map_renderer/MapboxRenderer';
import './App.css';
import { LeafletRenderer } from './map_renderer/LeafletRenderer';
import { IMapRenderer } from './interfaces/IMapRenderer';
import ScenarioEditor from './components/ScenarioEditor';
import { Map3DControls } from './components/Map3DControls';
import { MapLightingControls } from './components/MapLightingControls';
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
  ChevronLeft,
  ChevronRight,
  Speed,
} from '@mui/icons-material';
import { Popover, Slider, TextField } from '@mui/material';

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
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [currentLightPreset, setCurrentLightPreset] = useState('day');
  const [currentLabels, setCurrentLabels] = useState({
    showPlaceLabels: true,
    showPOILabels: true,
    showRoadLabels: true,
    showTransitLabels: true,
  });
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [isMapboxRenderer, setIsMapboxRenderer] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [speedAnchorEl, setSpeedAnchorEl] = useState<null | HTMLElement>(null);
  const handleSpeedButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setSpeedAnchorEl(event.currentTarget);
  };
  const handleSpeedPopoverClose = () => {
    setSpeedAnchorEl(null);
  };
  const openSpeedPopover = Boolean(speedAnchorEl);
  const speedId = openSpeedPopover ? 'simulation-speed-popover' : undefined;

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
      mapRendererRef.current = new MapboxRenderer();
      mapRendererRef.current.initialize(MAP_CONTAINER_ID, KISTA_CENTER, KISTA_ZOOM);
      
      // Set renderer type
      setIsMapboxRenderer(mapRendererRef.current instanceof MapboxRenderer);
      
      // Listen for style load event (only for Mapbox)
      if (mapRendererRef.current instanceof MapboxRenderer) {
        const map = (mapRendererRef.current as any).map;
        if (map) {
          console.log('Setting up style load listener...');
          
          // Check if style is already loaded
          if (map.isStyleLoaded()) {
            console.log('Style already loaded!');
            setStyleLoaded(true);
          } else {
            console.log('Style not loaded yet, waiting...');
            map.on('style.load', () => {
              console.log('Style load event fired!');
              setStyleLoaded(true);
            });
            
            // Also listen for load event as fallback
            map.on('load', () => {
              console.log('Map load event fired!');
              if (map.isStyleLoaded()) {
                console.log('Style is loaded after map load event');
                setStyleLoaded(true);
              }
            });
          }
        }
      } else {
        // For non-Mapbox renderers, set style as loaded immediately
        setStyleLoaded(true);
      }
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

  // Periodic check for style loading
  useEffect(() => {
    if (styleLoaded) return; // Don't check if already loaded
    
    const interval = setInterval(() => {
      if (mapRendererRef.current instanceof MapboxRenderer) {
        const map = (mapRendererRef.current as any).map;
        if (map && map.isStyleLoaded()) {
          console.log('Style loaded detected by periodic check!');
          setStyleLoaded(true);
          clearInterval(interval);
        }
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [styleLoaded]);

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
    let stepAccumulator = 0;
    function animate() {
      if (simulationRef.current && running && !isLoading) {
        // Use simulationSpeed to determine steps per frame
        stepAccumulator += simulationSpeed;
        let steps = Math.floor(stepAccumulator);
        stepAccumulator -= steps;
        if (steps < 1) steps = 1;
        for (let i = 0; i < steps; i++) {
          simulationRef.current.step();
        }
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
  }, [running, isLoading, simulationSpeed]);

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
    setRunning(false);
    setIsLoading(true);
    setInitializationProgress(0);

    // Clean up old simulation if needed
    if (simulationRef.current) {
      simulationRef.current.cleanup?.();
    }

    // Create a new simulation instance with the progress callback
    simulationRef.current = new GraphologyPedestrianSimulation(
      pedestrianCount,
      (progress) => {
        setInitializationProgress(progress);
        if (progress >= 100) {
          setIsLoading(false);
          setPedestrians(simulationRef.current!.getPedestrianPositions());
          setTick(simulationRef.current!.getTickCount());
        }
      }
    );

    setPedestrians(simulationRef.current.getPedestrianPositions());
    setTick(simulationRef.current.getTickCount());

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

  // 3D Controls handlers
  const handleToggle3D = (enabled: boolean) => {
    setIs3DEnabled(enabled);
    if (mapRendererRef.current && mapRendererRef.current instanceof MapboxRenderer) {
      if (enabled) {
        mapRendererRef.current.enable3DView(currentPitch, currentBearing);
      } else {
        mapRendererRef.current.disable3DView();
      }
    }
  };

  const handlePitchChange = (pitch: number) => {
    setCurrentPitch(pitch);
    if (mapRendererRef.current && mapRendererRef.current instanceof MapboxRenderer) {
      mapRendererRef.current.setPitch(pitch);
    }
  };

  const handleBearingChange = (bearing: number) => {
    setCurrentBearing(bearing);
    if (mapRendererRef.current && mapRendererRef.current instanceof MapboxRenderer) {
      mapRendererRef.current.setBearing(bearing);
    }
  };

  // Lighting handlers
  const handleLightPresetChange = (preset: 'dawn' | 'day' | 'dusk' | 'night') => {
    setCurrentLightPreset(preset);
    if (mapRendererRef.current && mapRendererRef.current instanceof MapboxRenderer && styleLoaded) {
      mapRendererRef.current.setLightPreset(preset);
    }
  };

  const handleLabelVisibilityChange = (settings: any) => {
    setCurrentLabels(prev => ({ ...prev, ...settings }));
    if (mapRendererRef.current && mapRendererRef.current instanceof MapboxRenderer && styleLoaded) {
      mapRendererRef.current.setLabelVisibility(settings);
    }
  };

  // Debug function to manually check style loading
  const checkStyleLoading = () => {
    if (mapRendererRef.current instanceof MapboxRenderer) {
      const map = (mapRendererRef.current as any).map;
      if (map) {
        console.log('Manual style check:');
        console.log('- Map exists:', !!map);
        console.log('- Style loaded:', map.isStyleLoaded());
        console.log('- Map loaded:', map.loaded());
        console.log('- Current style:', map.getStyle());
        
        if (map.isStyleLoaded()) {
          setStyleLoaded(true);
          console.log('Manually setting styleLoaded to true');
        }
      }
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
        <Toolbar sx={{ position: 'relative' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mobile Movement Pattern Recognition
          </Typography>
          {/* Simulation Controls - Centered Absolutely */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              height: '100%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              zIndex: 1,
            }}
          >
            {/* Simulation Speed Button (moved to beginning) */}
            <Tooltip title="Simulation Speed" placement="bottom">
              <IconButton
                onClick={handleSpeedButtonClick}
                color="primary"
                size="small"
              >
                <Speed sx={{ mr: 0.5, fontSize: 20 }} />
                <span style={{ fontWeight: 500, fontSize: 14 }}>{simulationSpeed.toFixed(1)}x</span>
              </IconButton>
            </Tooltip>
            <Popover
              id={speedId}
              open={openSpeedPopover}
              anchorEl={speedAnchorEl}
              onClose={handleSpeedPopoverClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              PaperProps={{ sx: { p: 2, minWidth: 200 } }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Simulation Speed</Typography>
                <Slider
                  value={simulationSpeed}
                  min={1}
                  max={100}
                  step={0.1}
                  marks={[{ value: 1, label: '1x' }]}
                  onChange={(_, value) => setSimulationSpeed(Number(value))}
                  valueLabelDisplay="auto"
                  sx={{ width: 140 }}
                />
                <TextField
                  label="Speed"
                  size="small"
                  value={simulationSpeed}
                  onChange={e => {
                    let v = parseFloat(e.target.value);
                    if (isNaN(v)) v = 1;
                    if (v < 1) v = 1;
                    if (v > 100) v = 100;
                    setSimulationSpeed(v);
                  }}
                  inputProps={{ min: 1, max: 100, step: 0.1, type: 'number', style: { width: 60 } }}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Popover>
            {/* Play/Stop/Step/Reset/Clear Buttons */}
            <Tooltip title="Start Simulation" placement="bottom">
              <IconButton
                onClick={handleStart}
                disabled={running || isLoading}
                color="success"
                size="small"
              >
                <PlayArrow />
              </IconButton>
            </Tooltip>
            <Tooltip title="Stop Simulation" placement="bottom">
              <IconButton
                onClick={handleStop}
                disabled={!running}
                color="error"
                size="small"
              >
                <Stop />
              </IconButton>
            </Tooltip>
            <Tooltip title="Step Forward" placement="bottom">
              <IconButton
                onClick={handleStep}
                disabled={running || isLoading}
                color="primary"
                size="small"
              >
                <SkipNext />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Simulation" placement="bottom">
              <IconButton
                onClick={handleReset}
                disabled={isLoading}
                color="warning"
                size="small"
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Cache" placement="bottom">
              <IconButton
                onClick={handleClearCache}
                color="info"
                size="small"
              >
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
          {/* Status Chips - Right */}
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
            {/* Removed Cached and Style Loaded chips */}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content: Responsive Two-Column Layout */}
      <Box sx={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}>
        {/* Map View: Full width, editor floats above */}
        <Box sx={{ width: '100%', position: 'relative', minWidth: 0, height: '100%' }}>
          <div
            id={MAP_CONTAINER_ID}
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #e0e0e0',
            }}
          />
          {/* Lighting Controls Overlay */}
          {isMapboxRenderer && (
            <MapLightingControls
              onLightPresetChange={handleLightPresetChange}
              onLabelVisibilityChange={handleLabelVisibilityChange}
              currentLightPreset={currentLightPreset}
              currentLabels={currentLabels}
              styleLoaded={styleLoaded}
            />
          )}
          {/* Floating Editor Panel */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 0, sm: 24 },
              right: { xs: 0, sm: editorOpen ? 24 : 0 },
              // Remove bottom and maxHeight gap
              width: { xs: '100vw', sm: 'auto' },
              minWidth: { xs: '100vw', sm: 320 },
              maxWidth: { xs: '100vw', sm: 480 },
              height: { xs: '100vh', sm: 'auto' },
              minHeight: { xs: '100vh', sm: 200 },
              maxHeight: { xs: '100vh', sm: '85vh' },
              zIndex: 1200,
              transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
              boxShadow: editorOpen ? 6 : 'none',
              borderRadius: { xs: 0, sm: 3 },
              overflow: 'visible',
              backgroundColor: editorOpen ? 'rgba(255,255,255,0.98)' : 'transparent',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
            }}
          >
            {/* Toggle button (chevron) */}
            <IconButton
              onClick={() => setEditorOpen((open) => !open)}
              sx={{
                position: 'absolute',
                left: editorOpen ? { xs: 8, sm: -36 } : 'auto',
                right: !editorOpen ? { xs: 8, sm: 16 } : 'auto',
                top: { xs: 8, sm: 24 },
                zIndex: 1300,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                boxShadow: 2,
                transition: 'left 0.3s, right 0.3s',
              }}
              size="small"
            >
              {editorOpen ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
            {/* Editor content (tabs) */}
            {editorOpen && (
              <Paper
                elevation={0}
                sx={{
                  width: { xs: '100vw', sm: 'auto' },
                  minWidth: { xs: '100vw', sm: 320 },
                  maxWidth: { xs: '100vw', sm: 480 },
                  height: { xs: '100vh', sm: 'auto' },
                  minHeight: { xs: '100vh', sm: 200 },
                  maxHeight: { xs: '100vh', sm: '100vh' },
                  borderRadius: { xs: 0, sm: 3 },
                  boxShadow: 'none',
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
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
                  <Tab label="Import/Export" />
                </Tabs>
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', maxHeight: '100%', pb: 2, px: 2 }}>
                  {renderTabContent()}
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App; 