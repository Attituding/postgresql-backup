import {
    constants,
    env,
} from './constants';
import { driveExport } from './drive';
import cron from 'node-cron';
import fsSync from 'node:fs';
import process from 'node:process';
import shell from 'shelljs';

cron.schedule('0 */24 * * *', async date => {
    try {
        const output = shell.exec(`pg_dump -U ${env.user} -h ${env.host} -p ${env.port} -w -F t ${env.database} > ${constants.fileName}.tar`);

        if (output.includes('error')) {
            throw new Error(output);
        } else {
            const drive = await driveExport();

            const time = date.toLocaleString(
                undefined,
                { hour12: false },
            );

            console.log(`${time}.tar`);

            await drive.files.create({
                requestBody: {
                    name: `${time}.tar 1`,
                    parents: [constants.parentFolder],
                },
                media: {
                    mimeType: 'application/octet-stream',
                    body: fsSync.createReadStream(constants.backupPath, {
                        encoding: 'binary',
                    }),
                },
            });
        }
    } catch (error) {
        console.error(error);
        process.exit(-1);
    }
}, {
    timezone: 'America/Vancouver',
});