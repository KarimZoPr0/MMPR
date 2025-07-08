// Utility to dynamically load CSS for different map renderers
export class CSSLoader {
  private static loadedCSS: Set<string> = new Set();

  static loadMapboxCSS(): void {
    if (this.loadedCSS.has('mapbox')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.id = 'mapbox-css';
    document.head.appendChild(link);
    this.loadedCSS.add('mapbox');
  }

  static loadLeafletCSS(): void {
    if (this.loadedCSS.has('leaflet')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.id = 'leaflet-css';
    document.head.appendChild(link);
    this.loadedCSS.add('leaflet');
  }

  static loadDeckGLCSS(): void {
    if (this.loadedCSS.has('deckgl')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/deck.gl@latest/dist.min.css';
    link.id = 'deckgl-css';
    document.head.appendChild(link);
    this.loadedCSS.add('deckgl');
  }

  static removeCSS(type: string): void {
    const existingCSS = document.getElementById(`${type}-css`);
    if (existingCSS) {
      existingCSS.remove();
      this.loadedCSS.delete(type);
    }
  }

  static clearAllMapCSS(): void {
    this.removeCSS('mapbox');
    this.removeCSS('leaflet');
    this.removeCSS('deckgl');
  }
} 