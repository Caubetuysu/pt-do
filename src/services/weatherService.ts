export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windspeed: number;
}

// Open-Meteo - hoàn toàn miễn phí, không cần API key
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const cw = data.current_weather;
    return {
      temperature: Math.round(cw.temperature),
      weatherCode: cw.weathercode,
      windspeed: Math.round(cw.windspeed)
    };
  } catch {
    return null;
  }
}

export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌤️';
}

export function getWeatherDesc(code: number): string {
  if (code === 0) return 'Trời nắng';
  if (code <= 3) return 'Nhiều mây';
  if (code <= 48) return 'Sương mù';
  if (code <= 55) return 'Mưa phùn';
  if (code <= 67) return 'Mưa';
  if (code <= 77) return 'Có tuyết';
  if (code <= 82) return 'Mưa rào';
  if (code <= 99) return 'Giông bão';
  return 'Không rõ';
}
