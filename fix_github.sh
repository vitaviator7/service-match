#!/bin/bash
echo "Fixing GitHub Authentication..."

# 1. Configure local git user for this repo
git config user.name "vitaviator7"
# We don't know the exact email, but we'll set a placeholder or skip. 
# Better to rely on what they login with.

# 2. Clear stubborn OSX keychain credentials for github.com
echo "Clearing old credentials..."
printf "protocol=https\nhost=github.com\n" | git credential-osxkeychain erase
printf "protocol=https\nhost=github.com\nusername=gporter\n" | git credential-osxkeychain erase

# 3. Authenticate with GitHub CLI (Interactive)
echo "Please authenticate with GitHub in the browser..."
gh auth login -h github.com -p https -w

# 4. Configure Git to use GitHub CLI as credential helper
echo "Configuring Git to use GitHub CLI credentials..."
gh auth setup-git

# 5. Verify and Push
echo "Verifying authentication..."
gh auth status
echo "Pushing to 'vitaviator7/service-match'..."
git push -u origin main
