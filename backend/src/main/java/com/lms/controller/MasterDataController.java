package com.lms.controller;

import com.lms.repository.CityRepository;
import com.lms.repository.CountryRepository;
import com.lms.repository.StateMasterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * MasterDataController — serves city, state, country reference data.
 * All endpoints are PUBLIC (/api/public/**) — no authentication required.
 * Responses are cached by the browser via Cache-Control headers.
 */
@RestController
@RequestMapping("/api/public/master")
public class MasterDataController {

    private final CityRepository cityRepo;
    private final StateMasterRepository stateRepo;
    private final CountryRepository countryRepo;

    public MasterDataController(CityRepository cityRepo,
                                StateMasterRepository stateRepo,
                                CountryRepository countryRepo) {
        this.cityRepo = cityRepo;
        this.stateRepo = stateRepo;
        this.countryRepo = countryRepo;
    }

    /** GET /api/public/master/cities — returns list of all city names sorted A-Z */
    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=86400") // cache 24h
            .body(cityRepo.findAllNames());
    }

    /** GET /api/public/master/states — returns list of all Indian state/UT names sorted A-Z */
    @GetMapping("/states")
    public ResponseEntity<List<String>> getStates() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=86400")
            .body(stateRepo.findAllNames());
    }

    /** GET /api/public/master/countries — returns list of all country names sorted A-Z */
    @GetMapping("/countries")
    public ResponseEntity<List<String>> getCountries() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=86400")
            .body(countryRepo.findAllNames());
    }

    /** GET /api/public/master/all — returns all three lists in one request */
    @GetMapping("/all")
    public ResponseEntity<Map<String, List<String>>> getAll() {
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=86400")
            .body(Map.of(
                "cities",    cityRepo.findAllNames(),
                "states",    stateRepo.findAllNames(),
                "countries", countryRepo.findAllNames()
            ));
    }
}
