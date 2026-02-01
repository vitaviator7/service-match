# 🚀 Vercel Deployment Guide - FairPrice™

## Deployment Status

**Git Push**: ✅ Complete (commit `b0f293a`)  
**Branch**: `main`  
**Auto-Deploy**: Vercel should be building now

---

## ⚡ Quick Deployment Checklist

### 1. ✅ Code Pushed to GitHub
```bash
✓ Committed: feat: Implement FairPrice™ AI Estimator
✓ Pushed to: origin/main
✓ Files: 11 changed, 2250+ insertions
```

### 2. 🔄 Vercel Auto-Deploy
Vercel will automatically:
- Detect the push to `main`
- Start a new deployment
- Build the Next.js app
- Deploy to production

**Check status**: https://vercel.com/vita-viators-projects/service-match-web

---

## 🔧 Required Vercel Environment Variables

You **MUST** add these environment variables in Vercel dashboard:

### Navigate to:
`Vercel Dashboard → Your Project → Settings → Environment Variables`

### Add These Variables:

#### 1. **NEXT_PUBLIC_BASE_URL** (Required)
```
Variable: NEXT_PUBLIC_BASE_URL
Value: https://your-domain.vercel.app
Environment: Production, Preview, Development
```
*(Replace with your actual Vercel domain)*

#### 2. **OPENAI_API_KEY** (Optional but Recommended)
```
Variable: OPENAI_API_KEY
Value: sk-your-openai-api-key-here
Environment: Production, Preview
```
*(Get from: https://platform.openai.com/api-keys)*

**Without this**: FairPrice uses intelligent fallbacks (still works great!)  
**With this**: GPT-4 powered estimates (even better!)

---

## 🗄️ Database Migration on Vercel

The database migrations need to run on your Vercel/Supabase database.

### Option 1: Automatic (Recommended)
Add a `postinstall` script to apply migrations automatically:

**File**: `package.json` (root)
```json
{
  "scripts": {
    "postinstall": "cd packages/db && npx prisma generate && npx prisma migrate deploy"
  }
}
```

### Option 2: Manual
Run migrations against your production database:

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="your-supabase-postgres-url"

cd packages/db
npx prisma migrate deploy
```

### Option 3: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations
vercel env pull .env.production
cd packages/db
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## ✅ Post-Deployment Verification

### 1. Check Deployment Status
Visit: https://vercel.com/vita-viators-projects/service-match-web/deployments

Look for:
- ✅ Build succeeded
- ✅ No build errors
- ✅ Deployment status: Ready

### 2. Test FairPrice on Production

#### Test Homepage:
```
Visit: https://your-domain.vercel.app
Scroll to: FairPrice™ AI Estimator section
Try: Enter "Boiler Service" and click Analyze
Expect: See price estimate appear
```

#### Test API Estimate:
```bash
curl -X POST https://your-domain.vercel.app/api/fairprice/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Boiler Service",
    "category": "heating-boilers",
    "postcode": "SW1A"
  }'
```

Expected response:
```json
{
  "success": true,
  "estimate": {
    "low": 144,
    "avg": 216,
    "high": 336,
    "confidence": 75,
    "reasoning": "Based on typical boiler service costs...",
    "dataPoints": 0
  }
}
```

#### Test API Audit:
```bash
curl -X POST https://your-domain.vercel.app/api/fairprice/audit \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Boiler Service",
    "quotedAmount": 400,
    "category": "heating-boilers"
  }'
```

Expected response:
```json
{
  "success": true,
  "audit": {
    "quotedAmount": 400,
    "marketAverage": 216,
    "variance": 184,
    "variancePercent": 85.2,
    "verdict": "OVERPRICED",
    "analysis": "This quote is significantly higher...",
    "redFlags": ["Price is more than 25% above market average"],
    "recommendations": [...]
  }
}
```

### 3. Check Vercel Logs
```
Vercel Dashboard → Your Project → Deployments → [Latest] → Logs
```

Look for:
- ✅ No errors during build
- ✅ Prisma client generated successfully
- ✅ API routes registered
- ℹ️ "FairPrice: OpenAI package not installed..." (if no API key) - This is fine!

---

## 🐛 Troubleshooting

### Build Fails with "Cannot find module 'openai'"
**Fix**: OpenAI should be in dependencies. Check `package.json`:
```json
{
  "dependencies": {
    "openai": "^4.x.x"
  }
}
```

If missing, run locally and push:
```bash
npm install openai
git add package.json package-lock.json
git commit -m "fix: Add openai to dependencies"
git push
```

### Database Migration Errors
**Symptoms**: "Table price_estimates does not exist"

**Fix**: Run migrations on production database:
```bash
# Option A: Use Supabase Dashboard SQL Editor
# Copy contents of: packages/db/prisma/migrations/20260201_add_fairprice_models/migration.sql
# Run in Supabase SQL editor

