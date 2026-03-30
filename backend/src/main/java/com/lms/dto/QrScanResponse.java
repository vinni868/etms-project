package com.lms.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QrScanResponse {
    private String status;
    private String message;
    private Map<String, Object> sessionInfo;
}
