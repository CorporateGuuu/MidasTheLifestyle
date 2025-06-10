// Replace this:
// process.env.SNYK_TOKEN or context.SNYK_TOKEN

// With this:
const snykToken = process.env.SNYK_TOKEN || '';
// Or with proper null checking:
const snykToken = (process.env.SNYK_TOKEN !== undefined) ? process.env.SNYK_TOKEN : '';