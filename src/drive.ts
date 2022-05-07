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
        private_key: env.private_key,
        client_email: env.client_email,
    },
});

export const driveExport = async () => googleDrive({
    version: 'v3',
    auth: await authorization,
});