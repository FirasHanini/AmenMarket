'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Si tu as ce composant shadcn, sinon utilise une checkbox

const registrationSchema = z.object({
    emailAddress: z.string().email('Entrez une adresse e-mail valide'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    phoneNumber: z.string().optional(),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
    // Champs Vendeur
    isSeller: z.boolean(),
    shopName: z.string().optional(),
    matriculeFiscal: z.string().optional(),
    rib: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.isSeller) {
        return !!data.shopName && !!data.matriculeFiscal && !!data.rib;
    }
    return true;
}, {
    message: "Veuillez remplir toutes les informations professionnelles",
    path: ["shopName"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export function RegistrationForm({ redirectTo }: { redirectTo?: string }) {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            emailAddress: '', firstName: '', lastName: '', phoneNumber: '',
            password: '', confirmPassword: '', isSeller: false,
            shopName: '', matriculeFiscal: '', rib: ''
        },
    });

    const isSeller = form.watch('isSeller');

    const onSubmit = (data: RegistrationFormData) => {
        setServerError(null);
        startTransition(async () => {
            const formData = new FormData();
            // On passe toutes les données au serveur
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, String(value));
            });
            if (redirectTo) formData.append('redirectTo', redirectTo);

            const result = await registerAction(undefined, formData);
            if (result?.error) setServerError(result.error);
        });
    };

    return (
        <Card className="w-full max-w-lg mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4 pt-6">
                        
                        {/* LE TOGGLE */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                            <div className="space-y-0.5">
                                <Label className="text-base">Devenir Vendeur Partenaire</Label>
                                <p className="text-sm text-muted-foreground">Cochez cette case pour vendre vos produits</p>
                            </div>
                            <Switch 
                                checked={isSeller} 
                                onCheckedChange={(checked) => form.setValue('isSeller', checked)} 
                            />
                        </div>

                        {/* CHAMPS COMMUNS */}
                        <FormField control={form.control} name="emailAddress" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        {/* CHAMPS VENDEUR CONDITIONNELS */}
                        {isSeller && (
                            <div className="p-4 border-l-4 border-primary bg-primary/5 space-y-4 animate-in fade-in zoom-in duration-300">
                                <h3 className="font-bold text-sm">Informations Amen Bank</h3>
                                <FormField control={form.control} name="shopName" render={({ field }) => (
                                    <FormItem><FormLabel>Nom de la Boutique</FormLabel><FormControl><Input placeholder="Ma Boutique" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="matriculeFiscal" render={({ field }) => (
                                    <FormItem><FormLabel>Matricule Fiscal</FormLabel><FormControl><Input placeholder="1234567/A" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="rib" render={({ field }) => (
                                    <FormItem><FormLabel>RIB (20 chiffres)</FormLabel><FormControl><Input placeholder="0123..." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        )}

                         <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Numero de téléphone</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            placeholder="22 123 456"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem><FormLabel>Confirmer</FormLabel><FormControl><Input type="password" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>
                        )} />

                        {serverError && <p className="text-destructive text-sm font-medium">{serverError}</p>}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Chargement...' : (isSeller ? 'S\'inscrire comme Vendeur' : 'Créer un compte Client')}
                        </Button>
                    </CardContent>
                </form>
            </Form>
        </Card>
    );
}