export default class Trade {
	account?: string;
	symbol?: string;
	amt?: number;
	amtType?: string = "FIXED"; //["FIXED", "PERCENT"]
	action?: string;
	side?: string;
	price?: number;
	atr?: number;
	maxLeverage?: number;
	stopType?: string; //["SL", "SL-ATR", "TP", "TP-ATR"]
	stop?: number;
	params?: any;
	accountName?: string;
	exchange?: string;
}
