# 3D Map Features

Your Mapbox implementation now includes comprehensive 3D capabilities! Here's what's available and how to use it.

## Features Added

### 1. 3D View Controls
- **Pitch Control**: Tilt the map from 0° (flat) to 60° (maximum tilt)
- **Bearing Control**: Rotate the map from 0° to 360°
- **3D Buildings**: Automatic 3D building rendering at zoom level 15+
- **Terrain**: Hillshade terrain visualization
- **Sky**: Atmospheric sky effects

### 2. Advanced Lighting System
- **Light Presets**: Dawn, Day, Dusk, Night with realistic lighting
- **Custom Lighting**: Ambient and directional light configuration
- **Shadow Casting**: Dynamic shadows for 3D buildings and terrain
- **Label Visibility**: Control place, POI, road, and transit labels
- **Real-time Lighting**: Dynamic lighting changes with smooth transitions

### 3. Interactive UI Controls
The `Map3DControls` component provides:
- Toggle switch for 3D mode
- Sliders for pitch and bearing adjustment
- Quick action buttons for preset views
- Real-time display of current values

The `MapLightingControls` component provides:
- Light preset selection (Dawn, Day, Dusk, Night)
- Label visibility toggles
- Custom lighting configuration with color pickers and sliders
- Shadow casting controls
- Real-time lighting preview

### 4. Programmatic API
The enhanced `MapboxRenderer` class includes:

```typescript
// Enable 3D view with custom pitch and bearing
mapRenderer.enable3DView(pitch: number, bearing: number, includeTerrain?: boolean);

// Disable 3D view
mapRenderer.disable3DView();

// Control pitch (0-60 degrees)
mapRenderer.setPitch(pitch: number);

// Control bearing (0-360 degrees)
mapRenderer.setBearing(bearing: number);

// Enhanced setView with 3D support
mapRenderer.setView(center: LatLng, zoom: number, pitch?: number, bearing?: number);

// Get current 3D state
mapRenderer.getPitch();
mapRenderer.getBearing();
mapRenderer.is3DEnabled();

// Lighting controls
mapRenderer.setLightPreset(preset: 'dawn' | 'day' | 'dusk' | 'night');
mapRenderer.setLabelVisibility(settings: {
  showPlaceLabels?: boolean;
  showPOILabels?: boolean;
  showRoadLabels?: boolean;
  showTransitLabels?: boolean;
});
mapRenderer.setCustomLighting(lighting: {
  type?: '3d' | 'flat';
  lights?: Array<{
    id: string;
    type: 'ambient' | 'directional' | 'flat';
    properties?: {
      color?: string;
      intensity?: number;
      direction?: [number, number];
      castShadows?: boolean;
      shadowIntensity?: number;
    };
  }>;
});

// Preset lighting methods
mapRenderer.setDawnLighting();
mapRenderer.setDayLighting();
mapRenderer.setDuskLighting();
mapRenderer.setNightLighting();

// Get lighting state
mapRenderer.getLightingState();
```

## Usage Examples

### Basic 3D View
```typescript
// Enable 3D with 45° pitch and 0° bearing
mapRenderer.enable3DView(45, 0);

// Disable 3D
mapRenderer.disable3DView();
```

### Lighting Examples
```typescript
// Set light presets
mapRenderer.setLightPreset('dawn');  // Warm morning light
mapRenderer.setLightPreset('day');   // Bright daylight
mapRenderer.setLightPreset('dusk');  // Golden hour
mapRenderer.setLightPreset('night'); // Dark night with subtle lighting

// Custom lighting
mapRenderer.setCustomLighting({
  type: '3d',
  lights: [
    {
      id: 'ambient',
      type: 'ambient',
      properties: {
        color: '#ff6b35',
        intensity: 0.3
      }
    },
    {
      id: 'directional',
      type: 'directional',
      properties: {
        color: '#ffffff',
        intensity: 0.8,
        direction: [210, 30],
        castShadows: true,
        shadowIntensity: 0.6
      }
    }
  ]
});

// Control label visibility
mapRenderer.setLabelVisibility({
  showPlaceLabels: true,
  showPOILabels: false,
  showRoadLabels: true,
  showTransitLabels: false
});
```

### Preset Views
```typescript
// Bird's eye view (high pitch)
mapRenderer.setView(center, 18, 60, 0);

// Street view (low pitch)
mapRenderer.setView(center, 17, 15, 0);

// Isometric view
mapRenderer.setView(center, 16, 45, 45);
```

### Animations
```typescript
// Rotate the map
let bearing = 0;
const animate = () => {
  bearing += 1;
  mapRenderer.setBearing(bearing);
  requestAnimationFrame(animate);
};
animate();

// Animate pitch
let pitch = 0;
let increasing = true;
const animatePitch = () => {
  if (increasing) {
    pitch += 1;
    if (pitch >= 60) increasing = false;
  } else {
    pitch -= 1;
    if (pitch <= 0) increasing = true;
  }
  mapRenderer.setPitch(pitch);
  requestAnimationFrame(animatePitch);
};
animatePitch();
```

## UI Integration

The 3D controls are automatically integrated into your main app. The controls panel appears in the top-right corner of the map and includes:

1. **3D Mode Toggle**: Enable/disable 3D view
2. **Quick Controls**: Reset, rotate, and pitch adjustment buttons
3. **Fine Control Sliders**: Precise pitch and bearing adjustment
4. **Real-time Feedback**: Current values displayed

## Performance Considerations

- 3D rendering is GPU-accelerated and generally performs well
- 3D buildings only appear at zoom level 15+ to maintain performance
- Terrain and sky layers add visual depth but minimal performance impact
- Consider disabling terrain in areas with complex topography if performance is an issue

## Browser Compatibility

3D features require:
- WebGL support
- Modern browser (Chrome, Firefox, Safari, Edge)
- Sufficient GPU memory for complex scenes

## Tips for Best Results

1. **Start with moderate pitch** (30-45°) for good balance of perspective and detail
2. **Use bearing to orient** the view for your specific use case
3. **Combine with zoom** for optimal viewing distance
4. **Consider lighting** - 3D buildings look best with good contrast
5. **Test on target devices** - mobile devices may have performance limitations

## Troubleshooting

- **3D buildings not showing**: Ensure zoom level is 15 or higher
- **Performance issues**: Try reducing pitch or disabling terrain
- **Controls not responding**: Check that the map is fully loaded
- **Visual artifacts**: Update your graphics drivers

## Future Enhancements

Potential additions:
- Custom 3D model support
- Advanced lighting controls
- 3D path visualization
- Height-based pedestrian rendering
- Custom shader effects 