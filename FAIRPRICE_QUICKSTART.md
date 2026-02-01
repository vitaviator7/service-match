# 🚀 FairPrice™ Quick Start Guide

## TL;DR - Start Using in 3 Minutes!

The FairPrice™ AI Estimator is **already fully implemented and working**. Here's how to start using it right now:

---

## ⚡ Quick Start (Choose Your Path)

### Path A: Use It NOW (No Setup Required!)
```bash
# 1. Start your dev server
npm run dev

# 2. Open browser
# Visit: http://localhost:3000

# 3. Scroll to "FairPrice™ AI Estimator"

# 4. Enter a job like "Boiler Service" and click "Analyze"

# 5. Done! You'll see instant pricing 🎉
```

**That's it!** The system uses intelligent fallbacks and works perfectly without any API keys.

---

### Path B: Enable AI Features (Optional - 5 Minutes)

Want GPT-4 powered estimates? Add your OpenAI key:

```bash
# 1. Get API key from: https://platform.openai.com/api-keys

# 2. Add to .env.local:
echo 'OPENAI_API_KEY=sk-your-key-here' >> .env.local

# 3. Restart dev server
npm run dev

# 4. Done! Now using GPT-4 intelligence 🧠
```

---

## 📍 Where to Find FairPrice

### 1. On the Homepage
- Visit: `http://localhost:3000`
- Scroll to the **"FairPrice™ AI Estimator"** section
- Beautiful purple/indigo section with price checking tool

### 2. Direct API Access
```bash
# Get a price estimate
curl -X POST http://localhost:3000/api/fairprice/estimate \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Fix Leaky Tap", "category": "plumbing"}'

# Audit a quote
curl -X POST http://localhost:3000/api/fairprice/audit \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Boiler Service", "quotedAmount": 200}'
```

---

## 🧪 Run Automated Tests

Test all features with one command:

```bash
# Make sure your server is running first!
npm run dev

# In another terminal:
./test-fairprice.sh
```

This will test:
- ✅ Price estimates for multiple categories
- ✅ Quote auditing (fair, overpriced, bargain prices)
- ✅ Regional pricing adjustments
- ✅ All API endpoints

---

## 🎯 Try These Examples

### Example 1: Get a Boiler Service Estimate
1. Go to homepage
2. Find FairPrice section
3. Type: **"Boiler Service"**
4. Click "Analyze"
5. See: £120 - £180 - £280 (Budget - Average - Premium)

### Example 2: Check if a Quote is Fair
```bash
curl -X POST http://localhost:3000/api/fairprice/audit \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Paint Living Room",
    "quotedAmount": 400,
    "category": "painting-decorating"
  }' | jq '.'
```

Expected Response:
```json
{
  "success": true,
  "audit": {
    "quotedAmount": 400,
    "marketAverage": 180,
    "variance": 220,
    "variancePercent": 122.2,
    "verdict": "OVERPRICED",
    "analysis": "This quote is significantly higher than typical market rates...",
    "redFlags": ["Price is more than 25% above market average"],
    "recommendations": [
      "Get at least 2 additional quotes",
      "Ask for detailed justification"
    ]
  }
}
```

### Example 3: Test Multiple Categories
```bash
# Plumbing
curl -s -X POST http://localhost:3000/api/fairprice/estimate \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Fix Leaky Tap", "category": "plumbing"}' | jq '.estimate'

# Electrical
curl -s -X POST http://localhost:3000/api/fairprice/estimate \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Install Light Fixture", "category": "electrical"}' | jq '.estimate'

# Cleaning
curl -s -X POST http://localhost:3000/api/fairprice/estimate \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Deep Clean House", "category": "cleaning"}' | jq '.estimate'
```

---

## 📊 What You'll See

