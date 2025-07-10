import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ViewInAr,
  ViewModule,
  RotateLeft,
  RotateRight,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

interface Map3DControlsProps {
  onToggle3D: (enabled: boolean) => void;
  onPitchChange: (pitch: number) => void;
  onBearingChange: (bearing: number) => void;
  is3DEnabled: boolean;
  currentPitch: number;
  currentBearing: number;
}

export const Map3DControls: React.FC<Map3DControlsProps> = ({
  onToggle3D,
  onPitchChange,
  onBearingChange,
  is3DEnabled,
  currentPitch,
  currentBearing,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePitchChange = (_event: Event, newValue: number | number[]) => {
    onPitchChange(newValue as number);
  };

  const handleBearingChange = (_event: Event, newValue: number | number[]) => {
    onBearingChange(newValue as number);
  };

  const resetView = () => {
    onPitchChange(0);
    onBearingChange(0);
  };

  const rotateLeft = () => {
    onBearingChange(currentBearing - 45);
  };

  const rotateRight = () => {
    onBearingChange(currentBearing + 45);
  };

  const increasePitch = () => {
    onPitchChange(Math.min(60, currentPitch + 15));
  };

  const decreasePitch = () => {
    onPitchChange(Math.max(0, currentPitch - 15));
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        p: 2,
        zIndex: 1000,
        minWidth: 280,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          3D Controls
        </Typography>
        <Tooltip title={is3DEnabled ? 'Disable 3D View' : 'Enable 3D View'}>
          <IconButton
            onClick={() => onToggle3D(!is3DEnabled)}
            color={is3DEnabled ? 'primary' : 'default'}
          >
            {is3DEnabled ? <ViewInAr /> : <ViewModule />}
          </IconButton>
        </Tooltip>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={is3DEnabled}
            onChange={(e) => onToggle3D(e.target.checked)}
          />
        }
        label="3D Mode"
        sx={{ mb: 2 }}
      />

      {is3DEnabled && (
        <>
          {/* Quick Controls */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Tooltip title="Reset View">
              <IconButton onClick={resetView} size="small">
                <ViewModule />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate Left">
              <IconButton onClick={rotateLeft} size="small">
                <RotateLeft />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate Right">
              <IconButton onClick={rotateRight} size="small">
                <RotateRight />
              </IconButton>
            </Tooltip>
            <Tooltip title="Increase Pitch">
              <IconButton onClick={increasePitch} size="small">
                <TrendingUp />
              </IconButton>
            </Tooltip>
            <Tooltip title="Decrease Pitch">
              <IconButton onClick={decreasePitch} size="small">
                <TrendingDown />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Advanced Controls */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Pitch: {currentPitch.toFixed(1)}°
            </Typography>
            <Slider
              value={currentPitch}
              onChange={handlePitchChange}
              min={0}
              max={60}
              step={1}
              marks={[
                { value: 0, label: '0°' },
                { value: 30, label: '30°' },
                { value: 60, label: '60°' },
              ]}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Bearing: {currentBearing.toFixed(1)}°
            </Typography>
            <Slider
              value={currentBearing}
              onChange={handleBearingChange}
              min={0}
              max={360}
              step={15}
              marks={[
                { value: 0, label: 'N' },
                { value: 90, label: 'E' },
                { value: 180, label: 'S' },
                { value: 270, label: 'W' },
                { value: 360, label: 'N' },
              ]}
              size="small"
            />
          </Box>
        </>
      )}
    </Paper>
  );
}; 