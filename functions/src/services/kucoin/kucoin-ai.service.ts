// import * as functions from "firebase-functions";
import { forkJoin, Observable, Subscriber } from "rxjs";
import kucoinService, { KucoinService } from "./kucoin.service";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

export class KucoinAIService {
	enumOrderAction = {
		BUY: "buy",
		SELL: "sell",
	};
	enumTradeAction: any = {
		OPEN_LONG: "OPEN_LONG",
		CLOSE_LONG: "CLOSE_LONG",
		OPEN_SHORT: "OPEN_SHORT",
		CLOSE_SHORT: "CLOSE_SHORT",
	};
	enumAmountType = {
		FIXED: "FIXED",
		PERCENT: "PERCENT",
		FLEXI: "FLEXI",
	};
	enumBalanceOptionType = {
		FIXED: "FIXED",
		PERCENT: "PERCENT",
	};
	enumStopType = {
		SL: "SL",
		SL_ATR: "SL-ATR",
		TP: "SL",
		TP_ATR: "TP-ATR",
	};
	enumStopDirection = {
		up: "up",
		down: "down",
	};
	enumOrderStatus = {
		ACTIVE: "active",
		DONE: "done",
	};
	leverageLiquidateThreshold: any = 80;
	openPositionQtyKey: any = "currentQty";
	exchangeService: KucoinService;

	constructor() {
		this.exchangeService = kucoinService;
	}

