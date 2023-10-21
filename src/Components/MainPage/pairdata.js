import Web3 from "web3";


const moment = require('moment');
const tokenABI = require("./tokenAbi.json");
const pairAbi = require("./pairAbi.json");
const routerAbi = require("./routerAbi.json");
const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";


const bscNodeUrl = "https://mainnet.infura.io/v3/fcae1556b27c43a19cf6163144febdcc";

const web3 = new Web3(bscNodeUrl);

async function fetchTokenDecimals(contractAddress) {
  try {
    const tokenContract = new web3.eth.Contract(tokenABI, contractAddress);
    const fetchedDecimals = await tokenContract.methods.decimals().call();
    console.log("DECIMALS", fetchedDecimals);
    return fetchedDecimals;
  } catch (error) {
    console.error("Error fetching token decimals:", error);
  }
  
}

async function getUniswapPairAddress(token0, token1) {
  const UNISWAP_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
  const UNISWAP_FACTORY_ABI = require("./factoryAbi.json");
  const factory = new web3.eth.Contract(UNISWAP_FACTORY_ABI, UNISWAP_FACTORY_ADDRESS);
  
  const pairAddress = await factory.methods.getPair(token0, token1).call();
  if(pairAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('Pair does not exist');
  }
  return pairAddress;
}

async function getEthPriceInUsd() {
  try {
      const routerContract = new web3.eth.Contract(routerAbi, ROUTER_ADDRESS);
      
      // Specify the path [WETH, USDT]
      const path = [WETH_ADDRESS, USDT_ADDRESS];

      // Specify the amount of WETH you want to swap (in wei)
      const amountIn = web3.utils.toWei('1', 'ether');  // 1 WETH

      const amountsOut = await routerContract.methods.getAmountsOut(amountIn, path).call();

      const priceOfEthInUsd = Number(amountsOut[1]) / (10**6); // considering USDT has 6 decimals
      console.log(`Price of ETH in USD: ${priceOfEthInUsd}`);
      return priceOfEthInUsd;
      
  } catch (error) {
      console.error('Failed to fetch price: ', error);
      throw error;
  }
}

const token0 = '0x44d4fbd11828f8d39645d160e837b70f5422ed9f'
const token1 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

async function getHistoricalData(token0, token1) {
  const ethPriceUSD = await getEthPriceInUsd();
  const pairAddress = await getUniswapPairAddress(token0, token1);  // This function needs to be defined to get pair address
  console.log(pairAddress.toString());
  const pairContract = new web3.eth.Contract(pairAbi, pairAddress);
  const tokenDecimalValue = await fetchTokenDecimals(token0);
  const convertedDecimals = Number(tokenDecimalValue);
  console.log(token0)
  console.log(convertedDecimals, "decimals");

  const pastEvents = await pairContract.getPastEvents('Swap', {
      fromBlock: 0,
      toBlock: 'latest'
  });
  console.log(pastEvents);
  const data = pastEvents[1]
  // let aggregatedData = "";
  let aggregatedData = {}

  // Parse and aggregate data per minute


  for (let event of pastEvents) {
      const timeStamp = await (Number(event.blockNumber.toString()));
      // const date = moment.unix(timeStamp.timestamp).startOf('minute').format();
      const amount0In = Number(event.returnValues.amount0In) / (10 ** convertedDecimals);
      const amount1In = Number(event.returnValues.amount1In) / (10 ** 18);
      const amount0Out = Number(event.returnValues.amount0Out) / (10 ** convertedDecimals);
      const amount1Out = Number(event.returnValues.amount1Out) / (10 ** 18);
      // amount1in = eth
      // amount0out = token
      // console.log(amount0In, timeStamp)
      // console.log(amount1In, timeStamp)
      // in 0, 1 out = sell
      // out 0, 1 in = buy
    
      let price = 0;  // Initialize price variable
  
      // Check if it's a sell for Token 0 and buy for Token 1
      if(amount0In > 0 && amount1Out > 0) {
          // It's a sell (Token 0 / Token 1)
          price = (amount1Out / amount0In) * ethPriceUSD;;
      }
      
      // Check if it's a sell for Token 1 and buy for Token 0
      else if(amount1In > 0 && amount0Out > 0) {
          // It's a buy (Token 0 / Token 1)
          price = (amount1In / amount0Out) * ethPriceUSD;
      }

      // Ensure price is not Infinity or NaN
      if (!isFinite(price)) {
          console.error(`Price calculation error at block ${timeStamp}: ${price}`);
          price = 0; // or handle as needed
      }

      // const priceInUSD = price;

      // Assuming you want to use price in open/high/low/close (modify as needed)
      if (!aggregatedData[timeStamp]) {
        aggregatedData[timeStamp] = {
            open: price,
            high: price,
            low: price,
            close: price,
            prices: [price], // Storing all prices for future reference if needed
        };
      } else {
          // Update high price
          if (price > aggregatedData[timeStamp].high) {
              aggregatedData[timeStamp].high = price;
          }
          // Update low price
          if (price < aggregatedData[timeStamp].low) {
              aggregatedData[timeStamp].low = price;
          }
          // Update close price
          aggregatedData[timeStamp].close = price;
  
          // Store price
          aggregatedData[timeStamp].prices.push(price);
      }
    }
  console.log(aggregatedData, "data")
  return aggregatedData;
}

const [data, setData] = useState([]);


const fetchData = async () => {
  try {
    const result = await getHistoricalData('0x6216F4f38745A41ea048e273eE20Cfe5a8E8C2F4', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
        const convertedResult = result.map(event => convertBigInt(event));
        setData(convertedResult);
  } catch (error) {
    console.error("Error fetching data: ", error);
    // Handle error accordingly
  }
};

fetchData();


