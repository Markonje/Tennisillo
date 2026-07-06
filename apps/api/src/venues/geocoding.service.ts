import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface MapboxFeature {
  center?: [number, number];
  place_name?: string;
}

/**
 * Mapbox geocoding wrapper (specs/02 §7.3). Results are cached in-process
 * (addresses are effectively immutable); a Redis cache layer can replace the
 * Map once Upstash is configured. Returns 503 when MAPBOX_TOKEN is not set —
 * venue coordinates can always be entered manually.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly cache = new Map<string, GeocodeResult>();

  async geocode(address: string): Promise<GeocodeResult> {
    const token = process.env.MAPBOX_TOKEN;
    if (!token) {
      throw new ServiceUnavailableException(
        'Geocoding unavailable: MAPBOX_TOKEN not configured. Enter coordinates manually.',
      );
    }

    const key = address.trim().toLowerCase();
    const cached = this.cache.get(key);
    if (cached) return cached;

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address,
    )}.json?limit=1&access_token=${token}`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.warn(`Mapbox geocoding failed with status ${res.status}`);
      throw new ServiceUnavailableException('Geocoding provider error');
    }

    const body = (await res.json()) as { features?: MapboxFeature[] };
    const feature = body.features?.[0];
    if (!feature?.center) {
      throw new BadRequestException('Address could not be geocoded');
    }

    const result: GeocodeResult = {
      longitude: feature.center[0],
      latitude: feature.center[1],
      formattedAddress: feature.place_name ?? address,
    };
    this.cache.set(key, result);
    return result;
  }
}
