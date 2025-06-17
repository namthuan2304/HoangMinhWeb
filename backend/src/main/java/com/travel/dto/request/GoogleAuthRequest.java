package com.travel.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO cho yêu cầu xác thực Google
 */
public class GoogleAuthRequest {
    
    @NotBlank(message = "Google credential is required")
    private String credential;
    
    public GoogleAuthRequest() {}
    
    public GoogleAuthRequest(String credential) {
        this.credential = credential;
    }
    
    public String getCredential() {
        return credential;
    }
    
    public void setCredential(String credential) {
        this.credential = credential;
    }
}
