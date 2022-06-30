import * as admin from "firebase-admin";
import { Observable } from "rxjs";
import serviceAccount from "./service-account-key.json";

// const API_ACCOUNT_COLLECTION:any = "accounts";
// const API_ACCOUNT_COLLECTION = "accountsTestnet";

export class FirestoreService {
	db: any;

	constructor() {
		const credential = serviceAccount as admin.ServiceAccount;
		admin.initializeApp({
			credential: admin.credential.cert(credential),
		});
		this.db = admin.firestore();
	}

	getAccounts(code?: any, exchange?: any): Observable<any> {
		return new Observable<any>((subscriber: any) => {
			let accountRef = this.db.collection("accounts");
			if (code) {
				accountRef = accountRef.where("code", "==", code);
			}

			if (exchange) {
				accountRef = accountRef.where("exchange", "==", exchange);
			}

			accountRef.get().then((data: any) => {
				const accounts: any = [];
				data.docs.map((d: any) => {
					const account = d.data();
					accounts.push(account);
				});
				subscriber.next(accounts);
				subscriber.complete();
			});
		});
	}

	editAccount(code?: any, data?: any): Observable<any> {
		return new Observable<any>((subscriber: any) => {
			const accountRef = this.db.collection("accounts");
			accountRef.doc(code).update(data);
			subscriber.next({});
			subscriber.complete();
		});
	}
}

export default new FirestoreService();
