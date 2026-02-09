import '@vendure/core';

declare module '@vendure/core' {
  interface CustomSellerFields {
    matriculeFiscal?: string;
    ribBancaire?: string;
    isValidatedByBank?: boolean;
  }
}