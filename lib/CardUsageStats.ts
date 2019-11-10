export class CardUsageStats {
    balance: number;
    usageDetails: CardUsageDetails[];
    isNetUseEnabled: boolean;

    constructor(balance: number, usageDetails: CardUsageDetails[], isNetUseEnabled: boolean) {
        this.usageDetails = usageDetails;
        this.balance = balance;
        this.isNetUseEnabled = isNetUseEnabled;
    }
}

export class CardUsageDetails {
    date: Date;
    inProcess: boolean;
    merchant: string;
    isForeignUse: boolean;
    price: number;

    constructor(date: Date, inProcess: boolean, merchant: string, isForeignUse: boolean, price: number) {
        this.date = date;
        this.inProcess = inProcess;
        this.merchant = merchant;
        this.isForeignUse = isForeignUse;
        this.price = price;
    }
}