
import { createDirectus, rest, readItems, updateItem, authentication } from '@directus/sdk';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.PUBLIC_DIRECTUS_URL;
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

if (!DIRECTUS_URL || !DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
    console.error('Error: Missing DIRECTUS_URL, DIRECTUS_EMAIL, or DIRECTUS_PASSWORD.');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

interface GamePlayer {
    id: number;
    user: number; // User ID
    game: number; // Game ID
    status: 'playing' | 'finished';
}

async function migrateGamePlayers() {
    try {
        console.log(`Authenticating as ${DIRECTUS_EMAIL}...`);
        await directus.login({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD });
        console.log('Authentication successful.');

        console.log('Fetching old game_players records...');
        const gamePlayers = await directus.request(readItems('game_players', {
            limit: -1,
            fields: ['user', 'game', 'status']
        })) as unknown as GamePlayer[];

        if (!gamePlayers || gamePlayers.length === 0) {
            console.log('No game_players found to migrate.');
            return;
        }

        console.log(`Found ${gamePlayers.length} records. grouping by user...`);

        // Group by User
        const userUpdates = new Map<number, { playing: number[], finished: number[] }>();

        gamePlayers.forEach(gp => {
            if (!gp.user || !gp.game) return;
            
            if (!userUpdates.has(gp.user)) {
                userUpdates.set(gp.user, { playing: [], finished: [] });
            }

            const userData = userUpdates.get(gp.user)!;
            
            if (gp.status === 'playing') {
                if (!userData.playing.includes(gp.game)) {
                    userData.playing.push(gp.game);
                }
            } else if (gp.status === 'finished') {
                if (!userData.finished.includes(gp.game)) {
                    userData.finished.push(gp.game);
                }
            }
        });

        console.log(`Prepared updates for ${userUpdates.size} users.`);

        // Apply Updates
        for (const [userId, games] of userUpdates.entries()) {
            console.log(`Updating User ID ${userId}: Playing=${games.playing.length}, Finished=${games.finished.length}`);
            
            // Requires Directus to accept partial updates and M2M IDs
            // M2M format in Directus create/update usually:
            // { playing_games: [{ game_id: 123 }, { game_id: 456 }] } 
            // OR if it's just IDs: { playing_games: [1, 2] } <-- this depends on junction table setup.
            // Directus standard M2M payload usually accepts an array of objects for create/update.
            // But if we generated the junction table automatically, it expects:
            // playing_games: [ { game_id: <ID> }, ... ]
            
            const payload: any = {};
            
            if (games.playing.length > 0) {
                // map to { games_id: ID } format (Note: matches junction field name)
                payload.playing_games = games.playing.map(gid => ({ games_id: gid }));
            }
            
            if (games.finished.length > 0) {
                payload.finished_games = games.finished.map(gid => ({ games_id: gid }));
            }

            if (Object.keys(payload).length > 0) {
                 await directus.request(updateItem('authors', userId, payload));
                 console.log(`  > Success User ${userId}`);
            }
        }

        console.log('Migration completed successfully!');

    } catch (e) {
        console.error('Migration failed:', e);
        console.log('Make sure "authors" collection has "playing_games" and "finished_games" M2M fields set up correctly.');
        console.log('Also ensure you have permissions to update authors.');
    }
}

migrateGamePlayers();
