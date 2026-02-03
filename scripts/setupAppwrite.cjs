const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// --- CONFIGURATION ---
const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '697ed1700020463678bd';
const DATABASE_ID = '697ed1ec000b6fa56d52';

const API_KEY = process.argv[2];

if (!API_KEY) {
    console.error('❌ Error: Please provide an API Key as an argument.');
    console.log('Usage: node scripts/setupAppwrite.cjs <YOUR_API_KEY>');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

const collections = [
    {
        name: 'children',
        attributes: [
            { key: 'name', type: 'string', size: 128, required: true },
            { key: 'dob', type: 'string', size: 32, required: true },
            { key: 'photoUrl', type: 'string', size: 500, required: true },
            { key: 'gender', type: 'string', size: 10, required: true },
            { key: 'updatedAt', type: 'integer', required: true },
            { key: 'sleepStartTime', type: 'integer', required: false }
        ]
    },
    {
        name: 'logs',
        attributes: [
            { key: 'childId', type: 'string', size: 36, required: true },
            { key: 'type', type: 'string', size: 20, required: true },
            { key: 'timestamp', type: 'integer', required: true },
            { key: 'details', type: 'string', size: 255, required: true },
            { key: 'value', type: 'float', required: false },
            { key: 'notes', type: 'string', size: 1000, required: false },
            { key: 'updatedAt', type: 'integer', required: true }
        ]
    },
    {
        name: 'appointments',
        attributes: [
            { key: 'childId', type: 'string', size: 36, required: true },
            { key: 'vaccineName', type: 'string', size: 128, required: true },
            { key: 'plannedDate', type: 'string', size: 32, required: true }
        ]
    },
    {
        name: 'caregivers',
        attributes: [
            { key: 'name', type: 'string', size: 128, required: true },
            { key: 'email', type: 'string', size: 128, required: true },
            { key: 'role', type: 'string', size: 50, required: true },
            { key: 'accessLevel', type: 'string', size: 20, required: true },
            { key: 'status', type: 'string', size: 20, required: true },
            { key: 'updatedAt', type: 'integer', required: true }
        ]
    },
    {
        name: 'joinRequests',
        attributes: [
            { key: 'userName', type: 'string', size: 128, required: true },
            { key: 'userEmail', type: 'string', size: 128, required: true },
            { key: 'inviteCode', type: 'string', size: 20, required: true },
            { key: 'status', type: 'string', size: 20, required: true },
            { key: 'timestamp', type: 'integer', required: true }
        ]
    }
];

async function setup() {
    console.log('🚀 Starting Appwrite Setup...');

    for (const col of collections) {
        try {
            console.log(`\n📦 Creating Collection: ${col.name}...`);
            const createdCol = await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                col.name,
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users()),
                ]
            );

            console.log(`✅ Collection Created (ID: ${createdCol.$id})`);

            // Wait a bit for Appwrite to register the collection
            await new Promise(resolve => setTimeout(resolve, 1500));

            for (const attr of col.attributes) {
                console.log(`  - Adding Attribute: ${attr.key}...`);
                try {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(DATABASE_ID, createdCol.$id, attr.key, attr.size, attr.required);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(DATABASE_ID, createdCol.$id, attr.key, attr.required);
                    } else if (attr.type === 'float') {
                        await databases.createFloatAttribute(DATABASE_ID, createdCol.$id, attr.key, attr.required);
                    }
                } catch (attrErr) {
                    console.error(`    ❌ Error adding attribute ${attr.key}:`, attrErr.message);
                }
            }
            console.log(`✅ Attributes initiated for ${col.name}`);
        } catch (err) {
            console.error(`❌ Error with collection ${col.name}:`, err.message);
        }
    }

    console.log('\n🏁 Setup Initiated! Note that attributes may take a few seconds to process in the dashboard.');
    console.log('IMPORTANT: Please check your Appwrite console and send me the IDs for these collections.');
}

setup();
