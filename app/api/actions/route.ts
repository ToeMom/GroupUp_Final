/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib2/db';

type Event = {
  id: string;
  category: string;
  ageMax: number;
  ageMin: number;
  createdBy: string;
  createdDate: string;
  createdTime: string;
  date: string;
  time: string;
  description: string;
  image: string;
  location: string;
  maxParticipants: number;
  participants: string[];
  title: string;
  reviewedBy: string;
  reviewedAt: string;
  reason: string;
};

function isBeforeToday(eventDate: string): boolean {
  const [day, month, year] = eventDate.split('-').map(Number);
  const eventDateObj = new Date(year, month - 1, day);
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);
  
  return eventDateObj < today;
}

export async function GET() {
  try {
    const eventsRef = getCollection<Event>('Events');
    const snapshot = await eventsRef.get();
    
    const expiredEvents = snapshot.docs.filter(doc => {
      const eventDate = doc.data().date;
      return isBeforeToday(eventDate);
    });

    const deletePromises = expiredEvents.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Expired events deleted successfully', 
        count: expiredEvents.length,
        deletedEvents: expiredEvents.map(doc => doc.id)
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting expired events:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete expired events', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}