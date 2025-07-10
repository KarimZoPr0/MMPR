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
import { HexColorPicker } from 'react-colorful';
import Popover from '@mui/material/Popover';

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

// Define available actions for effects
const EFFECT_ACTIONS = [
  {
    value: 'setSpeed',
    label: 'Set Speed',
    fields: [
      { name: 'speed', label: 'Speed (m/s)', type: 'number', min: 0, adornment: 'm/s' },
      { name: 'duration', label: 'Duration (s)', type: 'number', min: 0, adornment: 's' },
    ],
  },
  {
    value: 'wait',
    label: 'Wait',
    fields: [
      { name: 'duration', label: 'Duration (s)', type: 'number', min: 0, adornment: 's' },
    ],
  },
  // Add more actions here as needed
];

// Define available fields for effects
const EFFECT_FIELDS = [
  { value: 'duration', label: 'Duration (s)', type: 'number', min: 0, adornment: 's' },
  { value: 'speed', label: 'Speed (m/s)', type: 'number', min: 0, adornment: 'm/s' },
  { value: 'range', label: 'Range (m)', type: 'number', min: 1, adornment: 'm' },
  // Add more fields here as needed
];

const ScenarioEditor: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [openEvents, setOpenEvents] = useState<{ [id: string]: boolean }>({});
  // Add state for color picker popover
  const [colorPickerAnchor, setColorPickerAnchor] = useState<{ anchor: HTMLElement | null, eventId: string | null, effectId: string | null }>({ anchor: null, eventId: null, effectId: null });

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
                  color: '#3388ff',
                  actions: [], // sequence of { type, values }
                  targetValue: 1,
                  targetType: 'count',
                },
              ],
            }
          : ev
      )
    );
  };

  const handleAddActionToEffect = (eventId: string, effectId: string) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: ev.effects.map((ef: any) =>
                ef.id === effectId
                  ? {
                      ...ef,
                      actions: [
                        ...ef.actions,
                        { type: EFFECT_ACTIONS[0].value, values: {} },
                      ],
                    }
                  : ef
              ),
            }
          : ev
      )
    );
  };

  const handleDeleteActionFromEffect = (eventId: string, effectId: string, idx: number) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: ev.effects.map((ef: any) =>
                ef.id === effectId
                  ? {
                      ...ef,
                      actions: ef.actions.filter((_: any, i: number) => i !== idx),
                    }
                  : ef
              ),
            }
          : ev
      )
    );
  };

  const handleActionTypeChange = (eventId: string, effectId: string, idx: number, newType: string) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: ev.effects.map((ef: any) =>
                ef.id === effectId
                  ? {
                      ...ef,
                      actions: ef.actions.map((a: any, i: number) =>
                        i === idx ? { type: newType, values: {} } : a
                      ),
                    }
                  : ef
              ),
            }
          : ev
      )
    );
  };

  const handleActionValueChange = (eventId: string, effectId: string, idx: number, field: string, value: any) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: ev.effects.map((ef: any) =>
                ef.id === effectId
                  ? {
                      ...ef,
                      actions: ef.actions.map((a: any, i: number) =>
                        i === idx ? { ...a, values: { ...a.values, [field]: value } } : a
                      ),
                    }
                  : ef
              ),
            }
          : ev
      )
    );
  };

  const handleEffectColorChange = (eventId: string, effectId: string, color: string) => {
    setEvents(events =>
      events.map(ev =>
        ev.id === eventId
          ? {
              ...ev,
              effects: ev.effects.map((ef: any) =>
                ef.id === effectId ? { ...ef, color } : ef
              ),
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
  // The old flag handlers are removed as per the new UI.

  // Helper function to check if flag is set
  // The old flag logic is removed as per the new UI.

  const handleOpenColorPicker = (event: React.MouseEvent<HTMLElement>, eventId: string, effectId: string) => {
    setColorPickerAnchor({ anchor: event.currentTarget, eventId, effectId });
  };
  const handleCloseColorPicker = () => {
    setColorPickerAnchor({ anchor: null, eventId: null, effectId: null });
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
                          <Paper key={effect.id} sx={{ p: 2, backgroundColor: '#fafafa', borderLeft: `6px solid ${effect.color || '#3388ff'}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ flex: 1 }}>Effect Configuration</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: effect.color || '#3388ff',
                                    border: '2px solid #fff',
                                    boxShadow: '0 0 0 2px #ccc',
                                    cursor: 'pointer',
                                    transition: 'box-shadow 0.2s',
                                    '&:hover': { boxShadow: '0 0 0 3px #888' },
                                  }}
                                  onClick={e => handleOpenColorPicker(e, event.id, effect.id)}
                                  title="Pick color"
                                />
                                <Popover
                                  open={Boolean(colorPickerAnchor.anchor && colorPickerAnchor.eventId === event.id && colorPickerAnchor.effectId === effect.id)}
                                  anchorEl={colorPickerAnchor.anchor}
                                  onClose={handleCloseColorPicker}
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                  PaperProps={{ sx: { p: 2, boxShadow: 3 } }}
                                >
                                  <HexColorPicker
                                    color={effect.color || '#3388ff'}
                                    onChange={color => handleEffectColorChange(event.id, effect.id, color)}
                                    style={{ width: 180, height: 120 }}
                                  />
                                </Popover>
                              </Box>
                            </Box>
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
                            {/* Field Controls (sequence) */}
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Action Sequence:
                            </Typography>
                            <Stack spacing={1}>
                              {effect.actions && effect.actions.length > 0 && effect.actions.map((a: any, idx: number) => {
                                const actionMeta = EFFECT_ACTIONS.find(meta => meta.value === a.type) || EFFECT_ACTIONS[0];
                                return (
                                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Select
                                      value={a.type}
                                      onChange={e => handleActionTypeChange(event.id, effect.id, idx, e.target.value)}
                                      size="small"
                                      sx={{ minWidth: 120 }}
                                    >
                                      {EFFECT_ACTIONS.map(meta => (
                                        <MenuItem key={meta.value} value={meta.value}>{meta.label}</MenuItem>
                                      ))}
                                    </Select>
                                    {actionMeta.fields.map(field => (
                                      <TextField
                                        key={field.name}
                                        label={field.label}
                                        type={field.type}
                                        value={a.values[field.name] ?? ''}
                                        onChange={e => handleActionValueChange(event.id, effect.id, idx, field.name, e.target.value)}
                                        size="small"
                                        inputProps={{ min: field.min }}
                                        InputProps={field.adornment ? { endAdornment: <InputAdornment position="end">{field.adornment}</InputAdornment> } : {}}
                                        sx={{ width: 120 }}
                                      />
                                    ))}
                                    <IconButton onClick={() => handleDeleteActionFromEffect(event.id, effect.id, idx)} size="small" color="error">
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Box>
                                );
                              })}
                              <Button onClick={() => handleAddActionToEffect(event.id, effect.id)} size="small" variant="outlined" startIcon={<Add />} sx={{ mt: 1, alignSelf: 'flex-start' }}>
                                Add Action
                              </Button>
                            </Stack>
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