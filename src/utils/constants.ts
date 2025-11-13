import type {CONSTANTS} from "./types.js";
import TelegramBot from "node-telegram-bot-api";
import path from "path";
import dotenv from "dotenv";
import {fileURLToPath} from "url";
dotenv.config({ path: path.resolve(process.cwd(), ".env") })
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const USERS_FILE = path.join(__dirname, "users.json");

export const con :CONSTANTS ={
    token_bot:`${process.env.TELEGRAM_TOKEN}` ,
}
export const bot = new TelegramBot(con.token_bot, { polling: true });
