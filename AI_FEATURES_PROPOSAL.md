# AI Feature Proposal: Intelligent Home Services Marketplace

## Executive Summary
To differentiate "Service Match" from standard directories (Checkatrade, TaskRabbit), we propose three AI-driven features that transform the platform from a *passive connector* into an *active, intelligent agent* for both Homeowners and Professionals.

---

## 1. "SnapFix" – Visual AI Diagnostics
**The Problem**: Homeowners don't know technical terms. They search for "plumber" when they need a "boiler technician", leading to wasted call-outs.
**The AI Solution**: A "Show, Don't Tell" interface.
- *Mechanism*: Users upload a photo or short video of the problem (e.g., a crack in the wall, a weird noise from the heater).
- *AI Action*: Computer Vision analyzes the media to:
    1. Identify the specific issue (e.g., "Radiator valve leak").
    2. Categorize it to the exact sub-trade.
    3. Generate a preliminary materials list for the Pro.
- **Differentiation**: Removes the "Knowledge Gap" friction. No more forms asking "What type of boiler do you have?"—the AI just looks at the label.
- **Profit Driver**: Higher quality leads. Pros pay a premium for "Verified Visual Leads" because they know exactly what tools to bring.

## 2. "RouteMatch" – Hyper-Local Opportunity Pushing
**The Problem**: Professionals spend 30% of their day driving between scattered jobs.
**The AI Solution**: Real-time logistical arbitrage (The "Uber Pool" for Trades).
- *Mechanism*: The system monitors a Pro's live location and schedule. If a Plumber is finishing a job in *postcode N1*, and a user in *N1* searches for a plumber, the system matches them instantly with a "Neighborhood Discount."
- *User Benefit*: "A Pro is around the corner. Book now for 10% off."
- *Pro Benefit*: Zero travel time between jobs.
- **Differentiation**: Most platforms match based on static "Service Areas". We match based on *Live Trajectory*.
- **Profit Driver**: Volume. We capture impulse bookings ("might as well get that tap fixed since he's here").

## 3. "FairPrice" – Real-Time Dynamic Estimation
**The Problem**: Pricing opacity. Users fear overpaying; Pros hate low-ballers.
**The AI Solution**: calibrated market rate engine.
- *Mechanism*: Trained on thousands of completed invoices, the AI gives an instant, localized price range for the specific job description *before* the Pro is contacted.
- *Feature*: "Quote Auditor" - A user can upload a quote they received offline, and the AI validates if it's fair based on current market rates and materials costs.
- **Differentiation**: Radical transparency. We become the "Kelly Blue Book" for services.
- **Profit Driver**: "Guaranteed Fixed Price" model. The platform charges the user the AI-calculated price + 20% margin, pays the Pro the market rate, and keeps the difference.

---

## Technical Feasibility
- **SnapFix**: GPT-4 Vision API / Google Gemini Vision.
- **RouteMatch**: PostGIS + Redis Geospatial.
- **FairPrice**: Scikit-learn regression model on historical job data + Web scraping for material prices.
