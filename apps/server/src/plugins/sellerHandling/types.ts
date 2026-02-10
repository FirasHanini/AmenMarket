import '@vendure/core';

declare module '@vendure/core' {
  interface CustomSellerFields {
    matriculeFiscal?: string;
    ribBancaire?: string;
    isValidatedByBank?: boolean;
    adminId?: string; // L'ID de l'administrateur lié à ce vendeur
  }
}