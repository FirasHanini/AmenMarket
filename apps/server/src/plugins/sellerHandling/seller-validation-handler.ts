import { SellerEvent } from '@vendure/core';
import { EmailEventListener } from '@vendure/email-plugin';

/**
 * Ce handler écoute les modifications sur le vendeur.
 * Si le champ isValidatedByBank vient d'être activé, il déclenche l'email.
 */
export const sellerValidationHandler = new EmailEventListener('seller-validated')
    .on(SellerEvent)
    .filter(event => {
        // On ne déclenche l'email que si le champ personnalisé est à TRUE
        // et qu'il s'agit d'une mise à jour (update)
        const customFields = (event.entity as any).customFields;
        return event.type === 'updated' && customFields?.isValidatedByBank === true;
    })
    .setRecipient(event => {
        // On essaie de trouver l'email dans l'entité Seller
    // Si tu as lié ton vendeur à un Administrateur (cas fréquent dans Vendure) :
    const sellerUserEmail = (event.entity as any).administrator?.emailAddress;
    
    // Si on ne trouve rien, on met une adresse de secours ou on log l'erreur // ajout d'une table de log a faire
    return sellerUserEmail || 'support@amenmarket.com';
    }     
    ) 
    
    
    
    .setFrom('{{ fromAddress }}')
    .setSubject('Votre compte vendeur Amen Market est validé !')

    // Template à créer dans static/email/templates/seller-validated.html
    .setTemplateVars(event => ({
        sellerName: event.entity.name,
        // On peut ajouter d'autres variables pour le template email
    }));