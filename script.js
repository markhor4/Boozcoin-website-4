// Google Form configuration
const FORM_ID = '1FAIpQLSeN1XBtcl3l9pVQoLqhZlcBUi2xezfuNiCNzJQXbJyGY3ZF4w';
const FIELDS = {
    walletAddress: 'entry.1400207285', // Solana Wallet Address
    solAmount: 'entry.1655200200', // SOL Amount Sent
    boozAmount: 'entry.1184605775', // BOOZ Amount Allocated
    transactionId: 'entry.1866334747' // Transaction ID (not pre-filled)
};

// Solana Pay configuration
const RECIPIENT = '3j73rkUNf6cs4FpaPNse9Wkmvkf5a6RA47kNS5jfgy8D'; // Devnet presale wallet
const TOTAL_TOKENS = 300000000; // 300M BOOZ tokens for presale
const PRE_SALE_START = new Date('2025-06-18T14:00:00Z'); // Temporary for testing (Devnet)

// DOM elements
const connectWalletBtn = document.getElementById('connect-wallet');
const buyButton = document.getElementById('buy-button');
const solAmountInput = document.getElementById('sol-amount');
const solPriceSpan = document.getElementById('sol-price');
const boozAmountDisplay = document.getElementById('booz-amount');
const usdCostDisplay = document.getElementById('usd-cost');
const tokensSoldDisplay = document.getElementById('tokens-sold');
const progressBar = document.getElementById('progress-bar');
const presaleTimer = document.getElementById('presale-timer');
const transactionList = document.getElementById('transaction-list');
const googleFormLink = document.getElementById('google-form-link');

// State
let wallet = null;
let solPriceInUSD = 0;
let tokensSold = 0; // Placeholder; update via Google Sheet
let transactions = JSON.parse(localStorage.getItem('boozTransactions')) || [];

// Simple SHA-256 implementation for checksum
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

