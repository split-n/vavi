import puppeteer from "puppeteer";
import {LoginCardInfo} from "./LoginCardInfo";
import {CardUsageStats} from "./CardUsageStats";

export class VaViCrawler {
    private static readonly LOGIN_PATH = '/login.action';
    private readonly baseUrl: string;
    private readonly browser: puppeteer.Browser;

    constructor(browser: puppeteer.Browser, baseUrl: string) {
        this.browser = browser;
        this.baseUrl = baseUrl;
    }

    async getCardUsageStats(loginCardInfo: LoginCardInfo): Promise<CaptchaInterruption> {
        const page = await this.browser.newPage();
        await Promise.all([
            page.waitForNavigation(),
            page.goto(this.baseUrl + VaViCrawler.LOGIN_PATH)
        ]);

        await page.waitForSelector('#certificationImg:not([src=""])');
        await (await page.$('#txtCustomerNumber2'))!.type(loginCardInfo.inquiryNumber2!);
        await (await page.$('#txtCustomerNumber3'))!.type(loginCardInfo.inquiryNumber3!);
        await (await page.$('#txtCustomerNumber4'))!.type(loginCardInfo.inquiryNumber4!);
        await (await page.$('#txtSecurityCode'))!.type(loginCardInfo.securityCode!);

        // TODO: Captcha image to dataURL

        return new CaptchaInterruption('', async (answer: string) => {
            await (await page.$('#txtSecurityChkCode'))!.type(answer);
            await Promise.all([
                page.waitForNavigation(),
                // use evaluate because page.click not working
                // https://github.com/GoogleChrome/puppeteer/issues/3347
                page.evaluate(() => {
                    // @ts-ignore
                    document.querySelector('.ma_btn_submit > input').click();
                })
            ]);

            if(page.url().includes(VaViCrawler.LOGIN_PATH)) {
                throw new Error() //TODO impl captcha retry
            } else {
                return new CardUsageStats();
            }
        });
    }
}

export type CaptchaContinuationFunc = (answer: string) => Promise<CardUsageStats | CaptchaInterruption>;

export class CaptchaInterruption {
    public readonly captchaImage: string;
    public readonly continueFunc: CaptchaContinuationFunc;

    constructor(captchaImage: string, continueFunc: CaptchaContinuationFunc) {
        this.captchaImage = captchaImage;
        this.continueFunc = continueFunc;
    }
}