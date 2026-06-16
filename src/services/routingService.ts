export interface RouteResult {
  distance: number; // in meters
  geometry: { lat: number; lng: number }[];
}

export async function fetchOSRMRoute(points: {lat: number, lng: number}[]): Promise<RouteResult | null> {
  if (points.length < 2) return null;

  try {
    // Lấy tối đa 100 điểm để không bị lỗi API (giới hạn của OSRM public)
    const validPoints = points.slice(0, 100);
    
    // OSRM expects: lon,lat;lon,lat
    const coordinates = validPoints.map(p => `${p.lng},${p.lat}`).join(';');
    
    // Gọi OSRM public API (Lưu ý: Không dùng cho production với lượng truy cập cực lớn)
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error("OSRM API Error:", response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }
    
    const route = data.routes[0];
    
    // GeoJSON returns coordinates as [lon, lat]
    const geometry = route.geometry.coordinates.map((coord: [number, number]) => ({
      lat: coord[1],
      lng: coord[0]
    }));
    
    return {
      distance: route.distance,
      geometry
    };
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return null;
  }
}
