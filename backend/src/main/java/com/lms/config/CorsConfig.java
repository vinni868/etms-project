package com.lms.config;

/**
 * CORS is fully handled by SecurityConfig.corsConfigurationSource().
 * This file intentionally left as a no-op to avoid duplicate CORS bean conflicts.
 * Do NOT add a WebMvcConfigurer with addCorsMappings here — it will fight Spring Security's CORS.
 */
public class CorsConfig {
    // Intentionally empty — CORS lives in SecurityConfig
}
