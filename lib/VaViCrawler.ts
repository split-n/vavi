import puppeteer, {ElementHandle, Page} from "puppeteer";
import {LoginCardInfo} from "./LoginCardInfo";
import {CardUsageDetails, CardUsageStats} from "./CardUsageStats";

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

            // if still has input, then failed to login.
            if ((await page.$('#txtCustomerNumber2'))) {
                throw new Error() //TODO impl captcha retry
            } else {
                return this.parseStats(page);
            }
        });
    }

    private async parseStats(page: Page): Promise<CardUsageStats> {
        const balanceText = await (await (await page.$('#result_balance > .money'))!
            .getProperty('textContent')).jsonValue();
        const balanceResult = parseInt(balanceText.replace(/[,円]/g, ""));

        const details: CardUsageDetails[] = [];

        while (true) {
            details.push(...(await this.parseDetailsInPage(page)));
            const activeNextButton = await page.$('#pageNavi .btn_nextP > a');
            if (activeNextButton) {
                await Promise.all([
                    page.waitForNavigation(),
                    activeNextButton.click()
                ]);
            } else {
                break;
            }
        }

        return new CardUsageStats(balanceResult, details);
    }

    private async parseDetailsInPage(page: Page): Promise<CardUsageDetails[]> {
        // domestic use detail row in JPY: <td>
        // foreign use detail row in JPY: <td class="border1">
        // foreign use detail row in original price with exchange rate: <td class="childborder1 hidden detailsToggle">
        // only pick normal detail row (includes foreign use price in JPY).
        const detailRows = (await page.$$('#result_hisTable > table > tbody > tr:not(.hidden)'));
        return await Promise.all(detailRows.map(async row => await this.parseRow(row)));
    }

    private async parseRow(row: ElementHandle): Promise<CardUsageDetails> {
        const cols = await row.$$('td');

        const dateValue: string = await (await cols[0].getProperty('textContent')).jsonValue();
        const dateSplit = dateValue.split('/').map(s => parseInt(s));
        const date = new Date(0, dateSplit[0], dateSplit[1]);

        const merchantValue: string = await (await cols[1].getProperty('textContent')).jsonValue();
        const merchant: string = merchantValue.trim();
        const isInProcess = merchant.startsWith("*");

        const isForeignUseValue: string = await (await cols[2].getProperty('textContent')).jsonValue();
        const isForeignUse = isForeignUseValue.includes('▼');

        const priceValue: string = await (await cols[3].getProperty('textContent')).jsonValue();
        const price = parseInt(priceValue.replace(',', ''));

        return new CardUsageDetails(date,
            isInProcess, merchant, isForeignUse, price);
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