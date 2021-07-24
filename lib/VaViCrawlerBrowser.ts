import puppeteer from "puppeteer";
import { VaViCrawler } from "./VaViCrawler";

/**
 * Manages browser for crawler
 */
export class VaViCrawlerBrowser {
    static readonly baseUrl = 'https://vvgift.jp';
    private readonly browser: puppeteer.Browser;

    /**
     * Starts browser
     * @param launchOptions Puppeteer launch options
     * @returns Crawler browser instance
     */
    static async start(launchOptions: puppeteer.LaunchOptions) : Promise<VaViCrawlerBrowser> {
        const browser = await puppeteer.launch(launchOptions)
        return new VaViCrawlerBrowser(browser);
    }

    private constructor(browser: puppeteer.Browser){
        this.browser = browser;
    }

    /**
     * Creates new crawler
     * @returns Crawler
     */
    async newCrawler() : Promise<VaViCrawler> {
        const browserContext = await this.browser.createIncognitoBrowserContext();
        return new VaViCrawler(browserContext, VaViCrawlerBrowser.baseUrl)
    }
}