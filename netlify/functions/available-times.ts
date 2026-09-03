import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { getDb } from './_lib/firebaseAdmin'
import { badRequest, json, serverError } from './_lib/respond'

export const WORKING_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
]

/**
 * GET /.netlify/functions/available-times?date=YYYY-MM-DD
 *
 * Public endpoint that returns booked time slots for a given date
 * so the frontend can display available slots (09:00 - 18:00).
 */
const handler: Handler = async (event) => {
  try {
    return await route(event)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return serverError(err instanceof Error ? err.message : 'Kutilmagan xatolik.')
  }
}

async function route(event: HandlerEvent): Promise<HandlerResponse> {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' })

  const date = event.queryStringParameters?.date
  if (!date) {
    return badRequest("Sana ko'rsatilmadi.")
  }

  const db = getDb()
  const snap = await db.collection('bookings').where('scheduled_date', '==', date).get()

  const bookedTimes: string[] = []
  snap.forEach((doc) => {
    const data = doc.data()
    if (data.status !== 'cancelled' && data.scheduled_time) {
      bookedTimes.push(data.scheduled_time)
    }
  })

  const availableTimes = WORKING_HOURS.filter((time) => !bookedTimes.includes(time))

  return json(200, {
    date,
    workingHours: WORKING_HOURS,
    bookedTimes,
    availableTimes,
  })
}

export { handler }
