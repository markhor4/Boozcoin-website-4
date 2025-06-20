// Google Form configuration
const FORM_ID = '1FAIpQLSeN1XBtcl3l9pVQoLqhZlcBUi2xezfuNiCNzJQXbJyGY3ZF4w'; // Line 1
const FIELDS = {
    walletAddress: 'entry.1201752685',
    solAmount: 'entry.1049092587',
    boozAmount: 'entry.2108288659',
    transactionId: 'entry.913823248'
};

// Solana Pay configuration
const RECIPIENT = '3j73rkUNf6cs4FpaPNse9Wkmvkf5a6RA47kNS5jfgy8D'; // Devnet presale wallet // Line 9
const TOTAL_TOKENS = 300000000; // 300M BOOZ tokens for presale // Line 10
const PRE_SALE_START = new Date('2025-06-01T14:00:00Z'); // Presale start date // Line 11

// DOM elements
const connectWalletBtn = document.getElementById('connect-wallet'); // Line 13
const buyButton = document.getElementById('buy-button'); // Line 14
const solAmountInput = document.getElementById('sol-amount'); // Line 15
const solPriceSpan = document.getElementById('sol-price'); // Line 16
const boozAmountDisplay = document.getElementById('booz-amount'); // Line 17
const usdCostDisplay = document.getElementById('usd-cost'); // Line 18
const tokensSoldDisplay = document.getElementById('tokens-sold'); // Line 19
const progressBar = document.getElementById('progress-bar'); // Line 20
const presaleTimer = document.getElementById('presale-timer'); // Line 21
const transactionList = document.getElementById('transaction-list'); // Line 22
const googleFormLink = document.getElementById('google-form-link'); // Line 23

// State
let wallet = null; // Line 25
let solPriceInUSD = 0; // Line 26
let tokensSold = 0; // Placeholder; update via Google Sheet // Line 27
let transactions = JSON.parse(localStorage.getItem('boozTransactions')) || []; // Line 28
console.log('Initial transactions from localStorage (user-specific):', transactions); // Updated log

// Simple SHA-256 implementation for checksum
function sha256(str) { // Line 30
    function rightRotate(value, amount) { // Line 31
        return (value >>> amount) | (value << (32 - amount)); // Line 32
    } // Line 33
    const K = new Array(64).fill(0).map((_, i) => [ // Line 34
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, // Line 35
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, // Line 36
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, // Line 37
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, // Line 38
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, // Line 39
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, // Line 40
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, // Line 41
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 // Line 42
    ][i]); // Line 43
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]; // Line 44
    const msg = new TextEncoder().encode(str); // Line 45
    const padded = new Uint8Array(Math.ceil((msg.length + 9) / 64) * 64); // Line 46
    padded.set(msg); // Line 47
    padded[msg.length] = 0x80; // Line 48
    padded.set(new Uint8Array(new BigUint64Array([BigInt(msg.length * 8)]).buffer).reverse(), padded.length - 8); // Line 49
    for (let i = 0; i < padded.length; i += 64) { // Line 50
        const w = new Array(64).fill(0); // Line 51
        for (let t = 0; t < 16; t++) { // Line 52
            w[t] = (padded[i + t * 4] << 24) | (padded[i + t * 4 + 1] << 16) | (padded[i + t * 4 + 2] << 8) | padded[i + t * 4 + 3]; // Line 53
        } // Line 54
        for (let t = 16; t < 64; t++) { // Line 55
            const s0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3); // Line 56
            const s1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10); // Line 57
            w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0; // Line 58
        } // Line 59
        let [a, b, c, d, e, f, g, h] = H; // Line 60
        for (let t = 0; t < 64; t++) { // Line 61
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25); // Line 62
            const ch = (e & f) ^ (~e & g); // Line 63
            const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0; // Line 64
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22); // Line 65
            const maj = (a & b) ^ (a & c) ^ (b & c); // Line 66
            const temp2 = (S0 + maj) >>> 0; // Line 67
            h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0; // Line 68
        } // Line 69
        H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0; // Line 70
        H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0; // Line 71
    } // Line 72
    return H.map(h => h.toString(16).padStart(8, '0')).join(''); // Line 73
} // Line 74

