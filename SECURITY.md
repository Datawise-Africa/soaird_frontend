# Datawise Frontend - Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public issue
2. Email the security team at: security@datawise-africa.com
3. Include detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies based on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: 90+ days

## Security Best Practices

When contributing or deploying:

1. **Environment Variables**: Never commit `.env` files
2. **Dependencies**: Keep dependencies up to date
3. **Authentication**: Use secure authentication mechanisms
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: Validate and sanitize all user inputs
6. **Error Handling**: Don't expose sensitive information in error messages

## Security Features

This project includes:

- Error boundaries to prevent information leakage
- API client with request/response interceptors
- Environment variable validation
- Dependency scanning in CI/CD pipeline
- CodeQL security analysis
- Regular dependency updates

## Acknowledgments

We appreciate the security research community and will acknowledge contributors who report vulnerabilities (with their permission).
