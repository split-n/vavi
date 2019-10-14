export {LoginCardInfo} from "./LoginCardInfo";
export {CardUsageStats} from "./CardUsageStats"

import {VaViCrawler} from "./VaViCrawler";
import puppeteer, {LaunchOptions} from "puppeteer";

export async function launch(puppeteerLaunchOptions: LaunchOptions) {
    const browser = await puppeteer.launch(puppeteerLaunchOptions);
    return new VaViCrawler(browser, 'https://vvgift.jp');
}