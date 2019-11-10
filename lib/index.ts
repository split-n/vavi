export {LoginCardInfo} from "./LoginCardInfo";
export {CardUsageStats} from "./CardUsageStats";
export {VaViCrawler, CaptchaInterruption, CaptchaContinuationFunc} from "./VaViCrawler";

import {VaViCrawler} from "./VaViCrawler";
import puppeteer, {LaunchOptions} from "puppeteer";

/**
 * launch crawler
 * @param puppeteerLaunchOptions options to launch puppeteer.
 */
export async function launch(puppeteerLaunchOptions: LaunchOptions) {
    const browser = await puppeteer.launch(puppeteerLaunchOptions);
    return new VaViCrawler(browser, 'https://vvgift.jp');
}