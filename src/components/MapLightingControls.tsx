import React from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
} from '@mui/material';
import {
  Lightbulb,
  Visibility,
  ExpandMore,
  WbSunny,
  NightsStay,
  WbSunnyOutlined,
  NightsStayOutlined,
} from '@mui/icons-material';

interface MapLightingControlsProps {
  onLightPresetChange: (preset: 'dawn' | 'day' | 'dusk' | 'night') => void;
  onLabelVisibilityChange: (settings: {
    showPlaceLabels?: boolean;
    showPOILabels?: boolean;
    showRoadLabels?: boolean;
    showTransitLabels?: boolean;
  }) => void;
  currentLightPreset: string;
  currentLabels: {
    showPlaceLabels: boolean;
    showPOILabels: boolean;
    showRoadLabels: boolean;
    showTransitLabels: boolean;
  };
  styleLoaded?: boolean;
}

export const MapLightingControls: React.FC<MapLightingControlsProps> = ({
  onLightPresetChange,
  onLabelVisibilityChange,
  currentLightPreset,
  currentLabels,
  styleLoaded = true,
}) => {

  const handlePresetChange = (preset: 'dawn' | 'day' | 'dusk' | 'night') => {
    if (styleLoaded) {
      onLightPresetChange(preset);
    }
  };

  const handleLabelChange = (labelType: string, value: boolean) => {
    if (styleLoaded) {
      const settings: any = {};
      settings[labelType] = value;
      onLabelVisibilityChange(settings);
    }
  };

  const getPresetIcon = (preset: string) => {
    switch (preset) {
      case 'dawn':
        return <WbSunnyOutlined />;
      case 'day':
        return <WbSunny />;
      case 'dusk':
        return <NightsStayOutlined />;
      case 'night':
        return <NightsStay />;
      default:
        return <Lightbulb />;
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        left: 20,
        p: 1, // smaller padding
        zIndex: 1000,
        minWidth: 200,
        maxWidth: 260,
        width: 260,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Lightbulb sx={{ mr: 1, fontSize: 20 }} />
        <Typography variant="subtitle2">Lighting Controls</Typography>
        {!styleLoaded && (
          <Chip 
            label="Style Loading..." 
            size="small" 
            color="warning" 
            sx={{ ml: 'auto', fontSize: 11 }}
          />
        )}
      </Box>

      {/* Light Presets */}
      <Accordion defaultExpanded sx={{ boxShadow: 'none', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 32 }}>
          <Typography variant="subtitle2">Light Presets</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel sx={{ fontSize: 13 }}>Light Preset</InputLabel>
            <Select
              value={currentLightPreset}
              label="Light Preset"
              onChange={(e) => handlePresetChange(e.target.value as any)}
              disabled={!styleLoaded}
              size="small"
            >
              <MenuItem value="dawn">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WbSunnyOutlined sx={{ mr: 1, fontSize: 18 }} />
                  <span style={{ fontSize: 13 }}>Dawn</span>
                </Box>
              </MenuItem>
              <MenuItem value="day">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WbSunny sx={{ mr: 1, fontSize: 18 }} />
                  <span style={{ fontSize: 13 }}>Day</span>
                </Box>
              </MenuItem>
              <MenuItem value="dusk">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NightsStayOutlined sx={{ mr: 1, fontSize: 18 }} />
                  <span style={{ fontSize: 13 }}>Dusk</span>
                </Box>
              </MenuItem>
              <MenuItem value="night">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NightsStay sx={{ mr: 1, fontSize: 18 }} />
                  <span style={{ fontSize: 13 }}>Night</span>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handlePresetChange('dawn')}
              startIcon={<WbSunnyOutlined sx={{ fontSize: 16 }} />}
              disabled={!styleLoaded}
            >
              Dawn
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handlePresetChange('day')}
              startIcon={<WbSunny sx={{ fontSize: 16 }} />}
              disabled={!styleLoaded}
            >
              Day
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handlePresetChange('dusk')}
              startIcon={<NightsStayOutlined sx={{ fontSize: 16 }} />}
              disabled={!styleLoaded}
            >
              Dusk
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handlePresetChange('night')}
              startIcon={<NightsStay sx={{ fontSize: 16 }} />}
              disabled={!styleLoaded}
            >
              Night
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Label Visibility */}
      <Accordion sx={{ boxShadow: 'none', mb: 0 }}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 32 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Visibility sx={{ mr: 1, fontSize: 18 }} />
            <Typography variant="subtitle2">Labels</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={currentLabels.showPlaceLabels}
                onChange={(e) => handleLabelChange('showPlaceLabels', e.target.checked)}
                disabled={!styleLoaded}
                size="small"
              />
            }
            label={<span style={{ fontSize: 13 }}>Place Labels</span>}
            sx={{ mb: 0.5 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={currentLabels.showPOILabels}
                onChange={(e) => handleLabelChange('showPOILabels', e.target.checked)}
                disabled={!styleLoaded}
                size="small"
              />
            }
            label={<span style={{ fontSize: 13 }}>POI Labels</span>}
            sx={{ mb: 0.5 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={currentLabels.showRoadLabels}
                onChange={(e) => handleLabelChange('showRoadLabels', e.target.checked)}
                disabled={!styleLoaded}
                size="small"
              />
            }
            label={<span style={{ fontSize: 13 }}>Road Labels</span>}
            sx={{ mb: 0.5 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={currentLabels.showTransitLabels}
                onChange={(e) => handleLabelChange('showTransitLabels', e.target.checked)}
                disabled={!styleLoaded}
                size="small"
              />
            }
            label={<span style={{ fontSize: 13 }}>Transit Labels</span>}
            sx={{ mb: 0.5 }}
          />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}; 