/**
 * CareerCraft Centralized XP & Level Utility
 * 
 * Deterministic Level Progression:
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 250 XP
 * Level 4: 500 XP
 * Level 5: 1000 XP
 * Level 6: 1750 XP
 * Level 7: 2750 XP
 * Level 8: 4000 XP
 * Level 9: 5500 XP
 * Level 10: 7500 XP
 * Level 11+: +2500 XP per level
 */

const BASE_LEVELS = [
    { level: 1, xp: 0, title: "Novice Coder" },
    { level: 2, xp: 100, title: "Apprentice Developer" },
    { level: 3, xp: 250, title: "Code Explorer" },
    { level: 4, xp: 500, title: "Problem Solver" },
    { level: 5, xp: 1000, title: "Algorithm Explorer" },
    { level: 6, xp: 1750, title: "Full Stack Journeyman" },
    { level: 7, xp: 2750, title: "System Architect" },
    { level: 8, xp: 4000, title: "Senior Pathfinder" },
    { level: 9, xp: 5500, title: "Master Craftsman" },
    { level: 10, xp: 7500, title: "Tech Titan" },
];

/**
 * Returns minimum XP threshold required for a given level
 */
export function getThresholdForLevel(level) {
    if (level <= 1) return 0;
    if (level <= 10) {
        return BASE_LEVELS[level - 1].xp;
    }
    // Beyond Level 10, each level requires +2500 XP
    return 7500 + (level - 10) * 2500;
}

/**
 * Returns level number from total XP
 */
export function getLevelFromXp(totalXp) {
    const xp = Math.max(0, parseInt(totalXp, 10) || 0);

    for (let i = BASE_LEVELS.length - 1; i >= 0; i--) {
        if (xp >= BASE_LEVELS[i].xp) {
            if (i === BASE_LEVELS.length - 1) {
                // Check if beyond level 10
                const additionalXp = xp - 7500;
                const extraLevels = Math.floor(additionalXp / 2500);
                return 10 + extraLevels;
            }
            return BASE_LEVELS[i].level;
        }
    }
    return 1;
}

/**
 * Returns XP threshold required for next level
 */
export function getXpForNextLevel(totalXp) {
    const currentLevel = getLevelFromXp(totalXp);
    return getThresholdForLevel(currentLevel + 1);
}

/**
 * Returns full level progression metadata
 */
export function getLevelProgress(totalXp) {
    const currentXp = Math.max(0, parseInt(totalXp, 10) || 0);
    const level = getLevelFromXp(currentXp);

    const xpForCurrentLevel = getThresholdForLevel(level);
    const xpForNextLevel = getThresholdForLevel(level + 1);

    const xpIntoLevel = Math.max(0, currentXp - xpForCurrentLevel);
    const xpRequiredForNextLevel = Math.max(1, xpForNextLevel - xpForCurrentLevel);

    const rawPercent = (xpIntoLevel / xpRequiredForNextLevel) * 100;
    const progressPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));

    const baseTitleObj = BASE_LEVELS.find((b) => b.level === level);
    const levelTitle = baseTitleObj ? baseTitleObj.title : `Grandmaster Tier ${level - 10}`;

    return {
        level,
        levelTitle,
        currentXp,
        xpForCurrentLevel,
        xpForNextLevel,
        xpIntoLevel,
        xpRequiredForNextLevel,
        progressPercent,
    };
}
