package com.lms.dto;

import lombok.Data;

@Data
public class QrScanRequest {
    private String qrToken;
    private Double latitude;
    private Double longitude;
}
