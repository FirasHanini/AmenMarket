// apps/server/src/plugins/sellerHandling/seller-mail.service.ts
import { Injectable } from '@nestjs/common';
import { RequestContext, EventBus } from '@vendure/core';
import { AccountRegistrationEvent } from '@vendure/core';
import { SellerEvent } from '@vendure/core';

@Injectable()
export class SellerMailService {
    constructor(private eventBus: EventBus) {}

    // Pour l'inscription (Vérification email)
    async sendVerificationEmail(ctx: RequestContext, user: any) {
        // On déclenche l'événement que l'EmailPlugin comprend déjà
        this.eventBus.publish(new AccountRegistrationEvent(ctx, user));
    }

    // Pour la validation bancaire
    async sendValidationEmail(ctx: RequestContext, seller: any) {
        // On déclenche l'événement de mise à jour
        this.eventBus.publish(new SellerEvent(ctx, seller, 'updated'));
    }
}