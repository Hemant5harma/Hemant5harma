# 🔑 Solana Private Key Format Support

## ✅ ALL Supported Formats

The system now accepts **ALL common Solana private key formats**. You can paste your private key in ANY of these formats, and it will work automatically!

---

## 📋 Supported Formats

### 1. **Base58 Format** (Most Common)
The standard Solana format used by most wallets.

**Example:**
```
5JvmMUEmJhkDzv3bXhFvAz5kXq4W7dGjNqjvqvqvqvqvqvqvqvqvqvqvqvqvqvqvqvqvqvqvqvqvqv
```

**Length:** Typically 87-88 characters  
**Used by:** Phantom, Solflare, Sollet, CLI wallets

---

### 2. **Hexadecimal Format**
Private key as a hex string (with or without `0x` prefix).

**Examples:**
```
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Length:** 64 characters (32 bytes) or 128 characters (64 bytes)  
**Used by:** Some web3 tools, custom implementations

---

### 3. **JSON Array Format** (Uint8Array)
Array of 32 or 64 integers (0-255).

**Examples:**

**32-byte seed:**
```json
[174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,220,237,29]
```

**64-byte keypair:**
```json
[174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,220,237,29,45,147,190,159,111,214,131,235,70,215,27,188,59,13,120,28,228,154,205,196,208,21,199,229,184,161,38,65,206,167,252,112]
```

**Used by:** Phantom wallet export, Solflare export, wallet files

---

### 4. **JSON Object Format**
JSON object containing the private key.

**Examples:**
```json
{
  "secretKey": [174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,220,237,29]
}
```

```json
{
  "private_key": "base58_or_hex_string_here"
}
```

```json
{
  "keypair": [174,47,154,16,...]
}
```

**Used by:** Wallet backup files, some wallet exports

---

### 5. **Base64 Format**
Base64-encoded private key.

**Example:**
```
ri8aEMrBznHHvjWFqa8fON41ir3g2HWtCpU1LUnc7R0=
```

**Used by:** Some wallet exports, API integrations

---

### 6. **Comma-Separated Values (CSV)**
Integers separated by commas.

**Example:**
```
174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,220,237,29
```

**Used by:** Some custom exports

---

## 🔄 How It Works

### Automatic Format Detection

The system automatically:
1. **Detects** which format you're using
2. **Converts** it to the internal format
3. **Derives** your wallet address
4. **Encrypts** and stores it securely

### Processing Order

The system tries formats in this order:
1. JSON array `[1, 2, 3, ...]`
2. JSON object `{"secretKey": [...]}`
3. Base58 (length 80-90 chars)
4. Base64 (divisible by 4, valid chars)
5. Hexadecimal (0-9, a-f, A-F)
6. CSV (comma-separated integers)

---

## 💡 Usage Examples

### Adding a Private Key

#### From Phantom Wallet:
1. Export your private key from Phantom (it's a JSON array)
2. Copy the entire array: `[174,47,154,...]`
3. Paste into the "Private Key" field
4. Give it a name like "My Phantom Wallet"
5. Click "Add Wallet"

#### From Solana CLI:
1. Your keypair file is already a JSON array
2. Open the `.json` file
3. Copy the array
4. Paste into the "Private Key" field
5. Click "Add Wallet"

#### From Base58 String:
1. If you have a base58 string (starts with letters/numbers)
2. Just paste it directly
3. The system recognizes it automatically
4. Click "Add Wallet"

---

## 🔒 Security

### What Happens to Your Key:

1. **You paste it** in ANY format
2. **System validates** and derives address
3. **System encrypts** the key with AES-256
4. **Encrypted key stored** in database
5. **Original key deleted** from memory

### Key Features:
- ✅ **AES-256 encryption** at rest
- ✅ **Temporary decryption** only when needed (for trading)
- ✅ **Never exposed** in API responses
- ✅ **Secure storage** in database

---

## ❌ Common Errors and Solutions

### Error: "Invalid private key format"

**Possible causes:**
1. Key is incomplete (missing characters)
2. Key contains invalid characters
3. Key is wrong length

**Solutions:**
- ✅ Double-check you copied the entire key
- ✅ Remove any extra spaces or line breaks
- ✅ Make sure it's one of the supported formats
- ✅ Try copying directly from wallet (not screenshot)

### Error: "Could not decode private key"

**Possible causes:**
1. Base58 string is corrupted
2. JSON array has typo
3. Hex string has invalid characters

**Solutions:**
- ✅ Re-export from your wallet
- ✅ Verify no characters were lost during copy
- ✅ Check for accidental edits

---

## 🎯 Best Practices

### Recommended Formats (In Order):

1. **JSON Array** - Most reliable, what Phantom/Solflare export
2. **Base58** - Standard Solana format, works everywhere
3. **Hex** - Good for programmatic use
4. **Base64** - Good for API integrations

### Tips:

- ✅ Always copy the **entire** private key
- ✅ Use a **descriptive name** ("Trading Wallet", "Main SOL", etc.)
- ✅ Test with a **small amount** first
- ✅ Keep a **backup** of your private key separately
- ✅ Never share your private key

---

## 🚀 Technical Details

### Supported Key Lengths:

- **32 bytes (256 bits)** - Ed25519 seed
- **64 bytes (512 bits)** - Full keypair (private + public)

### Encoding Detection:

The `SolanaKeyHandler` class uses smart detection:
1. Checks for JSON structures first
2. Then tries common encodings (base58, base64)
3. Falls back to hex
4. Finally tries CSV

### Error Handling:

If one format fails, the system automatically tries the next format. Only if ALL formats fail will you see an error.

---

## 📊 Format Comparison

| Format | Length | Common? | Secure? | Easy? |
|--------|--------|---------|---------|-------|
| Base58 | 87-88  | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| JSON Array | Variable | ⭐⭐⭐⭐ | ✅ | ✅ |
| Hex | 64/128 | ⭐⭐⭐ | ✅ | ⭐⭐ |
| Base64 | Variable | ⭐⭐ | ✅ | ⭐⭐ |
| JSON Object | Variable | ⭐⭐⭐ | ✅ | ✅ |
| CSV | Variable | ⭐ | ✅ | ⭐⭐ |

---

## 🎉 Result

You can now use **ANY** Solana private key format! Just:

1. 📋 Copy your private key (in ANY format)
2. 📝 Give it a name
3. 💾 Click "Add Wallet"
4. ✅ Done!

The system handles everything automatically! 🚀

---

## 🔗 Related Files

- **Backend Handler**: `backend/src/utils/solana_key_handler.py`
- **API Endpoint**: `backend/src/api/endpoints/private_keys.py`
- **Frontend Component**: `src/components/AddPrivateKeyModal.tsx`

---

## 🆘 Need Help?

If you're still having issues:
1. Check that you copied the **entire** key
2. Try a different format (e.g., if JSON fails, try exporting as base58)
3. Make sure the key is valid in your original wallet
4. Contact support with the error message (NOT your private key!)

**Remember: NEVER share your private key with anyone!** 🔒

