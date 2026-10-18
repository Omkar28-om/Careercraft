import { Router } from "express";
import {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill,
} from "../controllers/skills.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getSkills);
router.post("/", createSkill);
router.put("/:id", updateSkill);
router.delete("/:id", deleteSkill);

export default router;
