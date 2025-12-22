import { NextResponse } from 'next/server';
import { LogisticsEngine } from '@/lib/logistics/engine';
import { ICPConfig } from '@/lib/types';

export async function GET() {
  try {
    const engine = new LogisticsEngine();
    const buckets = await engine.getActionBuckets();

    return NextResponse.json(buckets);
  } catch (error) {
    console.error('Error fetching buckets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buckets' },
      { status: 500 }
    );
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

