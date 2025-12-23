import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer - SmartHealthChoices',
};

export default function DisclaimerPage() {
  return (
    <div className="container mx-auto px-4 py-12 prose text-gray-700 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Disclaimer</h1>
      
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg mb-8">
        <p className="font-semibold mb-4">
          This website is an independent informational resource and is not the official website of the product mentioned.
          The information provided is based on publicly available materials, customer experiences, and independent research.
        </p>
        <p className="font-semibold mb-4">
          This site may contain affiliate links. If you choose to purchase through these links, we may earn a commission at no additional cost to you.
          Individual results may vary. This content is not intended to replace professional advice.
        </p>
      </div>

      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">No Professional Advice</h2>
      <p className="mb-4">
        The information contained in or made available through this website (including but not limited to information contained on message boards, in text files, or in chats) cannot replace or substitute for the services of trained professionals in any field, including, but not limited to, financial, medical, psychological, or legal matters.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">No Guarantees</h2>
      <p className="mb-4">
        You agree that no guarantees about any specific results are made by our company. You agree that any statements about the potential results are only expressions of opinion and are not guarantees.
      </p>
    </div>
  );
}
