import puppeteer, {ElementHandle, Page} from "puppeteer";
import {LoginCardInfo} from "./LoginCardInfo";
import {CardUsageDetails, CardUsageStats} from "./CardUsageStats";

/**
 * Vanilla visa site crawler
 */
export class VaViCrawler {
    private static readonly LOGIN_PATH = '/login.action';
    private readonly baseUrl: string;
    private readonly browser: puppeteer.Browser;

    /**
     * @param browser browser
     * @param baseUrl vanilla visa site protocol + host
     */
    constructor(browser: puppeteer.Browser, baseUrl: string) {
        this.browser = browser;
        this.baseUrl = baseUrl;
    }

    /**
     * Crawl usage stats.
     * @param loginCardInfo login information
     */
    async getCardUsageStats(loginCardInfo: LoginCardInfo): Promise<CaptchaInterruption> {
        const page = await this.browser.newPage();
        await Promise.all([
            page.waitForNavigation(),
            page.goto(this.baseUrl + VaViCrawler.LOGIN_PATH)
        ]);

        const waitCaptchaImageFunc = () => {
            const img = document.querySelector('#certificationImg') as HTMLImageElement;
            return img && img.getAttribute('src') !== '' && img.complete;
        };

        await page.waitForFunction(waitCaptchaImageFunc);

        // input login info
        await (await page.$('#txtCustomerNumber2'))!.type(loginCardInfo.inquiryNumber2!);
        await (await page.$('#txtCustomerNumber3'))!.type(loginCardInfo.inquiryNumber3!);
        await (await page.$('#txtCustomerNumber4'))!.type(loginCardInfo.inquiryNumber4!);
        await (await page.$('#txtSecurityCode'))!.type(loginCardInfo.securityCode!);

        // the function to request captcha input, then try login.
        // if succeed, return data, else retry same thing.
        const captchaAndSubmitFunc: () => Promise<CaptchaInterruption> = async () => {
            // Get captcha image as dataURL
            const captchaDataUrl = await page.evaluate(() => {
                const img = document.querySelector('#certificationImg') as HTMLImageElement;
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d')!.drawImage(img, 0, 0);
                return canvas.toDataURL('image/png');
            });

            // returning captcha image and continue function.
            return new CaptchaInterruption(captchaDataUrl, async (answer: string) => {
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

                // if still has input, then maybe failed to login.
                if ((await page.$('#txtCustomerNumber2'))) {
                    await page.waitForFunction(waitCaptchaImageFunc);
                    return captchaAndSubmitFunc();
                } else {
                    return this.parseStats(page);
                }
            });
        };

        return captchaAndSubmitFunc();
    }

    async dispose(): Promise<void> {
        await this.browser.close();
    }

    /**
     * parse stats from loaded page.
     * @param page
     */
    private async parseStats(page: Page): Promise<CardUsageStats> {
        const cardImgSrc = await (await (await page.$('img.card'))!
            .getProperty('src')).jsonValue() as string;
        // giftCard_history_finish01.png -> enabled
        // giftCard_history_result01.png -> not yet enabled
        const isNetUseEnabled = cardImgSrc.includes('finish');

        const balanceText = await (await (await page.$('#result_balance > .money'))!
            .getProperty('textContent')).jsonValue();
        const balanceResult = parseInt(balanceText.replace(/[,円]/g, ""));

        const details: CardUsageDetails[] = [];

        // crawl details from all page
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

        // TODO: set year to date

        return new CardUsageStats(balanceResult, details, isNetUseEnabled);
    }

    /**
     * parse detail items in the page.
     * @param page
     */
    private async parseDetailsInPage(page: Page): Promise<CardUsageDetails[]> {
        // domestic use detail row in JPY: <td>
        // foreign use detail row in JPY: <td class="border1">
        // foreign use detail row in original price with exchange rate: <td class="childborder1 hidden detailsToggle">
        // only pick normal detail row (includes foreign use price in JPY).
        const detailRows = (await page.$$('#result_hisTable > table > tbody > tr:not(.hidden)'));
        return await Promise.all(detailRows.map(async row => await this.parseRow(row)));
    }

    /**
     * parse detail row.
     * @param row
     */
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

// param: captcha answer, return value: usage stats or captcha retry
export type CaptchaContinuationFunc = (answer: string) => Promise<CardUsageStats | CaptchaInterruption>;

/**
 * Request to input captcha and continue.
 */
export class CaptchaInterruption {
    public readonly captchaImage: string;
    public readonly continueFunc: CaptchaContinuationFunc;

    constructor(captchaImage: string, continueFunc: CaptchaContinuationFunc) {
        this.captchaImage = captchaImage;
        this.continueFunc = continueFunc;
    }
}