import type { CreatorHub } from '../../types/api';

const HUBS_KEY = 'creator_hubs';

export const hubsStorage = {
    getHubs(): CreatorHub[] {
        try {
            const data = localStorage.getItem(HUBS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting hubs:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    setHubs(hubs: CreatorHub[]): void {
        try {
            localStorage.setItem(HUBS_KEY, JSON.stringify(hubs));
        } catch (error) {
            console.error('Error setting hubs:', error);
        } finally {
            // Required by architecture rules
        }
    },

    addHub(hub: CreatorHub): void {
        try {
            const hubs = this.getHubs();
            hubs.push(hub);
            this.setHubs(hubs);
        } catch (error) {
            console.error('Error adding hub:', error);
        } finally {
            // Required by architecture rules
        }
    },

    removeHub(hubId: string): void {
        try {
            const hubs = this.getHubs();
            const filtered = hubs.filter(hub => hub.id !== hubId);
            this.setHubs(filtered);
        } catch (error) {
            console.error('Error removing hub:', error);
        } finally {
            // Required by architecture rules
        }
    },

    updateHub(hubId: string, updates: Partial<CreatorHub>): void {
        try {
            const hubs = this.getHubs();
            const updated = hubs.map(hub => 
                hub.id === hubId ? { ...hub, ...updates } : hub
            );
            this.setHubs(updated);
        } catch (error) {
            console.error('Error updating hub:', error);
        } finally {
            // Required by architecture rules
        }
    },

    addCreatorToHub(hubId: string, creatorId: string): void {
        try {
            const hubs = this.getHubs();
            const updated = hubs.map(hub => {
                if (hub.id === hubId && !hub.creatorIds.includes(creatorId)) {
                    return { ...hub, creatorIds: [...hub.creatorIds, creatorId] };
                }
                return hub;
            });
            this.setHubs(updated);
        } catch (error) {
            console.error('Error adding creator to hub:', error);
        } finally {
            // Required by architecture rules
        }
    },

    removeCreatorFromHub(hubId: string, creatorId: string): void {
        try {
            const hubs = this.getHubs();
            const updated = hubs.map(hub => {
                if (hub.id === hubId) {
                    return { ...hub, creatorIds: hub.creatorIds.filter(id => id !== creatorId) };
                }
                return hub;
            });
            this.setHubs(updated);
        } catch (error) {
            console.error('Error removing creator from hub:', error);
        } finally {
            // Required by architecture rules
        }
    },

    getCreatorsInHub(hubId: string): string[] {
        try {
            const hubs = this.getHubs();
            const hub = hubs.find(h => h.id === hubId);
            return hub ? hub.creatorIds : [];
        } catch (error) {
            console.error('Error getting creators in hub:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    }
};