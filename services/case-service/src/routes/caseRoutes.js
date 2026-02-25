import express from "express";
import {
  createCase,
  getAllCases,
  updateCaseStatus,
  deleteCase,
} from "../controllers/caseController.js";

const router = express.Router();

router.post("/", createCase);
router.get("/", getAllCases);
router.put("/:id/status", updateCaseStatus);
router.delete("/:id", deleteCase);

export default router;