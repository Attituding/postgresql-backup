import 'dotenv/config';
import {
    auth,
    drive as googleDrive,
} from '@googleapis/drive';
import { constants } from './constants';
import cron from 'node-cron';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import process from 'node:process';
import shell from 'shelljs';

(async () => {
    const credentials = {
        private_key: process.env.GSERVICEPRIVATEKEY!,
        client_email: process.env.GSERVICEEMAIL!,
    };

    const authorization = await auth.getClient({
        scopes: constants.scopes,
        credentials: credentials,
    });

    const drive = googleDrive({
        version: 'v3',
        auth: authorization,
    });

    const path = `${__dirname}/../${constants.fileName}.tar`;

    const database = process.env.PGDATABASE!;
    const host = process.env.PGHOST!;
    const port = process.env.PGPORT!;
    const user = process.env.PGUSER!;

    cron.schedule('0 0 * * *', async () => {
        try {
            const output = shell.exec(`pg_dump -U ${user} -h ${host} -p ${port} -w -F t ${database} > ${constants.fileName}.tar`);

            if (output.includes('error')) {
                throw new Error(output);
            } else {
                const time = new Date().toLocaleString(
                    undefined,
                    { hour12: false },
                );

                const stats = await fs.stat(path);

                console.log(`${time}.tar ${stats.size} bytes`);

                await drive.files.create({
                    requestBody: {
                        name: `${time}.tar`,
                        parents: [constants.parentFolder],
                    },
                    media: {
                        mimeType: 'application/x-tar',
                        body: fsSync.createReadStream(path),
                    },
                });

                await fs.unlink(path);
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }, {
        timezone: 'America/Vancouver',
    });
})();