import {
    auth,
    drive as googleDrive,
} from '@googleapis/drive';
import {
    constants,
    env,
} from './constants';

const authorization = auth.getClient({
    scopes: constants.scopes,
    credentials: {
        private_key: env.gServicePrivateKey,
        client_email: env.gServiceClientEmail,
    },
});

export const driveExport = async () => googleDrive({
    version: 'v3',
    auth: await authorization,
});