package com.lms.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fees")
public class Fee {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "original_total_amount", precision = 10, scale = 2)
    private BigDecimal originalTotalAmount;

    @Column(name = "is_emi")
    private Boolean isEmi = false;

    @Column(name = "interest_amount", precision = 10, scale = 2)
    private BigDecimal interestAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "emi_installment", precision = 10, scale = 2)
    private BigDecimal emiInstallment;

    @Column(name = "payment_plan", length = 50)
    private String paymentPlan; // FULL_UPFRONT, HALF_AND_PLACEMENT, EMI_PLAN

    @Column(name = "paid_amount", precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "due_amount", precision = 10, scale = 2)
    private BigDecimal dueAmount;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payment_mode", length = 50)
    private String paymentMode; // CASH, UPI, BANK_TRANSFER, CHEQUE, CARD

    @Column(name = "receipt_number", unique = true, length = 100)
    private String receiptNumber;

    @Column(length = 20)
    private String status = "PENDING"; // PENDING, PARTIAL, PAID, OVERDUE

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "collected_by")
    private Long collectedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ─── Getters & Setters ────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public BigDecimal getOriginalTotalAmount() { return originalTotalAmount; }
    public void setOriginalTotalAmount(BigDecimal originalTotalAmount) { this.originalTotalAmount = originalTotalAmount; }
    public Boolean getIsEmi() { return isEmi; }
    public void setIsEmi(Boolean isEmi) { this.isEmi = isEmi; }
    public BigDecimal getInterestAmount() { return interestAmount; }
    public void setInterestAmount(BigDecimal interestAmount) { this.interestAmount = interestAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getEmiInstallment() { return emiInstallment; }
    public void setEmiInstallment(BigDecimal emiInstallment) { this.emiInstallment = emiInstallment; }
    public String getPaymentPlan() { return paymentPlan; }
    public void setPaymentPlan(String paymentPlan) { this.paymentPlan = paymentPlan; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public BigDecimal getDueAmount() { return dueAmount; }
    public void setDueAmount(BigDecimal dueAmount) { this.dueAmount = dueAmount; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getCollectedBy() { return collectedBy; }
    public void setCollectedBy(Long collectedBy) { this.collectedBy = collectedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
