import axios from "axios";
import type {HourlyForecastResponse, OpenMeteoGeoResponse, User, WeeklyForecastResponse} from "./types.js";
import {model, USERS_FILE} from "./constants.js";
import fs from "fs";


export async function getCoordinates(city: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const res = await axios.get<OpenMeteoGeoResponse> ("https://geocoding-api.open-meteo.com/v1/search", {
            params: { name: city, count: 1, language: "ru" },
        })
        console.log(`${res}`)
        const geo = res.data.results?.[0];

        if (!geo) {
            console.log(`ошибка тут`)
            return null;}
        console.log({ lat: geo.latitude, lon: geo.longitude });
        return { lat: geo.latitude, lon: geo.longitude };
    } catch (err) {
        console.error("Ошибка геокодирования Open-Meteo:", err);
        return null;
    }
}
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
 export async function AI_Func_week(city: string, weather: string) {
    const prompt_week = `
Ты помощник по стилю и досугу.
Город: ${city}
Погода: ${weather}
1) Что надеть (очень конкретно) на все  7 дней 
2) Что взять с собой на все  7 дней
3) Чем заняться сегодня в этом городе исходя из погодных условий на все  7 дней
Ответ короткий не больше 200 символов, структурированный, по пунктам на каждый из 7 дней.
`;


    const result = await model.generateContent(prompt_week);
    const response = await result.response;
    return Promise.resolve(response.text());
}
export async function AI_Func_today(city: string, weather: string) {
     const prompt_today = `
Ты помощник по стилю и досугу.
Город: ${city}
Погода: ${weather}
1) Что надеть (очень конкретно) 
2) Что взять с собой
3) Чем заняться сегодня в этом городе исходя из погодных условий
Ответ короткий не больше 350 символов, структурированный, по пунктам.
`;


    const result = await model.generateContent(prompt_today);
    const response = await result.response;
     return Promise.resolve(response.text());
}
export async function getStyleAdvice(city: string, weather: string, flag: string) {
     switch (flag) {
         case 'today':
             return await AI_Func_today(city, weather);
         case 'week':
             return await AI_Func_week(city, weather);
             default: return null;
     }}
export function saveUsers( users:Record<string, User>) {
    try {
        const tmp = USERS_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(users, null, 2));
        fs.renameSync(tmp, USERS_FILE);
    } catch (e) {
        console.error("Save error:", e);
    }
}
export const getOrCreateUser = (chatId: number, users :Record<string, User>): User => {
    const id = String(chatId);

    if (!users[id]) {
        users[id] = {
            city: "",
            dailySubscription: false,
            awaitingCity: false
        };
    }

    return users[id];
};
export function isLimitExceeded(user: User): boolean {
    const today = new Date().toLocaleDateString("en-CA");

    if (user.lastRequestDay !== today) {
        user.lastRequestDay = today;
        user.requestCount = 0;
    }

    user.requestCount = user.requestCount ?? 0;

    if (user.requestCount >= 4) {
        return true;
    }

    user.requestCount++;
    return false;
}