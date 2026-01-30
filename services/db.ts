import Dexie, { type Table } from 'dexie';
import { LogEntry, Child, VaccineAppointment, Caregiver } from '../types';

export class BabyTrackerDB extends Dexie {
    logs!: Table<LogEntry>;
    children!: Table<Child>;
    appointments!: Table<VaccineAppointment>;
    caregivers!: Table<Caregiver>;

    constructor() {
        // Using a more unique name to avoid conflicts and version(3) to force a schema update
        super('SunnyBabyTrackerDB_v1');
        this.version(3).stores({
            logs: 'id, childId, type, timestamp',
            children: 'id, name',
            appointments: '[childId+vaccineName]',
            caregivers: 'id, name'
        });
    }
}

export const db = new BabyTrackerDB();

// Handle open errors
db.open().catch(err => {
    console.error('Failed to open db:', err.stack || err);
});
