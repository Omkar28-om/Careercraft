import { Router } from "express";
import {
    authenticate,
    optionalAuthenticate,
} from "../middleware/auth.middleware.js";
import {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    submitProposal,
    getMyProposals,
    getProposal,
    withdrawProposal,
    getProjectProposals,
    acceptProposal,
    rejectProposal,
    getContracts,
    getContract,
    completeContract,
    cancelContract,
    saveProject,
    unsaveProject,
    getSavedProjects,
    getEarnings,
} from "../controllers/freelance.controller.js";

const router = Router();

// ======================================================
// SAVED PROJECTS (Before /projects/:id)
// ======================================================
router.get("/saved", authenticate, getSavedProjects);
router.post("/saved/:id", authenticate, saveProject);
router.delete("/saved/:id", authenticate, unsaveProject);

// ======================================================
// EARNINGS
// ======================================================
router.get("/earnings", authenticate, getEarnings);

// ======================================================
// PROPOSALS MANAGEMENT (Global & Single)
// ======================================================
router.get("/proposals", authenticate, getMyProposals);
router.get("/proposals/:id", authenticate, getProposal);
router.patch("/proposals/:id/withdraw", authenticate, withdrawProposal);
router.put("/proposals/:id/withdraw", authenticate, withdrawProposal);
router.post("/proposals/:proposalId/accept", authenticate, acceptProposal);
router.put("/proposals/:proposalId/accept", authenticate, acceptProposal);
router.post("/proposals/:proposalId/reject", authenticate, rejectProposal);
router.put("/proposals/:proposalId/reject", authenticate, rejectProposal);

// ======================================================
// CONTRACTS MANAGEMENT
// ======================================================
router.get("/contracts", authenticate, getContracts);
router.get("/contracts/:id", authenticate, getContract);
router.post("/contracts/:id/complete", authenticate, completeContract);
router.post("/contracts/:id/cancel", authenticate, cancelContract);

// ======================================================
// PROJECTS CATALOG & CRUD
// ======================================================
router.get("/projects", optionalAuthenticate, getProjects);
router.post("/projects", authenticate, createProject);

// Project sub-actions & details
router.get("/projects/:projectId/proposals", authenticate, getProjectProposals);
router.post("/projects/:projectId/proposals", authenticate, submitProposal);
router.post("/projects/:id/save", authenticate, saveProject);
router.delete("/projects/:id/save", authenticate, unsaveProject);

router.get("/projects/:id", optionalAuthenticate, getProject);
router.put("/projects/:id", authenticate, updateProject);
router.delete("/projects/:id", authenticate, deleteProject);

export default router;
