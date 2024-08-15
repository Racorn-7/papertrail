import React, { useState } from 'react';
import { ethers } from 'ethers';
import '../styling/WalletInput.css';

const WalletInput: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [transactions, setTransactions] = useState<ethers.providers.TransactionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const provider = new ethers.providers.EtherscanProvider("homestead", "PMWGSTAXA3VKW7CG4R7KWYAYVWJICE6SNZ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Validate the Ethereum address
      if (!ethers.utils.isAddress(walletAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      // Fetch the list of transactions using the Etherscan provider
      const history = await provider.getHistory(walletAddress);
      setTransactions(history);
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-input-container">
      <form onSubmit={handleSubmit} className="wallet-form">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter Ethereum Wallet Address"
          className="wallet-input"
        />
        <button type="submit" className="wallet-submit-button">
          Get Transactions
        </button>
      </form>
      
      {loading && <p>Loading transactions...</p>}
      {error && <p className="error-message">{error}</p>}
      
      <div className="transaction-list">
        {transactions.length > 0 && (
          <ul>
            {transactions.map((tx, index) => (
              <li key={index}>
                <p><strong>Hash:</strong> {tx.hash}</p>
                <p><strong>Block Number:</strong> {tx.blockNumber}</p>
                <p><strong>From:</strong> {tx.from}</p>
                <p><strong>To:</strong> {tx.to || 'Contract Creation'}</p>
                <p><strong>Value:</strong> {ethers.utils.formatEther(tx.value)} ETH</p>
                <p><strong>Date:</strong> {new Date(tx.timestamp! * 1000).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WalletInput;
