package com.lms.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "id_sequences")
public class IdSequence {

    @Id
    private String portal;        // "STUDENT", "TRAINER", "ADMIN", "MARKETER", "BATCH", "COURSE", "INVOICE"

    private String prefix;        // "STU", "TRN", "ADM", "MKT", "BAT", "CRS", "INV"
    private int    currentSeq;
    private int    year;
    private LocalDateTime updatedAt;

    public IdSequence() {}

    public IdSequence(String portal, String prefix, int currentSeq, int year) {
        this.portal = portal;
        this.prefix = prefix;
        this.currentSeq = currentSeq;
        this.year = year;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters & Setters
    public String getPortal() { return portal; }
    public void setPortal(String portal) { this.portal = portal; }

    public String getPrefix() { return prefix; }
    public void setPrefix(String prefix) { this.prefix = prefix; }

    public int getCurrentSeq() { return currentSeq; }
    public void setCurrentSeq(int currentSeq) { this.currentSeq = currentSeq; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
