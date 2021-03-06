import fsSync from 'node:fs';
import shell from 'shelljs';
import path from 'node:path';
import process from 'node:process';
import { getHeapStatistics } from 'v8';
import {
    constants,
    env,
} from './constants';
import { driveExport } from './drive';

export async function backup(date = new Date()) {
    console.log(process.memoryUsage());

    const drive = await driveExport();

    const time = date.toLocaleString(undefined, { hour12: false });

    console.log(process.memoryUsage());

    const folder = await drive.files.create({
        requestBody: {
            name: time,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [constants.parentFolder],
        },
        fields: 'id',
    });

    console.log(
        getHeapStatistics().heap_size_limit,
        (getHeapStatistics().heap_size_limit / 1024 ** 3).toFixed(3),
    );

    console.log(process.memoryUsage());

    await Promise.all([
        // Global objects (roles and tablespaces), no databases
        createFile(
            'global.out',
            `pg_dumpall --host=${
                env.postgresHost
            } --port=${
                env.postgresPort
            } --username=${
                env.postgresUser
            } --no-password --clean --file=global.out --globals-only`,
        ),

        // Databases
        ...constants.databases.map(
            (database) => createFile(
                `${database}.tar`,
                `pg_dump --host=${
                    env.postgresHost
                } --port=${
                    env.postgresPort
                } --username=${
                    env.postgresUser
                } --no-password --format=t ${
                    database
                } > ${
                    database
                }.tar`,
            ),
        ),
    ]);

    console.log(`Created backup ${time}`);

    console.log(process.memoryUsage());

    async function createFile(name: string, script: string) {
        const output = shell.exec(script);

        if (output.toLowerCase().includes('error')) {
            console.error(new Error(output));
            throw new Error(output);
        }

        await drive.files.create({
            requestBody: {
                name: name,
                parents: [folder.data.id!],
            },
            media: {
                mimeType: 'application/octet-stream',
                body: fsSync.createReadStream(
                    path.join(__dirname, '..', name), {
                        encoding: 'binary',
                    },
                ),
            },
        });
    }
}