import puppeteer from "puppeteer";

export class Crawler {
    private readonly baseUrl: string;
    private browser: puppeteer.Browser | null = null;

    private constructor(baseUrl : string) {
        this.baseUrl = baseUrl;
    }

    private async launchBrowser() {
        this.browser = await puppeteer.launch();
    }

    static async launch(baseUrl : string) {
        const instance = new Crawler(baseUrl);
        await instance.launchBrowser();
    }
}