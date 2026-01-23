package utils

import (
	"crypto/rand"
	"encoding/base64"
)

// GenerateRandomString creates a random string for OAuth state
func GenerateRandomString(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
