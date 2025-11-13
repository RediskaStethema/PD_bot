import axios from "axios";
import type {HourlyForecastResponse, OpenMeteoGeoResponse, User, WeeklyForecastResponse} from "./types.js";



// --- Функция: геокодинг через Open-Meteo ---
 export async function getCoordinates(city: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const res = await axios.get<OpenMeteoGeoResponse> ("https://geocoding-api.open-meteo.com/v1/search", {
            params: { name: city, count: 1, language: "ru" },
        });
        const geo = res.data.results?.[0];
        if (!geo) return null;
        return { lat: geo.latitude, lon: geo.longitude };
    } catch (err) {
        console.error("Ошибка геокодирования Open-Meteo:", err);
        return null;
    }
}

// --- Функция: почасовой прогноз на сегодня ---
export async function getTodayHourlyForecast(lat: number, lon: number): Promise<string> {
    try {
        const res = await axios.get<HourlyForecastResponse>("https://api.open-meteo.com/v1/forecast", {
            params: {
                latitude: lat,
                longitude: lon,
                hourly: "temperature_2m,precipitation,pressure_msl,windspeed_10m",
                timezone: "auto",
            },
        });

        const data = res.data;
        const times: Date[] = data.hourly.time.map((t: string) => new Date(t));
        const today = new Date().getDate();

        const forecast = times
            .map((t, i) => {
                if (t.getDate() !== today) return null;
                const temp = data.hourly.temperature_2m[i];
                const precip = data.hourly.precipitation[i];
                const pressure = data.hourly.pressure_msl[i];
                const wind = data.hourly.windspeed_10m[i];
                return `${t.getHours().toString().padStart(2, "0")}:00 - 🌡 *Температура*: ${temp}°C,
                💧 *Осадки*: ${precip} мм,
                🌀 *Давление*: ${pressure} гПа,
                💨 *Ветер*: ${wind} км/ч
                `;
            })
            .filter(Boolean)
            .join("\n");

        return forecast || "❌ Нет данных на сегодня.";
    } catch (err) {
        console.error("Ошибка почасового прогноза:", err);
        return "❌ Не удалось получить почасовой прогноз.";
    }
}


export async function getWeeklyForecast(lat: number, lon: number): Promise<string> {
    try {
        const res = await axios.get <WeeklyForecastResponse>("https://api.open-meteo.com/v1/forecast", {
            params: {
                latitude: lat,
                longitude: lon,
                daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,pressure_msl_mean",
                timezone: "auto",
            },
        });

        const daily = res.data.daily;

        return daily.time
            .map((t: string, i: number) => {
                const date = new Date(t);
                const dayName = date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
                return `*${dayName}*: 🌡 Температура: ${daily.temperature_2m_min[i]} - ${daily.temperature_2m_max[i]}°C, 
                💧 Осадки: ${daily.precipitation_sum[i]} мм, 
                🌀 Давление: ${daily.pressure_msl_mean[i]} гПа, 
                💨 Ветер: ${daily.windspeed_10m_max[i]} км/ч 
                
                `;


            })
            .join("\n");
    } catch (err) {
        console.error("Ошибка недельного прогноза:", err);
        return "❌ Не удалось получить недельный прогноз.";
    }
}

