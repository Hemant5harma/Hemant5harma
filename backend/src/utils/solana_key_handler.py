"""
Comprehensive Solana private key handler supporting multiple encoding formats.

Supported formats:
- Base58 string (standard Solana format)
- Hexadecimal string (with or without 0x prefix)
- JSON array of integers
- Phantom/Solflare wallet export format
- Raw bytes (32-byte seed or 64-byte keypair)
- Base64 encoded strings
"""

import json
import base58
import base64
import logging
from typing import Union, Optional, List
from solders.keypair import Keypair

logger = logging.getLogger(__name__)

class SolanaKeyHandler:
    """Handles Solana private keys in various encoding formats"""
    
    @staticmethod
    def create_keypair_from_private_key(private_key: Union[str, bytes, List[int]]) -> Keypair:
        """
        Create a Solana keypair from a private key in any supported format.
        
        Args:
            private_key: Private key in various formats:
                - str: Base58, hex, base64, or JSON string
                - bytes: Raw bytes (32 or 64 bytes)
                - List[int]: Array of integers (32 or 64 elements)
        
        Returns:
            Keypair: Solana keypair object
            
        Raises:
            ValueError: If the private key format is invalid or unsupported
        """
        try:
            # Handle different input types
            if isinstance(private_key, list):
                return SolanaKeyHandler._handle_array_format(private_key)
            elif isinstance(private_key, bytes):
                return SolanaKeyHandler._handle_bytes_format(private_key)
            elif isinstance(private_key, str):
                return SolanaKeyHandler._handle_string_format(private_key)
            else:
                raise ValueError(f"Unsupported private key type: {type(private_key)}")
                
        except Exception as e:
            logger.error(f"Failed to create keypair from private key: {e}")
            logger.error(f"Private key type: {type(private_key)}")
            if isinstance(private_key, str):
                logger.error(f"Private key length: {len(private_key)}")
                logger.error(f"Private key preview: {str(private_key)[:20]}...")
            raise ValueError(f"Invalid private key format: {str(e)}")
    
    @staticmethod
    def _handle_string_format(private_key: str) -> Keypair:
        """Handle string format private keys"""
        private_key = private_key.strip()
        
        # Try JSON array format first (common in wallet exports)
        if private_key.startswith('[') and private_key.endswith(']'):
            try:
                key_array = json.loads(private_key)
                return SolanaKeyHandler._handle_array_format(key_array)
            except json.JSONDecodeError:
                pass
        
        # Try JSON object format (wallet file format)
        if private_key.startswith('{') and private_key.endswith('}'):
            try:
                wallet_data = json.loads(private_key)
                if isinstance(wallet_data, list):
                    return SolanaKeyHandler._handle_array_format(wallet_data)
                elif isinstance(wallet_data, dict):
                    # Handle various wallet file formats
                    if 'secretKey' in wallet_data:
                        return SolanaKeyHandler._handle_array_format(wallet_data['secretKey'])
                    elif 'private_key' in wallet_data:
                        return SolanaKeyHandler.create_keypair_from_private_key(wallet_data['private_key'])
                    elif 'keypair' in wallet_data:
                        return SolanaKeyHandler._handle_array_format(wallet_data['keypair'])
            except json.JSONDecodeError:
                pass
        
        # Try Base58 format (standard Solana format)
        try:
            if len(private_key) >= 80 and len(private_key) <= 90:  # Typical base58 length
                decoded_key = base58.b58decode(private_key)
                logger.info("Private key decoded as base58 format")
                return SolanaKeyHandler._handle_bytes_format(decoded_key)
        except Exception as e:
            logger.debug(f"Base58 decode failed: {e}")
        
        # Try Base64 format
        try:
            if len(private_key) % 4 == 0 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in private_key):
                decoded_key = base64.b64decode(private_key)
                logger.info("Private key decoded as base64 format")
                return SolanaKeyHandler._handle_bytes_format(decoded_key)
        except Exception as e:
            logger.debug(f"Base64 decode failed: {e}")
        
        # Try hexadecimal format
        hex_key = private_key
        if hex_key.startswith('0x') or hex_key.startswith('0X'):
            hex_key = hex_key[2:]
        
        try:
            # Validate hexadecimal
            int(hex_key, 16)
            
            # Pad to even length if needed
            if len(hex_key) % 2 != 0:
                hex_key = '0' + hex_key
            
            # Pad to 64 characters (32 bytes) if shorter
            if len(hex_key) < 64:
                hex_key = hex_key.zfill(64)
            
            decoded_key = bytes.fromhex(hex_key)
            logger.info("Private key decoded as hexadecimal format")
            return SolanaKeyHandler._handle_bytes_format(decoded_key)
        except ValueError as e:
            logger.debug(f"Hex decode failed: {e}")
        
        # Try comma-separated integers
        if ',' in private_key:
            try:
                key_array = [int(x.strip()) for x in private_key.split(',')]
                return SolanaKeyHandler._handle_array_format(key_array)
            except ValueError:
                pass
        
        raise ValueError("Could not decode private key in any supported string format")
    
    @staticmethod
    def _handle_array_format(key_array: List[int]) -> Keypair:
        """Handle array format private keys"""
        if not isinstance(key_array, list):
            raise ValueError("Array format must be a list of integers")
        
        if not all(isinstance(x, int) for x in key_array):
            raise ValueError("Array format must contain only integers")
        
        if not all(0 <= x <= 255 for x in key_array):
            raise ValueError("Array format integers must be in range 0-255")
        
        key_bytes = bytes(key_array)
        logger.info(f"Private key decoded as array format ({len(key_array)} elements)")
        return SolanaKeyHandler._handle_bytes_format(key_bytes)
    
    @staticmethod
    def _handle_bytes_format(key_bytes: bytes) -> Keypair:
        """Handle bytes format private keys"""
        if len(key_bytes) == 32:
            # 32-byte seed
            keypair = Keypair.from_seed(key_bytes)
            logger.info("Created keypair from 32-byte seed")
            return keypair
        elif len(key_bytes) == 64:
            # 64-byte keypair (32-byte private key + 32-byte public key)
            keypair = Keypair.from_bytes(key_bytes)
            logger.info("Created keypair from 64-byte keypair")
            return keypair
        else:
            raise ValueError(f"Invalid key length: {len(key_bytes)} bytes (expected 32 or 64)")
    
    @staticmethod
    def detect_key_format(private_key: str) -> str:
        """
        Detect the format of a private key string.
        
        Args:
            private_key: Private key string
            
        Returns:
            str: Detected format ('base58', 'hex', 'json_array', 'json_object', 'base64', 'csv', 'unknown')
        """
        private_key = private_key.strip()
        
        # JSON array format
        if private_key.startswith('[') and private_key.endswith(']'):
            try:
                json.loads(private_key)
                return 'json_array'
            except json.JSONDecodeError:
                pass
        
        # JSON object format
        if private_key.startswith('{') and private_key.endswith('}'):
            try:
                json.loads(private_key)
                return 'json_object'
            except json.JSONDecodeError:
                pass
        
        # Base58 format (typical length and characters)
        if (80 <= len(private_key) <= 90 and 
            all(c in '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz' for c in private_key)):
            return 'base58'
        
        # Base64 format
        if (len(private_key) % 4 == 0 and 
            all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in private_key)):
            return 'base64'
        
        # Hexadecimal format
        hex_test = private_key
        if hex_test.startswith('0x') or hex_test.startswith('0X'):
            hex_test = hex_test[2:]
        
        if all(c in '0123456789abcdefABCDEF' for c in hex_test):
            return 'hex'
        
        # CSV format (comma-separated integers)
        if ',' in private_key and all(x.strip().isdigit() for x in private_key.split(',')):
            return 'csv'
        
        return 'unknown'
    
    @staticmethod
    def validate_key_format(private_key: str) -> dict:
        """
        Validate a private key and return detailed information.
        
        Args:
            private_key: Private key string
            
        Returns:
            dict: Validation result with format, valid status, and details
        """
        result = {
            'format': 'unknown',
            'valid': False,
            'details': '',
            'length': len(private_key),
            'error': None
        }
        
        try:
            result['format'] = SolanaKeyHandler.detect_key_format(private_key)
            
            # Try to create keypair to validate
            keypair = SolanaKeyHandler.create_keypair_from_private_key(private_key)
            
            result['valid'] = True
            result['details'] = f"Valid {result['format']} format"
            result['public_key'] = str(keypair.pubkey())
            
        except Exception as e:
            result['valid'] = False
            result['error'] = str(e)
            result['details'] = f"Invalid {result['format']} format: {str(e)}"
        
        return result

# Convenience function for backwards compatibility
def create_solana_keypair(private_key: Union[str, bytes, List[int]]) -> Keypair:
    """
    Create a Solana keypair from a private key in any supported format.
    This is a convenience wrapper around SolanaKeyHandler.create_keypair_from_private_key.
    """
    return SolanaKeyHandler.create_keypair_from_private_key(private_key)