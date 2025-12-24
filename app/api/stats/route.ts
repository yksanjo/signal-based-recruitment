import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    console.log('[API] /api/stats - Request received');
    
    const stats = {
      totalSignals: 0,
      processedSignals: 0,
      activeBuckets: 0,
      totalCandidates: 0,
    };
    
    const response = NextResponse.json(stats, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    console.log('[API] /api/stats - Returning stats');
    return response;
  } catch (error) {
    console.error('[API] /api/stats - Error:', error);
    
    return NextResponse.json({
      totalSignals: 0,
      processedSignals: 0,
      activeBuckets: 0,
      totalCandidates: 0,
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
