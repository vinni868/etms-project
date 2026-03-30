package com.lms.controller;

import com.lms.entity.Fee;
import com.lms.entity.User;
import com.lms.repository.FeeRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class FeeController {

    private final FeeRepository feeRepo;
    private final UserRepository userRepo;
    private final com.lms.repository.PaymentRecordRepository paymentRecordRepo;

    // ─────────────── ADMIN ENDPOINTS ─────────────────────────────

    /** GET /api/admin/fees — all fees */
    @GetMapping("/api/admin/fees")
    public ResponseEntity<?> getAllFees(Authentication auth) {
        System.out.println("FEE_AUTH: Request to getAllFees by user: " + (auth != null ? auth.getName() : "Anonymous"));
        if (auth != null) {
            System.out.println("FEE_AUTH: Authorities: " + auth.getAuthorities());
        }
        List<Fee> fees = feeRepo.findAll();
        BigDecimal totalCollected = feeRepo.getTotalCollected() != null ? feeRepo.getTotalCollected() : BigDecimal.ZERO;
        BigDecimal totalPending   = feeRepo.getTotalPending()   != null ? feeRepo.getTotalPending()   : BigDecimal.ZERO;
        return ResponseEntity.ok(Map.of(
            "fees",           enrichFees(fees),
            "totalCollected", totalCollected,
            "totalPending",   totalPending
        ));
    }

    /** GET /api/admin/fees/{id}/history — payment installments history */
    @GetMapping("/api/admin/fees/{id}/history")
    public ResponseEntity<?> getPaymentHistory(@PathVariable Long id, Authentication auth) {
        System.out.println("FEE_AUTH: Request to getPaymentHistory for ID: " + id + " by user: " + (auth != null ? auth.getName() : "Anonymous"));
        if (auth != null) {
            System.out.println("FEE_AUTH: Authorities: " + auth.getAuthorities());
        }
        return ResponseEntity.ok(paymentRecordRepo.findByFeeIdOrderByPaymentDateDesc(id));
    }

    /** GET /api/admin/fees/student/{studentId} — by student */
    @GetMapping("/api/admin/fees/student/{studentId}")
    public ResponseEntity<?> getFeesByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(enrichFees(feeRepo.findByStudentIdOrderByCreatedAtDesc(studentId)));
    }

    /** GET /api/admin/fees/batch/{batchId} — by batch */
    @GetMapping("/api/admin/fees/batch/{batchId}")
    public ResponseEntity<?> getFeesByBatch(@PathVariable Long batchId) {
        return ResponseEntity.ok(enrichFees(feeRepo.findByBatchIdOrderByCreatedAtDesc(batchId)));
    }

    /** POST /api/admin/fees — create fee record */
    @PostMapping("/api/admin/fees")
    public ResponseEntity<?> createFee(@RequestBody Map<String, Object> body, Authentication auth) {
        User admin = getUser(auth);
        String studentIdStr = body.get("studentId") != null ? body.get("studentId").toString().trim() : "";
        if (studentIdStr.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student ID is required."));
        }

        // 1. Identify Student
        Long dbStudentId = null;
        Optional<User> studentOpt = userRepo.findByPortalId(studentIdStr);
        if (studentOpt.isEmpty()) studentOpt = userRepo.findByStudentId(studentIdStr);

        if (studentOpt.isPresent()) dbStudentId = studentOpt.get().getId();
        else {
            try { dbStudentId = Long.parseLong(studentIdStr); } 
            catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("message", "Invalid Student ID: " + studentIdStr)); }
        }

        Fee fee = new Fee();
        fee.setStudentId(dbStudentId);
        
        String batchIdStr = body.get("batchId") != null ? body.get("batchId").toString().trim() : "";
        if (!batchIdStr.isEmpty()) {
            try { fee.setBatchId(Long.parseLong(batchIdStr)); } catch (Exception e) {}
        }

        // 2. Pricing Logic (Advanced)
        BigDecimal original = new BigDecimal(body.get("originalTotalAmount") != null ? body.get("originalTotalAmount").toString() : "0");
        String plan = str(body, "paymentPlan"); // FULL_UPFRONT, HALF_AND_PLACEMENT, EMI_PLAN
        
        fee.setOriginalTotalAmount(original);
        fee.setPaymentPlan(plan);
        
        BigDecimal finalTotal = original;
        if ("FULL_UPFRONT".equalsIgnoreCase(plan)) {
            BigDecimal discount = original.multiply(new BigDecimal("0.10"));
            fee.setDiscountAmount(discount);
            finalTotal = original.subtract(discount);
        } else if ("EMI_PLAN".equalsIgnoreCase(plan)) {
            fee.setIsEmi(true);
            fee.setInterestAmount(new BigDecimal("1000"));
            // Upfront portion is half + 1000 (User example: 15000 + 1000 = 16000)
            BigDecimal half = original.divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_UP);
            BigDecimal emiBase = half.add(new BigDecimal("1000"));
            // Monthly split over 3 months (e.g. 16000 / 3 = 5334 ceil)
            BigDecimal installment = emiBase.divide(new BigDecimal("3"), 0, java.math.RoundingMode.CEILING);
            fee.setEmiInstallment(installment);
            finalTotal = original.add(new BigDecimal("1000"));
        }

        fee.setTotalAmount(finalTotal);
        BigDecimal paid = body.get("paidAmount") != null && !body.get("paidAmount").toString().trim().isEmpty()
                ? new BigDecimal(body.get("paidAmount").toString()) : BigDecimal.ZERO;
        fee.setPaidAmount(paid);
        fee.setDueAmount(finalTotal.subtract(paid));
        fee.setPaymentMode(str(body, "paymentMode"));
        fee.setNotes(str(body, "notes"));
        fee.setCollectedBy(admin.getId());
        fee.setReceiptNumber("REC-" + System.currentTimeMillis());

        if (paid.compareTo(BigDecimal.ZERO) == 0) fee.setStatus("PENDING");
        else if (paid.compareTo(fee.getTotalAmount()) >= 0) fee.setStatus("PAID");
        else fee.setStatus("PARTIAL");

        feeRepo.save(fee);

        // Record Initial Payment entry if any
        if (paid.compareTo(BigDecimal.ZERO) > 0) {
            com.lms.entity.PaymentRecord rec = new com.lms.entity.PaymentRecord();
            rec.setFeeId(fee.getId());
            rec.setAmount(paid);
            rec.setPaymentMode(fee.getPaymentMode());
            rec.setNotes("Initial down-payment. " + (fee.getNotes() != null ? fee.getNotes() : ""));
            rec.setReceiptNumber(fee.getReceiptNumber());
            rec.setCollectedBy(admin.getId());
            paymentRecordRepo.save(rec);
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Fee record created.", "id", fee.getId(), "receiptNumber", fee.getReceiptNumber()));
    }

    @PutMapping("/api/admin/fees/{id}/pay")
    public ResponseEntity<?> recordPayment(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        User admin = getUser(auth);
        Fee fee = feeRepo.findById(id).orElseThrow(() -> new RuntimeException("Fee record not found"));
        
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String mode = str(body, "paymentMode");
        String notes = str(body, "notes");
        
        BigDecimal newPaid = fee.getPaidAmount().add(amount);
        fee.setPaidAmount(newPaid);
        fee.setDueAmount(fee.getTotalAmount().subtract(newPaid));
        fee.setPaymentDate(LocalDate.now());
        fee.setPaymentMode(mode);
        
        if (newPaid.compareTo(fee.getTotalAmount()) >= 0) fee.setStatus("PAID");
        else fee.setStatus("PARTIAL");
        
        feeRepo.save(fee);

        // Create Payment Audit Record
        com.lms.entity.PaymentRecord rec = new com.lms.entity.PaymentRecord();
        rec.setFeeId(fee.getId());
        rec.setAmount(amount);
        rec.setPaymentMode(mode);
        rec.setNotes(notes);
        rec.setReceiptNumber("REC-" + System.currentTimeMillis());
        rec.setCollectedBy(admin.getId());
        paymentRecordRepo.save(rec);

        return ResponseEntity.ok(Map.of("status", "success", "message", "Payment recorded.", "newPaidAmount", newPaid, "dueAmount", fee.getDueAmount()));
    }

    // ─────────────── STUDENT ENDPOINTS ─────────────────────────────

    /** GET /api/student/fees — my fees */
    @GetMapping("/api/student/fees")
    public ResponseEntity<?> myFees(Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(enrichFees(feeRepo.findByStudentIdOrderByCreatedAtDesc(user.getId())));
    }

    // ─────────────── HELPERS ─────────────────────────────

    private List<Map<String, Object>> enrichFees(List<Fee> fees) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Fee f : fees) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id",                  f.getId());
            dto.put("studentId",           f.getStudentId());
            dto.put("batchId",             f.getBatchId());
            dto.put("originalFee",         f.getOriginalTotalAmount());
            dto.put("totalAmount",         f.getTotalAmount());
            dto.put("paidAmount",          f.getPaidAmount());
            dto.put("dueAmount",           f.getDueAmount());
            dto.put("isEmi",               f.getIsEmi());
            dto.put("interestAmount",      f.getInterestAmount());
            dto.put("discountAmount",      f.getDiscountAmount());
            dto.put("emiInstallment",      f.getEmiInstallment());
            dto.put("paymentPlan",         f.getPaymentPlan());
            dto.put("status",              f.getStatus());
            dto.put("paymentDate",         f.getPaymentDate());
            dto.put("paymentMode",         f.getPaymentMode());
            dto.put("receiptNumber",       f.getReceiptNumber());
            dto.put("notes",               f.getNotes());
            dto.put("createdAt",           f.getCreatedAt());
            userRepo.findById(f.getStudentId()).ifPresent(u -> {
                dto.put("studentName",  u.getName());
                dto.put("studentEmail", u.getEmail());
                dto.put("studentPhone", u.getPhone());
                dto.put("portalId",     u.getPortalId() != null ? u.getPortalId() : u.getStudentId());
            });
            result.add(dto);
        }
        return result;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String str(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}
