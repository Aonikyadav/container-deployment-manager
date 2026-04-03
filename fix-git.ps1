try {
    git merge --abort
} catch {}

git add .
git commit -m "Auto-resolved conflict via script"

git pull origin main -X ours
git push origin main
