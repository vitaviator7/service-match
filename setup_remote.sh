#!/bin/bash
git init
git add .
git commit -m "Initial commit for Serious Control"
# Remove existing remote if any
git remote remove origin || true
# Add new remote
git remote add origin https://github.com/vitaviator7/service-match.git
git branch -M main
# Push to remote (allow interactive auth if possible, though unlikely here)
# If remote exists and empty, push works. If not, push fails.
git push -u origin main
echo "Setup complete. Remote URL:"
git remote -v
