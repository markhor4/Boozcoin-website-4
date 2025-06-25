// Google Form configuration
const FORM_ID = '1FAIpQLSeN1XBtcl3l9pVQoLqhZlcBUi2xezfuNiCNzJQXbJyGY3ZF4w';
const FIELDS = {
    walletAddress: 'entry.1201752685',
    solAmount: 'entry.1049092587',
    boozAmount: 'entry.1952283423',
    transactionId: 'entry.913823248'
};

// Solana Pay configuration
const RECIPIENT = 'HY6po9XbgiZEztwbphc4Uo2q5SYAc5RFb1Axg5h8T7Vy';
const TOTAL_TOKENS = 300000000;
const PRE_SALE_START = new Date('2025-07-05T15:00:00Z');

// DOM elements
const connectWalletBtn = document.getElementById('connect-wallet');
const buyButton = document.getElementById('buy-button');
const solAmountInput = document.getElementById('sol-amount');
const boozAmountInput = document.getElementById('booz-amount');
const usdCostInput = document.getElementById('usd-cost');
const solPriceSpan = document.getElementById('sol-price');
const presaleTimer = document.getElementById('presale-timer');
const utcTime = document.getElementById('utc-time');
const transactionList = document.getElementById('transaction-list');
const googleFormLink = document.getElementById('google-form-link');
const loadingIndicator = document.getElementById('loading-indicator');
const popupTutorial = document.getElementById('popup-tutorial');
const closePopupBtn = document.getElementById('close-popup');

// State
let wallet = null;
let solPriceInUSD = 0;
let tokensSold = 0;
let transactions = JSON.parse(localStorage.getItem('boozTransactions')) || [];
console.log('Initial transactions from localStorage:', transactions);

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Simple SHA-256 implementation
function sha256(str) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const K = new Array(64).fill(0).map((_, i) => [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ][i]);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const msg = new TextEncoder().encode(str);
    const padded = new Uint8Array(Math.ceil((msg.length + 9) / 64) * 64);
    padded.set(msg);
    padded[msg.length] = 0x80;
    padded.set(new Uint8Array(new BigUint64Array([BigInt(msg.length * 8)]).buffer).reverse(), padded.length - 8);
    for (let i = 0; i < padded.length; i += 64) {
        const w = new Array(64).fill(0);
        for (let t = 0; t < 16; t++) {
            w[t] = (padded[i + t * 4] << 24) | (padded[i + t * 4 + 1] << 16) | (padded[i + t * 4 + 2] << 8) | padded[i + t * 4 + 3];
        }
        for (let t = 16; t < 64; t++) {
            const s0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3);
            const s1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10);
            w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let t = 0; t < 64; t++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) >>> 0;
            h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
        }
        H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.map(h => h.toString(16).padStart(8, '0')).join('');
}

// Generate pre-filled Google Form URL with validation
function generatePreFilledFormUrl(walletAddress, solAmount, boozAmount, transactionId) {
    const requiredFields = ['walletAddress', 'solAmount', 'boozAmount', 'transactionId'];
    for (const field of requiredFields) {
        if (!FIELDS[field] || FIELDS[field].includes('YOUR_CORRECT_BOOZ_AMOUNT_ID')) {
            console.error(`Invalid Google Form field: ${field}`);
            alert('Form configuration error. Please contact support to update BOOZ amount field ID.');
            return '#';
        }
    }
    const baseUrl = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform?`;
    const params = new URLSearchParams({
        [FIELDS.walletAddress]: walletAddress,
        [FIELDS.solAmount]: solAmount.toString(),
        [FIELDS.boozAmount]: boozAmount.toString(),
        [FIELDS.transactionId]: transactionId
    });
    const formUrl = baseUrl + params.toString();
    console.log('Generated Form URL with Transaction ID:', formUrl);

    // Client-side validation of form URL
    if (!formUrl.includes(FORM_ID) || !formUrl.includes('viewform') || params.toString().length === 0) {
        console.error('Invalid form URL generated:', formUrl);
        alert('Error: The pre-filled form URL is invalid. Please try again or contact support.');
        return '#';
    }
    return formUrl;
}

// Fetch Live SOL Price
async function fetchSolPrice() {
    const cachedPrice = localStorage.getItem('cachedSolPrice');
    if (cachedPrice) {
        solPriceInUSD = parseFloat(cachedPrice);
        solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)} (cached)`;
        updateCalculations();
    }

    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        solPriceInUSD = data.solana.usd;
        localStorage.setItem('cachedSolPrice', solPriceInUSD);
        solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)} (CoinGecko)`;
        updateCalculations();
        return;
    } catch (error) {
        console.error('CoinGecko failed:', error);
    }
    try {
        const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL&convert=USD', {
            headers: { 'X-CMC_PRO_API_KEY': 'your-coinmarketcap-api-key' }
        });
        const data = await response.json();
        if (data.status.error_code === 0) {
            solPriceInUSD = data.data.SOL.quote.USD.price;
            localStorage.setItem('cachedSolPrice', solPriceInUSD);
            solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)} (CoinMarketCap)`;
            updateCalculations();
            return;
        } else {
            console.error('CoinMarketCap error:', data.status.error_message);
        }
    } catch (error) {
        console.error('CoinMarketCap failed:', error);
    }
    if (!cachedPrice) {
        solPriceInUSD = 150; // Default to a reasonable value
        solPriceSpan.textContent = `$150.00 (default)`;
        console.warn('Using default SOL price of $150.');
        updateCalculations();
    }
}