	manageTradeOrder(account: any, tradeParams: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			switch (tradeParams.action) {
				case this.enumTradeAction.OPEN_LONG:
				case this.enumTradeAction.OPEN_SHORT:
					{
						this.getOpenPosition(account, tradeParams.symbol).subscribe((openPositionRow) => {
							if (openPositionRow.symbol && this.isPositionOpen(openPositionRow)) {
								const openPositionSide =
									parseFloat(openPositionRow[this.openPositionQtyKey]) < 0
										? this.enumOrderAction.SELL
										: this.enumOrderAction.BUY;
								if (openPositionSide !== tradeParams.side) {
									this.closeOrder(account, openPositionRow).subscribe(() => {
										this.cancelStopOrder(account, openPositionRow.symbol, openPositionSide).subscribe(() => {
											this.openOrder(account, tradeParams).subscribe((result) => {
												subscriber.next(result);
												subscriber.complete();
											});
										});
									});
								} else {
									subscriber.next({});
									subscriber.complete();
								}
							} else {
								this.openOrder(account, tradeParams).subscribe((result) => {
									subscriber.next(result);
									subscriber.complete();
								});
							}
						});
					}
					break;
				case this.enumTradeAction.CLOSE_LONG:
				case this.enumTradeAction.CLOSE_SHORT:
					{
						this.getOpenPosition(account, tradeParams.symbol).subscribe((openPositionRow) => {
							if (openPositionRow.symbol && this.isPositionOpen(openPositionRow)) {
								const openPositionSide =
									parseFloat(openPositionRow[this.openPositionQtyKey]) < 0
										? this.enumOrderAction.SELL
										: this.enumOrderAction.BUY;

								if (openPositionSide === tradeParams.side) {
									this.closeOrder(account, openPositionRow).subscribe(() => {
										this.cancelStopOrder(account, openPositionRow.symbol, openPositionSide).subscribe((results) => {
											subscriber.next(results);
											subscriber.complete();
										});
									});
								}
							} else {
								this.cancelStopOrder(account, tradeParams.symbol, tradeParams.side).subscribe((results) => {
									subscriber.next(results);
									subscriber.complete();
								});
							}
						});
					}
					break;
				default:
					{
						subscriber.next({
							msg: "Invalid action",
						});
						subscriber.complete();
					}
					break;
			}
		});
	}

	getOpenPosition(account: any, symbol: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			this.exchangeService.getOpenPosition(account, symbol).subscribe((position: any) => {
				subscriber.next(position);
			});
		});
	}

	isPositionOpen(position: any) {
		return position && parseFloat(position[this.openPositionQtyKey]) != 0;
	}

	getOrderQuantity(account: any, amt: any, amtType: any, price: any, leverage: any, multiplier: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			price = parseFloat(price);
			let quantity: any;
			// 1 lot = multiplier
			if (amtType === this.enumAmountType.FIXED) {
				amt = amt === 0 ? account.trade.amtFixed : amt;
				quantity = amt / (price / leverage);
				quantity = Math.floor(quantity / multiplier);
				subscriber.next(quantity);
			}
			if (amtType === this.enumAmountType.PERCENT) {
				amt = amt === 0 ? account.trade.amtPercent : amt;
				kucoinService.getAccountOverview(account, "USDT").subscribe((wallet) => {
					quantity = (wallet.marginBalance * (amt / 100)) / (price / leverage);
					quantity = Math.floor(quantity / multiplier);
					subscriber.next(quantity);
				});
			}
			if (amtType === this.enumAmountType.FLEXI) {
				kucoinService.getAccountOverview(account, "USDT").subscribe((wallet) => {
					amt = amt === 0 ? account.trade.amtFlexi : amt;
					let currentMarginBalance = 0;
					if (account.trade.balanceOption.type === this.enumBalanceOptionType.FIXED) {
						currentMarginBalance = account.trade.balanceOption.amt;
					}
					if (account.trade.balanceOption.type === this.enumBalanceOptionType.PERCENT) {
						currentMarginBalance = wallet.marginBalance * (account.trade.balanceOption.amt / 100);
						currentMarginBalance = Math.floor(currentMarginBalance);
					}

					if (currentMarginBalance > wallet.marginBalance) {
						// Set margin balance equal wallet.marginBalance
						currentMarginBalance = wallet.marginBalance;
					}

					quantity = (currentMarginBalance * (amt / 100)) / (price / leverage);
					quantity = Math.floor(quantity / multiplier);
					subscriber.next(quantity);
				});
			}
		});
	}

	openOrder(account: any, tradeParams: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			setTimeout(() => {
				this.exchangeService.getCurrentPrice(account, tradeParams.symbol).subscribe((currentPrice) => {
					this.exchangeService.getContract(account, tradeParams.symbol).subscribe((currentContract) => {
						let leverage = tradeParams.leverage ? tradeParams.leverage : 0;
						if (currentContract.status && currentContract.status === "Open") {
							// Check Leverage
							if (leverage === 0) {
								if (tradeParams.atr) {
									leverage = Math.round(
										this.leverageLiquidateThreshold / ((tradeParams.atr * 100) / parseFloat(currentPrice.price)),
									);
								} else {
									subscriber.next({
										msg: "No atr value.",
									});
									subscriber.complete();
								}
							}
							leverage = leverage > currentContract.maxLeverage ? currentContract.maxLeverage : leverage;
							if (tradeParams.maxLeverage) {
								leverage = leverage > tradeParams.maxLeverage ? parseInt(tradeParams.maxLeverage) : leverage;
							}
							tradeParams.leverage = leverage;

							// Check Quantity
							this.getOrderQuantity(
								account,
								tradeParams.amt,
								tradeParams.amtType,
								currentPrice.price,
								leverage,
								currentContract.multiplier,
							).subscribe((quantity) => {
								tradeParams.quantity = quantity;
								tradeParams.orderId = uuidv4();
								tradeParams.price = currentPrice.price;
								const orderParams = {
									clientOid: tradeParams.orderId,
									side: tradeParams.side,
									symbol: tradeParams.symbol,
									type: "market",
									leverage: tradeParams.leverage,
									size: tradeParams.quantity,
									remark: "Trade Sheikh AI",
								};

								kucoinService.order(account, orderParams).subscribe((orderResult) => {
									if (orderResult.code === "200000") {
										// const isAutoDeposit = true; // Set default Auto Deposit
										// kucoinService.setAutoDeposit(account, orderParams.symbol, isAutoDeposit).subscribe(() => {
										// 	if (tradeParams.stopType) {
										// 		this.stopLossOrder(account, tradeParams).subscribe((stopLossOrderResult) => {
										// 			subscriber.next(stopLossOrderResult);
										// 			subscriber.complete();
										// 		});
										// 	} else {
										// 		subscriber.next(orderResult);
										// 		subscriber.complete();
										// 	}
										// });
										if (tradeParams.stopType) {
											this.stopLossOrder(account, tradeParams).subscribe((stopLossOrderResult) => {
												subscriber.next(stopLossOrderResult);
												subscriber.complete();
											});
										} else {
											subscriber.next(orderResult);
											subscriber.complete();
										}
									} else {
										subscriber.next(orderResult);
										subscriber.complete();
									}
								});
							});
						} else {
							subscriber.next({});
							subscriber.complete();
						}
					});
				});
			}, 1000);
		});
	}

	closeOrder(account: any, openPositionRow: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const orderParams = {
				symbol: openPositionRow.symbol,
				side:
					parseFloat(openPositionRow[this.openPositionQtyKey]) < 0
						? this.enumOrderAction.BUY
						: this.enumOrderAction.SELL,
				type: "market",
				size: Math.abs(openPositionRow[this.openPositionQtyKey]),
				clientOid: openPositionRow.id,
				closeOrder: true,
			};
			this.exchangeService.order(account, orderParams).subscribe((results) => {
				subscriber.next(results);
			});
		});
	}

	cancelStopOrder(account: any, symbol: any, actionSide: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			actionSide = actionSide === this.enumOrderAction.BUY ? this.enumOrderAction.SELL : this.enumOrderAction.BUY;
			this.exchangeService.getStopOrders(account, symbol).subscribe(
				(orders) => {
					if (orders.length > 0) {
						const cancelOrderActions: any = {};
						orders.map((order: any) => {
							if (order.side === actionSide) {
								cancelOrderActions[order.id] = this.exchangeService.cancelOrder(account, {
									id: order.id,
								});
							}
						});
						if (Object.keys(cancelOrderActions).length > 0 && cancelOrderActions.constructor === Object) {
							forkJoin(cancelOrderActions).subscribe((results: any) => {
								subscriber.next(results);
								subscriber.complete();
							});
						} else {
							subscriber.next({});
							subscriber.complete();
						}
					} else {
						subscriber.next({});
						subscriber.complete();
					}
				},
				() => {
					subscriber.next({});
					subscriber.complete();
				},
			);
		});
	}

	stopLossOrder(account: any, tradeParams: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			const stopSide =
				tradeParams.side === this.enumOrderAction.BUY ? this.enumOrderAction.SELL : this.enumOrderAction.BUY;
			let stopPrice = parseFloat(tradeParams.price);
			const entryPrice = parseFloat(tradeParams.price);
			switch (tradeParams.stopType) {
				case this.enumStopType.SL:
					{
						stopPrice = entryPrice * (tradeParams.stop / 100);
						if (stopSide === this.enumOrderAction.BUY) {
							stopPrice = entryPrice + stopPrice;
						}
						if (stopSide === this.enumOrderAction.SELL) {
							stopPrice = entryPrice - stopPrice;
						}
					}
					break;
				case this.enumStopType.SL_ATR:
					{
						stopPrice = parseFloat(tradeParams.atr);
						if (stopSide === this.enumOrderAction.BUY) {
							stopPrice = entryPrice + stopPrice;
						}
						if (stopSide === this.enumOrderAction.SELL) {
							stopPrice = entryPrice - stopPrice;
						}
					}
					break;
			}
			if (Math.floor(entryPrice) === entryPrice) {
				stopPrice = Math.round(stopPrice);
			} else {
				const pricePrecision = entryPrice.toString().split(".")[1].length;
				stopPrice = parseFloat(stopPrice.toFixed(pricePrecision));
			}
			const stopDirection = stopPrice > entryPrice ? this.enumStopDirection.up : this.enumStopDirection.down;
			const orderParams = {
				clientOid: uuidv4(),
				side: stopSide,
				symbol: tradeParams.symbol,
				type: "market",
				stopPrice: stopPrice,
				stopPriceType: "TP",
				stop: stopDirection,
				leverage: tradeParams.leverage,
				size: tradeParams.quantity,
				remark: tradeParams.orderId,
				reduceOnly: true,
				closeOrder: true,
			};
			this.exchangeService.order(account, orderParams).subscribe((results) => {
				subscriber.next(results);
				subscriber.complete();
			});
		});
	}

	checkOpenOrders(account: any): Observable<any> {
		return new Observable<any>((subscriber: Subscriber<any>) => {
			this.exchangeService.getAllPositions(account).subscribe((positions) => {
				this.exchangeService.getAllStopOrders(account).subscribe((stopOrders) => {
					const orders = _.differenceBy(stopOrders, positions, "symbol");
					const cancelStopOrderActions: any = {};
					orders.map((order: any) => {
						cancelStopOrderActions[account.code + "-" + order.symbol] = this.exchangeService.cancelAllStopOrders(
							account,
							order.symbol,
						);
					});
					if (Object.keys(cancelStopOrderActions).length > 0 && cancelStopOrderActions.constructor === Object) {
						forkJoin(cancelStopOrderActions).subscribe((results: any) => {
							subscriber.next(results);
							subscriber.complete();
						});
					} else {
						subscriber.next({});
						subscriber.complete();
					}

					// const orders = _.differenceBy(positions, stopOrders, "symbol");
					// subscriber.next({
					// 	positions: positions.length,
					// 	stopOrders: stopOrders.length,
					// 	orders: orders,
					// });
					// subscriber.complete();
				});
			});
		});
	}
}
export default new KucoinAIService();
