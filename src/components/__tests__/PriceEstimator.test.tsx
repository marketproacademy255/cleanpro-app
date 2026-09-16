import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PriceEstimator from '../PriceEstimator'

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/publicData', () => ({
  fetchActiveServiceTypes: vi.fn().mockResolvedValue([
    {
      id: 'test-1',
      code: 'std',
      name_uz: 'Standart tozalash',
      name_en: 'Standard Cleaning',
      name_ru: 'Стандартная уборка',
      pricing_unit: 'per_room',
      base_price: 150000,
      extra_unit_price: 40000,
      min_price: 150000,
      multiplier: 1,
      is_active: true,
      category: 'cleaning',
    },
  ]),
}))

vi.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'priceEstimator.title': 'Taxminiy narx',
        'priceEstimator.desc': 'Xizmat turi va o\'lchamni tanlang',
        'priceEstimator.serviceType': 'Xizmat turi',
        'priceEstimator.rooms': 'Xonalar soni',
        'priceEstimator.estimateLabel': 'Taxminiy narx (standart tarif)',
        'priceEstimator.continue': 'Band qilishni davom ettirish',
      }
      return map[key] || key
    },
    lang: 'uz',
  }),
}))

describe('PriceEstimator Component', () => {
  it('renders estimator title and calculates initial price', async () => {
    render(<PriceEstimator />)
    expect(await screen.findByText('Taxminiy narx')).toBeInTheDocument()
    expect(screen.getByText('Band qilishni davom ettirish')).toBeInTheDocument()
  })

  it('updates estimated price when room count changes', async () => {
    render(<PriceEstimator />)
    const roomInput = await screen.findByRole('spinbutton')
    fireEvent.change(roomInput, { target: { value: '3' } })
    expect(roomInput).toHaveValue(3)
  })
})
