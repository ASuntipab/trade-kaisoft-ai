// import * as functions from "firebase-functions";
import Kucoin = require("kucoin-futures-node-api");
import { Observable, Subscriber } from "rxjs";
// const axios = require("axios");

// eslint-disable-next-line prefer-const
const config = {
	apiKey: "61d411461d51cf0001de4583",
	secretKey: "bf5141f0-9552-4cab-82bf-7b67fb701cbd",
	passphrase: "kaisoft",
	environment: "live",
};
const configKunpanus = {
	apiKey: "62b84dbe5b0c120001d9f4c1",
	secretKey: "dbf60847-fff8-4a28-9612-76b1d4e950f8",
	passphrase: "kaisoft",
	environment: "live",
};
const configGrrn = {
	apiKey: "62b6de6a41f6a700018784f4",
	secretKey: "4693e73f-9841-4d75-beee-a1edc8280d3e",
	passphrase: "Gunozeus6699!",
	environment: "live",
};
const kucoinApi = new Kucoin();
kucoinApi.init(config);

export class KucoinService {
	constructor() {}

	apiClient(account: any) {
		let apiConfig = config;

		if (account === "a-kaisoft") {
			apiConfig = config
		} else if (account === "kunpanus") {
			apiConfig = configKunpanus
		} else if (account === "grrn") {
			apiConfig = configGrrn
			
		}
		const api = new Kucoin();
		api.init(apiConfig);
		return api;
	}

	getServerTime(): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient("kunpanus");
			api
				.getServerTime()
				.then((result: any) => {
					subscriber.next(result);
					subscriber.complete();
				})
				.catch((error: any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getExchangeInfo(): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(null);
			api
				.getContract("XBTUSDTM")
				.then((result:any) => {
					subscriber.next(result.data);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getAccountOverview(account: any, currency: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getAccountOverview({
					currency: currency,
				})
				.then((result:any) => {
					subscriber.next(result.data);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getContract(account: any, symbol: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getContract(symbol)
				.then((result:any) => {
					subscriber.next(result.data);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getOpenPosition(account: any, symbol: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getPosition({
					symbol: symbol,
				})
				.then((result:any) => {
					subscriber.next(result.data);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getAllPositions(account: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getAllPositions()
				.then((result:any) => {
					subscriber.next(result.data);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getAllStopOrders(account: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getStopOrders()
				.then((result:any) => {
					subscriber.next(result.data.items);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getOrders(account: any, symbol: any, status: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getOrders({
					symbol: symbol,
					status: status,
				})
				.then((result:any) => {
					subscriber.next(result.data.items);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getStopOrders(account: any, symbol: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getStopOrders({
					symbol: symbol,
				})
				.then((result:any) => {
					subscriber.next(result.data.items);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	getCurrentPrice(account: any, symbol: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.getTicker(symbol)
				.then((result:any) => {
					subscriber.next(result.data);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	order(account: any, orderParams: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.placeOrder(orderParams)
				.then((result:any) => {
					subscriber.next(result);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	cancelOrder(account: any, orderParams: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.cancelOrder(orderParams)
				.then((res:any) => {
					subscriber.next(res);
					subscriber.complete();
				})
				.catch((error:any) => {
					// functions.logger.error(`order [${orderParams.symbol}]`, error, orderParams);
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	cancelAllStopOrders(account: any, symbol: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.cancelAllStopOrders({
					symbol: symbol,
				})
				.then((res:any) => {
					subscriber.next(res);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}

	setAutoDeposit(account: any, symbol: any, isAuto: any) {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const api = this.apiClient(account);
			api
				.changeAutoDeposit({
					symbol: symbol,
					status: isAuto,
				})
				.then((res:any) => {
					subscriber.next(res);
					subscriber.complete();
				})
				.catch((error:any) => {
					subscriber.next(error);
					subscriber.complete();
				});
		});
	}
}

export default new KucoinService();
