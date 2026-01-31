import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

export const initGapi = () => {
    return new Promise((resolve, reject) => {
        if (typeof gapi === 'undefined') {
            console.error('GAPI not loaded in window. Check script tags.');
            reject(new Error('GAPI not loaded'));
            return;
        }
        gapi.load('client', () => {
            console.log('GAPI client loading...');
            gapi.client.init({
                discoveryDocs: DISCOVERY_DOCS,
            }).then(() => {
                console.log('GAPI client initialized successfully');
                resolve(true);
            }).catch(err => {
                console.error('GAPI init error:', err);
                reject(err);
            });
        });
    });
};

export const setGapiToken = (token: string) => {
    if (gapi?.client) {
        gapi.client.setToken({ access_token: token });
        console.log('GAPI token has been set manually');
    } else {
        console.error('Cannot set GAPI token: client not initialized');
    }
};

export const findOrCreateDatabaseFile = async () => {
    if (!gapi?.client?.drive) {
        console.error('❌ GAPI Drive client not ready. Attempting to reload...');
        await initGapi();
        if (!gapi?.client?.drive) {
            throw new Error('Google Drive client failed to initialize. Please check your internet connection or login status.');
        }
    }

    try {
        console.log('🔍 Sync: Searching for database.json in appDataFolder...');
        // Search for database.json in appDataFolder
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            q: "name = 'database.json'",
        });

        let files = response.result.files;
        if (files && files.length > 0) {
            console.log('✅ Sync Success: Found existing database file on Google Drive:', files[0].id);
            return files[0].id;
        } else {
            console.log('📦 First Sync: Creating new database.json on Google Drive appDataFolder...');
            // Create the file
            const fileMetadata = {
                'name': 'database.json',
                'parents': ['appDataFolder']
            };
            const createResponse = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            console.log('✅ Created new cloud database file:', createResponse.result.id);
            return createResponse.result.id;
        }
    } catch (err: any) {
        console.error('❌ Google Drive list/create error:', err);
        const detail = err.result?.error?.message || err.message || JSON.stringify(err);
        throw new Error(`Cloud Storage Error: ${detail}`);
    }
};

export const uploadData = async (fileId: string, data: any) => {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const contentType = 'application/json';
    const metadata = {
        'name': 'database.json',
        'mimeType': contentType,
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;

    return gapi.client.request({
        'path': `/upload/drive/v3/files/${fileId}`,
        'method': 'PATCH',
        'params': { 'uploadType': 'multipart' },
        'headers': {
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
    });
};

export const downloadData = async (fileId: string) => {
    const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    });
    return response.result;
};
