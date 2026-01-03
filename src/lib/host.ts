import { VerticalType } from '@/lib/templates';

export function getVerticalFromHost(host: string | null): VerticalType | null {
  if (!host) return null;

  // Normalize host (remove port if exists)
  const domain = host.split(':')[0].toLowerCase();

  // Define subdomain mappings
  if (domain.startsWith('health.')) return 'health';
  if (domain.startsWith('diy.')) return 'diy';
  if (domain.startsWith('pets.')) return 'pets';
  if (domain.startsWith('dating.')) return 'dating';
  if (domain.startsWith('finance.')) return 'finance';

  return null;
}
