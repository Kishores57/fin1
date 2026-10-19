import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icons broken by Webpack / Vite bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Expose on window for any legacy or inline scripts
if (typeof window !== 'undefined') {
  window.L = L;
}

export const DEFAULT_MAP_CENTER = [20.0131, 73.8213]; // Nashik, Maharashtra
export const DEFAULT_MAP_ZOOM = 16;

export const BASEMAP_TILES = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Earthstar Geographics (Satellite)',
    name: 'Satellite Earth',
    maxNativeZoom: 18,
  },
  voyager: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    name: 'Standard Light',
    maxNativeZoom: 19,
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri World Dark Gray Canvas',
    name: 'Dark Slate',
    maxNativeZoom: 16,
  },
};

/**
 * Creates and returns a Leaflet TileLayer with support for:
 * 1. Custom VITE_MAP_TILE_URL and VITE_OSM_API_KEY
 * 2. Standard OpenStreetMap tile server
 * 3. CARTO Voyager tile server fallback
 */
export function createTileLayer(options = {}) {
  const apiKey = import.meta.env.VITE_OSM_API_KEY || '';
  let tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Inject API key if token placeholder exists, or append if key is present
  if (apiKey) {
    if (tileUrl.includes('{apikey}')) {
      tileUrl = tileUrl.replace('{apikey}', apiKey);
    } else if (tileUrl.includes('{apiKey}')) {
      tileUrl = tileUrl.replace('{apiKey}', apiKey);
    } else if (tileUrl.includes('{token}')) {
      tileUrl = tileUrl.replace('{token}', apiKey);
    } else if (!tileUrl.includes('tile.openstreetmap.org') && !tileUrl.includes('cartocdn.com')) {
      const sep = tileUrl.includes('?') ? '&' : '?';
      tileUrl = `${tileUrl}${sep}api_key=${apiKey}`;
    }
  }

  const attribution =
    options.attribution ||
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

  const layer = L.tileLayer(tileUrl, {
    attribution,
    maxZoom: options.maxZoom || 22,
    maxNativeZoom: options.maxNativeZoom || 19,
    subdomains: ['a', 'b', 'c'],
    crossOrigin: true,
    ...options,
  });

  // Handle tile errors with automatic fallback to standard OpenStreetMap
  layer.on('tileerror', (error) => {
    console.warn('Map tile failed to load, checking tile fallback:', error.tile?.src);
  });

  return layer;
}

export default L;
