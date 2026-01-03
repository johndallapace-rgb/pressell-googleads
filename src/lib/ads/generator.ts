import { ProductConfig } from '@/lib/config';

interface AdCampaign {
  product: string;
  language: string;
  campaignName: string;
  adGroups: AdGroup[];
}

interface AdGroup {
  name: string;
  keywords: string[]; // exact and phrase matches
  negatives: string[];
  ads: RSA[];
}

interface RSA {
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  path1?: string;
  path2?: string;
}

const TEMPLATES = {
  health: {
    headlines: {
      en: [
        "{ProductName} Review", "Does {ProductName} Work?", "Official {ProductName} Site", 
        "Honest {ProductName} Review", "Is {ProductName} Legit?", "Get {ProductName} Today",
        "Save on {ProductName}", "Best Price Online", "Natural Ingredients", 
        "60-Day Guarantee", "Read Before Buying", "Customer Results",
        "How {ProductName} Works", "Order {ProductName} Now", "Limited Stock Alert"
      ],
      pt: [
        "Resenha {ProductName}", "{ProductName} Funciona?", "Site Oficial {ProductName}",
        "Análise {ProductName}", "{ProductName} é Confiável?", "Compre {ProductName} Hoje",
        "Desconto {ProductName}", "Melhor Preço Online", "Ingredientes Naturais",
        "Garantia de 60 Dias", "Leia Antes de Comprar", "Resultados Reais",
        "Como {ProductName} Age", "Peça {ProductName} Agora", "Estoque Limitado"
      ],
      es: [
        "Reseña {ProductName}", "¿{ProductName} Funciona?", "Sitio Oficial {ProductName}",
        "Opinión {ProductName}", "¿Es {ProductName} Legítimo?", "Compra {ProductName} Hoy",
        "Ahorra en {ProductName}", "Mejor Precio Online", "Ingredientes Naturales",
        "Garantía de 60 Días", "Lee Antes de Comprar", "Resultados Reales",
        "Cómo Funciona {ProductName}", "Pide {ProductName} Ahora", "Stock Limitado"
      ],
      fr: [
        "Avis {ProductName}", "{ProductName} Marche-t-il?", "Site Officiel {ProductName}",
        "Test {ProductName}", "{ProductName} est-il Fiable?", "Achetez {ProductName}",
        "Promo {ProductName}", "Meilleur Prix", "Ingrédients Naturels",
        "Garantie 60 Jours", "Lire Avant d'Acheter", "Résultats Clients",
        "Fonctionnement {ProductName}", "Commandez {ProductName}", "Stock Limité"
      ],
      it: [
        "Recensione {ProductName}", "{ProductName} Funziona?", "Sito Ufficiale {ProductName}",
        "Opinioni {ProductName}", "{ProductName} è Sicuro?", "Compra {ProductName} Oggi",
        "Sconto {ProductName}", "Miglior Prezzo", "Ingredienti Naturali",
        "Garanzia 60 Giorni", "Leggi Prima di Comprare", "Risultati Reali",
        "Come Funziona {ProductName}", "Ordina {ProductName}", "Scorte Limitate"
      ],
      de: [
        "{ProductName} Erfahrungen", "Wirkt {ProductName}?", "{ProductName} Offizielle Seite",
        "{ProductName} Test", "Ist {ProductName} Seriös?", "{ProductName} Kaufen",
        "Sparen bei {ProductName}", "Bester Preis Online", "Natürliche Inhaltsstoffe",
        "60 Tage Garantie", "Erst Lesen Dann Kaufen", "Kunden Ergebnisse",
        "Wie {ProductName} Wirkt", "{ProductName} Bestellen", "Begrenzter Vorrat"
      ]
    },
    descriptions: {
      en: [
        "Discover the truth about {ProductName}. Independent review covering ingredients, benefits, and side effects.",
        "Don't buy {ProductName} until you read this. We analyzed user feedback and clinical data.",
        "Looking for {ProductName}? Get the best deal and learn how it supports your health goals today.",
        "Official breakdown of {ProductName}. 60-day money back guarantee. Fast shipping available."
      ],
      pt: [
        "Descubra a verdade sobre {ProductName}. Resenha independente cobrindo ingredientes e benefícios.",
        "Não compre {ProductName} sem ler isto. Analisamos feedback de usuários e dados clínicos.",
        "Procurando {ProductName}? Garanta o melhor preço e saiba como ele ajuda sua saúde hoje.",
        "Análise oficial do {ProductName}. Garantia de 60 dias. Envio rápido disponível."
      ],
      es: [
        "Descubre la verdad sobre {ProductName}. Reseña independiente sobre ingredientes y beneficios.",
        "No compres {ProductName} hasta leer esto. Analizamos opiniones de usuarios y datos clínicos.",
        "¿Buscas {ProductName}? Obtén el mejor precio y aprende cómo apoya tu salud hoy.",
        "Análisis oficial de {ProductName}. Garantía de devolución de 60 días. Envío rápido."
      ],
      fr: [
        "Découvrez la vérité sur {ProductName}. Avis indépendant sur les ingrédients et bienfaits.",
        "N'achetez pas {ProductName} avant de lire ceci. Analyse des retours utilisateurs et données.",
        "Vous cherchez {ProductName}? Obtenez le meilleur prix et découvrez ses effets santé.",
        "Détails officiels sur {ProductName}. Garantie satisfait ou remboursé 60 jours. Livraison rapide."
      ],
      it: [
        "Scopri la verità su {ProductName}. Recensione indipendente su ingredienti e benefici.",
        "Non comprare {ProductName} prima di leggere. Abbiamo analizzato feedback e dati clinici.",
        "Cerchi {ProductName}? Ottieni il miglior prezzo e scopri come aiuta la tua salute.",
        "Analisi ufficiale di {ProductName}. Garanzia di 60 giorni. Spedizione veloce disponibile."
      ],
      de: [
        "Entdecken Sie die Wahrheit über {ProductName}. Unabhängiger Test zu Inhaltsstoffen und Wirkung.",
        "Kaufen Sie {ProductName} nicht, bevor Sie dies gelesen haben. Analyse von Nutzerfeedback.",
        "Suchen Sie {ProductName}? Sichern Sie sich den besten Preis und unterstützen Sie Ihre Gesundheit.",
        "Offizielle Details zu {ProductName}. 60 Tage Geld-zurück-Garantie. Schneller Versand."
      ]
    },
    intents: ["Review", "Buy", "Official", "Legit", "Ingredients"]
  },
  // Default fallback for other verticals like DIY
  general: {
    headlines: {
      en: [
        "{ProductName} Review", "Is {ProductName} Worth It?", "Official Site",
        "Get {ProductName} Now", "Instant Access", "PDF Download",
        "Legit or Scam?", "Customer Reviews", "Best Deal Online",
        "Step-by-Step Guide", "Easy to Follow", "Expert Opinion"
      ],
      pt: ["Resenha {ProductName}", "Vale a Pena?", "Site Oficial", "Baixar Agora", "Acesso Imediato", "Guia Passo a Passo"],
      es: ["Reseña {ProductName}", "¿Vale la Pena?", "Sitio Oficial", "Descargar Ahora", "Acceso Inmediato", "Guía Paso a Paso"],
      fr: ["Avis {ProductName}", "Vaut-il la Peine?", "Site Officiel", "Télécharger", "Accès Immédiat", "Guide Étape par Étape"],
      it: ["Recensione {ProductName}", "Ne Vale la Pena?", "Sito Ufficiale", "Scarica Ora", "Accesso Immediato", "Guida Passo Passo"],
      de: ["{ProductName} Test", "Lohnt es sich?", "Offizielle Seite", "Jetzt Herunterladen", "Sofortzugang", "Schritt-für-Schritt"]
    },
    descriptions: {
      en: [
        "Full review of {ProductName}. See what's inside before you buy. Instant access available.",
        "Is {ProductName} legit? We checked everything. Read our honest opinion here.",
        "Get started with {ProductName} today. Easy to follow instructions for beginners and pros.",
        "Don't overpay. Check the official discount for {ProductName} and start your project now."
      ],
      pt: [
        "Resenha completa do {ProductName}. Veja o que está incluído antes de comprar. Acesso imediato.",
        "{ProductName} é confiável? Verificamos tudo. Leia nossa opinião honesta aqui.",
        "Comece com {ProductName} hoje. Instruções fáceis para iniciantes e profissionais.",
        "Não pague a mais. Confira o desconto oficial para {ProductName} e comece seu projeto."
      ],
      es: [
        "Reseña completa de {ProductName}. Mira qué incluye antes de comprar. Acceso inmediato.",
        "¿{ProductName} es legítimo? Verificamos todo. Lee nuestra opinión honesta aquí.",
        "Empieza con {ProductName} hoy. Instrucciones fáciles para principiantes y profesionales.",
        "No pagues de más. Revisa el descuento oficial de {ProductName} y empieza tu proyecto."
      ],
      fr: [
        "Avis complet sur {ProductName}. Voyez le contenu avant d'acheter. Accès immédiat.",
        "{ProductName} est-il fiable ? Nous avons tout vérifié. Lisez notre opinion honnête.",
        "Commencez avec {ProductName} aujourd'hui. Instructions faciles pour débutants et pros.",
        "Ne payez pas trop. Vérifiez la remise officielle pour {ProductName} et lancez-vous."
      ],
      it: [
        "Recensione completa di {ProductName}. Vedi cosa include prima di comprare. Accesso immediato.",
        "{ProductName} è affidabile? Abbiamo controllato tutto. Leggi la nostra opinione.",
        "Inizia con {ProductName} oggi. Istruzioni facili per principianti e professionisti.",
        "Non pagare troppo. Controlla lo sconto ufficiale per {ProductName} e inizia il progetto."
      ],
      de: [
        "Vollständiger Test zu {ProductName}. Sehen Sie den Inhalt vor dem Kauf. Sofortzugang.",
        "Ist {ProductName} seriös? Wir haben alles geprüft. Lesen Sie hier unsere Meinung.",
        "Starten Sie heute mit {ProductName}. Einfache Anleitungen für Anfänger und Profis.",
        "Zahlen Sie nicht zu viel. Prüfen Sie den offiziellen Rabatt für {ProductName}."
      ]
    },
    intents: ["Review", "Download", "Official", "Legit", "Guide"]
  }
};

