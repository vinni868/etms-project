package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category; // RENT, ELECTRICITY, MARKETING, TOOLS, OTHERS
    private Double amount;
    private LocalDate date;
    private String description;
    private String spentBy;
}
