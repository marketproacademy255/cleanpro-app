import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { authenticate } from './_lib/auth'
import { getDb } from './_lib/firebaseAdmin'
import { queryData } from './_lib/firestoreUtil'
import { badRequest, forbidden, json, serverError, unauthorized } from './_lib/respond'
import { ensureReferralCode } from './_lib/referral'

const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://prime-standard.uz'

interface ReferralRedemption {
  code: string
  referrer_uid: string
  referred_uid: string
  status: 'pending' | 'booked' | 'rewarded'
  created_at: string
  booking_id?: string
  rewarded_at?: string
}

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
  const req = await authenticate(event)
  if (!req) return unauthorized()
  const db = getDb()

  // ---------- GET: my referral code + stats ----------
  if (event.httpMethod === 'GET') {
    const code = await ensureReferralCode(db, req.uid, req.profile?.referral_code)

    const redemptionsSnap = await db.collection('referralRedemptions').where('referrer_uid', '==', req.uid).get()
    const redemptions = queryData<ReferralRedemption>(redemptionsSnap)

    return json(200, {
      referralCode: code,
      referralLink: `${SITE_URL}/royxatdan-otish?ref=${code}`,
      creditsUzs: req.profile?.referral_credits_uzs ?? 0,
      stats: {
        totalReferred: redemptions.length,
        pendingCount: redemptions.filter((r) => r.status !== 'rewarded').length,
        rewardedCount: redemptions.filter((r) => r.status === 'rewarded').length,
      },
    })
  }

  // ---------- POST: redeem a friend's code ----------
  if (event.httpMethod === 'POST') {
    let body: { code?: string }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest("Noto'g'ri so'rov.")
    }

    const code = (body.code ?? '').trim().toUpperCase()
    if (!code) return badRequest('Referral kodini kiriting.')

    if (req.profile?.referred_by) {
      return badRequest('Siz allaqachon referral kodidan foydalangansiz.')
    }

    const codeSnap = await db.collection('referrals').doc(code).get()
    if (!codeSnap.exists) return badRequest("Bunday referral kodi topilmadi.")
    const referrerUid = codeSnap.data()?.owner_uid as string | undefined
    if (!referrerUid) return badRequest("Bunday referral kodi topilmadi.")
    if (referrerUid === req.uid) return forbidden()

    const now = new Date().toISOString()
    await db.collection('referralRedemptions').add({
      code,
      referrer_uid: referrerUid,
      referred_uid: req.uid,
      status: 'pending',
      created_at: now,
    } satisfies ReferralRedemption)

    await db.collection('profiles').doc(req.uid).set(
      { referred_by: referrerUid, referral_discount_pending: true },
      { merge: true },
    )

    return json(200, { ok: true })
  }

  return json(405, { error: 'Method not allowed' })
}

export { handler }
