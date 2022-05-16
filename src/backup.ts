import {
    constants,
    env,
} from './constants';
import { driveExport } from './drive';
import fsSync from 'node:fs';
import shell from 'shelljs';

export async function backup(date: Date | undefined = new Date()) {
    const output = shell.exec(
        `pg_dump -U ${env.user} -h ${env.host} -p ${env.port} -w -F t ${env.database} > ${constants.fileName}.tar`,
    );

    if (output.includes('error')) {
        throw new Error(output);
    } else {
        const drive = await driveExport();

        const time = date.toLocaleString(undefined, { hour12: false });

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
    }
}