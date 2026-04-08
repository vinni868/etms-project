package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "master_cities", indexes = @Index(columnList = "name"))
@Data
@NoArgsConstructor
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "state_name", length = 100)
    private String stateName;

    public City(String name, String stateName) {
        this.name = name;
        this.stateName = stateName;
    }
}