// Generate pre-filled Google Form URL
function generatePreFilledFormUrl(walletAddress, solAmount, boozAmount) {
    const baseUrl = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform?`;
    const params = new URLSearchParams({
        [FIELDS.walletAddress]: walletAddress,
        [FIELDS.solAmount]: solAmount.toString(),
        [FIELDS.boozAmount]: boozAmount.toString()
    });
    return baseUrl + params.toString();
}

// Fetch Live SOL Price
async function fetchSolPrice() {
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
            headers: { 'X-CMC Coinbase Cloud': 'https://pro-api.coinmarketcap.com' }
        });
        const data = await response.json();
        if (data.status.error_code === 0) {
            solPriceInUSD = data.data.SOL.quote.USD.price;
            localStorage.setItem('cachedSolPrice', solPriceInUSD);
            solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)}`;
            updateCalculations();
            return;
        } else {
            console.error('CoinMarketCap error:', data.status.error_message);
        }
    } catch (error) {
        console.error('CoinMarketCap failed:', error);
    }
    const cachedPrice = localStorage.getItem('cachedSolPrice');
    if (cachedPrice) {
        solPriceInUSD = parseFloat(cachedPrice);
        solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)} (cached)`;
    } else {
        solPriceInUSD = 100;
        solPriceSpan.textContent = `$100.00 (default)`;
        console.warn('Using default SOL price of $100.');
    }
    updateCalculations();
}

// Presale Logic
function getCurrentPrice() {
    if (tokensSold >= TOTAL_TOKENS) {
        return { price: 0, round: 'Ended' };
    }
    const step = Math.floor(tokensSold / 5000000) + 1;
    let price, round;
    if (tokensSold < 100000000) {
        price = 0.00003 + (step - 1) * 0.000002;
        round = '🍺 Boozer Shot';
    } else if (tokensSold < 200000000) {
        price = 0.00004 + (step - 21) * 0.000002;
        round = '🍻 Boozer Cheers';
    } else {
        price = 0.00005 + (step - 41) * 0.000002;
        round = '🎉 Party Popper';
    }
    return { price, round };
}

function updatePriceDisplay() {
    const { price, round } = getCurrentPrice();
    const priceInfo = document.getElementById('price-info');
    tokensSoldDisplay.textContent = tokensSold.toLocaleString();
    const progressPercent = (tokensSold / TOTAL_TOKENS) * 100;
    progressBar.style.width = `${progressPercent}%`;
    if (price === 0) {
        priceInfo.textContent = 'Presale Ended!';
    } else {
        priceInfo.textContent = `Current Price: $${price.toFixed(6)} per BOOZ (${round})`;
    }
}

// Check Presale Status
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
        presaleTimer.textContent = 'Presale Ongoing! Submit tx ID after payment';
        buyButton.disabled = false;
    }
}

// Calculate BOOZ and USD
function updateCalculations() {
    const solAmount = parseFloat(solAmountInput.value) || 0;
    const { price } = getCurrentPrice();
    if (price === 0) {
        boozAmountDisplay.textContent = '0';
        usdCostDisplay.textContent = '0';
        return;
    }
    if (solPriceInUSD === 0) {
        boozAmountDisplay.textContent = 'Waiting for SOL price...';
        usdCostDisplay.textContent = '$0';
        return;
    }
    const usdAmount = Number((solAmount * solPriceInUSD).toFixed(8));
    let boozAmount = Math.floor(Number((usdAmount / price).toFixed(8)));
    const remainingTokens = TOTAL_TOKENS - tokensSold;
    if (boozAmount > remainingTokens) {
        boozAmount = remainingTokens;
        console.log(`Capped BOOZ at ${boozAmount}.`);
    }
    boozAmountDisplay.textContent = boozAmount.toLocaleString();
    usdCostDisplay.textContent = usdAmount.toFixed(2);
}

// Transaction History with Checksum
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
    renderTransactions();
}

function renderTransactions() {
    transactionList.innerHTML = '';
    transactions.forEach(tx => {
        const li = document.createElement('li');
        li.textContent = `TxID: ${tx.signature.slice(0, 8)}... | Sent ${tx.solAmount} SOL for ${tx.boozAmount.toLocaleString()} BOOZ on ${tx.timestamp}`;
        transactionList.appendChild(li);
    });
}

// Wallet Connection
async function connectWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert('Phantom wallet not found. Please install Phantom.');
            return;
        }
        wallet = window.solana;
        await wallet.connect();
        connectWalletBtn.textContent = `Connected: ${wallet.publicKey.toString().slice(0, 8)}...`;
        buyButton.disabled = PRE_SALE_START > new Date() || tokensSold >= TOTAL_TOKENS;
        validateStorage();
        renderTransactions();
    } catch (error) {
        console.error('Wallet connection failed:', error);
        alert('Failed to connect wallet. Please install Phantom or try again.');
    }
}

// Buy BOOZ
async function buyBooz() {
    const solAmount = parseFloat(solAmountInput.value) || 0;
    if (solAmount < 0.05 || solAmount > 5 || isNaN(solAmount)) {
        alert('Enter a valid SOL amount (0.05–5 SOL).');
        return;
    }

    const now = new Date();
    if (now < PRE_SALE_START) {
        alert('Presale starts on July 7, 2025.');
        return;
    }

    const { price, round } = getCurrentPrice();
    if (round === 'Ended') {
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

    const usdAmount = Number((solAmount * solPriceInUSD).toFixed(8));
    let boozAmount = Math.floor(Number((usdAmount / price).toFixed(8)));
    const remainingTokens = TOTAL_TOKENS - tokensSold;
    if (boozAmount > remainingTokens) {
        alert(`Only ${remainingTokens.toLocaleString()} BOOZ left.`);
        return;
    }

    try {
        buyButton.disabled = true;
        buyButton.textContent = 'Processing...';

        // Check if SolanaWeb3 is available
        if (!window.SolanaWeb3) {
            throw new Error('SolanaWeb3 library failed to load. Please refresh the page or check your internet connection.');
        }

        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = window.SolanaWeb3;
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
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

        await connection.confirmTransaction(signature, 'confirmed');

        tokensSold += boozAmount;
        addTransaction(signature, solAmount, boozAmount);
        updatePriceDisplay();
        updateCalculations();

        const formUrl = generatePreFilledFormUrl(wallet.publicKey.toString(), solAmount, boozAmount);
        googleFormLink.href = formUrl;
        window.open(formUrl, '_blank');

        alert('Transaction successful! Form opened to submit transaction ID.');
    } catch (error) {
        console.error('Transaction error:', error);
        alert(`Error: ${error.message || 'Transaction failed.'}`);
    } finally {
        buyButton.disabled = PRE_SALE_START > new Date() || tokensSold >= TOTAL_TOKENS;
        buyButton.textContent = 'Buy BOOZ Now';
    }
}

// Event Listeners
connectWalletBtn.addEventListener('click', connectWallet);
buyButton.addEventListener('click', buyBooz);
solAmountInput.addEventListener('input', updateCalculations);

// Dynamic Button Enabling
function updateButtonState() {
    const now = new Date();
    buyButton.disabled = now < PRE_SALE_START || tokensSold >= TOTAL_TOKENS || !wallet;
}
setInterval(updateButtonState, 1000);

// Initialize
fetchSolPrice();
setInterval(fetchSolPrice, 60000);
checkPresaleStatus();
setInterval(checkPresaleStatus, 1000);
updatePriceDisplay();
updateCalculations();
validateStorage();
renderTransactions();

// Log SolanaWeb3 availability for debugging
if (typeof window.SolanaWeb3 === 'undefined') {
    console.error('SolanaWeb3 is not defined. Check script tag in index.html or CDN availability.');
} else {
    console.log('SolanaWeb3 loaded successfully:', window.SolanaWeb3);
}
