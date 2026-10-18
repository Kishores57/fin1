/**
 * Spherical & Geospatial Geometry Helpers
 * Uses WGS-84 ellipsoid sphere approximations (Earth radius = 6371008.8m)
 * Ensures accurate geodesic area calculations and robust point-in-polygon tests.
 */

const EARTH_RADIUS = 6371008.8; // meters

/**
 * Convert degrees to radians
 */
export function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates geodesic distance between two points in meters (Haversine formula)
 * pt1: [lng, lat]
 * pt2: [lng, lat]
 */
export function distanceMeters(pt1, pt2) {
  const [lng1, lat1] = pt1;
  const [lng2, lat2] = pt2;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Validates a GeoJSON Polygon or array of [lng, lat] coordinate rings
 */
export function validatePolygon(geometry) {
  let coords = null;
  if (!geometry) return { valid: false, error: 'Geometry is null or undefined' };

  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    coords = geometry.coordinates[0];
  } else if (Array.isArray(geometry) && geometry.length >= 3) {
    coords = geometry;
  } else if (Array.isArray(geometry.coordinates)) {
    coords = geometry.coordinates;
  }

  if (!coords || coords.length < 3) {
    return { valid: false, error: 'Polygon must contain at least 3 vertices' };
  }

  // Ensure coordinates are valid numbers [lng, lat]
  for (let i = 0; i < coords.length; i++) {
    const pt = coords[i];
    if (!Array.isArray(pt) || pt.length < 2) {
      return { valid: false, error: `Invalid coordinate pair at vertex index ${i}` };
    }
    const [lng, lat] = pt;
    if (isNaN(lng) || isNaN(lat) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { valid: false, error: `Coordinate out of bounds at vertex index ${i}: [${lng}, ${lat}]` };
    }
  }

  // Ensure closed polygon ring
  const first = coords[0];
  const last = coords[coords.length - 1];
  const isClosed = Math.abs(first[0] - last[0]) < 1e-7 && Math.abs(first[1] - last[1]) < 1e-7;
  const closedCoords = isClosed ? coords : [...coords, [first[0], first[1]]];

  return { valid: true, ring: closedCoords };
}

/**
 * Geodesic Area Calculation for a spherical polygon (in square meters)
 * Uses spherical excess formula.
 */
export function calculateGeodesicArea(ring) {
  if (!ring || ring.length < 4) return 0;

  let totalAngle = 0;
  const len = ring.length - 1;

  for (let i = 0; i < len; i++) {
    const p1 = ring[i];
    const p2 = ring[i + 1];

    const lon1 = toRad(p1[0]);
    const lat1 = toRad(p1[1]);
    const lon2 = toRad(p2[0]);
    const lat2 = toRad(p2[1]);

    totalAngle += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const area = Math.abs((totalAngle * EARTH_RADIUS * EARTH_RADIUS) / 2.0);
  return area;
}

/**
 * Robust Point-in-Polygon test (Ray-casting algorithm with boundary tolerance)
 * pt: [lng, lat]
 * ring: array of [lng, lat]
 */
export function isPointInPolygon(pt, ring, onBoundaryTolerance = 1e-7) {
  const [x, y] = pt;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    // Check if point lies directly on horizontal edge segment
    const onSegmentY = (y >= Math.min(yi, yj) - onBoundaryTolerance) && (y <= Math.max(yi, yj) + onBoundaryTolerance);
    const onSegmentX = (x >= Math.min(xi, xj) - onBoundaryTolerance) && (x <= Math.max(xi, xj) + onBoundaryTolerance);

    if (onSegmentY && onSegmentX) {
      const crossProduct = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
      if (Math.abs(crossProduct) < 1e-9) {
        return true; // Included on boundary
      }
    }

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculates bounding box of a polygon ring: [minLng, minLat, maxLng, maxLat]
 */
export function getBoundingBox(ring) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, minLat, maxLng, maxLat };
}
