import { Client, Databases, Account, ID, Query } from 'appwrite';

const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '697ed1700020463678bd';
const DATABASE_ID = '697ed1ec000b6fa56d52';

const COLLECTIONS = {
    CHILDREN: '6980b811001a1d102dc8',
    LOGS: '6980b8140027f62e8489',
    APPOINTMENTS: '6980b8180001a1297dc9',
    CAREGIVERS: '6980b81a0002402adf96',
    JOIN_REQUESTS: '6980b81c00100448434f',
};

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client);

// Helper to handle Appwrite errors
const handleError = (error: any) => {
    console.error('Appwrite Error:', error);
    throw error;
};

// --- AUTH ---
export const loginWithUsername = async (username: string, password: string, remember: boolean = true) => {
    try {
        // Appwrite requires email for password login. 
        // We map "username" -> "username@sunnybaby.internal"
        const email = `${username.toLowerCase().trim()}@sunnybaby.internal`;

        // Delete existing session if any (to avoid conflict)
        try {
            await account.deleteSession('current');
        } catch (e) {
            // No current session, that's fine
        }

        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error) {
        handleError(error);
    }
};

export const logout = async () => {
    try {
        return await account.deleteSession('current');
    } catch (error) {
        handleError(error);
    }
};

export const getSession = async () => {
    try {
        return await account.getSession('current');
    } catch (error) {
        // If no session, return null instead of throwing
        return null;
    }
};

// --- CHILDREN ---
export const getChildren = async () => {
    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHILDREN);
        return response.documents;
    } catch (error) {
        handleError(error);
    }
};

export const createChild = async (data: any) => {
    try {
        return await databases.createDocument(DATABASE_ID, COLLECTIONS.CHILDREN, ID.unique(), data);
    } catch (error) {
        handleError(error);
    }
};

export const updateChild = async (documentId: string, data: any) => {
    try {
        return await databases.updateDocument(DATABASE_ID, COLLECTIONS.CHILDREN, documentId, data);
    } catch (error) {
        handleError(error);
    }
};

export const deleteChild = async (documentId: string) => {
    try {
        return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CHILDREN, documentId);
    } catch (error) {
        handleError(error);
    }
};

// --- LOGS ---
export const getLogs = async (limit = 100) => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.LOGS,
            [Query.limit(limit), Query.orderDesc('timestamp')]
        );
        return response.documents;
    } catch (error) {
        handleError(error);
    }
};

export const createLog = async (data: any) => {
    try {
        return await databases.createDocument(DATABASE_ID, COLLECTIONS.LOGS, ID.unique(), data);
    } catch (error) {
        handleError(error);
    }
};

export const updateLog = async (documentId: string, data: any) => {
    try {
        return await databases.updateDocument(DATABASE_ID, COLLECTIONS.LOGS, documentId, data);
    } catch (error) {
        handleError(error);
    }
};

export const deleteLog = async (documentId: string) => {
    try {
        return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.LOGS, documentId);
    } catch (error) {
        handleError(error);
    }
};

// --- APPOINTMENTS ---
export const getAppointments = async () => {
    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.APPOINTMENTS);
        return response.documents;
    } catch (error) {
        handleError(error);
    }
};

export const createAppointment = async (data: any) => {
    try {
        return await databases.createDocument(DATABASE_ID, COLLECTIONS.APPOINTMENTS, ID.unique(), data);
    } catch (error) {
        handleError(error);
    }
};

// --- CAREGIVERS ---
export const getCaregivers = async () => {
    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CAREGIVERS);
        return response.documents;
    } catch (error) {
        handleError(error);
    }
};

export const createCaregiver = async (data: any) => {
    try {
        return await databases.createDocument(DATABASE_ID, COLLECTIONS.CAREGIVERS, ID.unique(), data);
    } catch (error) {
        handleError(error);
    }
};

// --- REALTIME ---
export const subscribeToChanges = (collection: string, callback: (payload: any) => void) => {
    const channel = `databases.${DATABASE_ID}.collections.${collection}.documents`;
    return client.subscribe(channel, (response) => {
        callback(response);
    });
};

export { COLLECTIONS };
