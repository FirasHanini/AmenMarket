import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { 
    Allow, 
    Ctx, 
    RequestContext, 
    SellerService, 
    AdministratorService, 
    RoleService,
    Permission,
    InternalServerError,
    Transaction
} from '@vendure/core';

@Resolver()
export class SellerRegistrationResolver {
    constructor(
        private sellerService: SellerService,
        private administratorService: AdministratorService,
        private roleService: RoleService,
    ) {}

    @Transaction()
    @Mutation()
    @Allow(Permission.Public) // N'importe qui peut s'inscrire
    async registerSellerAccount(@Ctx() ctx: RequestContext, @Args() args: any) {
        const { input } = args;

        // 1. Trouver le rôle "Seller" (Assure-toi de l'avoir créé dans l'Admin UI avant)
        const allRoles = await this.roleService.findAll(ctx);
        const sellerRole = allRoles.items.find(r => r.code === 'seller-role' || r.code === 'vendeur');
        
        if (!sellerRole) {
            throw new InternalServerError('Le rôle Vendeur n est pas configuré sur la plateforme.');
        }

        // 2. Créer le Seller (La Boutique)
        const newSeller = await this.sellerService.create(ctx, {
            name: input.shopName,
            customFields: {
                Matriculefiscal: input.matriculeFiscal,
                Ribbancaire: input.rib,
                isValidatedByBank: false // Toujours false par défaut
            }
        });

        // 3. Créer l'Administrator
        const newAdmin = await this.administratorService.create(ctx, {
            emailAddress: input.email,
    //        userName: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            password: input.password,
            roleIds: [sellerRole.id],
        });

        // 4. Lier l'Admin au Seller
        // On utilise une méthode interne pour forcer la liaison au nouveau Seller
        (newAdmin as any).seller = newSeller;
        await this.administratorService.update(ctx, {
            id: newAdmin.id,
        });

        return newSeller;
    }
}