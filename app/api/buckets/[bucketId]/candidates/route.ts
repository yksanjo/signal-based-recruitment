import { NextRequest, NextResponse } from 'next/server';
import { OrchestrationWorkflow } from '@/lib/orchestration/workflow';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { bucketId: string } }
) {
  try {
    const workflow = new OrchestrationWorkflow();
    const candidates = await workflow.getCandidatesForBucket(params.bucketId);

    return NextResponse.json(Array.isArray(candidates) ? candidates : []);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    // Return empty array instead of error to prevent client-side crashes
    return NextResponse.json([]);
  }
}




