import type {Metadata} from 'next';
import {Suspense} from 'react';
import {LoginForm} from "./login-form";
import {Card, CardContent, CardFooter} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: 'Se connecter',
    description: 'Connectez-vous à votre compte pour accéder à vos commandes, votre liste de souhaits, et plus encore.',
};

function LoginFormSkeleton() {
    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-12"/>
                    <Skeleton className="h-10 w-full"/>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16"/>
                    <Skeleton className="h-10 w-full"/>
                </div>
                <Skeleton className="h-10 w-full"/>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">

                <div className="flex flex-col items-center space-y-2">
                    <Skeleton className="h-4 w-40"/>
                </div>
            </CardFooter>
        </Card>
    );
}

async function SignInContent({searchParams}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const resolvedParams = await searchParams;
    const redirectTo = resolvedParams?.redirectTo as string | undefined;

    return <LoginForm redirectTo={redirectTo}/>;
}

export default async function SignInPage({searchParams}: PageProps<'/sign-in'>) {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Se connecter</h1>
                    <p className="text-muted-foreground">
                        Entrez vos identifiants pour accéder à votre compte
                    </p>
                </div>
                <Suspense fallback={<LoginFormSkeleton/>}>
                    <SignInContent searchParams={searchParams}/>
                </Suspense>
            </div>
        </div>
    );
}