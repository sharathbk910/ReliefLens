export interface ReverseGeocodeResult {
  displayName: string;
  district: string;
  locationText: string;
  city?: string;
  state?: string;
  country?: string;
}

export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ReliefLens-Emergency-Coordination/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const town = addr.suburb || addr.neighbourhood || addr.residential || addr.town || addr.village || addr.city_district || addr.hamlet || '';
    const city = addr.city || addr.county || addr.state_district || '';
    const state = addr.state || '';
    const road = addr.road || addr.street || '';
    const postcode = addr.postcode || '';

    // District / Zone: Prefer (Town, City / County)
    const districtParts = [town, city].filter(Boolean);
    const district = districtParts.join(', ') || addr.county || addr.state_district || state || 'Local District';

    // Specific Location description: Prefer (Road, Town, Postcode)
    const locationParts = [road, town, city, postcode].filter(Boolean);
    const locationText = locationParts.join(', ') || data.display_name || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;

    return {
      displayName: data.display_name || locationText,
      district,
      locationText,
      city,
      state,
      country: addr.country,
    };
  } catch (err) {
    console.warn('Reverse geocoding failed, generating coordinate-based location descriptor:', err);
    return {
      displayName: `GPS Position: ${lat.toFixed(5)}°, ${lon.toFixed(5)}°`,
      district: `Zone (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      locationText: `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    };
  }
}
