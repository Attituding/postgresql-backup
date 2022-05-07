import 'dotenv/config';
import {
    constants,
    env,
} from './constants';
import { driveExport } from './drive';
import express from 'express';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import shell from 'shelljs';

const app = express();

app.use((req, _res, next) => {
    console.log(req.path, req.query);

    next();
});

app.use((req, res, next) => {
    const query = req.query;

    if (query.auth === env.password) {
        // eslint-disable-next-line callback-return
        next();
    } else {
        console.warn(401);
        res.sendStatus(401);
    }
});

app.all('/backup', async (_req, res) => {
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
    }

    res.sendStatus(200);
});

app.all('/restore', async (req, res) => {
    const query = req.query;

    const drive = await driveExport();

    const fileID = (query.fileID as string | undefined) ??
        (
            await drive.files.list({
                includeItemsFromAllDrives: true,
                pageSize: 1,
                // eslint-disable-next-line id-length
                q: `'${constants.parentFolder}' in parents and trashed = false`,
                supportsAllDrives: true,
            })
        ).data.files?.[0]?.id;

    if (fileID) {
        const file = await drive.files.get({
            fileId: fileID,
            alt: 'media',
        });

        await fs.writeFile(
            constants.tempPath,
            file.data as string,
            {
                encoding: 'binary',
            },
        );

        shell.exec(`pg_restore -U ${env.user} -h ${env.host} -p ${env.port} -w -c -F t -d ${env.database} temp.tar`);

        res.status(200).send(`Restored from ${fileID}`);
    } else {
        res.status(500).send('No backups available.');
    }
});

app.listen(3000, '0.0.0.0');