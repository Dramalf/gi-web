# Deploying to AWS Amplify

## 1. Create a GitHub OAuth App

Go to https://github.com/settings/applications/new

- **Application name**: gi
- **Homepage URL**: `https://your-app.amplifyapp.com` (update after deploy)
- **Authorization callback URL**: `https://your-app.amplifyapp.com/api/auth/callback/github`

Save the **Client ID** and **Client Secret**.

## 2. Push to GitHub

```bash
cd gi-web
git init
git add .
git commit -m "init gi-web"
gh repo create gi-web --public --source=. --push
```

## 3. Connect to AWS Amplify

1. Go to https://console.aws.amazon.com/amplify
2. Click **Create new app** → **Host web app**
3. Choose **GitHub** → authorize → select your `gi-web` repo and `main` branch
4. Amplify auto-detects Next.js — confirm the build settings (uses `amplify.yml`)
5. Click **Next** → **Save and deploy**

## 4. Set environment variables

In Amplify Console → your app → **Environment variables**, add:

| Key | Value |
|-----|-------|
| `GITHUB_CLIENT_ID` | from step 1 |
| `GITHUB_CLIENT_SECRET` | from step 1 |
| `NEXTAUTH_SECRET` | run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.amplifyapp.com` |

Then **Redeploy** from the Amplify console.

## 5. Update GitHub OAuth callback URL

Once you have the real Amplify URL, go back to your GitHub OAuth App settings and update:
- Homepage URL
- Authorization callback URL

## Local development

```bash
cp .env.example .env.local
# fill in .env.local with real values (use http://localhost:3000 for NEXTAUTH_URL)
npm run dev
```
