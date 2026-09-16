import { z } from 'zod'

export const bookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Iltimos, xizmat turini tanlang'),
  rooms: z.number().min(1, 'Xonalar soni kamida 1 bo\'lishi kerak').max(20, 'Xonalar soni ko\'pi bilan 20 bo\'lishi mumkin'),
  areaSqm: z.string().optional(),
  floor: z.string().optional(),
  address: z.string().min(5, 'Manzil kamida 5 ta belgidan iborat bo\'lishi kerak'),
  addressNotes: z.string().optional(),
  city: z.string().min(1, 'Iltimos, shaharni tanlang'),
  date: z.string().min(1, 'Iltimos, sanani tanlang'),
  time: z.string().min(1, 'Iltimos, vaqtni tanlang'),
  frequency: z.enum(['once', 'weekly', 'biweekly', 'monthly']),
  tier: z.enum(['standard', 'premium', 'elite']),
  addonCodes: z.array(z.string()),
  contactName: z.string().min(2, 'Ismingiz kamida 2 ta belgidan iborat bo\'lishi kerak'),
  contactPhone: z
    .string()
    .min(9, 'Telefon raqamini to\'liq kiriting')
    .refine((val) => /^\+?[0-9\s-]{9,15}$/.test(val), {
      message: 'Telefon raqami noto\'g\'ri formatda (masalan: +998 90 123 45 67)',
    }),
  notes: z.string().optional(),
})

export type BookingFormValues = z.infer<typeof bookingFormSchema>

export const loginSchema = z.object({
  email: z.string().email('Noto\'g\'ri email formati'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Ismingiz kamida 2 ta belgidan iborat bo\'lishi kerak'),
  phone: z
    .string()
    .min(9, 'Telefon raqamingizni to\'liq kiriting')
    .refine((val) => /^\+?[0-9\s-]{9,15}$/.test(val), {
      message: 'Telefon raqami noto\'g\'ri formatda (masalan: +998 90 123 45 67)',
    }),
  email: z.string().email('Noto\'g\'ri email formati'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
