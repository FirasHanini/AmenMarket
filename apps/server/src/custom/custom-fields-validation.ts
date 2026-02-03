import { Permission, CustomFieldConfig, RequestContext, Injector } from '@vendure/core';

/**
 * Seule la banque (ceux qui ont la permission UpdateSeller ou UpdateSettings)
 * peut valider ou dévalider un vendeur.
 */
export const validateBankPermission: CustomFieldConfig['validate'] = (
    value: any,  
    injector: Injector,              
    ctx: RequestContext         
)=> {
    const isBankAdmin = ctx.userHasPermissions([Permission.UpdateSettings]) || 
                        ctx.userHasPermissions([Permission.UpdateSeller]);



    if (!isBankAdmin) {
        return 'Action non autorisée : Seule admin Amen Bank peut modifier ce champ.';
    }
    return;
};