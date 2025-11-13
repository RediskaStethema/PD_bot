export declare function getCoordinates(city: string): Promise<{
    lat: number;
    lon: number;
} | null>;
export declare function getTodayHourlyForecast(lat: number, lon: number): Promise<string>;
export declare function getWeeklyForecast(lat: number, lon: number): Promise<string>;
//# sourceMappingURL=tools.d.ts.map