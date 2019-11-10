import * as vavi from "../lib";
import util from "util";
import readline from 'readline';

async function* getAsyncReadlineIter() : AsyncIterableIterator<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    for await (const line of rl) {
        yield line;
    }
}

async function main() {
    const crawler = await vavi.launch({headless: false});

    const loginCardInfo: vavi.LoginCardInfo = {
        inquiryNumber2 : '', inquiryNumber3 : '', inquiryNumber4 : '', securityCode : ''
    };

    let captcha = await crawler.getCardUsageStats(loginCardInfo);
    const readlineIter = getAsyncReadlineIter();
    while(true) {
        process.stdout.write('captcha dataURL: ' + captcha.captchaImage + "\n");
        process.stdout.write("Please input captcha.\n> ");

        const inputData = await readlineIter.next();
        if(inputData.done) {
            break;
        }

        const result = await captcha.continueFunc(inputData.value);
        console.log(util.inspect(result));
        if(result instanceof vavi.CaptchaInterruption) {
            captcha = result;
        } else {
            break;
        }
    }
}

main();