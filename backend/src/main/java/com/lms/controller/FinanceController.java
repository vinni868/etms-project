package com.lms.controller;

import com.lms.entity.Expense;
import com.lms.entity.Salary;
import com.lms.repository.ExpenseRepository;
import com.lms.repository.FeeRepository;
import com.lms.repository.SalaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin/finance")
public class FinanceController {

    @Autowired
    private SalaryRepository salaryRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private FeeRepository feeRepository;

    // ================= SALARY =================
    @GetMapping("/salaries")
    public List<Salary> getAllSalaries() {
        return salaryRepository.findAll();
    }

    @PostMapping("/disburse-salary")
    public ResponseEntity<?> disburseSalary(@RequestBody Salary salary) {
        salary.setPaymentDate(LocalDate.now());
        salary.setStatus("PAID");
        salaryRepository.save(salary);
        return ResponseEntity.ok(Map.of("message", "Salary disbursed successfully"));
    }

    // ================= EXPENSES =================
    @GetMapping("/expenses")
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    @PostMapping("/add-expense")
    public ResponseEntity<?> addExpense(@RequestBody Expense expense) {
        if (expense.getDate() == null) expense.setDate(LocalDate.now());
        expenseRepository.save(expense);
        return ResponseEntity.ok(Map.of("message", "Expense added successfully"));
    }

    // ================= P&L SUMMARY (uses real fee data) =================
    @GetMapping("/summary")
    public ResponseEntity<?> getPnLSummary() {
        double totalSalaries = salaryRepository.findAll().stream()
                .mapToDouble(s -> s.getAmount() != null ? s.getAmount() : 0.0)
                .sum();
        double totalExpenses = expenseRepository.findAll().stream()
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                .sum();

        // Real revenue from Fee payments collected
        BigDecimal collected = feeRepository.getTotalCollected();
        BigDecimal pending   = feeRepository.getTotalPending();
        double totalRevenue  = collected != null ? collected.doubleValue() : 0.0;
        double totalPending  = pending   != null ? pending.doubleValue()   : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalSalaries", totalSalaries);
        summary.put("totalGeneralExpenses", totalExpenses);
        summary.put("netProfit", totalRevenue - (totalSalaries + totalExpenses));
        summary.put("totalPendingFees", totalPending);

        return ResponseEntity.ok(summary);
    }
}
