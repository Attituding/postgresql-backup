import {
    constants,
    env,
} from './constants';
import { driveExport } from './drive';
import cron from 'node-cron';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import process from 'node:process';
import shell from 'shelljs';

cron.schedule('0 0 * * *', async () => {
    try {
        const output = shell.exec(`pg_dump -U ${env.user} -h ${env.host} -p ${env.port} -w -F t ${env.database} > ${constants.fileName}.tar`);

        if (output.includes('error')) {
            throw new Error(output);
        } else {
            const drive = await driveExport();

            const time = new Date().toLocaleString(
                undefined,
                { hour12: false },
            );

            console.log(`${time}.tar`);

            await drive.files.create({
                requestBody: {
                    name: `${time}.tar`,
                    parents: [constants.parentFolder],
                },
                media: {
                    mimeType: 'application/octet-stream',
                    body: fsSync.createReadStream(constants.backupPath, {
                        encoding: 'binary',
                    }),
                },
            });

            await fs.unlink(constants.backupPath);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}, {
    timezone: 'America/Vancouver',
});