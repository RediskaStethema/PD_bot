import  { type Message } from "node-telegram-bot-api";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import {getCoordinates, getTodayHourlyForecast, getWeeklyForecast} from "./src/utils/tools.js";
import {bot, USERS_FILE} from "./src/utils/constants.js";
import type {User} from "./src/utils/types.js";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") })


let users: Record<number, User> = {};
if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

export function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}



bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Привет! 🌤️ Я бот прогноза погоды.\nВыбери команду:", {
        reply_markup: {
            keyboard: [
                [{ text: "🌤 Погода сегодня" }, { text: "📅 Прогноз на неделю" }],
                [{ text: "🏙 Изменить город" }, { text: "🔔 Подписка" }],
            ],
            resize_keyboard: true,
        },
    });
});

bot.on("message", async (msg: Message) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!text) return;

    if (text === "🏙 Изменить город") {
        bot.sendMessage(chatId, "Введите название города:");
        users[chatId] = { city: "" };
        return;
    }

    if (users[chatId] && users[chatId].city === "") {
        users[chatId].city = text;
        saveUsers();
        bot.sendMessage(chatId, `✅ Город установлен: *${text}*`, { parse_mode: "Markdown" });
        return;
    }

    if (text === "🌤 Погода сегодня") {
        const user = users[chatId];
        if (!user?.city) return bot.sendMessage(chatId, "Сначала укажи город.");
        const coords = await getCoordinates(user.city);
        if (!coords) return bot.sendMessage(chatId, "❌ Город не найден.");
        const forecast = await getTodayHourlyForecast(coords.lat, coords.lon);
        bot.sendMessage(chatId, `🌤 Погода в *${user.city}* сегодня:\n\n${forecast}`, { parse_mode: "Markdown" });
    }

    if (text === "📅 Прогноз на неделю") {
        const user = users[chatId];
        if (!user?.city) return bot.sendMessage(chatId, "Сначала укажи город.");
        const coords = await getCoordinates(user.city);
        if (!coords) return bot.sendMessage(chatId, "❌ Город не найден.");
        const forecast = await getWeeklyForecast(coords.lat, coords.lon);
        bot.sendMessage(chatId, forecast, { parse_mode: "Markdown" });
    }

    if (text === "🔔 Подписка") {
        const user = users[chatId];
        if (!user?.city) return bot.sendMessage(chatId, "Сначала укажи город.");
        user.dailySubscription = !user.dailySubscription;
        saveUsers();
        bot.sendMessage(
            chatId,
            user.dailySubscription
                ? "✅ Подписка на ежедневную погоду включена!"
                : "❌ Подписка отключена."
        );
    }
});


cron.schedule("0 8 * * *", async () => {
    for (const [chatId, user] of Object.entries(users)) {
        if (!user.city || !user.dailySubscription) continue;
        try {
            const coords = await getCoordinates(user.city);
            if (!coords) continue;
            const forecast = await getTodayHourlyForecast(coords.lat, coords.lon);
            await bot.sendMessage(
                Number(chatId),
                `Доброе утро! ☀️\nПогода в *${user.city}* сегодня:\n\n${forecast}`,
                { parse_mode: "Markdown" }
            );
        } catch (err) {
            console.error("Ошибка при рассылке:", err);
        }
    }
});

