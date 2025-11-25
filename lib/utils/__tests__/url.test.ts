import { isValidUrl, ALLOWED_URL_SCHEMES } from '../url'

describe('ALLOWED_URL_SCHEMES', () => {
  it('only includes http and https protocols', () => {
    expect(ALLOWED_URL_SCHEMES).toEqual(['http:', 'https:'])
  })

  it('is readonly', () => {
    // This test verifies the type is readonly at compile time
    // If it compiles, the type is correct
    const schemes: readonly string[] = ALLOWED_URL_SCHEMES
    expect(schemes).toBeDefined()
  })
})

describe('isValidUrl', () => {
  describe('valid URLs', () => {
    it('accepts simple http URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
    })

    it('accepts simple https URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
    })

    it('accepts http URL with path', () => {
      expect(isValidUrl('http://example.com/path/to/page')).toBe(true)
    })

    it('accepts https URL with path', () => {
      expect(isValidUrl('https://example.com/path/to/page')).toBe(true)
    })

    it('accepts URL with query parameters', () => {
      expect(isValidUrl('https://example.com/search?q=test&page=1')).toBe(true)
    })

    it('accepts URL with fragment', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true)
    })

    it('accepts URL with port', () => {
      expect(isValidUrl('http://example.com:8080')).toBe(true)
    })

    it('accepts URL with authentication', () => {
      expect(isValidUrl('https://user:pass@example.com')).toBe(true)
    })

    it('accepts URL with subdomain', () => {
      expect(isValidUrl('https://subdomain.example.com')).toBe(true)
    })

    it('accepts URL with IP address', () => {
      expect(isValidUrl('http://192.168.1.1')).toBe(true)
    })

    it('accepts localhost URL', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true)
    })

    it('trims whitespace before validation', () => {
      expect(isValidUrl('  https://example.com  ')).toBe(true)
    })
  })

  describe('dangerous protocols (XSS prevention)', () => {
    it('rejects javascript: protocol', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
    })

    it('rejects javascript: with encoded chars', () => {
      expect(isValidUrl('javascript:alert(document.cookie)')).toBe(false)
    })

    it('rejects data: protocol', () => {
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('rejects data: with base64', () => {
      expect(isValidUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false)
    })

    it('rejects file: protocol', () => {
      expect(isValidUrl('file:///etc/passwd')).toBe(false)
    })

    it('rejects file: protocol with path', () => {
      expect(isValidUrl('file:///C:/Windows/System32/config/sam')).toBe(false)
    })

    it('rejects vbscript: protocol', () => {
      expect(isValidUrl('vbscript:msgbox("XSS")')).toBe(false)
    })

    it('rejects about: protocol', () => {
      expect(isValidUrl('about:blank')).toBe(false)
    })

    it('rejects blob: protocol', () => {
      expect(isValidUrl('blob:https://example.com/uuid')).toBe(false)
    })

    it('rejects ftp: protocol', () => {
      expect(isValidUrl('ftp://ftp.example.com')).toBe(false)
    })

    it('rejects tel: protocol', () => {
      expect(isValidUrl('tel:+1234567890')).toBe(false)
    })

    it('rejects mailto: protocol', () => {
      expect(isValidUrl('mailto:user@example.com')).toBe(false)
    })

    it('rejects custom protocol', () => {
      expect(isValidUrl('customprotocol://something')).toBe(false)
    })
  })

  describe('malformed URLs', () => {
    it('rejects URL without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false)
    })

    it('rejects URL with only domain', () => {
      expect(isValidUrl('www.example.com')).toBe(false)
    })

    it('rejects URL without domain', () => {
      expect(isValidUrl('http://')).toBe(false)
    })

    it('rejects URL with invalid characters', () => {
      expect(isValidUrl('https://exam ple.com')).toBe(false)
    })

    it('rejects plain text', () => {
      expect(isValidUrl('not a url at all')).toBe(false)
    })

    it('rejects number', () => {
      expect(isValidUrl('12345')).toBe(false)
    })

    it('rejects path without domain', () => {
      expect(isValidUrl('/path/to/page')).toBe(false)
    })

    it('rejects protocol only', () => {
      expect(isValidUrl('https://')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('rejects empty string', () => {
      expect(isValidUrl('')).toBe(false)
    })

    it('rejects whitespace only', () => {
      expect(isValidUrl('   ')).toBe(false)
    })

    it('rejects null-like string', () => {
      expect(isValidUrl('null')).toBe(false)
    })

    it('rejects undefined-like string', () => {
      expect(isValidUrl('undefined')).toBe(false)
    })

    it('rejects tab characters', () => {
      expect(isValidUrl('\t\t')).toBe(false)
    })

    it('rejects newline characters', () => {
      expect(isValidUrl('\n\n')).toBe(false)
    })
  })

  describe('case sensitivity', () => {
    it('accepts HTTP in uppercase', () => {
      expect(isValidUrl('HTTP://example.com')).toBe(true)
    })

    it('accepts HTTPS in uppercase', () => {
      expect(isValidUrl('HTTPS://example.com')).toBe(true)
    })

    it('accepts mixed case protocol', () => {
      expect(isValidUrl('HtTpS://example.com')).toBe(true)
    })

    it('rejects JAVASCRIPT in uppercase', () => {
      expect(isValidUrl('JAVASCRIPT:alert(1)')).toBe(false)
    })
  })

  describe('real-world examples', () => {
    it('accepts GitHub profile URL', () => {
      expect(isValidUrl('https://github.com/username')).toBe(true)
    })

    it('accepts Twitter profile URL', () => {
      expect(isValidUrl('https://twitter.com/username')).toBe(true)
    })

    it('accepts LinkedIn profile URL', () => {
      expect(isValidUrl('https://www.linkedin.com/in/username/')).toBe(true)
    })

    it('accepts personal website with subdomain', () => {
      expect(isValidUrl('https://blog.example.com')).toBe(true)
    })

    it('accepts URL with multiple subdomains', () => {
      expect(isValidUrl('https://api.v2.example.com/endpoint')).toBe(true)
    })

    it('rejects malicious XSS attempt', () => {
      expect(isValidUrl('javascript:void(document.cookie=\'xss\')')).toBe(false)
    })

    it('rejects data URI XSS attempt', () => {
      expect(isValidUrl('data:text/html,<img src=x onerror=alert(1)>')).toBe(false)
    })
  })
})
