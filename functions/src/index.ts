import * as functions from "firebase-functions";
import firestoreService from "./services/firestore.service";
import kucoinService from "./services/kucoin/kucoin.service";
// import { forkJoin } from "rxjs";

// import { v4 as uuidv4 } from "uuid";
import kucoinAiService from "./services/kucoin/kucoin-ai.service";
// import { forkJoin } from "rxjs/internal/observable/forkJoin";
//import _ = require("lodash");
import dayjs = require("dayjs");
 import _ from "lodash";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require("cors")({
	origin: true,
});

const enumExchange = {
	KUCOIN: "KUCOIN",
};

// ------------ Schedule Functions ------------ //

// export const checkKucoinOpenOrderRunner = functions
// 	.runWith({ memory: "1GB", timeoutSeconds: 540 })
// 	.pubsub.schedule("*/4 * * * *")
// 	.timeZone("UTC")
// 	.onRun(async (context: any) => {
// 		// */4 * * * * - At every 4 minutes
// 		// 0 */4 * * * - At minute 0 past every 4th hour.
// 		// 0 0 1 * * - At 00:00 on day-of-month 1.
// 		const result = await new Promise((resolve: any) => {
// 			setTimeout(() => {
// 				const currentMinute = dayjs().minute();
// 				if (currentMinute != 0) {
// 					firestoreService.getAccounts(null, enumExchange.KUCOIN).subscribe((accounts: any) => {
// 						const checkOpenOrderActions:any = {};
// 						accounts.map((account:any ) => {
// 							checkOpenOrderActions[account.code] = kucoinAiService.checkOpenOrders(account);
// 						});
// 						if (Object.keys(checkOpenOrderActions).length > 0 && checkOpenOrderActions.constructor === Object) {
// 							forkJoin(checkOpenOrderActions).subscribe((results: any) => {
// 								functions.logger.log("Check Open Order Runner Completed", results);
// 								resolve(results);
// 							});
// 						} else {
// 							resolve("No account");
// 						}
// 					});
// 				} else {
// 					functions.logger.log("Check Open Order Runner Completed", "Ignore 0 minute");
// 					resolve("Ignore 0 minute");
// 				}
// 			}, 10000);
// 		});
// 		return result;
// 	});

exports.check = functions.https.onRequest(async (req, res) => {
	cors(req, res, async () => {
		const result = await new Promise((resolve: any) => {
			kucoinService.getServerTime().subscribe((info) => {
				resolve(info);
			});
		});
		res.send(result);
	});
});

// exports.changeBalanceOption = functions.https.onRequest(async (req: any, res) => {
// 	cors(req, res, async () => {
// 		const result = await new Promise((resolve: any) => {
// 			if (!req.query.account) {
// 				resolve({
// 					msg: "Did you forget something?",
// 				});
// 			}

// 			firestoreService.getAccounts(req.query.account).subscribe((accounts: any) => {
// 				if (accounts && accounts.length > 0) {
// 					const currentAccount = _.cloneDeep(accounts[0]);

// 					if (req.query.amtFlexi) {
// 						currentAccount.trade.amtFlexi = parseInt(req.query.amtFlexi);
// 					}

// 					if (req.query.balanceType) {
// 						currentAccount.trade.balanceOption.type = req.query.balanceType.toUpperCase();
// 					}

// 					if (req.query.balanceAmt) {
// 						currentAccount.trade.balanceOption.amt = parseInt(req.query.balanceAmt);
// 					}

// 					if (JSON.stringify(currentAccount) != JSON.stringify(accounts[0])) {
// 						firestoreService.editAccount(currentAccount.code, currentAccount).subscribe(() => {
// 							resolve({
// 								msg: "Balance Option Changed!",
// 							});
// 						});
// 					} else {
// 						resolve({
// 							msg: "Nothing Changes!",
// 						});
// 					}
// 				} else {
// 					resolve({
// 						msg: "Invalid account",
// 					});
// 				}
// 			});
// 		});
// 		res.send(result);
// 	});
// });

// exports.orders = functions.https.onRequest(async (req, res) => {
// 	cors(req, res, async () => {
// 		const result = await new Promise((resolve: any) => {
// 			firestoreService.getAccounts(null, enumExchange.KUCOIN).subscribe((accounts: any) => {
// 				const checkOpenOrderActions:any = {};
// 				accounts.map((account:any) => {
// 					checkOpenOrderActions[account.code] = kucoinAiService.checkOpenOrders(account);
// 				});
// 				if (Object.keys(checkOpenOrderActions).length > 0 && checkOpenOrderActions.constructor === Object) {
// 					forkJoin(checkOpenOrderActions).subscribe((results: any) => {
// 						resolve(results);
// 					});
// 				} else {
// 					resolve({
// 						msg: "Invalid account",
// 					});
// 				}
// 			});
// 		});
// 		res.send(result);
// 	});
// });

exports.trade = functions.https.onRequest(async (req, res) => {
	cors(req, res, async () => {
		const result = await new Promise((resolve: any) => {
			if (!req.query.account || !req.body.action || !req.query.accountName || !req.query.exchange) {
				resolve({
					msg: "Did you forget something?" + req.body,
				});
			}
			let currentTrade: any = {};
			currentTrade = req.query;
			currentTrade.params = req.body;

			// Assign params
			if (currentTrade.amt && currentTrade.amt.toString() === "0") {
				currentTrade.amt = 0;
			} else {
				currentTrade.amt = Math.round(currentTrade.amt) || 0;
			}
			currentTrade.action = currentTrade.params.action || null;
			currentTrade.atr = currentTrade.params.atr ? parseFloat(currentTrade.params.atr) : null || null;
			currentTrade.side = currentTrade.params.side ? currentTrade.params.side.toLowerCase() : null || null;

			if ((!currentTrade.account && !currentTrade.amt && !currentTrade.action) || !currentTrade.side) {
				functions.logger.info(`${currentTrade.account}-${currentTrade.symbol}-${currentTrade.action}`, {
					msg: "Invalid trade params",
				});
				resolve({
					msg: "Invalid trade params",
				});
			} else {
				// firestoreService.getAccounts(currentTrade.account).subscribe((accounts: any) => {
				// 	if (accounts.length === 0) {
				// 		functions.logger.info(`${currentTrade.account}-${currentTrade.symbol}-${currentTrade.action}`, {
				// 			msg: "Invalid account",
				// 		});
				// 		resolve({
				// 			msg: "Invalid account",
				// 		});
				// 	} else {
				// 		const currentAccount = accounts[0];
						switch (currentTrade.exchange) {
							case enumExchange.KUCOIN:
								{
									kucoinAiService.manageTradeOrder(currentTrade.accountName, currentTrade).subscribe((result: any) => {
										functions.logger.info(`${currentTrade.symbol}-${currentTrade.action}`, {
											...currentTrade,
											result: result,
										});
										resolve(result);
									});
								}
								break;
							default:
								{
									functions.logger.info(`${currentTrade.account}-${currentTrade.symbol}-${currentTrade.action}`, {
										msg: "Account have no exchange value.",
									});
									resolve({
										msg: "Account have no exchange value.",
									});
								}
								break;
						}
				// 	}
				// });
			}
		});
		res.send(result);
	});
});
