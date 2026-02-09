import { Injectable } from '@nestjs/common';
import { 
    ChannelService, RoleService, AdministratorService, 
    RequestContext, Permission, LanguageCode, CurrencyCode,
    TransactionalConnection, Seller, Administrator,
    isGraphQlErrorResult,
    Channel,
    Role,
    Zone
} from '@vendure/core';

@Injectable()
export class SellerAutomationService {
   constructor(
        private connection: TransactionalConnection,
    ) {}

    async setupSellerAccess(ctx: RequestContext, seller: Seller) {
        // On récupère les repositories (ils ignorent les permissions GraphQL/Admin)
        const channelRepo = this.connection.getRepository(ctx, Channel);
        const roleRepo = this.connection.getRepository(ctx, Role);
        const zoneRepo = this.connection.getRepository(ctx, Zone);
        const adminRepo = this.connection.getRepository(ctx, Administrator);

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
            permissions: [
                Permission.ReadCatalog, Permission.UpdateCatalog, Permission.CreateCatalog,
                Permission.ReadOrder, Permission.UpdateOrder, Permission.UpdateAsset,
                Permission.Authenticated
            ],
            channels: [savedChannel], // On lie au channel qu'on vient de créer
        });
        const savedRole = await roleRepo.save(sellerRole);

        // 4. Lier l'administrateur au rôle
        // On cherche l'admin qui a ce sellerId
        const admin = await adminRepo.findOne({
            where: { id: seller.id  },
            relations: ['user', 'user.roles']
        });

        if (admin) {
            admin.user.roles.push(savedRole);
            await adminRepo.save(admin);
            console.log(`✅ Succès : Canal et Rôle créés pour l'admin ${admin.emailAddress}`);
        } else {
            console.error(`❌ Erreur : Aucun administrateur trouvé pour le vendeur ID ${seller.id}`);
        }

        // 5. OPTIONNEL : Ajouter le nouveau canal au SuperAdmin pour qu'il puisse voir la boutique
        const superAdminRole = await roleRepo.findOne({
            where: { code: 'superadmin-role' }, // ou 'SuperAdmin' selon ta config
            relations: ['channels']
        });
        if (superAdminRole) {
            superAdminRole.channels.push(savedChannel);
            await roleRepo.save(superAdminRole);
        }
    }
}