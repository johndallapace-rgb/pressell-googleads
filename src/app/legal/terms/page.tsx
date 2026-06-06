import { permanentRedirect } from 'next/navigation';

export default function LegalTermsRedirectPage() {
  permanentRedirect('/terms-of-service');
}