// Generate pre-filled Google Form URL
function generatePreFilledFormUrl(walletAddress, solAmount, boozAmount) { // Line 76
    const baseUrl = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform?`; // Line 77
    const params = new URLSearchParams({ // Line 78
        [FIELDS.walletAddress]: walletAddress, // Line 79
        [FIELDS.solAmount]: solAmount.toString(), // Line 80
        [FIELDS.boozAmount]: boozAmount.toString() // Line 81
    }); // Line 82
    console.log('Pre-fill URL params:', params.toString()); // Debug log
    return baseUrl + params.toString(); // Line 83
} // Line 84

// Fetch Live SOL Price
async function fetchSolPrice() { // Line 86
    try { // Line 87
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'); // Line 88
        const data = await response.json(); // Line 89
        solPriceInUSD = data.solana.usd; // Line 90
        localStorage.setItem('cachedSolPrice', solPriceInUSD); // Line 91
        solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)} (CoinGecko)`; // Line 92
        updateCalculations(); // Line 93
        return; // Line 94
    } catch (error) { // Line 95
        console.error('CoinGecko failed:', error); // Line 96
    } // Line 97
    try { // Line 98
        const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL&convert=USD', { // Line 99
            headers: { 'X-CMC_PRO_API_KEY': 'your-coinmarketcap-api-key' } // Replace with your actual key // Line 100
        }); // Line 101
        const data = await response.json(); // Line 102
        if (data.status.error_code === 0) { // Line 103
            solPriceInUSD = data.data.SOL.quote.USD.price; // Line 104
            localStorage.setItem('cachedSolPrice', solPriceInUSD); // Line 105
            solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)} (CoinMarketCap)`; // Line 106
            updateCalculations(); // Line 107
            return; // Line 108
        } else { // Line 109
            console.error('CoinMarketCap error:', data.status.error_message); // Line 110
        } // Line 111
    } catch (error) { // Line 112
        console.error('CoinMarketCap failed:', error); // Line 113
    } // Line 114
    const cachedPrice = localStorage.getItem('cachedSolPrice'); // Line 115
    if (cachedPrice) { // Line 116
        solPriceInUSD = parseFloat(cachedPrice); // Line 117
        solPriceSpan.textContent = `$${solPriceInUSD.toFixed(2)} (cached)`; // Line 118
    } else { // Line 119
        solPriceInUSD = 100; // Line 120
        solPriceSpan.textContent = `$100.00 (default)`; // Line 121
        console.warn('Using default SOL price of $100.'); // Line 122
    } // Line 123
    updateCalculations(); // Line 124
} // Line 125

// Presale Logic
function getCurrentPrice() { // Line 127
    if (tokensSold >= TOTAL_TOKENS) { // Line 128
        return { price: 0, round: 'Ended' }; // Line 129
    } // Line 130
    const step = Math.floor(tokensSold / 5000000) + 1; // Line 131
    let price, round; // Line 132
    if (tokensSold < 100000000) { // Line 133
        price = 0.00003 + (step - 1) * 0.000002; // Line 134
        round = '🍺 Boozer Shot'; // Line 135
    } else if (tokensSold < 200000000) { // Line 136
        price = 0.00004 + (step - 21) * 0.000002; // Line 137
        round = '🍻 Boozer Cheers'; // Line 138
    } else { // Line 139
        price = 0.00005 + (step - 41) * 0.000002; // Line 140
        round = '🎉 Party Popper'; // Line 141
    } // Line 142
    return { price, round }; // Line 143
} // Line 144

function updatePriceDisplay() { // Line 146
    const { price, round } = getCurrentPrice(); // Line 147
    const priceInfo = document.getElementById('price-info'); // Line 148
    tokensSoldDisplay.textContent = tokensSold.toLocaleString(); // Line 149
    const progressPercent = (tokensSold / TOTAL_TOKENS) * 100; // Line 150
    progressBar.style.width = `${progressPercent}%`; // Line 151
    if (price === 0) { // Line 152
        priceInfo.textContent = 'Presale Ended!'; // Line 153
    } else { // Line 154
        priceInfo.textContent = `Current Price: $${price.toFixed(6)} per BOOZ (${round})`; // Line 155
    } // Line 156
} // Line 157

// Check Presale Status
function checkPresaleStatus() { // Line 159
    const now = new Date(); // Line 160
    if (tokensSold >= TOTAL_TOKENS) { // Line 161
        presaleTimer.textContent = 'Presale Ended! Awaiting final verification.'; // Line 162
    } else if (now < PRE_SALE_START) { // Line 163
        const timeLeft = PRE_SALE_START - now; // Line 164
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24)); // Line 165
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); // Line 166
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)); // Line 167
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000); // Line 168
        presaleTimer.textContent = `Presale Starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`; // Line 169
    } else { // Line 170
        presaleTimer.textContent = 'Presale Ongoing! Submit tx ID after payment.'; // Line 171
    } // Line 172
} // Line 173

// Calculate BOOZ and USD
function updateCalculations(solAmount = parseFloat(solAmountInput.value) || 0) { // Added parameter for flexibility
    console.log('Updating calculations with SOL Amount:', solAmount); // Debug log
    const { price } = getCurrentPrice(); // Line 177
    if (price === 0) { // Line 178
        boozAmountDisplay.textContent = '0'; // Line 179
        usdCostDisplay.textContent = '0'; // Line 180
        return; // Line 181
    } // Line 182
    if (solPriceInUSD === 0) { // Line 183
        boozAmountDisplay.textContent = 'Waiting for SOL price...'; // Line 184
        usdCostDisplay.textContent = '$0'; // Line 185
        return; // Line 186
    } // Line 187
    const usdAmount = Number((solAmount * solPriceInUSD).toFixed(8)); // Line 188
    let boozAmount = Math.floor(Number((usdAmount / price).toFixed(8))); // Line 189
    console.log('Calculated BOOZ Amount:', boozAmount); // Debug log
    const remainingTokens = TOTAL_TOKENS - tokensSold; // Line 190
    if (boozAmount > remainingTokens) { // Line 191
        boozAmount = remainingTokens; // Line 192
        console.log(`Capped BOOZ at ${boozAmount}.`); // Line 193
    } // Line 194
    boozAmountDisplay.textContent = boozAmount.toLocaleString(); // Line 195
    usdCostDisplay.textContent = usdAmount.toFixed(2); // Line 196
    console.log('BOOZ Display updated to:', boozAmount.toLocaleString()); // New debug log
} // Line 197

// Transaction History with Checksum
function validateStorage() { // Line 199
    const storedHash = localStorage.getItem('boozTransactionsHash'); // Line 200
    const currentHash = sha256(JSON.stringify(transactions)); // Line 201
    if (storedHash && storedHash !== currentHash) { // Line 202
        alert('Warning: Transaction data may have been tampered with. Contact support.'); // Line 203
    } // Line 204
} // Line 205

function addTransaction(signature, solAmount, boozAmount) { // Line 207
    const timestamp = new Date().toLocaleString(); // Line 208
    transactions.push({ signature, solAmount, boozAmount, timestamp }); // Line 209
    localStorage.setItem('boozTransactions', JSON.stringify(transactions)); // Line 210
    localStorage.setItem('boozTransactionsHash', sha256(JSON.stringify(transactions))); // Line 211
    renderTransactions(); // Line 212
    updateCalculations(solAmount); // Use transaction's solAmount to update display
    console.log('Added transaction:', { signature, solAmount, boozAmount, timestamp }); // Debug log
} // Line 213

function renderTransactions() { // Line 215
    transactionList.innerHTML = ''; // Line 216
    transactions.forEach(tx => { // Line 217
        const li = document.createElement('li'); // Line 218
        const link = document.createElement('a'); // Line 219
        link.href = `https://solscan.io/tx/${tx.signature}?cluster=devnet`; // Devnet link
        link.textContent = `TxID: ${tx.signature.slice(0, 8)}...`; // Line 221
        link.target = '_blank'; // Line 222
        link.rel = 'noopener noreferrer'; // Line 223
        li.appendChild(link); // Line 224
        li.appendChild(document.createTextNode(` | Sent ${tx.solAmount} SOL for ${tx.boozAmount.toLocaleString()} BOOZ on ${tx.timestamp}`)); // Line 225
        transactionList.appendChild(li); // Line 226
    }); // Line 227
    console.log('Rendered transactions (user-specific):', transactions); // Updated log
} // Line 228

