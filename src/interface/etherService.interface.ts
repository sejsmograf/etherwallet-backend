export interface EtherService {
	getBalance: (address: string) => Promise<string>;
}
