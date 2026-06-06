import { permanentRedirect } from 'next/navigation';

export default function LegalPrivacyRedirectPage() {
  permanentRedirect('/privacy-policy');
}
