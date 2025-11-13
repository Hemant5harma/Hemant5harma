import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

logger = logging.getLogger(__name__)

class PrivateKeyEncryption:
    """Utility class for encrypting and decrypting private keys"""
    
    def __init__(self):
        # Get encryption key from environment or generate one
        self.encryption_password = os.getenv("ENCRYPTION_KEY", "default-encryption-key-change-this")
        if self.encryption_password == "default-encryption-key-change-this":
            logger.warning("Using default encryption key! Please set ENCRYPTION_KEY environment variable for production")
    
    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password using PBKDF2"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def encrypt_private_key(self, private_key: str) -> str:
        """
        Encrypt a private key and return base64 encoded encrypted data with salt
        Format: base64(salt + encrypted_data)
        """
        try:
            # Generate a random salt
            salt = os.urandom(16)
            
            # Derive key from password and salt
            key = self._derive_key(self.encryption_password, salt)
            
            # Create Fernet cipher
            f = Fernet(key)
            
            # Encrypt the private key
            encrypted_data = f.encrypt(private_key.encode())
            
            # Combine salt and encrypted data
            combined = salt + encrypted_data
            
            # Return base64 encoded result
            return base64.b64encode(combined).decode()
            
        except Exception as e:
            logger.error(f"Failed to encrypt private key: {e}")
            raise Exception("Failed to encrypt private key")
    
    def decrypt_private_key(self, encrypted_data: str) -> str:
        """
        Decrypt a private key from base64 encoded encrypted data with salt
        """
        try:
            # Decode base64
            combined = base64.b64decode(encrypted_data.encode())
            
            # Extract salt (first 16 bytes) and encrypted data
            salt = combined[:16]
            encrypted_private_key = combined[16:]
            
            # Derive key from password and salt
            key = self._derive_key(self.encryption_password, salt)
            
            # Create Fernet cipher
            f = Fernet(key)
            
            # Decrypt the private key
            decrypted_data = f.decrypt(encrypted_private_key)
            
            return decrypted_data.decode()
            
        except Exception as e:
            logger.error(f"Failed to decrypt private key: {e}")
            raise Exception("Failed to decrypt private key")
    
    def validate_private_key(self, private_key: str) -> bool:
        """Validate that a private key is in correct format (EVM or Solana)"""
        try:
            # Check if it's an EVM private key (64 hex characters)
            if self._is_evm_private_key(private_key):
                return True
            
            # Check if it's a Solana private key (Base58 encoded)
            if self._is_solana_private_key(private_key):
                return True
            
            return False
            
        except (ValueError, TypeError):
            return False
    
    def _is_evm_private_key(self, private_key: str) -> bool:
        """Check if private key is valid EVM format (64 hex characters)"""
        try:
            # Remove 0x prefix if present
            key = private_key[2:] if private_key.startswith('0x') else private_key
            
            # Check if it's exactly 64 hex characters
            if len(key) != 64:
                return False
            
            # Try to convert to int to verify it's valid hex
            int(key, 16)
            return True
            
        except (ValueError, TypeError):
            return False
    
    def _is_solana_private_key(self, private_key: str) -> bool:
        """
        Check if private key appears to be Solana format.
        This is a lenient check - actual validation is done by SolanaKeyHandler.
        Accepts all formats that SolanaKeyHandler can process.
        """
        try:
            if not isinstance(private_key, str):
                return False
            
            # Empty check
            if not private_key.strip():
                return False
            
            # Very lenient check - accept any non-empty string
            # The actual format validation will be done by SolanaKeyHandler
            # which supports: base58, hex, base64, JSON array, JSON object, CSV, etc.
            return len(private_key.strip()) >= 1
            
        except Exception:
            return False
    
    def get_private_key_type(self, private_key: str) -> str:
        """Determine the type of private key (evm, solana, or unknown)"""
        if self._is_evm_private_key(private_key):
            return "evm"
        elif self._is_solana_private_key(private_key):
            return "solana"
        else:
            return "unknown"

# Global instance
encryption_util = PrivateKeyEncryption() 