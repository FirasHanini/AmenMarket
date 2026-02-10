// seller-permissions.ts
import { Permission } from '@vendure/core';

/**
 * Liste des permissions accordées par défaut à un nouveau vendeur
 * lors de la validation de son compte.
 */
export const DEFAULT_SELLER_PERMISSIONS: Permission[] = [
    Permission.Authenticated,
    Permission.ReadAsset,
    Permission.CreateAsset,
    Permission.CreateProduct,
    Permission.UpdateProduct,
    Permission.ReadProduct,
    Permission.DeleteProduct,
    Permission.ReadSettings,
    Permission.ReadOrder,
    Permission.UpdateOrder,
    Permission.ReadOrder,
    Permission.ReadAdministrator,
    Permission.ReadCatalog,
    Permission.ReadFacet,
    Permission.ReadCollection,
    Permission.ReadChannel,
    // Ajoutez ici d'autres permissions nécessaires pour les vendeurs

    // Tu peux facilement en ajouter d'autres ici plus tard (ex: Permission.ReadPayment)
];