// Wait for solanaWeb3 to be defined
async function waitForSolanaWeb3(timeout = 10000) { // Line 230
    const start = Date.now(); // Line 231
    while (!window.solanaWeb3 && Date.now() - start < timeout) { // Line 232
        await new Promise(resolve => setTimeout(resolve, 100)); // Line 233
    } // Line 234
    if (!window.solanaWeb3) { // Line 235
        throw new Error('solanaWeb3 not loaded after timeout. Check script inclusion: https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.iife.min.js'); // Line 236
    } // Line 237
    return window.solanaWeb3; // Line 238
} // Line 239

// Wallet Connection
async function connectWallet() { // Line 241
    try { // Line 242
        if (!window.solana || !window.solana.isPhantom) { // Line 243
            alert('Phantom wallet not found. Please install Phantom.'); // Line 244
            return; // Line 245
        } // Line 246
        wallet = window.solana; // Line 247
        try { // Line 248
            await wallet.disconnect(); // Line 249
            console.log('Disconnected existing Phantom wallet'); // Line 250
        } catch (err) { // Line 251
            console.warn('Failed to disconnect existing wallet:', err); // Line 252
        } // Line 253
        wallet.publicKey = null; // Line 254
        await wallet.connect({ onlyIfTrusted: false }); // Line 255
        connectWalletBtn.textContent = `Connected: ${wallet.publicKey.toString().slice(0, 8)}...`; // Line 256
        buyButton.disabled = PRE_SALE_START > new Date() || tokensSold >= TOTAL_TOKENS; // Line 257
        validateStorage(); // Line 258
        renderTransactions(); // Line 259
    } catch (error) { // Line 260
        console.error('Wallet connection failed:', error); // Line 261
        alert('Failed to connect wallet. Please install Phantom, ensure it’s logged in, and try again.'); // Line 262
        wallet = null; // Line 263
        connectWalletBtn.textContent = 'Connect Wallet'; // Line 264
    } // Line 265
} // Line 266

