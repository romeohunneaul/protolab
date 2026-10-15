// The data set of the "volume" scenario: host code, built on demand, never fetched.
export type Invoice = { id: string; customer: string; amount: number };

const CUSTOMERS = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Vandelay"];

export const invoices = (count: number): Invoice[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `#${1042 + i}`,
    customer: CUSTOMERS[i % CUSTOMERS.length],
    amount: 120 + ((i * 37) % 880),
  }));
