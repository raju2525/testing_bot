const { ethers } = window;
const { utils,JsonRpcProvider } = ethers;


function initializeWalletAndContract() {
  const privateKeyInput = document.getElementById('privateKey').value;
const contractAddressInput = document.getElementById('contractAddress').value;
const apiUrlInput = document.getElementById('apiUrl').value; 
const DestinationAddress = document.getElementById('DestAddress').value;
function consoleAsStatus(...args) {
  const status = document.getElementById("output");
  status.innerHTML += args.join(" ") + "<br />";
  console.log(...args);
}
  const provider = new ethers.providers.JsonRpcProvider(apiUrlInput);

  const wallet = new ethers.Wallet(privateKeyInput, provider);
  
  const decimalPlace = document.querySelector('input[name="decimalPlace"]:checked').value;
  

  

  // Replace ABI with the actual ABI of your contract
  const ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  const contract = new ethers.Contract(contractAddressInput, ABI, wallet);

  return { wallet, contract,privateKeyInput,contractAddressInput,apiUrlInput ,consoleAsStatus,decimalPlace,DestinationAddress};
}



async function checkBalance() {
  const { wallet, contract,privateKeyInput,contractAddressInput,apiUrlInput,consoleAsStatus,decimalPlace,DestinationAddress}= initializeWalletAndContract();
  try {
    const walletAddress = await wallet.getAddress();
    const balance = await contract.balanceOf(walletAddress);
    const balanceInEther = ethers.utils.formatUnits(balance,decimalPlace);
    consoleAsStatus(`BALANCE: ${balanceInEther}`);
    
  } catch (error) {
    consoleAsStatus('Error checking balance:', error);
  }
}



// Function to initiate AutoTransfer
async function AutoTransfer() {
  const { wallet, contract,  consoleAsStatus, decimalPlace ,DestinationAddress} = initializeWalletAndContract();

  try {
    while (true) {
      const walletAddress = await wallet.getAddress();
      const tokenBalance = await contract.balanceOf(walletAddress);
      const tokenBalanceInEther = ethers.utils.formatUnits(tokenBalance);
      consoleAsStatus(`wactching balance in ${walletAddress}....`);
      consoleAsStatus(`BALANCE: ${tokenBalanceInEther}`);
      
      consoleAsStatus('Waiting for balance greater than 0...');

      if (tokenBalanceInEther > 0) {
        consoleAsStatus(`Token Balance: ${tokenBalanceInEther}`);
       
        const to_address= DestinationAddress;
        const amountToTransfer = tokenBalance;

        try {
          consoleAsStatus(`Initiating transfer... sending ${amountToTransfer}`);
          const tx = await contract.transfer(to_address, amountToTransfer);
          consoleAsStatus('Transaction sent, awaiting confirmation...');
          const receipt = await tx.wait();
          consoleAsStatus(`Receipt: ${receipt}`);
          consoleAsStatus(`Transaction hash: ${tx.hash}`);
          consoleAsStatus(`Sent ${utils.formatUnits(amountToTransfer, decimalPlace)} tokens to VAULT ${to_address} ✅`);
        } catch (error) {
          if (error.message.includes("insufficient funds for gas") || error.message.includes("nonce too low")) {
            consoleAsStatus('Transfer failed: Insufficient funds or nonce too low. Please check your account.');
          } else {
            consoleAsStatus('Transfer failed:', error);
          }
        }
      }

      const intervalInMilliseconds = 2500; // 3 seconds
      await new Promise(resolve => setTimeout(resolve, intervalInMilliseconds));
    }
  } catch (error) {
    consoleAsStatus('Error fetching token balance or transferring:', error);
  }
}
