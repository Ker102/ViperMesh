# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

The ViperMesh team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### Please DO NOT report security vulnerabilities through public GitHub issues.

Instead, please report security vulnerabilities by using GitHub's Security Advisory feature:

1. Go to the [Security Advisories page](https://github.com/Ker102/ViperMesh/security/advisories)
2. Click "Report a vulnerability"
3. Fill in the details of the vulnerability

Alternatively, you can email the maintainers directly with the details.

### What to Include in Your Report

To help us better understand the nature and scope of the possible issue, please include as much of the following information as possible:

* Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Response Timeline

* **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours.
* **Status Updates**: We will send you regular updates about our progress, at least every 5 business days.
* **Disclosure**: Once the vulnerability is fixed, we will work with you to coordinate public disclosure.

## What to Expect

* We will confirm the vulnerability and determine its impact
* We will release a patch as soon as possible, depending on the complexity
* We will credit you in the security advisory (unless you prefer to remain anonymous)

## Preferred Languages

We prefer all communications to be in English.

## Security Best Practices for Users

When using ViperMesh, please follow these security best practices:

* **Never commit secrets**: Do not commit API keys, passwords, or other sensitive data to your repository
* **Use environment variables**: Store all sensitive configuration in environment variables
* **Keep dependencies updated**: Regularly update your dependencies to get security patches
* **Review permissions**: Only grant necessary permissions to third-party integrations
* **Use strong passwords**: Ensure your authentication credentials are strong and unique
* **Enable 2FA**: Enable two-factor authentication on your GitHub account
* **Validate input**: Always validate and sanitize user input in your own implementations

## Security Features

ViperMesh implements several security measures:

* Password hashing using bcryptjs with appropriate salt rounds
* CSRF protection via NextAuth.js
* SQL injection prevention through Prisma ORM
* Stripe webhook signature verification
* Protected API routes with authentication middleware
* Environment variable isolation

## Dependency Security

We use:

* **Dependabot**: Automated dependency updates and security alerts
* **CodeQL**: Automated code scanning for security vulnerabilities
* **npm audit**: Regular security audits of npm packages

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed. We will:

1. Release a patch version with the fix
2. Publish a security advisory on GitHub
3. Update this security policy if necessary
4. Notify users through our communication channels

## Recognition

We believe in recognizing security researchers who help keep our project secure. With your permission, we will:

* Credit you in the security advisory
* List you in our SECURITY.md acknowledgments section
* Include you in release notes for the fix

Thank you for helping keep ViperMesh and our users safe!
