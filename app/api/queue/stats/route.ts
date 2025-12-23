import { NextResponse } from 'next/server';
import { SignalQueue } from '@/lib/signals/queue';

/**
 * Get queue statistics
 */
export async function GET() {
  try {
    const queue = new SignalQueue();
    const stats = await queue.getQueueStats();
    await queue.close();

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get queue stats' },
      { status: 500 }
    );
  }
}




