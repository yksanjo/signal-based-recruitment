'use client';

export function HelpGuide() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How to Use Signal-Based Recruitment Sourcing</h1>
        <p className="text-lg text-gray-700 mb-8">
          A high-velocity event stream system for recruitment intelligence that replaces data-heavy scraping with signal-based architecture.
        </p>

        <div className="space-y-8">
          {/* Step 1 */}
          <section className="border-l-4 border-indigo-500 pl-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 1: Configure Your Ideal Customer Profile (ICP)</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click on the <strong className="text-indigo-600">&quot;ICP Config&quot;</strong> tab in the navigation</li>
              <li>Set your target criteria:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Target Country</strong>: Where you want to find candidates (e.g., &quot;Brazil&quot;)</li>
                  <li><strong>Excluded HQ Countries</strong>: Countries to exclude</li>
                  <li><strong>Minimum Job Title Level</strong>: Seniority levels (e.g., &quot;VP&quot;, &quot;Head of&quot;, &quot;Director&quot;)</li>
                  <li><strong>Required Languages</strong>: Languages candidates should speak</li>
                  <li><strong>Max Employees in Target Country</strong>: Maximum company size</li>
                  <li><strong>Industries</strong>: Target industries (e.g., &quot;Technology&quot;, &quot;SaaS&quot;)</li>
                  <li><strong>Minimum Funding Amount</strong>: Minimum funding for startups</li>
                </ul>
              </li>
              <li>Click <strong className="text-indigo-600">&quot;Save Configuration&quot;</strong></li>
            </ol>
            <p className="mt-3 text-gray-600 italic">This filters signals to match your ideal customer profile.</p>
          </section>

          {/* Step 2 */}
          <section className="border-l-4 border-blue-500 pl-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 2: Ingest Signals</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click on the <strong className="text-blue-600">&quot;Signal Ingestion&quot;</strong> tab</li>
              <li>Fill in the form:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Keywords</strong>: Job titles to search for (comma-separated)
                    <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm">Example: Head of Engineering, VP of Sales, Director of Product</div>
                  </li>
                  <li><strong>Location</strong>: Geographic location to search
                    <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm">Example: Brazil, United States, Remote</div>
                  </li>
                  <li><strong>Days Back</strong>: How many days back to search (1-90)
                    <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm">Example: 30 (last 30 days)</div>
                  </li>
                </ul>
              </li>
              <li>Click <strong className="text-blue-600">&quot;Ingest Signals&quot;</strong></li>
            </ol>
            <p className="mt-3 text-gray-600 italic">The system searches LinkedIn, Indeed, and Glassdoor for job postings matching your criteria.</p>
          </section>

          {/* Step 3 */}
          <section className="border-l-4 border-green-500 pl-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 3: View Your Dashboard</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click on the <strong className="text-green-600">&quot;Dashboard&quot;</strong> tab (default view)</li>
              <li>You&apos;ll see:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Total Signals</strong>: Number of signals collected</li>
                  <li><strong>Processed Signals</strong>: Signals that have been analyzed</li>
                  <li><strong>Active Buckets</strong>: Number of action buckets created</li>
                  <li><strong>Candidates</strong>: Total candidate profiles generated</li>
                  <li><strong>Recent Signals</strong>: Latest job postings found</li>
                </ul>
              </li>
            </ol>
            <p className="mt-3 text-gray-600 italic">Monitor your recruitment pipeline at a glance.</p>
          </section>

          {/* Step 4 */}
          <section className="border-l-4 border-purple-500 pl-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 4: Review Action Buckets</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click on the <strong className="text-purple-600">&quot;Action Buckets&quot;</strong> tab</li>
              <li>You'll see signals grouped into categories:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>POACH</strong>: Companies undergoing merger/restructuring</li>
                  <li><strong>SCALE</strong>: Companies that just hired VP-level, need to scale team</li>
                  <li><strong>SKILLS_SHIFT</strong>: Companies changing tech stack</li>
                  <li><strong>EXPANSION</strong>: Companies opening new offices</li>
                  <li><strong>FUNDING_BOOST</strong>: Recently funded startups</li>
                </ul>
              </li>
              <li>Click on a bucket to see details</li>
              <li>Click <strong className="text-purple-600">&quot;Trigger Workflow&quot;</strong> to generate candidate profiles</li>
            </ol>
            <p className="mt-3 text-gray-600 italic">Groups similar opportunities together for easier targeting.</p>
          </section>

          {/* Step 5 */}
          <section className="border-l-4 border-cyan-500 pl-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 5: Generate Candidate Profiles</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>In the <strong className="text-cyan-600">&quot;Action Buckets&quot;</strong> tab, select a bucket</li>
              <li>Click <strong className="text-cyan-600">&quot;Trigger Workflow&quot;</strong> button</li>
              <li>The system will:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Generate candidate profiles</li>
                  <li>Score candidates by likelihood to move</li>
                  <li>Show candidate details (name, title, company, skills, etc.)</li>
                </ul>
              </li>
            </ol>
            <p className="mt-3 text-gray-600 italic">Get ready-to-contact candidate lists for each opportunity type.</p>
          </section>

          {/* Tips */}
          <section className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Tips & Best Practices</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-indigo-600 font-bold mr-2">1.</span>
                <span><strong>Start with ICP Config</strong>: Always configure your ideal customer profile first</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 font-bold mr-2">2.</span>
                <span><strong>Use Specific Keywords</strong>: More specific keywords = better results
                    <div className="mt-1">
                    <span className="text-green-600">✅ Good:</span> &quot;Head of Engineering, VP of Sales&quot;<br/>
                    <span className="text-red-600">❌ Bad:</span> &quot;engineer, sales&quot;
                  </div>
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 font-bold mr-2">3.</span>
                <span><strong>Monitor Dashboard</strong>: Check regularly to see signal quality</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 font-bold mr-2">4.</span>
                <span><strong>Review Buckets</strong>: Not all signals are equal - focus on high-priority buckets</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 font-bold mr-2">5.</span>
                <span><strong>Trigger Workflows Strategically</strong>: Only generate candidates for buckets that match your goals</span>
              </li>
            </ul>
          </section>

          {/* Example Workflow */}
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Example Workflow: Find Engineering Leaders in Brazil</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li><strong>ICP Config</strong> → Set target country to &quot;Brazil&quot;, industries to &quot;Technology&quot;</li>
              <li><strong>Signal Ingestion</strong> → Keywords = &quot;Head of Engineering, VP Engineering&quot;, Location = &quot;Brazil&quot;, Days = 30</li>
              <li><strong>Dashboard</strong> → Monitor signals coming in</li>
              <li><strong>Action Buckets</strong> → Review SCALE bucket for companies hiring engineering leaders</li>
              <li><strong>Trigger Workflow</strong> → Generate candidate profiles</li>
            </ol>
          </section>

          {/* Current Status */}
          <section className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Current Status</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ <strong>UI is fully functional</strong> - All tabs and features work</li>
              <li>✅ <strong>Works without database</strong> - Shows empty states for now</li>
              <li>⚠️ <strong>Mock Data</strong> - Uses mock scrapers (not real LinkedIn/Indeed scraping yet)</li>
              <li>⚠️ <strong>Demo Mode</strong> - Payment processing is in demo mode</li>
            </ul>
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="font-bold text-gray-900 mb-2">🚀 To Enable Full Functionality:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li><strong>Add Database</strong>: Set up PostgreSQL and add <code className="bg-gray-100 px-2 py-1 rounded">DATABASE_URL</code> in Vercel environment variables</li>
                <li><strong>Add API Keys</strong>: <code className="bg-gray-100 px-2 py-1 rounded">APOLLO_API_KEY</code> for company enrichment</li>
                <li><strong>Set Up Scrapers</strong>: Integrate real scraping services (Apify, ScraperAPI, etc.)</li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

