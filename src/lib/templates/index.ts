import { ProductConfig } from '../config';

export type TemplateType = 'editorial' | 'story' | 'comparison';
export type VerticalType = 'health' | 'diy' | 'pets' | 'dating' | 'finance' | 'other';

export interface TemplateDefinition {
  name: string;
  description: string;
  defaultContent: Partial<ProductConfig>;
}

const commonDefaults = {
  cta_text: 'Check Availability',
  faq: [
    { q: 'Is this product safe?', a: 'This product is made with natural ingredients and is generally considered safe. However, always consult with your doctor before starting any new supplement or program.' },
    { q: 'How long does shipping take?', a: 'Orders are typically processed within 24-48 hours and shipping usually takes 3-5 business days within the US.' },
    { q: 'Is there a money-back guarantee?', a: 'Yes, the official website offers a 60-day money-back guarantee if you are not satisfied with your results.' }
  ]
};

export const templates: Record<VerticalType, Record<TemplateType, TemplateDefinition>> = {
  health: {
    editorial: {
      name: 'Health Editorial',
      description: 'Classic health supplement review style with scientific tone.',
      defaultContent: {
        headline: 'New Metabolic Support Formula Trending in 2024',
        subheadline: 'How this natural blend is helping thousands support their health goals.',
        bullets: [
          'Supports healthy metabolism',
          '100% Natural ingredients',
          'Made in FDA-registered facility',
          'No prescription required'
        ],
        ...commonDefaults,
        whatIs: {
          title: 'What Is It?',
          content: [
            '[Product Name] is a revolutionary dietary supplement designed to support metabolic health naturally. Unlike harsh chemicals or restrictive diets, this formula uses a unique blend of nutrients to work with your body\'s natural processes.',
            'Developed after years of research, it targets the root cause of slow metabolism using plant-based ingredients.'
          ]
        },
        howItWorks: {
          title: 'How Does It Work?',
          content: [
            'The science behind [Product Name] is based on recent discoveries about metabolic efficiency. The formula contains specific nutrients that have been shown to support thermogenesis - the way your body burns calories for heat.',
            'By optimizing these natural processes, users often report feeling more energetic and seeing better results from their healthy lifestyle choices.'
          ]
        },
        prosCons: {
          pros: ['Natural Formula', 'Easy to swallow capsules', '60-Day Money Back Guarantee', 'Manufactured in GMP Facility'],
          cons: ['Only available on official website', 'Stock is limited due to high demand']
        }
      }
    },
    story: {
      name: 'Health Story',
      description: 'Narrative-driven approach focusing on a user journey.',
      defaultContent: {
        headline: 'I Was Skeptical About Supplements, Until I Tried This...',
        subheadline: 'My 30-day journey with [Product Name] and what really happened.',
        bullets: ['Personal experience', 'Day-by-day results', 'Honest pros and cons', 'Where to buy safely'],
        ...commonDefaults
      }
    },
    comparison: {
      name: 'Health Comparison',
      description: 'Compares the product against generic alternatives.',
      defaultContent: {
        headline: '[Product Name] vs. Generic Supplements: Which is Better?',
        subheadline: 'A detailed breakdown of ingredients, dosage, and value for money.',
        bullets: ['Ingredient quality check', 'Price per serving', 'Manufacturer reputation', 'User reviews analysis'],
        ...commonDefaults
      }
    }
  },
  diy: {
    editorial: {
      name: 'DIY Editorial',
      description: 'Project-focused review for woodworking, home improvement, etc.',
      defaultContent: {
        headline: 'The Secret Resource Expert Craftsmen Are Using',
        subheadline: 'Access thousands of plans and professional tips instantly.',
        bullets: ['Over 16,000 plans', 'Step-by-step instructions', 'Beginner friendly', 'Lifetime access'],
        ...commonDefaults,
        whatIs: {
          title: 'What Is [Product Name]?',
          content: ['[Product Name] is a comprehensive digital library of woodworking plans and projects. It solves the common problem of "not knowing where to start" by providing detailed blueprints, material lists, and cutting instructions for every project imaginable.']
        }
      }
    },
    story: {
        name: 'DIY Story',
        description: 'Success story of a first-time builder.',
        defaultContent: {
            headline: 'How I Built My Dream Shed in One Weekend (With Zero Experience)',
            subheadline: 'I almost gave up on DIY until I found this simple guide.',
            bullets: ['No expensive tools needed', 'Saved $2000 on contractors', 'Simple instructions', 'Instant download'],
            ...commonDefaults
        }
    },
    comparison: {
        name: 'DIY Comparison',
        description: 'Comparison with other courses or hiring a pro.',
        defaultContent: {
            headline: 'DIY vs. Hiring a Contractor: The Real Cost Breakdown',
            subheadline: 'Why [Product Name] might be the smartest investment for your home.',
            bullets: ['Cost savings analysis', 'Time investment', 'Skill requirements', 'Result quality'],
            ...commonDefaults
        }
    }
  },
  pets: {
    editorial: {
        name: 'Pet Health Editorial',
        description: 'Veterinarian-style review of pet supplements or training.',
        defaultContent: {
            headline: 'Is Your Dog Showing Signs of Aging? Read This.',
            subheadline: 'New canine support formula helps older dogs regain their puppy energy.',
            bullets: ['Vet recommended ingredients', 'Taste dogs love', 'Supports joint health', 'Made in USA'],
            ...commonDefaults
        }
    },
    story: {
        name: 'Pet Story',
        description: 'Owner\'s journey with their pet.',
        defaultContent: {
            headline: 'I Thought My Dog Was Just Getting Old...',
            subheadline: 'But one small change to his diet made all the difference.',
            bullets: ['Real owner story', 'Before and after', 'Simple daily routine', 'Safety facts'],
            ...commonDefaults
        }
    },
    comparison: {
        name: 'Pet Comparison',
        description: 'Comparison of pet solutions.',
        defaultContent: {
            headline: 'Top 5 Dog Joint Supplements of 2024',
            subheadline: 'Why [Product Name] is our top pick for senior dogs.',
            bullets: ['Ingredient purity', 'Cost effectiveness', 'Taste test results', 'Vet approval'],
            ...commonDefaults
        }
    }
  },
  dating: {
    editorial: {
        name: 'Dating Editorial',
        description: 'Relationship advice style review.',
        defaultContent: {
            headline: 'The "Secret Language" of Attraction?',
            subheadline: 'New program claims to help anyone find their soulmate.',
            bullets: ['Psychology-based', 'Works for men and women', 'Instant digital access', 'Risk-free trial'],
            ...commonDefaults
        }
    },
    story: {
        name: 'Dating Story',
        description: 'Personal success story in dating.',
        defaultContent: {
            headline: 'How I Went From "Always Single" to Happily Married',
            subheadline: 'It wasn\'t about looks or money. It was about understanding this one thing.',
            bullets: ['Confidence booster', 'Communication secrets', 'Real results', 'Downloadable guide'],
            ...commonDefaults
        }
    },
    comparison: {
        name: 'Dating Comparison',
        description: 'Comparison of dating apps/guides.',
        defaultContent: {
            headline: 'Dating Apps vs. Relationship Coaching: What Works?',
            subheadline: 'Why swiping might be wasting your time, and what to do instead.',
            bullets: ['Success rates', 'Time commitment', 'Emotional impact', 'Long-term results'],
            ...commonDefaults
        }
    }
  },
  finance: {
    editorial: {
        name: 'Finance Editorial',
        description: 'Investment or money-saving review.',
        defaultContent: {
            headline: 'The Wealth Loophole Wall Street Doesn\'t Want You to Know',
            subheadline: 'How everyday people are protecting their savings.',
            bullets: ['Asset protection', 'Tax advantages', 'Legal strategies', 'Expert guide'],
            ...commonDefaults
        }
    },
    story: {
        name: 'Finance Story',
        description: 'Financial freedom journey.',
        defaultContent: {
            headline: 'How I Retired 10 Years Early',
            subheadline: 'A simple strategy that anyone can follow.',
            bullets: ['Passive income', 'Risk management', 'Step-by-step plan', 'Free resources'],
            ...commonDefaults
        }
    },
    comparison: {
        name: 'Finance Comparison',
        description: 'Comparing investment vehicles.',
        defaultContent: {
            headline: 'Gold vs. Crypto vs. Stocks: Where to Put Your Money?',
            subheadline: 'Analysis of the best performing assets for the coming year.',
            bullets: ['Historical performance', 'Risk analysis', 'Liquidity', 'Growth potential'],
            ...commonDefaults
        }
    }
  },
  other: {
    editorial: {
        name: 'General Editorial',
        description: 'Standard product review.',
        defaultContent: {
            headline: 'Review: Is [Product Name] Worth the Hype?',
            subheadline: 'We tested it for 30 days. Here are our honest results.',
            bullets: ['Feature breakdown', 'User experience', 'Value for money', 'Final verdict'],
            ...commonDefaults
        }
    },
    story: {
        name: 'General Story',
        description: 'General user experience story.',
        defaultContent: {
            headline: 'Why Everyone Is Talking About [Product Name]',
            subheadline: 'The viral sensation that actually lives up to the claims.',
            bullets: ['Viral trend', 'Real user testimonials', 'Unboxing experience', 'Where to get it'],
            ...commonDefaults
        }
    },
    comparison: {
        name: 'General Comparison',
        description: 'General comparison.',
        defaultContent: {
            headline: '[Product Name] vs. The Competition',
            subheadline: 'We compared the top brands so you don\'t have to.',
            bullets: ['Feature comparison', 'Price battle', 'Durability test', 'Winner declared'],
            ...commonDefaults
        }
    }
  }
};

export function getTemplate(vertical: VerticalType, template: TemplateType): TemplateDefinition {
    return templates[vertical]?.[template] || templates.other.editorial;
}
