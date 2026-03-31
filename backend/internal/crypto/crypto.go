package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
	"os"
	"sync"
)

var (
	gcm     cipher.AEAD
	once    sync.Once
	initErr error
)

func Init() error {
	once.Do(func() {
		key := os.Getenv("ENCRYPTION_KEY")
		if key == "" {
			key = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" // 32 bytes for AES-256
		}
		if len(key) != 32 {
			initErr = errors.New("ENCRYPTION_KEY must be exactly 32 bytes")
			return
		}
		block, err := aes.NewCipher([]byte(key))
		if err != nil {
			initErr = err
			return
		}
		gcm, err = cipher.NewGCM(block)
		if err != nil {
			initErr = err
		}
	})
	return initErr
}

func Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func Decrypt(encoded string) (string, error) {
	if encoded == "" {
		return "", nil
	}
	ciphertext, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}
