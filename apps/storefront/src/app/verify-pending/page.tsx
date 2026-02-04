import type {Metadata} from 'next';
import {Suspense} from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Verification Pending',
    description: 'Check your email to verify your account.',
};

async function VerifyPendingContent({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
    const resolvedParams = await searchParams;
    const redirectTo = resolvedParams?.redirectTo as string | undefined;

    const signInHref = redirectTo
        ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/sign-in';

    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">Verifiez votre Email</h1>
                    <p className="text-muted-foreground">
                        Un email de verification a été envoyé à votre adresse.
                         Veuillez cliquer sur le lien dans l'email pour vérifier votre compte.    
                    </p>
                </div>
                <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">
                       Pas d'email? Vérifiez votre dossier spam ou demandez un nouveau lien de vérification.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <Link href={signInHref} className="w-full">
                    <Button className="w-full">
                        Aller à la connexion
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export default async function VerifyPendingPage({searchParams}: PageProps<'/verify-pending'>) {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <Suspense fallback={<div>Loading...</div>}>
                    <VerifyPendingContent searchParams={searchParams} />
                </Suspense>
            </div>
        </div>
    );
}
