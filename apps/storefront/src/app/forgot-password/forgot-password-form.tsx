'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { requestPasswordResetAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
    emailAddress: z.email('Entrez une adresse e-mail valide'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            emailAddress: '',
        },
    });

    const onSubmit = (data: ForgotPasswordFormData) => {
        setServerError(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append('emailAddress', data.emailAddress);

            const result = await requestPasswordResetAction(undefined, formData);
            if (result?.error) {
                setServerError(result.error);
            } else if (result?.success) {
                setSuccess(true);
            }
        });
    };

    if (success) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Vérifiez votre e-mail</CardTitle>
                    <CardDescription>
                        Si un compte existe avec cet e-mail, nous avons envoyé des instructions pour réinitialiser votre mot de passe.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link href="/sign-in">
                        <Button variant="outline" className="w-full">
                            Retour à la connexion
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mot de passe oublié ?</CardTitle>
                <CardDescription>
                    Entrez votre adresse e-mail et un lien pour réinitialiser votre mot de passe vous sera envoyé.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="emailAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adresse e-mail</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {serverError && (
                            <div className="text-sm text-destructive mt-4">
                                {serverError}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 mt-4">
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                        </Button>
                        <Link
                            href="/sign-in"
                            className="text-sm text-center text-muted-foreground hover:text-primary"
                        >
                            Retour à la connexion
                        </Link>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
