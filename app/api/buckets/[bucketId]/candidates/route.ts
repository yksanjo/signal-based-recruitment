import { NextRequest, NextResponse } from 'next/server';
import { OrchestrationWorkflow } from '@/lib/orchestration/workflow';

export async function GET(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    const workflow = new OrchestrationWorkflow();
    const candidates = await workflow.getCandidatesForBucket(params.bucketId);

    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

