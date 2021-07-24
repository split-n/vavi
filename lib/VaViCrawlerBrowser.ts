import puppeteer from "puppeteer";
import { VaViCrawler } from "./VaViCrawler";

export class VaViCrawlerBrowser {
    static readonly baseUrl = 'https://vvgift.jp';
    private readonly browser: puppeteer.Browser;

    static async start(launchOptions: puppeteer.LaunchOptions) : Promise<VaViCrawlerBrowser> {
        const browser = await puppeteer.launch(launchOptions)
        return new VaViCrawlerBrowser(browser);
    }

    private constructor(browser: puppeteer.Browser){
        this.browser = browser;
    }

    async newCrawler() : Promise<VaViCrawler> {
        const browserContext = await this.browser.createIncognitoBrowserContext();
        return new VaViCrawler(browserContext, VaViCrawlerBrowser.baseUrl)
    }
}