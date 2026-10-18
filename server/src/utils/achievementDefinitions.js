/**
 * Centralized CareerCraft Achievement Definitions
 */

export const ACHIEVEMENT_DEFINITIONS = [
    {
        code: "FIRST_STEP",
        title: "First Step",
        description: "Added your first technical skill to your profile.",
        icon: "Sparkles",
        requirementType: "skill_count",
        requirementValue: 1,
        rewardXp: 10,
    },
    {
        code: "SKILL_BUILDER",
        title: "Skill Builder",
        description: "Added 5 skills to your profile.",
        icon: "Award",
        requirementType: "skill_count",
        requirementValue: 5,
        rewardXp: 25,
    },
    {
        code: "PROFILE_COMPLETE",
        title: "Profile Completed",
        description: "Completed your bio, college, and degree on your profile.",
        icon: "CheckCircle2",
        requirementType: "profile_complete",
        requirementValue: 1,
        rewardXp: 25,
    },
    {
        code: "XP_BEGINNER",
        title: "XP Beginner",
        description: "Reached 100 total XP on CareerCraft.",
        icon: "Trophy",
        requirementType: "total_xp",
        requirementValue: 100,
        rewardXp: 25,
    },
    {
        code: "XP_RISING",
        title: "XP Rising Star",
        description: "Reached 250 total XP on CareerCraft.",
        icon: "Flame",
        requirementType: "total_xp",
        requirementValue: 250,
        rewardXp: 50,
    },
];

export default ACHIEVEMENT_DEFINITIONS;
