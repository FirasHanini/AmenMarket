import { bootstrap, VendureConfig } from '@vendure/core';
import { populate } from '@vendure/core/cli';
import { config } from './vendure-config';
import * as path from 'path';

/**
 * Script pour restaurer les données officielles après un TRUNCATE
 */
async function run() {
    // 1. On localise les fichiers officiels dans node_modules
    const initialDataPath = path.join(require.resolve('@vendure/create'), '../assets/initial-data.json');
    const productsCsvPath = path.join(require.resolve('@vendure/create'), '../assets/products.csv');
    
    // 2. On prépare une config temporaire pour forcer la synchronisation de la BD
    const populateConfig: VendureConfig = {
        ...config,
        dbConnectionOptions: {
            ...config.dbConnectionOptions,
            synchronize: true, // Recrée les tables si elles sont manquantes
        },
        importExportOptions: {
            // Localisation des images de test officielles
            importAssetsDir: path.join(require.resolve('@vendure/create'), '../assets/images'),
        },
    };

    console.log('Début de la restauration des données officielles...');
    
    try {
        await populate(
            () => bootstrap(populateConfig),
            initialDataPath,
            productsCsvPath
        );
        console.log('Restauration terminée !');
        console.log('Accès Admin : http://localhost:3000/admin');
        console.log('Login : superadmin / Password : superadmin');
    } catch (err) {
        console.error('Erreur lors du peuplement :', err);
    }
    process.exit(0);
}

run();