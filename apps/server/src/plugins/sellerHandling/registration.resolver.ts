import { Args, Mutation, Resolver } from '@nestjs/graphql';
import gql from 'graphql-tag';
import {
    Allow,
    Ctx,
    RequestContext,
    SellerService,
    AdministratorService,
    RoleService,
    Permission,
    InternalServerError,
    Transaction,
    VendurePlugin,
    PluginCommonModule,
    UserService
} from '@vendure/core';


const adminSchemaAdditions = gql`
  input RegisterSellerInput {
    email: String!
    firstName: String!
    lastName: String!
    password: String!
    matriculeFiscal: String!
    rib: String!
  }

  extend type Mutation {
    registerSellerAccount(input: RegisterSellerInput!): Seller!
  }
`;


@Resolver()
export class SellerRegistrationResolver {
    constructor(
        private sellerService: SellerService,
        private administratorService: AdministratorService,
        private roleService: RoleService,
        private userService: UserService,
    ) {}

    @Transaction()
    @Mutation()
    @Allow(Permission.Public) // N'importe qui peut s'inscrire
    async registerSellerAccount(@Ctx() ctx: RequestContext, @Args() args: any) {
        const { input } = args;

        // 1. Trouver le rôle "Seller" (Assure-toi de l'avoir créé dans l'Admin UI avant)
        const allRoles = await this.roleService.findAll(ctx);
        const sellerRole = allRoles.items.find(r => r.code === 'seller-role' || r.code === 'SellerRole');
        
        if (!sellerRole) {
            throw new InternalServerError('Le rôle Vendeur n est pas configuré sur la plateforme.');
        }

        // 2. Créer le Seller (La Boutique)
        const newSeller = await this.sellerService.create(ctx, {
            name: input.firstName + ' ' + input.lastName ,
            customFields: {
                matriculefiscal: input.matriculeFiscal,
                ribbancaire: input.rib,
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


        // 5. Générer le token et déclencher l'envoi de l'email
        // On récupère l'utilisateur associé à l'administrateur
        const adminWithUser = await this.administratorService.findOne(ctx, newAdmin.id);
        
        if (adminWithUser && adminWithUser.user) {
            // Cette méthode génère le token et émet l'événement AccountRegistrationEvent
            // que l'EmailPlugin intercepte pour envoyer le mail.
            await this.userService.setVerificationToken(ctx, adminWithUser.user);
        }






        return newSeller;
    }

    
}
@VendurePlugin({
    imports: [PluginCommonModule], // <--- Indispensable pour injecter SellerService
    adminApiExtensions: {
        schema: adminSchemaAdditions,
        resolvers: [SellerRegistrationResolver],
    },
})
export class SellerRegistrationPlugin {}