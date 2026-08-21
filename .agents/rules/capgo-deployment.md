# Capgo Deployment Rule

When the user asks to push changes for the mobile app, phone, or Capgo, you MUST follow this exact deployment sequence:

1. **Increment Version**: Open `package.json` and bump the `"version"` field. Capgo requires a new version number for OTA updates.
2. **Build and Sync**: Run the Vite build and sync to Android Studio via Capacitor.
   ```bash
   npm run build
   npx cap sync android
   ```
3. **Commit and Push**: Stage all changes (including `package.json` and the built Android assets if tracked), commit, and push to GitHub.
   ```bash
   git add .
   git commit -m "chore: bump version and sync for capgo release"
   git push
   ```

**CRITICAL**: Do NOT push to git before syncing to Android Studio. The version bump and the synced Android files must be included in the git commit.
