import axios from 'axios';
import { ethers } from 'ethers';
import { InfuraConfig } from '../types/infura';

export class InfuraService {
	private provider: ethers.InfuraProvider;

	constructor(private config: InfuraConfig) {
		this.provider = new ethers.InfuraProvider(config.network, config.projectId);
	}
}
