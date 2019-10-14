import * as vavi from "../lib";
import readline from 'readline';

async function main() {
    const crawler = await vavi.launch({headless: false});

    const loginCardInfo: vavi.LoginCardInfo = {
        inquiryNumber2 : '', inquiryNumber3 : '', inquiryNumber4 : '', securityCode : ''
    };

    const captcha = await crawler.getCardUsageStats(loginCardInfo);
    process.stdout.write("Please input captcha.\n> ");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', async function(line){
        await captcha.continueFunc(line);
        rl.close();
    })
}
main();