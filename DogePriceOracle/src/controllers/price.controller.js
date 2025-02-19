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

// Fetch price from Coinbase
async function fetchPriceFromCoinbase() {
  try {
    const response = await axios.get(
      "https://api.coinbase.com/v2/prices/DOGE-USD/spot"
    );
    const price = parseFloat(response.data.data.amount);
    console.log("Coinbase DOGE/USD Price:", price);
    return price;
  } catch (error) {
    console.error("Error fetching price from Coinbase:", error.message);
    return null;
  }
}

// Fetch price from CoinGecko
async function fetchPriceFromCoinGecko() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd"
    );
    const price = response.data.dogecoin.usd;
    console.log("CoinGecko DOGE/USD Price:", price);
    return price;
  } catch (error) {
    console.error("Error fetching price from CoinGecko:", error.message);
    return null;
  }
}

// Fetch price from Binance
async function fetchPriceFromBinance() {
  try {
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/price?symbol=DOGEUSDT"
    );
    const price = parseFloat(response.data.price);
    console.log("Binance DOGE/USD Price:", price);
    return price;
  } catch (error) {
    console.error("Error fetching price from Binance:", error.message);
    return null;
  }
}

// Fetch DOGE price from multiple sources and calculate the average
async function fetchDogePrice() {
  try {
    // Execute all price fetches concurrently
    const prices = await Promise.all([
      fetchPriceFromCoinbase(),
      fetchPriceFromCoinGecko(),
      fetchPriceFromBinance(),
    ]);

    // Filter out any failed (null) responses
    const validPrices = prices.filter((price) => price !== null);

    if (validPrices.length === 0) {
      throw new Error("Failed to fetch price from all sources.");
    }

    // Calculate the average price
    const sum = validPrices.reduce((acc, curr) => acc + curr, 0);
    const averagePrice = sum / validPrices.length;
    console.log("Averaged DOGE/USD Price:", averagePrice);

    // Convert the average price to a BigNumber in 18-decimal format
    // Using toFixed(18) to ensure 18 decimal places in the string representation
    const formattedPrice = ethers.parseUnits(averagePrice.toFixed(18), 18);
    return formattedPrice;
  } catch (error) {
    console.error("Error calculating averaged DOGE price:", error.message);
    throw error;
  }
}

async function updateDogePrice(req, res) {
  try {
    // Fetch the averaged DOGE price from multiple sources
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
    console.error("Error updating price:", error.message);
    res.status(500).json({ error: error.message });
  }
}

export { updateDogePrice };
