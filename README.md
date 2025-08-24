# E‑Invoicing Compliance Tracker

A comprehensive web application for tracking global e‑invoicing compliance mandates, designed for compliance teams and tax professionals.

## Features

### 🌍 Global Coverage
- **200+ Countries**: Complete coverage of global e-invoicing implementations
- **Real-time Updates**: Automated data refresh and verification
- **Multi-channel Tracking**: B2G, B2B, and B2C invoice requirements

### 🔍 Advanced Filtering & Search
- **Smart Search**: Intelligent country and regulation search
- **Multi-criteria Filters**: Filter by continent, status, implementation date
- **Export Capabilities**: Excel export with comprehensive data sheets

### 📊 Rich Data Visualization
- **Status Indicators**: Visual compliance status with color coding
- **Timeline Views**: Implementation timeline with key milestones
- **News Integration**: Latest regulatory updates and changes

### ♿ Accessibility & Performance
- **WCAG 2.2 Level AA**: Full accessibility compliance
- **Performance Optimized**: Fast loading with code splitting
- **Mobile Responsive**: Works seamlessly across all devices

### 🔒 Security & Reliability
- **XSS Protection**: Comprehensive input sanitization
- **Rate Limiting**: Built-in protection against abuse
- **Error Reporting**: Advanced logging and error tracking
- **Data Integrity**: Automated validation and verification

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd einvoicing-compliance-tracker
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Start API Server** (Optional - for data updates)
   ```bash
   npm run api
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run api` | Start local API server for data updates |
| `npm run refresh` | Refresh specification data |
| `npm run refresh:web` | Update data from web sources |

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Sage Carbon Design System
- **State Management**: Zustand
- **Testing**: Vitest + Testing Library
- **Styling**: CSS-in-JS with accessibility features
- **Build**: Vite with optimized chunking

### Project Structure
```
src/
├── components/           # React components
│   ├── CountryDetail/   # Country detail modal
│   ├── CountryTable/    # Main data table
│   ├── Filters/         # Search and filter components
│   └── common/          # Shared UI components
├── config/              # Configuration constants
├── data/                # Static data files
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization
├── store/               # State management
├── styles/              # Global styles and themes
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   ├── accessibility.ts # Accessibility helpers
│   ├── logger.ts        # Logging system
│   ├── performance.ts   # Performance monitoring
│   └── security.ts      # Security utilities
└── test/                # Test configuration
```

## Data Model

### Country Structure
```typescript
interface Country {
  id: string;
  name: string;
  isoCode2: string;
  isoCode3: string;
  continent: string;
  region?: string;
  eInvoicing: {
    b2g: InvoiceChannel;
    b2b: InvoiceChannel;
    b2c: InvoiceChannel;
    lastUpdated: string;
  };
}

interface InvoiceChannel {
  status: 'mandated' | 'permitted' | 'planned' | 'none';
  implementationDate: string | null;
  formats: Format[];
  legislation: Legislation | null;
}
```

## Security Features

### Input Validation
- HTML sanitization using DOMPurify
- XSS prevention on all user inputs
- URL validation for external links
- File upload restrictions

### Rate Limiting
- API endpoint protection
- Export functionality limits
- Search query throttling

### Content Security Policy
- Restrictive CSP headers
- Script and style source controls
- Frame-ancestors protection

## Accessibility Features

### WCAG 2.2 Level AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and live regions
- **Focus Management**: Proper focus trapping and restoration
- **Color Contrast**: Meets AA contrast requirements
- **Responsive Design**: Mobile and desktop optimized

### Accessibility Tools
- Skip navigation links
- High contrast mode support
- Reduced motion preferences
- Screen reader announcements
- Focus indicators

## Performance Optimizations

### Code Splitting
- Route-based splitting
- Component lazy loading
- Vendor chunk separation
- Dynamic imports for heavy libraries

### Caching Strategy
- Browser caching headers
- Service worker integration
- LocalStorage for preferences
- SessionStorage for temporary data

### Monitoring
- Web Vitals tracking
- Custom performance metrics
- Memory usage monitoring
- Network request timing

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint + Prettier configuration
- Semantic component naming
- Consistent file structure

### Testing Strategy
- Unit tests for utilities
- Component testing with Testing Library
- Integration tests for user flows
- Accessibility testing

### Git Workflow
- Feature branch development
- Pull request reviews
- Automated testing on CI
- Semantic versioning

## Deployment

### Build Optimization
```bash
npm run build
```

This creates an optimized production build with:
- Minified JavaScript and CSS
- Asset optimization and compression
- Source maps for debugging
- Proper cache headers

### Environment Variables
- `NODE_ENV`: Development/production mode
- `VITE_APP_VERSION`: Application version
- `VITE_BUILD_DATE`: Build timestamp

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## Contributing

1. **Fork the Repository**
2. **Create Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Follow Code Style** (run `npm run lint`)
4. **Add Tests** for new functionality
5. **Update Documentation** as needed
6. **Commit Changes** (`git commit -m 'Add amazing feature'`)
7. **Push to Branch** (`git push origin feature/amazing-feature`)
8. **Open Pull Request**

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test

# Start development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Common Issues

**Port 5173 already in use**
```bash
npm run dev -- --port 3000
```

**API connection issues**
- Ensure API server is running: `npm run api`
- Check firewall settings for localhost:4321

**Build failures**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

### Performance Issues
- Enable React DevTools Profiler
- Check Network tab for slow resources
- Monitor memory usage in DevTools

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

### Third-Party Licenses
Third-party licenses are documented in `THIRD-PARTY-NOTICES.md`. When redistributing, include both files and preserve license headers in built artifacts.

## Support

For issues and questions:
1. Check existing [Issues](../../issues)
2. Create new issue with detailed description
3. Include environment details and steps to reproduce

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Version**: 1.0.0  
**Last Updated**: August 2025  
**Maintainer**: Sage Software Development Team


