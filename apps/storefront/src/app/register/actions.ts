'use server';

import {mutate} from '@/lib/vendure/api';
import {RegisterCustomerAccountMutation} from '@/lib/vendure/mutations';
import {redirect} from 'next/navigation';


const RegisterSellerMutation = `
  mutation RegisterSeller($input: any) {
    registerSellerAccount(input: $input) {
      id
      name
    }
  }
`;

export async function registerAction(prevState: { error?: string } | undefined, formData: FormData) {
    const isSeller = formData.get('isSeller') === 'true';
    const emailAddress = formData.get('emailAddress') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    if (!emailAddress || !password) {
        return {error: 'Adresse e-mail et mot de passe sont requis.'};
    }

    if (isSeller) {
        const matriculeFiscal = formData.get('matriculeFiscal') as string;
        const rib = formData.get('rib') as string;
        const shopName = formData.get('shopName') as string;
         // --- CAS VENDEUR ---
            // On utilise directement un fetch car "mutate" pointe probablement vers la Shop API
            // alors que la création de Seller se fait souvent via l'Admin API (port 3000/admin-api)
            const response = await fetch('http://localhost:3000/admin-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: RegisterSellerMutation,
                    variables: {
                        input: {
                            shopName,
                            email: emailAddress,
                            firstName,
                            lastName,
                            password,
                            matriculeFiscal,
                            rib
                        }
                    },
                }),
            });

            const result = await response.json();

            if (result.errors) {
                return { error: result.errors[0].message };
            }

            // Redirection spécifique pour les vendeurs (en attente de validation banque)
            redirect('/verify-pending-seller');



    }else {
    


    const result = await mutate(RegisterCustomerAccountMutation, {
        input: {
            emailAddress,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phoneNumber: phoneNumber || undefined,
            password,
        }
    });

    const registerResult = result.data.registerCustomerAccount;

    if (registerResult.__typename !== 'Success') {
        return {error: registerResult.message};
    }

    // Redirect to verification pending page, preserving redirectTo if present
    const verifyUrl = redirectTo
        ? `/verify-pending?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/verify-pending';

    redirect(verifyUrl);

}

}









