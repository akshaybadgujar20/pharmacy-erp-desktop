import { faker } from '@faker-js/faker';

const SEED = 42_026;

export function initFaker(): void {
  faker.seed(SEED);
}

export { faker };

export function indianMobile(): string {
  const digits = faker.string.numeric(10);
  return `+91${digits.startsWith('0') ? digits.slice(1) : digits}`;
}

export function gstin(stateCode = '27'): string {
  return `${stateCode}${faker.string.alphanumeric(10).toUpperCase()}1Z${faker.string.numeric(1)}`;
}

export function pan(): string {
  return faker.string.alphanumeric(10).toUpperCase();
}

export function uuid(): string {
  return faker.string.uuid();
}
