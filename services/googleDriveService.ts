import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

export const initGapi = () => {
    return new Promise((resolve, reject) => {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            }).then(resolve).catch(reject);
        });
    });
};

export const findOrCreateDatabaseFile = async () => {
    // Search for database.json in appDataFolder
    const response = await gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        q: "name = 'database.json'",
    });

    let files = response.result.files;
    if (files && files.length > 0) {
        return files[0].id;
    } else {
        // Create the file
        const fileMetadata = {
            'name': 'database.json',
            'parents': ['appDataFolder']
        };
        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        return createResponse.result.id;
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
