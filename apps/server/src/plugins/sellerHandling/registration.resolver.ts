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

  
    RequestContextService,
  
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

   

        // 2. Créer le Seller (La Boutique)
        const newSeller = await this.sellerService.create(systemCtx, {
            name: input.firstName + ' ' + input.lastName ,
            customFields: {
                matriculeFiscal: input.matriculeFiscal,
                ribBancaire: input.rib,
                isValidatedByBank: false // Toujours false par défaut
            }
        });

      

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