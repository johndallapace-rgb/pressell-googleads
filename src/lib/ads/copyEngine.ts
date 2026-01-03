import { LOCALIZED_INTENTS } from './i18nIntents';

export const COPY_TEMPLATES = {
  health: {
    headlines: {
      en: [
        // Brand + Authority
        "{ProductName} Review",
        "Official {ProductName}",
        "Is {ProductName} Legit?",
        "Honest Review 2024",
        "See User Results",
        
        // Benefit / Support (Compliance Safe)
        "Supports Your Goals",
        "Natural Ingredients",
        "How It Works",
        "Benefits Explained",
        "Safety & Side Effects",

        // Commercial / Urgency
        "Best Price Online",
        "Save on {ProductName}",
        "Order Official Pack",
        "60-Day Guarantee",
        "Check Availability"
      ],
      pt: [
        "Resenha {ProductName}",
        "Site Oficial {ProductName}",
        "{ProductName} Funciona?",
        "Análise Sincera 2024",
        "Veja Resultados",
        "Suporte Natural",
        "Ingredientes Reais",
        "Como Funciona",
        "Benefícios Reais",
        "Segurança e Uso",
        "Melhor Preço Hoje",
        "Desconto {ProductName}",
        "Peça o Original",
        "Garantia 60 Dias",
        "Verificar Estoque"
      ],
      // Add other languages similarly (ES, FR, IT, DE)... 
      // For brevity, using EN structure for others in full implementation
      es: [
        "Reseña {ProductName}", "Sitio Oficial", "¿{ProductName} Funciona?", "Análisis 2024", "Ver Resultados",
        "Apoyo Natural", "Ingredientes", "Cómo Funciona", "Beneficios", "Seguridad",
        "Mejor Precio", "Ahorra Hoy", "Pide el Original", "Garantía 60 Días", "Ver Disponibilidad"
      ],
      fr: [
        "Avis {ProductName}", "Site Officiel", "{ProductName} Fiable ?", "Test Complet 2024", "Voir Résultats",
        "Soutien Naturel", "Ingrédients", "Fonctionnement", "Bienfaits", "Sécurité",
        "Meilleur Prix", "Économisez", "Commander", "Garantie 60 Jours", "Voir Stock"
      ],
      it: [
        "Recensione {ProductName}", "Sito Ufficiale", "{ProductName} Funziona?", "Analisi 2024", "Vedi Risultati",
        "Supporto Naturale", "Ingredienti", "Come Funziona", "Benefici", "Sicurezza",
        "Miglior Prezzo", "Sconto Attivo", "Ordina Ora", "Garanzia 60 Giorni", "Verifica Disponibilità"
      ],
      de: [
        "{ProductName} Test", "Offizielle Seite", "Wirkt {ProductName}?", "Erfahrung 2024", "Ergebnisse",
        "Natürliche Hilfe", "Inhaltsstoffe", "Wirkungsweise", "Vorteile", "Sicherheit",
        "Bester Preis", "Sparen Sie", "Hier Bestellen", "60 Tage Garantie", "Verfügbarkeit"
      ]
    },
    descriptions: {
      en: {
        variantA: [ // Social Proof / Review Focus
          "Read our independent review of {ProductName}. Analysis of ingredients and customer feedback.",
          "Does {ProductName} really work? We investigated the formula and user reports. Read more.",
          "See what real users are saying about {ProductName}. Pros, cons, and final verdict.",
          "Don't buy until you read this. Comprehensive breakdown of benefits and safety."
        ],
        variantB: [ // Official / Direct Focus
          "Get {ProductName} from the official site. Secure checkout and 60-day money-back guarantee.",
          "Best price available online for {ProductName}. Fast shipping and satisfaction guaranteed.",
          "Support your health goals with {ProductName}. Natural ingredients backed by research.",
          "Limited stock warning. Check availability for {ProductName} official packages today."
        ]
      },
      pt: {
        variantA: [
          "Leia nossa análise independente do {ProductName}. Ingredientes e opiniões de clientes.",
          "{ProductName} funciona mesmo? Investigamos a fórmula e relatos de uso. Saiba mais.",
          "Veja o que usuários reais dizem. Prós, contras e veredito final sobre o produto.",
          "Não compre antes de ler. Detalhes completos sobre benefícios e segurança."
        ],
        variantB: [
          "Garanta {ProductName} no site oficial. Compra segura e garantia de 60 dias.",
          "Melhor preço online para {ProductName}. Envio rápido e satisfação garantida.",
          "Apoie sua saúde com {ProductName}. Ingredientes naturais de alta qualidade.",
          "Alerta de estoque limitado. Verifique a disponibilidade dos pacotes oficiais."
        ]
      }
      // Add other languages...
    }
  },
  diy: {
    headlines: {
      en: [
        "{ProductName} Review",
        "Official Download",
        "Is It Worth It?",
        "16,000+ Plans",
        "Step-by-Step Guide",
        "Instant Access",
        "For Beginners & Pros",
        "What's Included?",
        "PDF Projects",
        "Watch Video Guide",
        "Best Value Deal",
        "Lifetime Access",
        "Get Started Today",
        "Money Back Promise",
        "Legit Woodworking"
      ],
      pt: [
        "Resenha {ProductName}",
        "Download Oficial",
        "Vale a Pena?",
        "16.000+ Projetos",
        "Guia Passo a Passo",
        "Acesso Imediato",
        "Iniciantes e Pros",
        "O Que Inclui?",
        "Projetos em PDF",
        "Ver Vídeo Guia",
        "Melhor Oferta",
        "Acesso Vitalício",
        "Comece Hoje",
        "Garantia Total",
        "Marcenaria Real"
      ]
      // Add others...
    },
    descriptions: {
      en: {
        variantA: [
          "Full review of {ProductName} database. Are the plans really that good? We checked.",
          "See examples of projects you can build with {ProductName}. Perfect for all skill levels.",
          "User feedback on {ProductName}. Is it easy to follow? Read our honest opinion.",
          "Don't start your next project without seeing this. detailed breakdown of the plans."
        ],
        variantB: [
          "Download 16,000+ plans with {ProductName}. Instant access to member area.",
          "Get lifetime access to {ProductName} for one low price. 60-day money back guarantee.",
          "Start building today. Clear instructions, material lists, and 3D diagrams included.",
          "Official offer for {ProductName}. Grab your discount and bonuses now."
        ]
      },
      pt: {
        variantA: [
          "Resenha completa do banco de dados {ProductName}. Os planos são bons? Verificamos.",
          "Veja exemplos de projetos que você pode criar. Perfeito para todos os níveis.",
          "Opiniões sobre {ProductName}. É fácil de seguir? Leia nossa análise sincera.",
          "Não comece seu próximo projeto sem ver isso. Detalhes dos planos inclusos."
        ],
        variantB: [
          "Baixe 16.000+ planos com {ProductName}. Acesso imediato à área de membros.",
          "Acesso vitalício ao {ProductName} por um preço baixo. Garantia de 60 dias.",
          "Comece a construir hoje. Instruções claras, listas de materiais e diagramas 3D.",
          "Oferta oficial {ProductName}. Garanta seu desconto e bônus agora."
        ]
      }
    }
  }
};