### On the Frontend:
```
┌─────────────────────────────────────────────┐
│  FairPrice™ AI Estimator                    │
│                                             │
│  [What do you need? e.g. Boiler repair...]  │
│  [Analyze Button]                           │
│                                             │
│  Budget    Market Avg    Premium            │
│  £120      £180          £280               │
│  └─────────┬─────────────┴──────┐           │
│  ═════════════════════════════════           │
│                                             │
│  💡 "Based on typical boiler service       │
│      costs in your area..."                │
│                                             │
│  Confidence: 75% | Based on 0 recent jobs  │
│                                             │
│  [Get a Guaranteed Quote for £180]         │
└─────────────────────────────────────────────┘
```

### Via API:
```json
{
  "success": true,
  "estimate": {
    "low": 120,
    "avg": 180,
    "high": 280,
    "confidence": 75,
    "reasoning": "Based on typical boiler service costs...",
    "dataPoints": 0,
    "breakdown": {
      "labor": 108,
      "materials": 54,
      "callout": 18,
      "complexity": 1.0
    }
  }
}
```

---

## 🔧 Configuration (All Optional!)

Everything works out of the box, but you can customize:

### .env.local
```bash
# Optional: Enable AI-powered estimates
OPENAI_API_KEY=sk-your-key-here

# Required for quote audit (already set)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## ❓ Common Questions

### "Do I need an OpenAI API key?"
**No!** The system works perfectly without it using:
- Smart category-based pricing
- Regional adjustments (UK postcodes)
- Seasonal demand factors
- Historical data (as it accumulates)

### "What if I add the API key?"
You get even better estimates powered by GPT-4:
- More accurate pricing
- Better job categorization
- Smarter reasoning
- Higher confidence scores

### "Is the database set up?"
**Yes!** All migrations have been applied:
- ✅ `price_estimates` table created
- ✅ `quote_audits` table created
- ✅ `historical_pricing` table created
- ✅ `material_prices` table created

### "Does it cost money to run?"
- **Without OpenAI**: 100% free, unlimited
- **With OpenAI**: ~$0.01-0.03 per estimate (very cheap!)
- **Database**: Your existing PostgreSQL (no extra cost)

---

## 📈 What Happens Next

### Immediate (Now)
1. ✅ FairPrice is live on your homepage
2. ✅ API endpoints are working
3. ✅ Users can get instant estimates
4. ✅ Quote auditing available

### Short-term (This Week)
1. Gather user feedback
2. Monitor which services are searched
3. Optionally add OpenAI key
4. Share with stakeholders

### Medium-term (This Month)
1. Historical data starts accumulating
2. Estimates become more accurate
3. Regional patterns emerge
4. Consider material price integration

### Long-term (3+ Months)
1. Rich pricing dataset
2. Machine learning opportunities
3. "Guaranteed Fixed Price" premium tier
4. Competitive moat established

---

## 🎯 Success Checklist

- [ ] Visit homepage → Scroll to FairPrice
- [ ] Enter "Boiler Service" → Click Analyze
- [ ] See price estimate appear
- [ ] Try different service categories
- [ ] Run `./test-fairprice.sh` (optional)
- [ ] Share screenshot with team
- [ ] Add OpenAI key for AI features (optional)
- [ ] Celebrate your unique differentiator! 🎉

---

## 📚 Need More Info?

- **Full Guide**: `FAIRPRICE_IMPLEMENTATION.md`
- **Completion Summary**: `FAIRPRICE_COMPLETE.md`
- **API Docs**: Both guides above have detailed API documentation
- **Testing**: `./test-fairprice.sh`

---

## 🚨 Troubleshooting

### Server won't start?
```bash
# Check for port conflicts
lsof -ti:3000 | xargs kill -9
npm run dev
```

### API returns errors?
```bash
# Check environment variables
cat .env.local | grep NEXT_PUBLIC_BASE_URL

# Should show: NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Want to see logs?
```bash
# API logs appear in terminal where you ran `npm run dev`
# Look for: "FairPrice: ..." messages
```

---

## ✨ You're Ready!

**FairPrice™ is fully implemented and working.**

The fastest way to see it: **Visit http://localhost:3000** after running `npm run dev`

Questions? Check the comprehensive docs in:
- `FAIRPRICE_COMPLETE.md`
- `FAIRPRICE_IMPLEMENTATION.md`

---

**Happy pricing! 💰✨**
