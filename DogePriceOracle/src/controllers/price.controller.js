import axios from "axios";
import { ethers } from "ethers";
import "dotenv/config";
import { oracleABI } from "../contractABI/oracleABI.js";

// Replace these with your contract details
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // Sepolia/Mainnet RPC URL
const privateKey = process.env.PRIVATE_KEY; // Wallet private key
const wallet = new ethers.Wallet(privateKey, provider);
const oracleContractAddress = process.env.ORACLE_CONTRACT_ADDRESS; // Deployed Oracle contract address
const oracleContract = new ethers.Contract(
  oracleContractAddress,
  oracleABI,
  wallet
);

async function fetchDogePrice() {
  try {
    // Use the Coingecko API to fetch the latest DOGE/USD price
    // Docs: https://www.coingecko.com/en/api
    const response = await axios.get(
      "https://api.coinbase.com/v2/prices/DOGE-USD/spot"
    );

    const dogePrice = response.data.data.amount;
    console.log("Fetched DOGE/USD Price:", dogePrice);

    // Convert the price from a string to a BigNumber
    // The price is in USD, so we use the parseUnits function to convert it to 18 decimals
    // This is because the price is a decimal number, and we need to represent it as an integer
    // in the 18-decimal format required by the Ethereum protocol
    const formattedPrice = ethers.parseUnits(dogePrice.toString(), 18);
    return formattedPrice;
  } catch (error) {
    console.error("Error fetching DOGE price:", error);
    throw error;
  }
}

async function updateDogePrice(req, res) {
  try {
    // Fetch the latest DOGE price
    const newPrice = await fetchDogePrice();

    // Update the price in the smart contract
    const tx = await oracleContract.updatePrice(newPrice);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.transactionHash);

    // Fetch the updated price from the contract
    const updatedPrice = await oracleContract.getPrice();
    console.log(
      "Updated DOGE/USD Price in Contract:",
      ethers.formatUnits(updatedPrice, 18)
    );
    return res.json({
        message: "Updated DOGE/USD Price in Contract:",
        updatedPrice: ethers.formatUnits(updatedPrice, 18),
    });
  } catch (error) {
    console.error("Error updating price:", error);
  }
}

export { updateDogePrice };
