export class CardUsageStats {
    balance: number;
    usageDetails: CardUsageDetails[];

    constructor(balance: number, usageDetails: CardUsageDetails[]) {
        this.usageDetails = usageDetails;
        this.balance = balance;
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