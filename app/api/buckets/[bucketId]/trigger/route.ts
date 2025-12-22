import { NextRequest, NextResponse } from 'next/server';
import { OrchestrationWorkflow } from '@/lib/orchestration/workflow';
import { ICPConfig } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    const body = await request.json();
    const icpConfig: ICPConfig = body.icpConfig || {
      targetCountry: 'Brazil',
      excludedHQCountries: ['Brazil'],
      maxEmployeesInTargetCountry: 100,
    };

    const workflow = new OrchestrationWorkflow();
    const candidates = await workflow.triggerWorkflow(params.bucketId, icpConfig);

    return NextResponse.json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    );
  }
}

