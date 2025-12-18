/**
 * Tests for Breadcrumbs component
 *
 * Validates breadcrumb rendering, navigation, accessibility, and structured data.
 */

import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '../Breadcrumbs'

// Mock the JsonLd component
jest.mock('../JsonLd', () => ({
  JsonLd: ({ data }: { data: unknown }) => (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      data-testid="json-ld"
    />
  ),
}))

// Mock the JSON-LD generator
jest.mock('@/lib/seo/json-ld', () => ({
  generateBreadcrumbSchema: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
}))

describe('Breadcrumbs', () => {
  const mockItems = [
    { name: 'Home', url: 'https://test.com' },
    { name: 'Category', url: 'https://test.com/category' },
    { name: 'Item', url: 'https://test.com/category/item' },
  ]

  describe('Rendering', () => {
    it('renders all breadcrumb items', () => {
      render(<Breadcrumbs items={mockItems} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Item')).toBeInTheDocument()
    })

    it('renders separators between items', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />)

      // Should have 2 separators for 3 items
      const separators = container.querySelectorAll('[aria-hidden="true"]')
      expect(separators).toHaveLength(2)
      separators.forEach((sep) => {
        expect(sep.textContent).toBe('/')
      })
    })

    it('applies custom className', () => {
      const { container } = render(
        <Breadcrumbs items={mockItems} className="custom-class" />
      )

      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('custom-class')
    })
  })

  describe('Navigation', () => {
    it('renders links for non-last items', () => {
      render(<Breadcrumbs items={mockItems} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toHaveAttribute('href', '/')

      const categoryLink = screen.getByRole('link', { name: 'Category' })
      expect(categoryLink).toHaveAttribute('href', '/category')
    })

    it('does not render link for last item', () => {
      render(<Breadcrumbs items={mockItems} />)

      const lastItem = screen.getByText('Item')
      expect(lastItem.tagName).toBe('SPAN')
      expect(lastItem).toHaveAttribute('aria-current', 'page')
    })

    it('uses custom href when provided', () => {
      const itemsWithCustomHref = [
        { name: 'Home', url: 'https://test.com', href: '/custom' },
        { name: 'Item', url: 'https://test.com/item' },
      ]

      render(<Breadcrumbs items={itemsWithCustomHref} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toHaveAttribute('href', '/custom')
    })

    it('extracts path from URL when href not provided', () => {
      render(<Breadcrumbs items={mockItems} />)

      const categoryLink = screen.getByRole('link', { name: 'Category' })
      expect(categoryLink).toHaveAttribute('href', '/category')
    })
  })

  describe('Accessibility', () => {
    it('has breadcrumb navigation landmark', () => {
      render(<Breadcrumbs items={mockItems} />)

      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
      expect(nav).toBeInTheDocument()
    })

    it('marks current page with aria-current', () => {
      render(<Breadcrumbs items={mockItems} />)

      const currentPage = screen.getByText('Item')
      expect(currentPage).toHaveAttribute('aria-current', 'page')
    })

    it('hides separators from screen readers', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />)

      const separators = container.querySelectorAll('[aria-hidden="true"]')
      separators.forEach((sep) => {
        expect(sep).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('uses ordered list for breadcrumbs', () => {
      render(<Breadcrumbs items={mockItems} />)

      const list = screen.getByRole('list')
      expect(list.tagName).toBe('OL')
    })
  })

  describe('Structured Data', () => {
    it('includes JSON-LD script tag', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />)

      const script = container.querySelector('[data-testid="json-ld"]')
      expect(script).toBeInTheDocument()
      expect(script?.getAttribute('type')).toBe('application/ld+json')
    })

    it('generates valid breadcrumb schema', () => {
      const { container } = render(<Breadcrumbs items={mockItems} />)

      const script = container.querySelector('[data-testid="json-ld"]')
      const jsonLd = JSON.parse(script?.innerHTML || '{}')

      expect(jsonLd['@context']).toBe('https://schema.org')
      expect(jsonLd['@type']).toBe('BreadcrumbList')
      expect(jsonLd.itemListElement).toHaveLength(3)

      // Verify each breadcrumb item
      jsonLd.itemListElement.forEach(
        (item: { position: number; name: string; item: string }, index: number) => {
          expect(item.position).toBe(index + 1)
          expect(item.name).toBe(mockItems[index].name)
          expect(item.item).toBe(mockItems[index].url)
        }
      )
    })
  })

  describe('Edge Cases', () => {
    it('handles single breadcrumb item', () => {
      const singleItem = [{ name: 'Home', url: 'https://test.com' }]

      render(<Breadcrumbs items={singleItem} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page')

      // No separators for single item
      const { container } = render(<Breadcrumbs items={singleItem} />)
      const separators = container.querySelectorAll('[aria-hidden="true"]')
      expect(separators).toHaveLength(0)
    })

    it('handles long breadcrumb trails', () => {
      const longTrail = [
        { name: 'Home', url: 'https://test.com' },
        { name: 'Level 1', url: 'https://test.com/level1' },
        { name: 'Level 2', url: 'https://test.com/level1/level2' },
        { name: 'Level 3', url: 'https://test.com/level1/level2/level3' },
        { name: 'Level 4', url: 'https://test.com/level1/level2/level3/level4' },
      ]

      render(<Breadcrumbs items={longTrail} />)

      // All items should render
      longTrail.forEach((item) => {
        expect(screen.getByText(item.name)).toBeInTheDocument()
      })

      // Should have 4 separators for 5 items
      const { container } = render(<Breadcrumbs items={longTrail} />)
      const separators = container.querySelectorAll('[aria-hidden="true"]')
      expect(separators).toHaveLength(4)
    })
  })

  describe('Styling', () => {
    it('applies correct classes to current page', () => {
      render(<Breadcrumbs items={mockItems} />)

      const currentPage = screen.getByText('Item')
      expect(currentPage).toHaveClass('font-medium')
      expect(currentPage).toHaveClass('text-gray-900')
    })

    it('applies hover classes to links', () => {
      render(<Breadcrumbs items={mockItems} />)

      const link = screen.getByRole('link', { name: 'Home' })
      expect(link).toHaveClass('hover:text-blue-600')
      expect(link).toHaveClass('transition-colors')
    })
  })
})
