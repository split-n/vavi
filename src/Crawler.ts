import puppeteer from "puppeteer";
import {LoginCardInfo} from "./LoginCardInfo";
import {CardUsageStats} from "./CardUsageStats";

export class Crawler {
    private static readonly LOGIN_PATH = '/login.action';
    private readonly baseUrl: string;
    private readonly browser: puppeteer.Browser;

    constructor(browser: puppeteer.Browser, baseUrl: string) {
        this.browser = browser;
        this.baseUrl = baseUrl;
    }

    async getCardUsageStats(loginCardInfo: LoginCardInfo): Promise<CaptchaInterruption> {
        const page = await this.browser.newPage();
        await page.goto(this.baseUrl + Crawler.LOGIN_PATH);
        throw new Error("TODO");
    }
}

export type CaptchaContinuationFunc = (answer: string) => CardUsageStats;

export class CaptchaInterruption {
    private readonly captchaImage: string;
    private readonly continueFunc: CaptchaContinuationFunc;

    constructor(captchaImage: string, continueFunc: CaptchaContinuationFunc) {
        this.captchaImage = captchaImage;
        this.continueFunc = continueFunc;
    }

}