import { OnModuleInit } from '@nestjs/common';
import { EventBus, PluginCommonModule, RequestContextService, SellerEvent, VendurePlugin } from '@vendure/core';
import { filter } from 'rxjs/operators';
import gql from 'graphql-tag';
import { SellerAutomationService } from './SellerAutomationService';
import { SellerRegistrationResolver } from './registration.resolver';
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

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        SellerAutomationService, // N'oublie pas d'ajouter ton service ici !
        SellerMailService,
    ],
    adminApiExtensions: {
        schema: adminSchemaAdditions,
        resolvers: [SellerRegistrationResolver],
    },
})

export class SellerRegistrationPlugin implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private automationService: SellerAutomationService,
        private requestContextService: RequestContextService,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(SellerEvent).pipe(
            filter(event => event.type === 'updated'),
            filter(event => event.entity.customFields.isValidatedByBank === true)
        ).subscribe(async (event) => {
            // Ici, on lance la création technique
            console.log(`Seller ${event.entity.name} validated by bank, setting up access...`);

            const systemCtx = await this.requestContextService.create({
                apiType: 'admin',
            });
            await this.automationService.setupSellerAccess(systemCtx,event.entity);
        });
    }
}

