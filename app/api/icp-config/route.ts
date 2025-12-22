import { NextRequest, NextResponse } from 'next/server';
import { ICPConfig } from '@/lib/types';

// In production, store this in a database or config service
let cachedConfig: ICPConfig | null = null;

export async function GET() {
  try {
    if (!cachedConfig) {
      cachedConfig = {
        targetCountry: 'Brazil',
        excludedHQCountries: ['Brazil'],
        minJobTitleLevel: ['VP', 'Head of', 'Director'],
        requiredLanguages: ['English', 'Spanish'],
        maxEmployeesInTargetCountry: 100,
        industries: ['Technology', 'SaaS', 'Oil & Energy'],
        minFundingAmount: 1000000,
      };
    }

    return NextResponse.json(cachedConfig);
  } catch (error) {
    console.error('Error fetching ICP config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ICP config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    cachedConfig = body as ICPConfig;

    return NextResponse.json({
      success: true,
      config: cachedConfig,
    });
  } catch (error) {
    console.error('Error saving ICP config:', error);
    return NextResponse.json(
      { error: 'Failed to save ICP config' },
      { status: 500 }
    );
  }
}

