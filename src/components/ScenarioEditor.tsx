// ScenarioEditor.tsx
// Flag-based UI control for scenario editing
// Checkboxes control what fields are shown/used

import React, { useState, ChangeEvent, MouseEvent } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Select,
  MenuItem,
  Stack,
  Grid,
} from '@mui/material';
import { ExpandLess, ExpandMore, Delete, Add, PlayArrow } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';

function randomId() {
  return Math.random().toString(36).substr(2, 9);
}

// UI Control Flags
enum EffectFlags {
  HAS_DURATION = 1 << 0,  // If unchecked = forever, if checked = shows duration field
  HAS_RANGE    = 1 << 1,  // If unchecked = outside, if checked = shows range field
  HAS_SPEED    = 1 << 2,  // If unchecked = speed 0, if checked = shows speed field
}

const TARGET_TYPE_OPTIONS = [
  { value: 'count', label: 'count' },
  { value: 'percent', label: '%' },
];

const ScenarioEditor: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [openEvents, setOpenEvents] = useState<{ [id: string]: boolean }>({});

  // Event handlers
  const handleEventChange = (id: string, key: string, value: any) => {
    setEvents(events =>
      events.map(ev => (ev.id === id ? { ...ev, [key]: value } : ev))
    );
  };

  const handleAddEvent = () => {
    setEvents([
      ...events,
      {
        id: randomId(),
        name: '',
        effects: [],
      },
    ]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events => events.filter(ev => ev.id !== id));
  };

  const handleRunEvent = (id: string) => {
    alert(`Run event: ${events.find(ev => ev.id === id)?.name || ''}`);
  };

  // Collapsible panels
  const toggleEventOpen = (id: string) => {
    setOpenEvents(open => ({ ...open, [id]: !open[id] }));
  };

  // Effect/Group handlers
  const handleAddEffect = (eventId: string) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: [
                ...ev.effects,
                {
                  id: randomId(),
                  flags: EffectFlags.HAS_DURATION | EffectFlags.HAS_RANGE | EffectFlags.HAS_SPEED,
                  targetValue: 1,
                  targetType: 'count',
                  range: 100,
                  duration: 10,
                  speed: 1.5,
                },
              ],
            }
          : ev
      )
    );
  };

  const handleDeleteEffect = (eventId: string, effectId: string) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? { ...ev, effects: ev.effects.filter((ef: any) => ef.id !== effectId) }
          : ev
      )
    );
  };

  const handleEffectChange = (eventId: string, effectId: string, key: string, value: any) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: ev.effects.map((ef: any) =>
                ef.id === effectId ? { ...ef, [key]: value } : ef
              ),
            }
          : ev
      )
    );
  };

  // Flag handlers
  const handleFlagChange = (eventId: string, effectId: string, flag: EffectFlags) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: ev.effects.map((ef: any) =>
                ef.id === effectId ? { ...ef, flags: ef.flags ^ flag } : ef
              ),
            }
          : ev
      )
    );
  };

  // Helper function to check if flag is set
  const hasFlag = (effect: any, flag: EffectFlags): boolean => {
    return (effect.flags & flag) !== 0;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ pl: 2, pt: 2, pb: 1, mb: 0 }}>
          Events
        </Typography>
        <Button 
          startIcon={<Add />} 
          onClick={handleAddEvent} 
          variant="contained" 
          size="small"
          fullWidth
        >
          Add Event
        </Button>
      </Box>

      {/* Events List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {events.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="body2" color="text.secondary">
              No events created yet. Click "Add Event" to get started.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {events.map(event => (
              <Paper key={event.id} elevation={1} sx={{ overflow: 'hidden' }}>
                {/* Event Header */}
                <ListItem
                  sx={{ 
                    px: 2, 
                    py: 1,
                    backgroundColor: '#f8f9fa',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                  }}
                >
                  {/* Collapse/Expand Button (left) */}
                  <IconButton onClick={() => toggleEventOpen(event.id)} size="small" sx={{ mr: 1 }}>
                    {openEvents[event.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                  {/* Main Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ListItemText
                      primary={
                        <TextField
                          label="Event Name"
                          value={event.name}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleEventChange(event.id, 'name', e.target.value)}
                          size="small"
                          variant="standard"
                          fullWidth
                          onClick={e => e.stopPropagation()}
                          sx={{ minWidth: 0 }}
                        />
                      }
                      secondary={
                        event.effects && event.effects.length > 0
                          ? `${event.effects.length} effect${event.effects.length > 1 ? 's' : ''}`
                          : 'No effects'
                      }
                    />
                  </Box>
                  {/* Run/Delete Buttons (right) */}
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    <IconButton 
                      onClick={(e: MouseEvent) => { 
                        e.stopPropagation(); 
                        handleRunEvent(event.id); 
                      }} 
                      size="small"
                      title="Run"
                    >
                      <PlayArrow fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={(e: MouseEvent) => { 
                        e.stopPropagation(); 
                        handleDeleteEvent(event.id); 
                      }} 
                      size="small"
                      title="Delete"
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>

                {/* Event Content */}
                <Collapse in={openEvents[event.id]} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2 }}>
                    {event.effects && event.effects.length > 0 ? (
                      <Stack spacing={2}>
                        {event.effects.map((effect: any) => (
                          <Paper key={effect.id} sx={{ p: 2, backgroundColor: '#fafafa' }}>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>Effect Configuration</Typography>
                            
                            {/* Target Configuration */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                              <TextField
                                label="Target"
                                type="number"
                                value={effect.targetValue}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleEffectChange(event.id, effect.id, 'targetValue', Number(e.target.value))}
                                size="small"
                                sx={{ flex: 1 }}
                              />
                              <Select
                                value={effect.targetType}
                                onChange={(e: SelectChangeEvent) => handleEffectChange(event.id, effect.id, 'targetType', e.target.value)}
                                size="small"
                                sx={{ minWidth: 80 }}
                              >
                                {TARGET_TYPE_OPTIONS.map(opt => (
                                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                              </Select>
                            </Box>

                            {/* Flags Configuration */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Field Controls:
                              </Typography>
                              <Stack direction="row" spacing={2} flexWrap="wrap">
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={hasFlag(effect, EffectFlags.HAS_DURATION)}
                                      onChange={() => handleFlagChange(event.id, effect.id, EffectFlags.HAS_DURATION)}
                                      size="small"
                                    />
                                  }
                                  label="Duration"
                                  sx={{ fontSize: '0.875rem' }}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={hasFlag(effect, EffectFlags.HAS_RANGE)}
                                      onChange={() => handleFlagChange(event.id, effect.id, EffectFlags.HAS_RANGE)}
                                      size="small"
                                    />
                                  }
                                  label="Range"
                                  sx={{ fontSize: '0.875rem' }}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={hasFlag(effect, EffectFlags.HAS_SPEED)}
                                      onChange={() => handleFlagChange(event.id, effect.id, EffectFlags.HAS_SPEED)}
                                      size="small"
                                    />
                                  }
                                  label="Speed"
                                  sx={{ fontSize: '0.875rem' }}
                                />
                              </Stack>
                            </Box>

                            {/* Dynamic Fields Based on Flags */}
                            <Grid container spacing={2}>
                              {/* Duration Field */}
                              <Grid item xs={12} sm={4}>
                                {hasFlag(effect, EffectFlags.HAS_DURATION) ? (
                                  <TextField
                                    label="Duration (s)"
                                    type="number"
                                    value={effect.duration}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleEffectChange(event.id, effect.id, 'duration', Number(e.target.value))}
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 0 }}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">s</InputAdornment>,
                                    }}
                                  />
                                ) : (
                                  <Box sx={{ 
                                    p: 1, 
                                    backgroundColor: '#f0f0f0', 
                                    borderRadius: 1,
                                    textAlign: 'center'
                                  }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Duration: Forever
                                    </Typography>
                                  </Box>
                                )}
                              </Grid>

                              {/* Range Field */}
                              <Grid item xs={12} sm={4}>
                                {hasFlag(effect, EffectFlags.HAS_RANGE) ? (
                                  <TextField
                                    label="Range (m)"
                                    type="number"
                                    value={effect.range}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleEffectChange(event.id, effect.id, 'range', Number(e.target.value))}
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 1 }}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                                    }}
                                  />
                                ) : (
                                  <Box sx={{ 
                                    p: 1, 
                                    backgroundColor: '#f0f0f0', 
                                    borderRadius: 1,
                                    textAlign: 'center'
                                  }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Range: Outside
                                    </Typography>
                                  </Box>
                                )}
                              </Grid>

                              {/* Speed Field */}
                              <Grid item xs={12} sm={4}>
                                {hasFlag(effect, EffectFlags.HAS_SPEED) ? (
                                  <TextField
                                    label="Speed (m/s)"
                                    type="number"
                                    value={effect.speed}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleEffectChange(event.id, effect.id, 'speed', Number(e.target.value))}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">m/s</InputAdornment>,
                                    }}
                                  />
                                ) : (
                                  <Box sx={{ 
                                    p: 1, 
                                    backgroundColor: '#f0f0f0', 
                                    borderRadius: 1,
                                    textAlign: 'center'
                                  }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Speed: 0 m/s
                                    </Typography>
                                  </Box>
                                )}
                              </Grid>
                            </Grid>

                            {/* Delete Effect Button */}
                            <Box sx={{ mt: 2, textAlign: 'right' }}>
                              <IconButton 
                                onClick={() => handleDeleteEffect(event.id, effect.id)} 
                                size="small"
                                color="error"
                                title="Delete Effect"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          No effects configured for this event.
                        </Typography>
                      </Box>
                    )}
                    
                    <Button 
                      startIcon={<Add />} 
                      onClick={() => handleAddEffect(event.id)} 
                      size="small"
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Add Effect/Group
                    </Button>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default ScenarioEditor; 