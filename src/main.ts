import 'dotenv/config';
import {
    auth,
    drive as googleDrive,
} from '@googleapis/drive';
import { constants } from './constants';
import cron from 'node-cron';
import express from 'express';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import process from 'node:process';
import shell from 'shelljs';

(async () => {
    const app = express();

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

    const basePath = `${__dirname}/../`;
    const tar = `${basePath}${constants.fileName}.tar`;

    const database = process.env.PGDATABASE!;
    const host = process.env.PGHOST!;
    const password = process.env.PGPASSWORD!;
    const port = process.env.PGPORT!;
    const user = process.env.PGUSER!;

    app.all('/backup', async (req, res) => {
        const query = req.query;

        console.log('/backup', query);

        if (query.auth === '1') {
            await attempt(backup);

            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    });

    app.all('/restore', async (req, res) => {
        const query = req.query;

        console.log('/restore', query);

        if (query.auth === '1') {
            const files = await drive.files.list({
                includeItemsFromAllDrives: true,
                pageSize: 1,
                q: `'${constants.parentFolder}' in parents and trashed = false`,
                supportsAllDrives: true,
            });

            if (
                typeof files.data.files === 'undefined' ||
                files.data.files?.length !== 0
            ) {
                res.status(500).send('No backups available.');
            }

            const file = await drive.files.get({
                fileId: files.data.files![0]!.id!,
                alt: 'media',
            });

            console.log('n', file.status);

            await fs.writeFile(`${__dirname}../temp.tar`, String(file.data));

            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }

        //await fs.writeFile(`${__dirname}../temp.tar`, file.data);

        //const output = shell.exec(`pg_restore -U ${user} -h ${host} -p ${port} -w -F t -d ${database} ${constants.fileName}.tar`);
    });

    app.listen(3000);

    cron.schedule('0 0 * * *', async () => {
        await attempt(backup);
    }, {
        timezone: 'America/Vancouver',
    });

    async function backup() {
        const output = shell.exec(`pg_dump -U ${user} -h ${host} -p ${port} -w -F t ${database} > ${constants.fileName}.tar`);

        if (output.includes('error')) {
            throw new Error(output);
        } else {
            const time = new Date().toLocaleString(
                undefined,
                { hour12: false },
            );

            const stats = await fs.stat(tar);

            console.log(`${time}.tar ${stats.size} bytes`);

            await drive.files.create({
                requestBody: {
                    name: `${time}.tar`,
                    parents: [constants.parentFolder],
                },
                media: {
                    mimeType: 'application/x-tar',
                    body: fsSync.createReadStream(tar),
                },
            });

            await fs.unlink(tar);
        }
    }

    async function attempt(func: () => Promise<void>) {
        try {
            await func();
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
})();