// Traduções completas de todos os 64 type_id encontrados no Google Sheets
export const TYPE_TRANSLATIONS = {
  // Imobiliário
  'real_estate_agency': 'Imobiliária',
  'real_estate': 'Imobiliária',
  'real_estate_agent': 'Agente Imobiliário',
  'real_estate_developer': 'Promotor Imobiliário',
  'property_management': 'Gestão de Imóveis',
  'apartment_building': 'Edifício de Apartamentos',
  
  // Restauração
  'restaurant': 'Restaurante',
  'cafe': 'Café',
  'bar': 'Bar',
  'bakery': 'Padaria',
  'food': 'Restaurante',
  
  // Saúde
  'doctor': 'Médico',
  'dentist': 'Dentista',
  'cosmetic_dentist': 'Dentista Estético',
  'pediatric_dentist': 'Dentista Pediátrico',
  'orthodontist': 'Ortodontista',
  'dental_clinic': 'Clínica Dentária',
  'dental_hygienist': 'Higienista Dental',
  'dental_implants_periodontist': 'Periodontista',
  'dental_implants_provider': 'Implantes Dentários',
  'dental_laboratory': 'Laboratório Dentário',
  'dental_radiology': 'Radiologia Dentária',
  'dental_school': 'Escola Dentária',
  'dental_supply_shop': 'Loja de Material Dentário',
  'dental_supply_store': 'Loja de Material Dentário',
  'denture_care_center': 'Centro de Próteses Dentárias',
  'emergency_dental_service': 'Serviço Dentário de Emergência',
  'clinic': 'Clínica',
  'medical_clinic': 'Clínica Médica',
  'specialized_clinic': 'Clínica Especializada',
  'plastic_surgery_clinic': 'Clínica de Cirurgia Plástica',
  'hospital': 'Hospital',
  'private_hospital': 'Hospital Privado',
  'pharmacy': 'Farmácia',
  'parapharmacy': 'Parafarmácia',
  'physiotherapist': 'Fisioterapeuta',
  'obstetrician-gynecologist': 'Obstetra-Ginecologista',
  'psychologist': 'Psicólogo',
  'veterinarian': 'Veterinário',
  'health_consultant': 'Consultor de Saúde',
  'local_medical_services': 'Serviços Médicos Locais',
  'hospital_equipment_and_supplies': 'Equipamento Hospitalar',
  'orthotics_&_prosthetics_service': 'Órtoteses e Próteses',
  'surgical_products_wholesaler': 'Grossista de Produtos Cirúrgicos',
  
  // Beleza
  'hair_care': 'Cabeleireiro',
  'beauty_salon': 'Salão de Beleza',
  'spa': 'Spa',
  'nail_salon': 'Manicure',
  
  // Serviços
  'lawyer': 'Advogado',
  'accountant': 'Contabilista',
  'insurance_agency': 'Seguradora',
  'insurance_agent': 'Agente de Seguros',
  'travel_agency': 'Agência de Viagens',
  'car_repair': 'Oficina Mecânica',
  'electrician': 'Eletricista',
  'plumber': 'Canalizador',
  'locksmith': 'Serralheiro',
  'driving_school': 'Escola de Condução',
  'training_center': 'Centro de Formação',
  'photography_studio': 'Estúdio Fotográfico',
  'coworking_space': 'Espaço de Coworking',
  'internet_marketing_service': 'Marketing Digital',
  'telecommunications_contractor': 'Telecomunicações',
  
  // Comércio
  'store': 'Loja',
  'shop': 'Loja',
  'clothing_store': 'Loja de Roupa',
  'shoe_store': 'Sapataria',
  'jewelry_store': 'Joalharia',
  'furniture_store': 'Loja de Móveis',
  'electronics_store': 'Loja de Eletrónicos',
  'supermarket': 'Supermercado',
  'hypermarket': 'Hipermercado',
  'discount_store': 'Loja de Descontos',
  'discount_supermarket': 'Supermercado Desconto',
  'shopping_mall': 'Centro Comercial',
  'bazar': 'Bazar',
  'pet_store': 'Loja de Animais',
  'pet_supply_store': 'Loja de Animais',
  'animal_feed_store': 'Loja de Rações',
  'sporting_goods_store': 'Loja de Desporto',
  'farm_shop': 'Loja Agrícola',
  
  // Educação
  'school': 'Escola',
  'university': 'Universidade',
  'library': 'Biblioteca',
  'student_union': 'Associação de Estudantes',
  
  // Organizações
  'association_/_organization': 'Associação',
  'social_services_organisation': 'Serviços Sociais',
  'newspaper_publisher': 'Editora de Jornais',
  
  // Outros
  'gym': 'Ginásio',
  'hotel': 'Hotel',
  'bank': 'Banco',
  'gas_station': 'Posto de Combustível',
  'car_dealer': 'Stand de Automóveis',
  'park': 'Parque',
  'parking_garage': 'Parque de Estacionamento'
};

export function translateTypeToPortuguese(typeId) {
  const typeIdLower = (typeId || '').toLowerCase().replace(/\s+/g, '_');
  return TYPE_TRANSLATIONS[typeIdLower] || typeId || 'Empresa';
}
