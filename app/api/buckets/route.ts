import { NextResponse } from 'next/server';
import { LogisticsEngine } from '@/lib/logistics/engine';
import { ICPConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const engine = new LogisticsEngine();
    const buckets = await engine.getActionBuckets();

    return NextResponse.json(Array.isArray(buckets) ? buckets : []);
  } catch (error: any) {
    console.error('Error fetching buckets:', error);
    // Return empty array instead of error to prevent client-side crashes
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const icpConfig: ICPConfig = body.icpConfig || {
      targetCountry: 'Brazil',
      excludedHQCountries: ['Brazil'],
      maxEmployeesInTargetCountry: 100,
    };

    const engine = new LogisticsEngine();
    const buckets = await engine.processSignals(icpConfig);

    return NextResponse.json({
      success: true,
      buckets,
    });
  } catch (error) {
    console.error('Error processing signals:', error);
    return NextResponse.json(
      { error: 'Failed to process signals' },
      { status: 500 }
    );
  }
}




