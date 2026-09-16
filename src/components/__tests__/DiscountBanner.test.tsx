import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DiscountBanner from '../DiscountBanner'

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

vi.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'discountBanner.pre': 'Yangi mijozlar uchun birinchi buyurtmaga',
        'discountBanner.percent': '10% chegirma!',
        'discountBanner.mid': 'Promokod:',
        'discountBanner.code': 'FIRST10',
        'discountBanner.post': '',
        'discountBanner.cta': 'Band qilish',
      }
      return translations[key] || key
    },
  }),
}))

describe('DiscountBanner Component', () => {
  it('renders discount text and call to action button correctly', () => {
    render(<DiscountBanner />)
    expect(screen.getByText('10% chegirma!')).toBeInTheDocument()
    expect(screen.getByText('Band qilish')).toBeInTheDocument()
  })
})
