const { SigningArchwayClient } = require("@archwayhq/arch3.js");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const fs = require("fs");
const base64js = require("base64-js");
const dotenv = require("dotenv");
const Long = require("long")
dotenv.config();
function calculateEpochTime(minutes) {
	const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

	const futureTime = new Date();
	futureTime.setMinutes(futureTime.getMinutes() + minutes);
	const futureTimestamp = Math.floor(futureTime.getTime() / 1000); // Future time in seconds

	return futureTimestamp;
}
async function main() {
	const network = {
		chainId: "constantine-3",
		endpoint: "https://rpc.constantine.archway.tech",
		prefix: "archway",
	};
	// Get wallet and accounts from mnemonic
	const mnemonic =
		"add memonic key";
	const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
		prefix: network.prefix,
	});
	const accounts = await wallet.getAccounts();
	const accountAddress = accounts[0].address;
	console.log(accountAddress)
	const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS;
	const signingClient = await SigningArchwayClient.connectWithSigner(
		network.endpoint,
		wallet
	);
	// const TimeStamp = signingClient.getHeight()
	// Upload a contract
	const wasmCode = fs.readFileSync("./sb_archway_contract.wasm");
	const contract = new Uint8Array(wasmCode);
	const encoded = Buffer.from(contract, "binary").toString("base64");
	const contractData = base64js.toByteArray(encoded);
	const msgStoreCode = {
		typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode",
		value: {
			sender: accountAddress,
			wasmByteCode: contractData,
			instantiatePermission: {
				// optional
				permission: 3,
				//address: accountAddress,
			},
		},
	};
	const broadcastResult = await signingClient.upload(
		accountAddress,
		contractData,
		'auto',
		'',);
	if (broadcastResult.code !== undefined && broadcastResult.code !== 0) {
		console.log("contract no store ooooo")
		console.log(
			"Storage failed:",
			broadcastResult.log || broadcastResult.rawLog
		);
	} else {
		console.log("contract done store ooo")
		console.log("Storage successful:", broadcastResult.transactionHash);

	}

	// Instantiate a contract

	const codeId = broadcastResult.codeId
	const time = 0;
	//config  instaiate msg
	const msg = {
		owner: accounts[0].address, //smart builder
		project_owner: accounts[0].address, // project or dao wallet
		name: "Smart Builder test", // name of presale
		hard_cap: "1000000000",
		soft_cap: "50000000",
		start_time: calculateEpochTime(5),
		end_time: calculateEpochTime(120),
		public_sale: true,
		min_investment: "1000000", ///min investment per user
		max_investment: "3000000", // max ivestment
	};
	const instantiateOptions = {
		memo: "Instantiating a new contract",
		funds: [{ denom: 'aconst', amount: '1000000000000000000' }],
		admin: accounts[0].address
	};
	const instantiateResult = await signingClient.instantiate(accountAddress, codeId, msg, 'my-instance-label', 'auto', instantiateOptions);
	if (instantiateResult.code !== undefined && instantiateResult.code !== 0) {
		console.log("instant failed")
		console.log("Instantiation failed:", instantiateResult.log || instantiateResult.rawLog);
	}
	else {
		console.log("instant successful")
		console.log("Instantiation successful:", instantiateResult.transactionHash);
	}
}
main();
