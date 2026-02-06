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
    UserService,
    ChannelService, // <--- AJOUTÉ
    CurrencyCode,   // <--- AJOUTÉ
    LanguageCode,
   
    Role,
    RequestContextService,
    Administrator,
    Channel,
} from '@vendure/core';
import { SellerMailService } from './sellerMailService';


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
        private sellerMailService: SellerMailService,
        private channelService: ChannelService,
        private requestContextService: RequestContextService,
    ) {}

    @Transaction()
    @Mutation()
    @Allow(Permission.Public) // N'importe qui peut s'inscrire
    async registerSellerAccount(@Ctx() ctx: RequestContext, @Args() args: any) {
        const { input } = args;

        const defaultChannel = await this.channelService.getDefaultChannel(ctx);
        console.log(`Canal par défaut : ${defaultChannel ? defaultChannel.code : 'Aucun canal trouvé'}`);
     const systemCtx = await this.requestContextService.create({
        apiType: 'admin',
        channelOrToken: defaultChannel,
    });

    // 3. UTILISEZ 'systemCtx' AU LIEU DE 'ctx' POUR TOUS LES SERVICES
     const allRoles = await this.roleService.findAll(systemCtx);
     console.log(`Rôles disponibles : ${allRoles.items.map(r => r.code).join(', ')}`);
     const sellerRole = allRoles.items.find(r => r.code === 'seller-role' || r.code === 'SellerRole');
    
    if (!sellerRole) {
        throw new InternalServerError('Rôle non trouvé avec les droits système.');
    }

        // 2. Créer le Seller (La Boutique)
        const newSeller = await this.sellerService.create(systemCtx, {
            name: input.firstName + ' ' + input.lastName ,
            customFields: {
                matriculeFiscal: input.matriculeFiscal,
                ribBancaire: input.rib,
                isValidatedByBank: false // Toujours false par défaut
            }
        });

        // 3. CRÉATION DU CHANNEL UNIQUE
        // Cela permet d'isoler les produits du vendeur
        const newChannel = await this.channelService.create(systemCtx, {
            code: `channel-${newSeller.id}-${input.lastName.toLowerCase()}`,
            token: `token-${newSeller.id}-${Math.random().toString(36).substr(2, 9)}`,
            pricesIncludeTax: true,
            currencyCode: CurrencyCode.TND,
            defaultLanguageCode: LanguageCode.fr,
            sellerId: newSeller.id,
            defaultShippingZoneId: '',
            defaultTaxZoneId: ''
        });

        if (!(newChannel instanceof Channel)) {
    throw new InternalServerError('Failed to create channel');
}

        (systemCtx as any)._permissions = [Permission.SuperAdmin];

        // 4. Créer l'Administrator         
        const newAdmin = await this.administratorService.create(systemCtx, {
            emailAddress: input.email,
    //        userName: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            password: input.password,
            roleIds: []//[sellerRole.id],
        });


        const sellerPermissions = [
            Permission.ReadCatalog,
            Permission.UpdateCatalog,
            Permission.CreateCatalog,
            Permission.ReadOrder,
            Permission.UpdateAsset,
            ];
  
        const adminRole = await this.roleService.create(systemCtx, {
        description: 'Administrator for New Channel',
        code: 'new-channel-admin',
        permissions: sellerPermissions, // or specific permissions
        channelIds: [newChannel.id], // Assign the Role to the Channel
    });

    // 2. Assign that Role to the Administrator


    await this.administratorService.update(systemCtx, {
        id: newAdmin.id,
        roleIds: [adminRole.id], // Pass the ID of the role assigned to the new channel
    });


    

        // 5. Lier l'Admin au Seller
        // On utilise une méthode interne pour forcer la liaison au nouveau Seller
        (newAdmin as any).seller = newSeller;
        await this.administratorService.update(systemCtx, {
            id: newAdmin.id,
        });

        // 6. Générer le token et déclencher l'envoi de l'email
        // On récupère l'utilisateur associé à l'administrateur
        const adminWithUser = await this.administratorService.findOne(systemCtx, newAdmin.id);
        
        if (adminWithUser && adminWithUser.user) {
            const user = await this.userService.getUserById(
                systemCtx,
                adminWithUser.user.id,
            );
            


            console.log(`Token généré pour l'utilisateur avant if`);

            if (user) {
                console.log(`Token généré pour l'utilisateur : ${user.identifier}`);
                // Cette méthode génère le token et émet l'événement AccountRegistrationEvent
                // que l'EmailPlugin intercepte pour envoyer le mail.
                await this.sellerMailService.sendVerificationEmail(ctx, user);
            }
        }






        return newSeller;
    }

    
}
@VendurePlugin({
    imports: [PluginCommonModule], // <--- Indispensable pour injecter SellerService
    providers: [SellerMailService],
    adminApiExtensions: {
        schema: adminSchemaAdditions,
        resolvers: [SellerRegistrationResolver],
    },
})
export class SellerRegistrationPlugin {}