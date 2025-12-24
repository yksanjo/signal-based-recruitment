import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Explicitly use Node.js runtime

export async function GET(request: Request) {
  try {
    console.log('[API] /api/signals - Request received');
    
    // Return empty array immediately - no database needed
    const response = NextResponse.json([], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    console.log('[API] /api/signals - Returning empty array');
    return response;
  } catch (error) {
    console.error('[API] /api/signals - Error:', error);
    
    // Always return valid JSON, never let it crash
    return NextResponse.json([], {
      status: 200, // Return 200 even on error to prevent crashes
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
