package com.lms.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
@Order(-101) // Run before Spring Security
public class DiagnosticFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        String uri = req.getRequestURI();
        if (uri.contains("/public/")) {
            String authHeader = req.getHeader("Authorization");
            System.out.println("DIAGNOSTIC [v5]: Hit path -> " + uri + " [Method: " + req.getMethod() + "] [Auth: " + (authHeader != null ? "PRESENT" : "MISSING") + "]");
        }
        chain.doFilter(request, response);
    }
}
