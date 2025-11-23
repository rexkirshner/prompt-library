import { render, screen } from '@testing-library/react'
import Page from '../page'

describe('Home Page', () => {
  it('renders successfully', () => {
    render(<Page />)

    // The Next.js default page includes "To get started"
    const element = screen.getByText(/To get started/i)
    expect(element).toBeInTheDocument()
  })

  it('contains Next.js logo', () => {
    render(<Page />)

    const logo = screen.getByAltText(/Next.js logo/i)
    expect(logo).toBeInTheDocument()
  })

  it('contains call-to-action links', () => {
    render(<Page />)

    const deployLink = screen.getByText(/Deploy Now/i)
    const docsLink = screen.getByText(/Documentation/i)

    expect(deployLink).toBeInTheDocument()
    expect(docsLink).toBeInTheDocument()
  })
})
