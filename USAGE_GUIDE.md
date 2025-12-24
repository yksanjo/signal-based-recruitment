# How to Use Signal-Based Recruitment Sourcing Platform

## 🚀 Quick Start Guide

### Access Your App
Visit: **https://signal-based-recruitment.vercel.app**

---

## 📋 Step-by-Step Usage

### Step 1: Configure Your Ideal Customer Profile (ICP)

1. Click on the **"ICP Config"** tab in the navigation
2. Set your target criteria:
   - **Target Country**: Where you want to find candidates (e.g., "Brazil")
   - **Excluded HQ Countries**: Countries to exclude (e.g., "Brazil" if you want companies with HQ elsewhere)
   - **Minimum Job Title Level**: Seniority levels (e.g., "VP", "Head of", "Director")
   - **Required Languages**: Languages candidates should speak
   - **Max Employees in Target Country**: Maximum company size
   - **Industries**: Target industries (e.g., "Technology", "SaaS", "Oil & Energy")
   - **Minimum Funding Amount**: Minimum funding for startups
3. Click **"Save Configuration"**

**Why this matters:** This filters signals to match your ideal customer profile.

---

### Step 2: Ingest Signals

1. Click on the **"Signal Ingestion"** tab
2. Fill in the form:
   - **Keywords**: Job titles to search for (comma-separated)
     - Example: `Head of Engineering, VP of Sales, Director of Product`
   - **Location**: Geographic location to search
     - Example: `Brazil`, `United States`, `Remote`
   - **Days Back**: How many days back to search (1-90)
     - Example: `30` (last 30 days)
3. Click **"Ingest Signals"**
4. Wait for the ingestion to complete

**What happens:** The system searches LinkedIn, Indeed, and Glassdoor for job postings matching your criteria.

---

### Step 3: View Your Dashboard

1. Click on the **"Dashboard"** tab (default view)
2. You'll see:
   - **Total Signals**: Number of signals collected
   - **Processed Signals**: Signals that have been analyzed
   - **Active Buckets**: Number of action buckets created
   - **Candidates**: Total candidate profiles generated
   - **Recent Signals**: Latest job postings found

**Use this to:** Monitor your recruitment pipeline at a glance.

---

### Step 4: Review Action Buckets

1. Click on the **"Action Buckets"** tab
2. You'll see signals grouped into categories:
   - **POACH**: Companies undergoing merger/restructuring
   - **SCALE**: Companies that just hired VP-level, need to scale team
   - **SKILLS_SHIFT**: Companies changing tech stack
   - **EXPANSION**: Companies opening new offices
   - **FUNDING_BOOST**: Recently funded startups
3. Click on a bucket to see details
4. Click **"Trigger Workflow"** to generate candidate profiles for that bucket

**What this does:** Groups similar opportunities together for easier targeting.

---

### Step 5: Generate Candidate Profiles

1. In the **"Action Buckets"** tab, select a bucket
2. Click **"Trigger Workflow"** button
3. The system will:
   - Generate candidate profiles
   - Score candidates by likelihood to move
   - Show candidate details (name, title, company, skills, etc.)

**Use this to:** Get ready-to-contact candidate lists for each opportunity type.

---

### Step 6: Manage Subscriptions (Optional)

1. Click on the **"Payment"** tab
2. View your current subscription plan
3. Choose a plan:
   - **Free**: 100 signals/month, Basic enrichment
   - **Pro**: 10,000 signals/month, Full enrichment, API access ($99/month)
   - **Enterprise**: Unlimited signals, Custom enrichment ($499/month)
4. Click **"Subscribe"** to upgrade

---

## 🎯 Common Workflows

### Workflow 1: Find Engineering Leaders in Brazil

1. **ICP Config**: Set target country to "Brazil", industries to "Technology"
2. **Signal Ingestion**: Keywords = "Head of Engineering, VP Engineering", Location = "Brazil", Days = 30
3. **Dashboard**: Monitor signals coming in
4. **Action Buckets**: Review SCALE bucket for companies hiring engineering leaders
5. **Trigger Workflow**: Generate candidate profiles

### Workflow 2: Target Recently Funded Startups

1. **ICP Config**: Set minimum funding amount (e.g., $1M)
2. **Signal Ingestion**: Search for various senior roles
3. **Action Buckets**: Focus on FUNDING_BOOST bucket
4. **Trigger Workflow**: Get candidates from funded companies

### Workflow 3: Find Companies Expanding

1. **ICP Config**: Set target country and excluded HQ countries
2. **Signal Ingestion**: Search for expansion-related roles
3. **Action Buckets**: Check EXPANSION bucket
4. **Trigger Workflow**: Generate profiles for expansion opportunities

---

## 💡 Tips & Best Practices

1. **Start with ICP Config**: Always configure your ideal customer profile first
2. **Use Specific Keywords**: More specific keywords = better results
   - ✅ Good: "Head of Engineering, VP of Sales"
   - ❌ Bad: "engineer, sales"
3. **Monitor Dashboard**: Check regularly to see signal quality
4. **Review Buckets**: Not all signals are equal - focus on high-priority buckets
5. **Trigger Workflows Strategically**: Only generate candidates for buckets that match your goals

---

## 🔧 Current Limitations

- **No Database**: Currently works without database (shows empty states)
- **Mock Data**: Uses mock scrapers (not real LinkedIn/Indeed scraping yet)
- **Demo Mode**: Payment processing is in demo mode

---

## 🚀 To Enable Full Functionality

1. **Add Database**: Set up PostgreSQL and add `DATABASE_URL` in Vercel environment variables
2. **Add API Keys**: 
   - `APOLLO_API_KEY` for company enrichment
   - `CLAY_API_KEY` for additional data
3. **Set Up Scrapers**: Integrate real scraping services (Apify, ScraperAPI, etc.)

---

## 📞 Need Help?

- Check the **Dashboard** for real-time stats
- Review **Action Buckets** to see how signals are categorized
- Use **ICP Config** to refine your targeting

---

**Your app is live at: https://signal-based-recruitment.vercel.app**

