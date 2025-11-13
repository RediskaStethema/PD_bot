export type CONSTANTS = {
    token_bot: string;
};
export type WeeklyForecastResponse = {
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        windspeed_10m_max: number[];
        pressure_msl_mean: number[];
    };
};
export type HourlyForecastResponse = {
    hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation: number[];
        pressure_msl: number[];
        windspeed_10m: number[];
    };
};
export type OpenMeteoGeoResponse = {
    results?: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        country: string;
        admin1?: string;
        admin2?: string;
    }[];
};
export type User = {
    city: string;
    dailySubscription?: boolean;
};
//# sourceMappingURL=types.d.ts.map