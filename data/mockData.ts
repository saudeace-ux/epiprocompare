export interface ProductData {
  ca: string;
  name: string;
  price: string;
  life: string; // em dias
  image: string;
  description: string;
  type: string;
  benefits: { icon: string; color: string; label: string }[];
  specs: { label: string; value: string }[];
  indications: string[];
}

export const MOCK_DB: Record<string, ProductData> = {
  // Capacetes
  '45678': { 
    ca: '45678',
    price: '150,00', 
    life: '365', 
    name: 'Capacete V-Gard H1',
    type: 'Capacete',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAput8XCV0FZnk4aTAISSm-FlLXpYlft4mY1Ys_juqu9imOdtQvlI0hRp6bGeKaXg6XxLin17I8EXNDVtoLrQRHLMZeP_4XdN-Y1do1JLnsKXoODeBY0n57rpu2ikaNCxJhTHP0jSkzAwLw9ZeMMr517hs0i5cvBKy3rg0q_x-r-llRdjGyUMCVib7HrO8L8akM9PoEEPtzN8ZlgHk2FNkSXgySqXhA5YkSNuswSpL6WbQgNjyXnGlRFaQXFc3NKLc2OmMGTdro-Rs',
    description: 'Capacete de segurança classe B, tipo aba frontal, com suspensão fas-trac III. Projetado para oferecer conforto superior e proteção contra impactos verticais e riscos elétricos até 30 kV.',
    benefits: [
      { icon: 'bolt', color: 'yellow', label: 'Alta Tensão' },
      { icon: 'health_and_safety', color: 'blue', label: 'Impacto' },
      { icon: 'tune', color: 'purple', label: 'Ajuste Rápido' },
      { icon: 'verified', color: 'green', label: 'Certificado' }
    ],
    specs: [
      { label: 'Material', value: 'Polietileno de Alta Densidade (PEAD)' },
      { label: 'Suspensão', value: 'Fas-Trac III (Catraca)' },
      { label: 'Classe', value: 'B (Elétrico)' },
      { label: 'Peso', value: '340g' }
    ],
    indications: ['Construção Civil', 'Manutenção Elétrica', 'Indústria Geral', 'Mineração']
  },
  '12345': { 
    ca: '12345',
    price: '80,00', 
    life: '120', 
    name: 'Capacete Evolution',
    type: 'Capacete',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASVvCGE_0Bz00sECvJu5IKWpnSiAxTAwLZ4mnDrkkesksd_y9zxrHX28y6rrL_hsX0uSHUVC1U6sAw-iNFO-k2EGbAN1qKu_vW-E5Ky-F9Z0VCpF8MtUx_-QuukSUl-rgBmygCg5ZipUsZv9XPVgsS7T1w_kN6al5siTZ-VOtroQslYeA1ijPTMsyqsPTEpc9rxGFsEe4KjYGl6mB9a28Hqcl-4JkcmcK_6eRDu8OfmDOlPJCVgOUw9vyZD6GB20Oqnj8EEhTeMSk',
    description: 'Capacete de segurança básico com aba frontal. Injetado em polietileno de alta densidade, com suspensão simples. Ideal para visitantes ou obras de curto prazo.',
    benefits: [
      { icon: 'attach_money', color: 'green', label: 'Econômico' },
      { icon: 'line_weight', color: 'slate', label: 'Leve' },
      { icon: 'shield', color: 'blue', label: 'Básico' }
    ],
    specs: [
      { label: 'Material', value: 'Polietileno (PEAD)' },
      { label: 'Suspensão', value: 'Simples (Pino)' },
      { label: 'Classe', value: 'A (Impacto)' },
      { label: 'Peso', value: '310g' }
    ],
    indications: ['Visitantes', 'Obras Rápidas', 'Logística Leve']
  },
  // Botas
  '43377': {
    ca: '43377',
    price: '120,00',
    life: '180',
    name: 'Botina de elástico - Marluvas',
    type: 'Calçado',
    image: '/ca-43377.png',
    description: 'Botina de segurança com elástico lateral recoberto, dorso acolchoado, confeccionada em couro preto texturizado. Possui costuras aparentes em linha clara, solado de borracha bidensidade grosso com travas profundas. Ideal para proteção dos pés contra riscos de natureza leve e contra agentes abrasivos e escoriantes.',
    benefits: [
      { icon: 'shield', color: 'slate', label: 'Couro' },
      { icon: 'bolt', color: 'yellow', label: 'Sem Biqueira' },
      { icon: 'water_drop', color: 'blue', label: 'Hidrofugado' }
    ],
    specs: [
      { label: 'Material', value: 'Couro Vaqueta' },
      { label: 'Solado', value: 'PU Bidensidade' },
      { label: 'Fechamento', value: 'Elástico' }
    ],
    indications: ['Construção Civil', 'Serviços Gerais', 'Indústria Leve']
  },
  '37456': { 
    ca: '37456',
    price: '120,00', 
    life: '180', 
    name: 'Bota PVC Bracol', 
    type: 'Calçado',
    image: 'https://images.unsplash.com/photo-1543329124-b153926861e6?auto=format&fit=crop&w=400&q=80',
    description: 'Calçado ocupacional tipo bota, cano médio, confeccionado em PVC (Policloreto de Vinila). Oferece proteção integral contra umidade proveniente de operações com uso de água e agentes químicos leves.',
    benefits: [
      { icon: 'water_drop', color: 'blue', label: 'Impermeável' },
      { icon: 'personal_injury', color: 'amber', label: 'Antiderrapante' },
      { icon: 'oil_barrel', color: 'red', label: 'Resist. Óleo' },
      { icon: 'verified_user', color: 'purple', label: 'Durabilidade' }
    ],
    specs: [
      { label: 'Material', value: 'PVC Virgem' },
      { label: 'Design', value: 'Cano Médio' },
      { label: 'Solado', value: 'Full Grip' },
      { label: 'Forro', value: 'Poliéster' }
    ],
    indications: ['Limpeza Industrial', 'Frigoríficos', 'Saneamento', 'Cozinhas Industriais']
  },
  // Abafadores
  '11883': { 
    ca: '11883',
    price: '95,00', 
    life: '240', 
    name: 'Abafador 3M Peltor', 
    type: 'Proteção Auditiva',
    image: 'https://images.unsplash.com/photo-1522646638977-2f635677df22?auto=format&fit=crop&w=400&q=80',
    description: 'Protetor auditivo tipo concha, constituído por duas conchas de plástico, revestidas com almofadas de espuma e hastes metálicas. Atenuação NRRsf 22dB.',
    benefits: [
      { icon: 'volume_off', color: 'red', label: '22dB' },
      { icon: 'headphones', color: 'slate', label: 'Conforto' },
      { icon: 'settings_accessibility', color: 'blue', label: 'Ajustável' }
    ],
    specs: [
      { label: 'Atenuação', value: '22 dB (NRRsf)' },
      { label: 'Tipo', value: 'Concha (Haste Acima)' },
      { label: 'Peso', value: '190g' }
    ],
    indications: ['Indústria Metalúrgica', 'Aeroportos', 'Construção Civil']
  },
  // Luvas
  '5745': { 
    ca: '5745',
    price: '35,00', 
    life: '45', 
    name: 'Luva Ansell Hyflex', 
    type: 'Luva',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
    description: 'Luva de segurança tricotada em nylon, recoberta com poliuretano na palma e dedos. Excelente tato e destreza para montagem de precisão.',
    benefits: [
      { icon: 'fingerprint', color: 'green', label: 'Alta Tato' },
      { icon: 'cut', color: 'slate', label: 'Precisão' },
      { icon: 'air', color: 'blue', label: 'Respirável' }
    ],
    specs: [
      { label: 'Material', value: 'Nylon / PU' },
      { label: 'Punho', value: 'Elástico' },
      { label: 'Dorso', value: 'Ventilado' }
    ],
    indications: ['Montagem Eletrônica', 'Logística', 'Manutenção Fina']
  },
   // Óculos
  '11268': {
    ca: '11268',
    price: '15,00',
    life: '60',
    name: 'Óculos Leopardo - Kalipso',
    type: 'Proteção Visual',
    image: 'https://images.unsplash.com/photo-1582239105436-e88939c3a3c2?auto=format&fit=crop&w=400&q=80', // Reusing safety glasses image
    description: 'Óculos de segurança constituídos de arco de material plástico preto com um pino central e duas fendas nas extremidades, utilizada para o encaixe de um visor de policarbonato.',
    benefits: [
      { icon: 'visibility', color: 'blue', label: 'Lente Única' },
      { icon: 'shield', color: 'slate', label: 'Policarbonato' },
      { icon: 'wb_sunny', color: 'amber', label: 'Filtro UV' }
    ],
    specs: [
      { label: 'Lente', value: 'Policarbonato' },
      { label: 'Cor', value: 'Incolor/Fumê' },
      { label: 'Hastes', value: 'Tipo Espátula' }
    ],
    indications: ['Indústria Geral', 'Construção Civil', 'Montagem']
  },
  '20000': {
    ca: '20000',
    price: '45,00',
    life: '90',
    name: 'Óculos Spectra',
    type: 'Proteção Visual',
    image: 'https://images.unsplash.com/photo-1582239105436-e88939c3a3c2?auto=format&fit=crop&w=400&q=80',
    description: 'Óculos de segurança com lente única de policarbonato, tratamento antirrisco e antiembaçante. Hastes com ajuste de comprimento.',
    benefits: [
      { icon: 'visibility', color: 'blue', label: 'Anti-risco' },
      { icon: 'wb_sunny', color: 'amber', label: 'UV400' },
      { icon: 'science', color: 'slate', label: 'Policarbonato' }
    ],
    specs: [
      { label: 'Lente', value: 'Policarbonato' },
      { label: 'Tratamento', value: 'Antirrisco/Antiembaçante' },
      { label: 'Hastes', value: 'Ajustáveis' }
    ],
    indications: ['Laboratórios', 'Usinagem', 'Serviços Gerais']
  }
};