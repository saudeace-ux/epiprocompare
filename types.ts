export interface EPIItem {
  id: string;
  name: string;
  ca: string;
  price: number;
  lifespan: number;
  image: string;
  type: 'main' | 'comparison';
  dailyCost: number;
  durabilityScore: 'ALTA' | 'BAIXA' | 'REGULAR';
}

export enum Period {
  MONTH = 'Month',
  QUARTER = 'Quarter',
  SEMESTER = 'Semester',
  YEAR = 'Year'
}