const NEGATIVES = [
  "free", "gratis", "gratuit", "kostenlos", "gratuito",
  "torrent", "download free", "crack", "hacked", "login", "member area",
  "scam", "fake", "fraud", "reclame aqui", "complaints"
];

export function generateCampaigns(product: ProductConfig): AdCampaign[] {
  const languages = ['en', 'pt', 'es', 'fr', 'it', 'de'];
  const campaigns: AdCampaign[] = [];
  
  // Select template based on vertical
  const templateKey = product.vertical === 'health' ? 'health' : 'general';
  const template = TEMPLATES[templateKey];

  languages.forEach(lang => {
    const langKey = lang as keyof typeof template.headlines;
    const headlines = template.headlines[langKey] || template.headlines['en'];
    const descriptions = template.descriptions[langKey] || template.descriptions['en'];

    // Replace placeholders
    const finalHeadlines = headlines.map(h => h.replace(/{ProductName}/g, product.name)).slice(0, 15);
    const finalDescriptions = descriptions.map(d => d.replace(/{ProductName}/g, product.name)).slice(0, 4);

    const campaign: AdCampaign = {
      product: product.slug,
      language: lang,
      campaignName: `[Search] [${lang.toUpperCase()}] ${product.name} - BOFU`,
      adGroups: []
    };

    // Create Ad Groups based on intents
    template.intents.forEach(intent => {
      const adGroup: AdGroup = {
        name: `${product.name} - ${intent}`,
        keywords: [
          `[${product.name} ${intent}]`, // Exact
          `"${product.name} ${intent}"`, // Phrase
          `[${product.name}]`,
          `"${product.name}"`
        ],
        negatives: NEGATIVES,
        ads: [{
          headlines: finalHeadlines,
          descriptions: finalDescriptions,
          finalUrl: `https://${getDomainForVertical(product.vertical)}/${product.slug}`,
          path1: "Review",
          path2: "Official"
        }]
      };
      campaign.adGroups.push(adGroup);
    });

    campaigns.push(campaign);
  });

  return campaigns;
}

function getDomainForVertical(vertical: string): string {
  if (vertical === 'health') return 'health.topproductofficial.com';
  if (vertical === 'diy') return 'diy.topproductofficial.com';
  return 'www.topproductofficial.com';
}
