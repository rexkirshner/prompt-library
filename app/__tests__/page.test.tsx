import { render, screen } from '@testing-library/react'
import Page from '../page'

describe('Home Page', () => {
  it('renders the page title', () => {
    render(<Page />)

    const heading = screen.getByRole('heading', { name: /AI Prompts Library/i })
    expect(heading).toBeInTheDocument()
  })

  it('displays the tagline', () => {
    render(<Page />)

    const tagline = screen.getByText(/A curated collection of high-quality AI prompts/i)
    expect(tagline).toBeInTheDocument()
  })

  it('shows current phase status', () => {
    render(<Page />)

    const status = screen.getByText(/Phase 0 - Foundation/i)
    expect(status).toBeInTheDocument()
  })

  it('displays status description', () => {
    render(<Page />)

    const description = screen.getByText(/Building the infrastructure/i)
    expect(description).toBeInTheDocument()
  })
})