# Option B: Use Vercel CLI
vercel env pull .env.production
cd packages/db
npx prisma migrate deploy
```

### API Returns "Failed to generate price estimate"
**Check**:
1. Logs in Vercel dashboard
2. Database connection (DATABASE_URL)
3. Environment variables set correctly

**Expected behavior**:
- Should work even without OpenAI
- Returns fallback prices
- Logs will show: "FairPrice: OpenAI package not installed, using intelligent fallbacks"

### Frontend Shows Old Simulation Data
**Fix**: Clear cache and hard reload
- In browser: Cmd/Ctrl + Shift + R
- Or: Clear Vercel cache in dashboard

---

## 🎯 Environment Variables Summary

**Required for Production:**
```bash
# Already set (from previous setup)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.vercel.app

# NEW - Required for FairPrice
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app

# NEW - Optional for AI features
OPENAI_API_KEY=sk-...  # Optional but recommended
```

**Add these in Vercel:**
1. Go to: Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_BASE_URL` with your Vercel domain
3. Optionally add `OPENAI_API_KEY`
4. Redeploy (or Vercel auto-redeploys)

---

## 📊 Deployment Timeline

### What's Happening Now:
```
[1-2 min]  Push detected by Vercel
[2-5 min]  Dependencies installed (npm install)
[2-3 min]  Prisma client generated
[3-5 min]  Next.js build
[1 min]    Deployment to edge network
──────────────────────────────────────
Total: ~10-15 minutes
```

### Check Progress:
Visit: https://vercel.com/vita-viators-projects/service-match-web

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] Build completes without errors
- [ ] Deployment shows "Ready" status
- [ ] Homepage loads at your Vercel URL
- [ ] FairPrice section visible on homepage
- [ ] Can enter a job and get estimate
- [ ] API endpoints respond (test with curl)
- [ ] No errors in Function Logs
- [ ] Database tables exist (check Supabase)

---

## 🚀 After Successful Deployment

### 1. Test Live
```bash
# Replace with your actual domain
export DOMAIN="your-app.vercel.app"

# Test estimate
curl -X POST https://$DOMAIN/api/fairprice/estimate \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Fix Tap", "category": "plumbing"}'

# Test audit
curl -X POST https://$DOMAIN/api/fairprice/audit \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Boiler Service", "quotedAmount": 300}'
```

### 2. Share with Team
- Send homepage URL
- Get feedback on FairPrice feature
- Monitor usage analytics

### 3. Monitor
- Check Vercel Analytics
- Review Function Logs
- Track API usage
- Monitor OpenAI costs (if enabled)

### 4. Optimize (Later)
- Add OpenAI key if not done
- Collect historical pricing data
- Fine-tune regional factors
- Add material price integration

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/vita-viators-projects/service-match-web
- **Deployments**: https://vercel.com/vita-viators-projects/service-match-web/deployments
- **Environment Vars**: https://vercel.com/vita-viators-projects/service-match-web/settings/environment-variables
- **Function Logs**: Check latest deployment → Logs tab
- **Supabase Dashboard**: https://supabase.com/dashboard/project/dsxagaodhfilezmdopam
- **OpenAI API Keys**: https://platform.openai.com/api-keys

---

## 📞 Need Help?

### Common Commands:
```bash
# Check deployment status
vercel ls

# View logs
vercel logs your-deployment-url

# Run migrations on production
vercel env pull
cd packages/db && npx prisma migrate deploy

# Force redeploy
git commit --allow-empty -m "chore: Trigger redeploy"
git push
```

### Check These First:
1. ✅ Environment variables set in Vercel
2. ✅ Database migrations applied
3. ✅ Build logs show no errors
4. ✅ Function logs show API working
5. ✅ OpenAI key valid (if added)

---

**Status**: 🚀 **DEPLOYING**  
**ETA**: ~10-15 minutes  
**Next**: Check Vercel dashboard for build status  

**Once deployed, FairPrice™ will be live on production!** 🎉
