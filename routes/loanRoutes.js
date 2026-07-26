const express = require("express");
const { protect, restrictTo } = require("../middleware/authMiddleWare");
const loanController = require("../controllers/loanController");

const router = express.Router();

router.use(protect);

router.post("/loans", restrictTo("customer"), loanController.createLoan);
router.get("/my-loans", restrictTo("customer"), loanController.getMyLoans);

router.get(
  "/loans",
  restrictTo("loan_officer", "branch-manager", "admin"),
  loanController.getAllLoans,
);

router.get(
  "/loans/:id",
  restrictTo("customer", "loan_officer", "branch-manager", "admin"),
  loanController.getLoan,
);

router.put("/loans/:id", restrictTo("loan_officer"), loanController.updateLoan);

router.put(
  "/loans/:id/status",
  restrictTo("loan_officer", "branch-manager"),
  loanController.updateStatus,
);

// Delete loan record
router.delete("/loans/:id", restrictTo("admin"), loanController.deleteLoan);

module.exports = router;
