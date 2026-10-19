/**
 * GeoJSON polygon boundaries for predefined study zones in Nashik survey area
 * Coordinates: [longitude, latitude] in GeoJSON standard
 */
export const STUDY_ZONES = [
  {
    id: 'zone-kkwagh-full-campus',
    name: 'KK Wagh College Campus (Entire Institute Extent)',
    description: 'Comprehensive boundary of K.K. Wagh Institute of Engineering Education & Research (KKWIEER), Nashik with 290+ surveyed trees.',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.8198, 20.0123],
          [73.8228, 20.0123],
          [73.8228, 20.0147],
          [73.8198, 20.0147],
          [73.8198, 20.0123]
        ]
      ]
    }
  },
  {
    id: 'zone-kkwagh-polytechnic-hostel',
    name: 'KK Wagh North Campus (Polytechnic & Hostel Grove)',
    description: 'Northern campus quadrant bordering Saraswati Nagar road, girl hostels and polytechnic lawns with mature shade trees.',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.8200, 20.0135],
          [73.8226, 20.0135],
          [73.8226, 20.0146],
          [73.8200, 20.0146],
          [73.8200, 20.0135]
        ]
      ]
    }
  },
  {
    id: 'zone-kkwagh-central-academic',
    name: 'KK Wagh Central Sector (Main Academic Block & Lawns)',
    description: 'Central campus core housing Main Building, Library, central circle avenue and workshop corridors.',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.8202, 20.0128],
          [73.8225, 20.0128],
          [73.8225, 20.0138],
          [73.8202, 20.0138],
          [73.8202, 20.0128]
        ]
      ]
    }
  },
  {
    id: 'zone-kkwagh-sports-south',
    name: 'KK Wagh South Campus (Sports Ground & Peripheral Avenue)',
    description: 'Southern sports complex and peripheral tree line bordering main access gates and agricultural field boundary.',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.8200, 20.0124],
          [73.8226, 20.0124],
          [73.8226, 20.0130],
          [73.8200, 20.0130],
          [73.8200, 20.0124]
        ]
      ]
    }
  }
];

export default STUDY_ZONES;
