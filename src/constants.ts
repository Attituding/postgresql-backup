export const constants = {
    databases: ['railway', 'test'],
    parentFolder: '1RsEna-Wsgigu_GRvnnYRMRgCaBZkGIG_',
    scopes: ['https://www.googleapis.com/auth/drive'],
};

export const env = {
    cron: process.env.CRON ?? '0 */24 * * *',
    gServiceClientEmail: process.env.GSERVICEEMAIL!,
    gServicePrivateKey: process.env.GSERVICEPRIVATEKEY!,
    port: process.env.PORT ?? 3000,
    postgresHost: process.env.PGHOST!,
    postgresPassword: process.env.PGPASSWORD!,
    postgresPort: process.env.PGPORT!,
    postgresUser: process.env.PGUSER!,
};