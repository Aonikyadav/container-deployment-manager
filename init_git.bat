@echo off
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Aonikyadav/container-deployment-manager.git
git push -u origin main
