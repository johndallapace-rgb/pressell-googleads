import { VerticalType } from '@/lib/templates';

export function getVerticalFromHost(host: string | null): VerticalType | null {
  if (!host) return null;

  // Normalize host (remove port if exists)
  const domain = host.split(':')[0].toLowerCase();

  // FORCE VERTICAL IF HOST CONTAINS KEYWORD
  // This is a robust fallback for environments where subdomains are not cleanly passed
  if (domain.includes('health')) return 'health';
  if (domain.includes('diy')) return 'diy';
  if (domain.includes('pets')) return 'pets';
  if (domain.includes('dating')) return 'dating';
  if (domain.includes('finance')) return 'finance';

  // Define subdomain mappings (Standard)
  if (domain.startsWith('health.')) return 'health';
  if (domain.startsWith('diy.')) return 'diy';
  if (domain.startsWith('pets.')) return 'pets';
  if (domain.startsWith('dating.')) return 'dating';
  if (domain.startsWith('finance.')) return 'finance';

  return null;
}
