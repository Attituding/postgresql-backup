import {
    auth,
    drive as googleDrive,
} from '@googleapis/drive';
import { constants } from './constants';
import process from 'node:process';

const credentials = {
    private_key: process.env.GSERVICEPRIVATEKEY!,
    client_email: process.env.GSERVICEEMAIL!,
};

const authorization = auth.getClient({
    scopes: constants.scopes,
    credentials: credentials,
});

export const driveExport = async () => googleDrive({
    version: 'v3',
    auth: await authorization,
});