// Presale Logic
function getCurrentPrice() {
    return 0.00003; // Fixed price, manually adjustable
}

function updatePriceDisplay() {
    const price = getCurrentPrice();
    const priceInfo = document.getElementById('price-info');
    priceInfo.textContent = `Current Price: $${price.toFixed(6)} per BOOZ`;
}

function checkPresaleStatus() {
    const now = new Date();
    if (tokensSold >= TOTAL_TOKENS) {
        presaleTimer.textContent = 'Presale Ended! Awaiting final verification.';
    } else if (now < PRE_SALE_START) {
        const timeLeft = PRE_SALE_START - now;
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        presaleTimer.textContent = `Presale Starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
        presaleTimer.textContent = 'Presale Ongoing! Submit form after payment.';
    }
}

function updateCalculations() {
    const price = getCurrentPrice();
    if (price === 0 || solPriceInUSD === 0) {
        solAmountInput.value = '0.05';
        boozAmountInput.value = '0';
        usdCostInput.value = '$0';
        return;
    }

    let solAmount = parseFloat(solAmountInput.value) || 0;

    // Restrict calculations to 0.05–5 SOL range
    if (solAmount >= 0.05 && solAmount <= 5) {
        const usdAmount = solAmount * solPriceInUSD;
        const boozAmount = Math.floor(usdAmount / price);
        boozAmountInput.value = boozAmount.toLocaleString();
        usdCostInput.value = `$${usdAmount.toFixed(2)}`;
    } else {
        boozAmountInput.value = '0';
        usdCostInput.value = '$0';
    }
}

function validateStorage() {
    const storedHash = localStorage.getItem('boozTransactionsHash');
    const currentHash = sha256(JSON.stringify(transactions));
    if (storedHash && storedHash !== currentHash) {
        alert('Warning: Transaction data may have been tampered with. Contact support.');
    }
}

function addTransaction(signature, solAmount, boozAmount) {
    const timestamp = new Date().toLocaleString();
    transactions.push({ signature, solAmount, boozAmount, timestamp });
    localStorage.setItem('boozTransactions', JSON.stringify(transactions));
    localStorage.setItem('boozTransactionsHash', sha256(JSON.stringify(transactions)));
    tokensSold += boozAmount; // Increment tokensSold with each transaction
    renderTransactions();
    updateCalculations(); // Update with current SOL value
    updatePriceDisplay();
}

function renderTransactions() {
    transactionList.innerHTML = '';
    transactions.forEach(tx => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `https://solscan.io/tx/${tx.signature}`;
        link.textContent = `TxID: ${tx.signature.slice(0, 8)}...`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        li.appendChild(link);
        li.appendChild(document.createTextNode(` | Sent ${tx.solAmount} SOL for ${tx.boozAmount.toLocaleString()} BOOZ on ${tx.timestamp}`));
        transactionList.appendChild(li);
    });
}

async function waitForSolanaWeb3(timeout = 10000) {
    const start = Date.now();
    while (!window.solanaWeb3 && Date.now() - start < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!window.solanaWeb3) {
        throw new Error('solanaWeb3 not loaded after timeout. Check script inclusion: https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.iife.min.js');
    }
    return window.solanaWeb3;
}

async function connectWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert('Phantom wallet not found. Please install Phantom.');
            return;
        }
        wallet = window.solana;
        try {
            await wallet.disconnect();
        } catch (err) {
            console.warn('Failed to disconnect existing wallet:', err);
        }
        wallet.publicKey = null;
        await wallet.connect({ onlyIfTrusted: false });
        connectWalletBtn.textContent = `Connected: ${wallet.publicKey.toString().slice(0, 8)}...`;
        buyButton.disabled = PRE_SALE_START > new Date() || tokensSold >= TOTAL_TOKENS;
        validateStorage();
        renderTransactions();
    } catch (error) {
        console.error('Wallet connection failed:', error);
        alert('Failed to connect wallet. Please install Phantom, ensure it’s logged in, and try again.');
        wallet = null;
        connectWalletBtn.textContent = 'Connect Wallet';
    }
}

