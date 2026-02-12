import { Injectable } from '@nestjs/common';
import { 
    RequestContext, 
    LanguageCode, 
    CurrencyCode,
    TransactionalConnection, 
    Seller,
     Administrator,
    Channel,
    Role,
    Zone,
    User,
    StockLocationService,
    StockLocation
} from '@vendure/core';
import { DEFAULT_SELLER_PERMISSIONS } from './seller-permissions';

@Injectable()
export class SellerAutomationService {
   constructor(
        private connection: TransactionalConnection,
        private stockLocationService: StockLocationService,
    ) {}

    async setupSellerAccess(ctx: RequestContext, seller: Seller) {
        // On récupère les repositories (ils ignorent les permissions GraphQL/Admin, pas besoin de contexte spécial)
        const channelRepo = this.connection.getRepository(ctx, Channel);
        const roleRepo = this.connection.getRepository(ctx, Role);
        const zoneRepo = this.connection.getRepository(ctx, Zone);
        const adminRepo = this.connection.getRepository(ctx, Administrator);
        const userRepo = this.connection.getRepository(ctx, User);
       

        // 1. Trouver une zone (nécessaire pour le channel)
        const zones = await zoneRepo.find();
        const defaultZone = zones[0];

        console.log(`Initialisation technique pour le vendeur: ${seller.name}`);

        // 2. Créer le Channel manuellement
        const newChannel = new Channel({
            code: `channel-${seller.id}`,
            token: Math.random().toString(36).substr(2, 10),
            seller: seller,
            defaultCurrencyCode: CurrencyCode.TND,
            availableCurrencyCodes: [CurrencyCode.TND],
            availableLanguageCodes: [LanguageCode.fr],
            defaultLanguageCode: LanguageCode.fr,
            pricesIncludeTax: true,
            defaultShippingZone: defaultZone,
            defaultTaxZone: defaultZone,
            
        });
        const savedChannel = await channelRepo.save(newChannel);

        // 3. Créer le Rôle manuellement
        const sellerRole = new Role({
            code: `role-seller-${seller.id}`,
            description: `Rôle pour le vendeur ${seller.name}`,
            permissions: DEFAULT_SELLER_PERMISSIONS,
            channels: [savedChannel], 
        });
        const savedRole = await roleRepo.save(sellerRole);

        // 4. Lier l'administrateur au rôle
        // On cherche l'admin qui a ce sellerId
        const admin = await adminRepo.findOne({
            where: { id:  seller.customFields.adminId  },
            relations: ['user', 'user.roles']
        });
       



        if (admin) {
             admin.user.roles=[]
            admin.user.roles.push(savedRole);

            
            await userRepo.save(admin.user);
            console.log(`Succès : Canal et Rôle créés pour l'admin ${admin.emailAddress}`);
        } else {
            console.error(`Erreur : Aucun administrateur trouvé pour le vendeur ID ${seller.id}`);
        }

        // 5. OPTIONNEL : Ajouter le nouveau canal au SuperAdmin pour qu'il puisse voir la boutique
        const superAdminRole = await roleRepo.findOne({
            where: { id: 1 },  // ou 'SuperAdmin' selon ta config
            relations: ['channels']
        });

        console.log(`Rôle SuperAdmin trouvé : ${superAdminRole ? 'Oui' : 'Non'}`);
        if (superAdminRole) {
            console.log(`Ajout du canal ${savedChannel.code} au rôle SuperAdmin`);
            superAdminRole.channels.push(savedChannel);
            await roleRepo.save(superAdminRole);
        }


        const newStockLocation = await this.stockLocationService.create(ctx, {
        name: `Stock ${seller.name}`,
        description: `Dépôt principal pour ${seller.name}`,
   
        });



        // IMPORTANT : Il faut lier la location au canal
        // Le service a une méthode dédiée pour cela
        await this.stockLocationService.assignStockLocationsToChannel(ctx, {
            channelId: savedChannel.id,
            stockLocationIds: [newStockLocation.id],
             
        });



        


    }
}