// Buy BOOZ
async function buyBooz() { // Line 268
    const solAmount = parseFloat(solAmountInput.value) || 0; // Line 269
    console.log('User Input SOL Amount:', solAmount); // Debug log
    if (solAmount < 0.05 || solAmount > 5 || isNaN(solAmount)) { // Line 270
        alert('Enter a valid SOL amount (0.05–5 SOL).'); // Line 271
        return; // Line 272
    } // Line 273

    const now = new Date(); // Line 275
    if (now < PRE_SALE_START) { // Line 276
        alert('Presale starts on July 5, 2025.'); // Line 277
        return; // Line 278
    } // Line 279

    const { price, round } = getCurrentPrice(); // Line 281
    if (round === 'Ended') { // Line 282
        alert('Presale has ended!'); // Line 283
        return; // Line 284
    } // Line 285

    if (solPriceInUSD === 0) { // Line 287
        alert('SOL price unavailable. Try again later.'); // Line 288
        return; // Line 289
    } // Line 290

    if (!wallet || !wallet.publicKey) { // Line 292
        alert('Please connect your wallet first.'); // Line 293
        return; // Line 294
    } // Line 295

    const usdAmount = Number((solAmount * solPriceInUSD).toFixed(8)); // Line 297
    let boozAmount = Math.floor(Number((usdAmount / price).toFixed(8))); // Line 298
    console.log('Calculated BOOZ Amount in buyBooz:', boozAmount); // Debug log
    const remainingTokens = TOTAL_TOKENS - tokensSold; // Line 299
    if (boozAmount > remainingTokens) { // Line 300
        alert(`Only ${remainingTokens.toLocaleString()} BOOZ left.`); // Line 301
        return; // Line 302
    } // Line 303

    try { // Line 305
        buyButton.disabled = true; // Line 306
        buyButton.textContent = 'Processing...'; // Line 307

        const solanaWeb3 = await waitForSolanaWeb3(); // Line 309

        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = solanaWeb3; // Line 311
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed'); // Line 312
        const recipientPubkey = new PublicKey(RECIPIENT); // Line 313
        const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL); // Line 314

        const transaction = new Transaction().add( // Line 316
            SystemProgram.transfer({ // Line 317
                fromPubkey: wallet.publicKey, // Line 318
                toPubkey: recipientPubkey, // Line 319
                lamports // Line 320
            }) // Line 321
        ); // Line 322

        const { blockhash } = await connection.getLatestBlockhash(); // Line 324
        transaction.recentBlockhash = blockhash; // Line 325
        transaction.feePayer = wallet.publicKey; // Line 326

        const signedTransaction = await wallet.signTransaction(transaction); // Line 328
        const signature = await connection.sendRawTransaction(signedTransaction.serialize()); // Line 329
        console.log('Transaction sent, signature:', signature); // Debug log

        const confirmation = await connection.confirmTransaction(signature, 'processed', 60000); // 60-second timeout
        if (confirmation?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.err)}`);
        }
        console.log('Transaction confirmed, signature:', signature); // Debug log

        tokensSold += boozAmount; // Line 333
        addTransaction(signature, solAmount, boozAmount); // Line 335
        console.log('Transactions array after add:', transactions); // Line 336
        updatePriceDisplay(); // Line 337
        updateCalculations(solAmount); // Pass solAmount to ensure correct recalculation
        const formUrl = generatePreFilledFormUrl(wallet.publicKey.toString(), solAmount, boozAmount); // Line 339
        console.log('Generated form URL:', formUrl); // Debug log
        googleFormLink.href = formUrl; // Line 341
        window.open(formUrl, '_blank'); // Line 342
        alert('Transaction successful! Form opened to submit transaction ID.'); // Line 343
    } catch (error) { // Line 345
        console.error('Transaction error:', error); // Line 346
        alert(`Error: ${error.message || 'Transaction failed.'}`); // Line 347
    } finally { // Line 349
        buyButton.disabled = PRE_SALE_START > new Date() || tokensSold >= TOTAL_TOKENS; // Line 350
        buyButton.textContent = 'Buy BOOZ Now'; // Line 351
    } // Line 352
} // Line 353

// Event Listeners
connectWalletBtn.addEventListener('click', connectWallet); // Line 355
buyButton.addEventListener('click', buyBooz); // Line 356
solAmountInput.addEventListener('input', updateCalculations); // Line 357

// Dynamic Button Enabling
function updateButtonState() { // Line 359
    const now = new Date(); // Line 360
    buyButton.disabled = now < PRE_SALE_START || tokensSold >= TOTAL_TOKENS || !wallet; // Line 361
} // Line 362
setInterval(updateButtonState, 1000); // Line 363

// Initialize
fetchSolPrice(); // Line 365
setInterval(fetchSolPrice, 60000); // Line 366
checkPresaleStatus(); // Line 367
setInterval(checkPresaleStatus, 1000); // Line 368
updatePriceDisplay(); // Line 369
updateCalculations(); // Line 370
validateStorage(); // Line 371
renderTransactions(); // Line 372

// Log solanaWeb3 availability for debugging
window.addEventListener('load', async () => { // Line 375
    try { // Line 376
        const solanaWeb3 = await waitForSolanaWeb3(); // Line 377
        console.log('solanaWeb3 loaded successfully:', solanaWeb3); // Line 378
    } catch (error) { // Line 379
        console.error('solanaWeb3 failed to load:', error.message); // Line 380
        console.error('Check script inclusion: https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.iife.min.js'); // Line 381
    } // Line 382
}); // Line 383