async function buyBooz() {
    const solAmount = parseFloat(solAmountInput.value) || 0;
    console.log('User Input SOL Amount:', solAmount);
    if (solAmount < 0.05 || solAmount > 5 || isNaN(solAmount)) {
        alert('Enter a valid amount within 0.05–5 SOL range.');
        return;
    }

    const now = new Date();
    if (now < PRE_SALE_START) {
        alert('Presale starts on July 5, 2025 at 15:00 UTC.');
        return;
    }

    const price = getCurrentPrice();
    if (price === 0) {
        alert('Presale has ended!');
        return;
    }

    if (solPriceInUSD === 0) {
        alert('SOL price unavailable. Try again later.');
        return;
    }

    if (!wallet || !wallet.publicKey) {
        alert('Please connect your wallet first.');
        return;
    }

    const usdAmount = solAmount * solPriceInUSD;
    let boozAmount = Math.floor(usdAmount / price);
    const remainingTokens = TOTAL_TOKENS - tokensSold;
    if (boozAmount > remainingTokens) {
        alert(`Only ${remainingTokens.toLocaleString()} BOOZ left.`);
        return;
    }

    try {
        buyButton.disabled = true;
        buyButton.textContent = 'Processing...';
        loadingIndicator.style.display = 'block';

        const solanaWeb3 = await waitForSolanaWeb3();
        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = solanaWeb3;
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        const recipientPubkey = new PublicKey(RECIPIENT);
        const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: recipientPubkey,
                lamports
            })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log('Transaction sent, signature:', signature);

        const confirmation = await connection.confirmTransaction(signature, 'processed', 60000);
        if (confirmation?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.err)}`);
        }
        console.log('Transaction confirmed, signature:', signature);

        tokensSold += boozAmount;
        addTransaction(signature, solAmount, boozAmount);
        updatePriceDisplay();

        const formUrl = generatePreFilledFormUrl(wallet.publicKey.toString(), solAmount, boozAmount, signature);
        if (formUrl === '#') {
            throw new Error('Form URL validation failed.');
        }
        googleFormLink.href = formUrl;
        googleFormLink.style.display = 'block';

        setTimeout(() => {
            const formWindow = window.open(formUrl, '_blank');
            if (!formWindow || formWindow.closed || typeof formWindow.closed === 'undefined') {
                popupTutorial.style.display = 'block';
            } else {
                formWindow.focus();
            }
            alert('Transaction successful! Please submit the pre-filled form to record your purchase.');
            loadingIndicator.style.display = 'none';
        }, 5000);

    } catch (error) {
        console.error('Transaction error:', error);
        alert(`Error: ${error.message || 'Transaction failed.'}`);
        loadingIndicator.style.display = 'none';
    } finally {
        buyButton.disabled = PRE_SALE_START > new Date() || tokensSold >= TOTAL_TOKENS;
        buyButton.textContent = 'Buy BOOZ Now';
    }
}

// Event Listeners
connectWalletBtn.addEventListener('click', connectWallet);
buyButton.addEventListener('click', buyBooz);
solAmountInput.addEventListener('input', debounce(updateCalculations, 300));
closePopupBtn.addEventListener('click', () => {
    popupTutorial.style.display = 'none';
});

// Dynamic Button Enabling
function updateButtonState() {
    const now = new Date();
    buyButton.disabled = now < PRE_SALE_START || tokensSold >= TOTAL_TOKENS || !wallet;
}
setInterval(updateButtonState, 1000);

// Initialize
fetchSolPrice();
setInterval(fetchSolPrice, 120000);
checkPresaleStatus();
setInterval(checkPresaleStatus, 1000);
updatePriceDisplay();
updateCalculations();
validateStorage();
renderTransactions();

window.addEventListener('load', async () => {
    try {
        const solanaWeb3 = await waitForSolanaWeb3();
        console.log('solanaWeb3 loaded successfully:', solanaWeb3);
        const testUrl = generatePreFilledFormUrl('test-wallet', 0.05, 250000, 'test-signature');
        console.log('Test Form URL:', testUrl);
    } catch (error) {
        console.error('solanaWeb3 failed to load:', error.message);
        console.error('Check script inclusion: https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.iife.min.js');
    }
});
