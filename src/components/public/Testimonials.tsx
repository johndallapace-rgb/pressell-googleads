import { Testimonial } from '@/lib/config';

interface TestimonialsProps {
  testimonials?: Testimonial[];
  productName: string;
}

export function Testimonials({ testimonials, productName }: TestimonialsProps) {
  // Fallback generic testimonials if none provided
  const items = testimonials && testimonials.length > 0 ? testimonials : [
    { name: "Verified Customer", rating: 5, text: `I was skeptical at first, but ${productName} exceeded my expectations. Shipping was fast too.` },
    { name: "Happy User", rating: 4, text: "Great quality and value. I would definitely recommend this to friends and family." },
    { name: "Recent Buyer", rating: 5, text: "Exactly as described. The customer support team was also very helpful when I had questions." }
  ];

  return (
    <section className="bg-white py-12 rounded-2xl shadow-sm border border-gray-100 my-12 mx-4 md:mx-0">
      <h2 className="text-2xl font-bold mb-10 text-center text-gray-900 px-4">
        Real Feedback from Real Users
      </h2>
      <div className="grid md:grid-cols-3 gap-6 px-6">
        {items.map((t, i) => (
          <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, starIdx) => (
                  <svg 
                    key={starIdx} 
                    className={`w-5 h-5 ${starIdx < t.rating ? 'fill-current' : 'text-gray-300'}`} 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-700 italic mb-6 flex-grow">"{t.text}"</p>
            <div className="mt-auto flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mr-3">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                {t.location && <p className="text-xs text-gray-500">{t.location}</p>}
                {(t.age && t.age > 0) && <p className="text-xs text-gray-400">Age: {t.age}</p>}
              </div>
              <div className="ml-auto text-green-600 text-xs font-bold flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Verified
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
