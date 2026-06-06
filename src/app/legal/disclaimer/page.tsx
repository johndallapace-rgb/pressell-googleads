import { permanentRedirect } from 'next/navigation';

export default function LegalDisclaimerRedirectPage() {
  permanentRedirect('/disclaimer');
}
