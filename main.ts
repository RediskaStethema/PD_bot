import { type Message } from "node-telegram-bot-api";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import {
    getCoordinates,
    getStyleAdvice,
    getTodayHourlyForecast,
    getWeeklyForecast,
    saveUsers,
    getOrCreateUser,
    isLimitExceeded
} from "./src/utils/tools.js";

import { bot, USERS_FILE } from "./src/utils/constants.js";
import type { User } from "./src/utils/types.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ---------------- USERS ----------------
let users: Record<string, User> = {};

try {
    if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
} catch (e) {
    console.error("Failed to load users:", e);
    users = {};
}

// ---------------- START ----------------
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const user = getOrCreateUser(chatId, users);
    saveUsers(users);

    bot.sendMessage(chatId, "Привет! 🌤️ Я бот прогноза погоды.\nВыбери команду:", {
        reply_markup: {
            keyboard: [
                [{ text: "🌤 Погода сегодня" }, { text: "📅 Прогноз на неделю" }],
                [{ text: "🏙 Выбрать город" }, { text: "🔔 Подписка" }],
                [{ text: "Совет на сегодня" }, { text: "Совет на неделю" }],
            ],
            resize_keyboard: true,
        },
    });
});

// ---------------- MAIN ROUTER ----------------
bot.on("message", async (msg: Message) => {
    if (!msg.text || msg.from?.is_bot) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    const user = getOrCreateUser(chatId, users);

    try {
        // ---------- CHANGE CITY ----------
        if (text === "🏙 Выбрать город") {
            user.awaitingCity = true;
            user.city = "";
            saveUsers(users);

            return bot.sendMessage(chatId, "Введите название города (пример: Москва, London, Paris):");
        }

        // ---------- CITY INPUT ----------
        if (user.awaitingCity) {
            // защита от кнопок
            if (
                text.startsWith("🌤") ||
                text.startsWith("📅") ||
                text.startsWith("🔔") ||
                text.startsWith("Совет")
            ) {
                return bot.sendMessage(chatId, "❗ Введите название города, а не команду");
            }

            user.city = text;
            user.awaitingCity = false;
            saveUsers(users);

            return bot.sendMessage(chatId, `✅ Город установлен: ${text}`);
        }

        // ---------- WEATHER TODAY ----------
        if (text === "🌤 Погода сегодня") {
            if (!user.city) {
                return bot.sendMessage(chatId, "Сначала укажи город.");
            }

            const coords = await getCoordinates(user.city);
            if (!coords) {
                return bot.sendMessage(chatId, "❌ Город не найден.");
            }

            const forecast = await getTodayHourlyForecast(coords.lat, coords.lon);

            return bot.sendMessage(chatId, `🌤 ${user.city}\n\n${forecast}`);
        }

        // ---------- WEEK ----------
        if (text === "📅 Прогноз на неделю") {
            if (!user.city) {
                return bot.sendMessage(chatId, "Сначала укажи город.");
            }

            const coords = await getCoordinates(user.city);
            if (!coords) {
                return bot.sendMessage(chatId, "❌ Город не найден.");
            }

            const forecast = await getWeeklyForecast(coords.lat, coords.lon);

            return bot.sendMessage(chatId, forecast);
        }

        // ---------- SUBSCRIPTION ----------
        if (text === "🔔 Подписка") {
            if (!user.city) {
                return bot.sendMessage(chatId, "Сначала укажи город.");
            }

            user.dailySubscription = !user.dailySubscription;
            saveUsers(users);

            return bot.sendMessage(
                chatId,
                user.dailySubscription
                    ? "✅ Подписка включена"
                    : "❌ Подписка отключена"
            );
        }

        // ---------- AI TODAY ----------
        if (text === "Совет на сегодня") {
            if (!user.city) {
                return bot.sendMessage(chatId, "Сначала укажи город.");
            }

            if (isLimitExceeded(user)) {
                saveUsers(users);
                return bot.sendMessage(chatId, "🚫 Лимит 4 запроса в день исчерпан.");
            }

            saveUsers(users);

            const coords = await getCoordinates(user.city);
            if (!coords) {
                return bot.sendMessage(chatId, "❌ Город не найден.");
            }

            const weather = await getTodayHourlyForecast(coords.lat, coords.lon);
            const ai = await getStyleAdvice(user.city, weather, "today");

            return bot.sendMessage(chatId, `💡 ${ai}`);
        }

        // ---------- AI WEEK ----------
        if (text === "Совет на неделю") {
            if (!user.city) {
                return bot.sendMessage(chatId, "Сначала укажи город.");
            }

            if (isLimitExceeded(user)) {
                saveUsers(users);
                return bot.sendMessage(chatId, "🚫 Лимит 4 запроса в день исчерпан.");
            }

            saveUsers(users);

            const coords = await getCoordinates(user.city);
            if (!coords) {
                return bot.sendMessage(chatId, "❌ Город не найден.");
            }

            const weather = await getWeeklyForecast(coords.lat, coords.lon);
            const ai = await getStyleAdvice(user.city, weather, "week");

            return bot.sendMessage(chatId, `💡 ${ai}`);
        }

        // ---------- FALLBACK ----------
        return bot.sendMessage(chatId, "🤖 Я не понял команду");

    } catch (err) {
        console.error("Bot error:", err);
        return bot.sendMessage(chatId, "⚠️ Ошибка, попробуй позже.");
    }
});

// ---------------- CRON ----------------
cron.schedule("0 8 * * *", async () => {
    for (const [chatId, user] of Object.entries(users)) {
        if (!user || typeof user !== "object") continue;
        if (!user.city || !user.dailySubscription) continue;

        try {
            const coords = await getCoordinates(user.city);
            if (!coords) continue;

            const forecast = await getTodayHourlyForecast(coords.lat, coords.lon);

            await bot.sendMessage(
                Number(chatId),
                `☀️ Доброе утро!\n\n${forecast}`
            );
        } catch (e) {
            console.error("Cron error:", e);
        }
    }
});