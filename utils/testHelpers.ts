// Returns a unique email address for tests using timestamp + optional prefix
// Includes a small random suffix to reduce collision risk when tests run in parallel
export function makeUniqueEmail(prefix = 'update'): string {
    const random = Math.floor(Math.random() * 1_000_000); // 6-digit random number
    return `${prefix}_${Date.now()}_${random}@example.com`;
}
