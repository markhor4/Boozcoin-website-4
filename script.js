// Google Form configuration
const FORM_ID = '1FAIpQLSeN1XBtcl3l9pVQoLqhZlcBUi2xezfuNiCNzJQXbJyGY3ZF4w';
const FIELDS = {
    walletAddress: 'entry.1201752685',
    solAmount: 'entry.1049092587',
    boozAmount: 'entry.1952283423',
    transactionId: 'entry.913823248'
};

// Solana Pay configuration
const RECIPIENT = '3j73rkUNf6cs4FpaPNse9Wkmvkf5a6RA47kNS5jfgy8D';
const TOTAL_TOKENS = 300000000;
const PRE_SALE_START = new Date('2025-06-20T00:00:00Z');

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
const loadingIndicator = document.getElementById('loading-indicator');

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

// Generate pre-filled Google Form URL
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
        solPriceInUSD = 100;
        solPriceSpan.textContent = `$100.00 (default)`;
        console.warn('Using default SOL price of $100.');
        updateCalculations();
    }
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
        presaleTimer.textContent = 'Presale Ongoing! Submit tx ID after payment.';
    }
}

function updateCalculations(solAmount = parseFloat(solAmountInput.value) || 0) {
    console.log('Updating calculations with SOL Amount:', solAmount);
    boozAmountDisplay.parentElement.classList.add('loading');
    usdCostDisplay.parentElement.classList.add('loading');

    const { price } = getCurrentPrice();
    if (price === 0) {
        boozAmountDisplay.textContent = '0';
        usdCostDisplay.textContent = '0';
        boozAmountDisplay.parentElement.classList.remove('loading');
        usdCostDisplay.parentElement.classList.remove('loading');
        return;
    }
    if (solPriceInUSD === 0) {
        boozAmountDisplay.textContent = 'Waiting for SOL price...';
        usdCostDisplay.textContent = '$0';
        boozAmountDisplay.parentElement.classList.remove('loading');
        usdCostDisplay.parentElement.classList.remove('loading');
        return;
    }
    const usdAmount = Number((solAmount * solPriceInUSD).toFixed(8));
    let boozAmount = Math.floor(Number((usdAmount / price).toFixed(8)));
    console.log('Calculated BOOZ Amount:', boozAmount);
    const remainingTokens = TOTAL_TOKENS - tokensSold;
    if (boozAmount > remainingTokens) {
        boozAmount = remainingTokens;
        console.log(`Capped BOOZ at ${boozAmount}.`);
    }
    boozAmountDisplay.textContent = boozAmount.toLocaleString();
    usdCostDisplay.textContent = usdAmount.toFixed(2);
    console.log('BOOZ Display updated to:', boozAmount.toLocaleString());
    boozAmountDisplay.parentElement.classList.remove('loading');
    usdCostDisplay.parentElement.classList.remove('loading');
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
    renderTransactions();
    updateCalculations(solAmount);
    console.log('Added transaction:', { signature, solAmount, boozAmount, timestamp });
}

function renderTransactions() {
    transactionList.innerHTML = '';
    transactions.forEach(tx => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `https://solscan.io/tx/${tx.signature}?cluster=devnet`;
        link.textContent = `TxID: ${tx.signature.slice(0, 8)}...`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        li.appendChild(link);
        li.appendChild(document.createTextNode(` | Sent ${tx.solAmount} SOL for ${tx.boozAmount.toLocaleString()} BOOZ on ${tx.timestamp}`));
        transactionList.appendChild(li);
    });
    console.log('Rendered transactions:', transactions);
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
            console.log('Disconnected existing Phantom wallet');
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
        alert('Enter a valid SOL amount (0.05–5 SOL).');
        return;
    }

    const now = new Date();
    if (now < PRE_SALE_START) {
        alert('Presale starts on June 20, 2025.');
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
        loadingIndicator.style.display = 'block';

        const solanaWeb3 = await waitForSolanaWeb3();
        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = solanaWeb3;
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
        console.log('Transaction sent, signature:', signature);

        const confirmation = await connection.confirmTransaction(signature, 'processed', 60000);
        if (confirmation?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.err)}`);
        }
        console.log('Transaction confirmed, signature:', signature);

        tokensSold += boozAmount;
        addTransaction(signature, solAmount, boozAmount);
        updatePriceDisplay();

        // Log to web app immediately
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbzMnIOrElphMLpH6sVvXNgwSdZTlCUrDshOvT05LrHYhkvVQFZyZ2fyD3CpnMY4UrJJ/exec';
        const transactionData = {
            walletAddress: wallet.publicKey.toString(),
            solAmount: solAmount,
            boozAmount: boozAmount,
            transactionId: signature
        };
        let webAppSuccess = false;
        try {
            const response = await fetch(webAppUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });
            const result = await response.text();
            console.log('Web app response:', result);
            webAppSuccess = response.ok;
        } catch (error) {
            console.error('Error sending to web app:', error);
        }

        // Generate and offer form URL
        const formUrl = generatePreFilledFormUrl(wallet.publicKey.toString(), solAmount, boozAmount, signature);
        googleFormLink.href = formUrl;
        googleFormLink.style.display = 'block'; // Show manual link immediately

        // Attempt to open form with popup check
        setTimeout(() => {
            const formWindow = window.open(formUrl, '_blank');
            if (!formWindow || formWindow.closed || typeof formWindow.closed === 'undefined') {
                alert('Popup blocked! Data logged internally. Click "Open Form Manually" to submit the form or allow popups and retry if needed.');
                console.warn('Popup blocked for form URL:', formUrl);
            } else {
                formWindow.addEventListener('load', () => {
                    const fieldsToLock = [
                        formWindow.document.querySelector(`input[name="${FIELDS.walletAddress}"]`),
                        formWindow.document.querySelector(`input[name="${FIELDS.solAmount}"]`),
                        formWindow.document.querySelector(`input[name="${FIELDS.boozAmount}"]`)
                    ];
                    fieldsToLock.forEach(field => {
                        if (field) {
                            field.setAttribute('readonly', 'true');
                            field.setAttribute('disabled', 'true');
                            field.style.backgroundColor = '#f0f0f0';
                            field.style.cursor = 'not-allowed';
                        }
                    });
                    const txField = formWindow.document.querySelector(`input[name="${FIELDS.transactionId}"]`);
                    if (txField) {
                        txField.removeAttribute('readonly');
                        txField.removeAttribute('disabled');
                        txField.style.backgroundColor = '';
                        txField.style.cursor = 'text';
                    }
                });
                formWindow.focus();
                alert('Transaction successful! Form opened. ' + (webAppSuccess ? 'Data recorded internally.' : 'Failed to log data to internal sheet.'));
            }
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
solAmountInput.addEventListener('input', debounce(() => updateCalculations(), 300));

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
        const testUrl = generatePreFilledFormUrl('test-wallet', 0.05, 230850, 'test-signature');
        console.log('Test Form URL:', testUrl);
    } catch (error) {
        console.error('solanaWeb3 failed to load:', error.message);
        console.error('Check script inclusion: https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.iife.min.js');
    }
});
