package com.travel.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình Web MVC
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Cấu hình CORS
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }    /**
     * Cấu hình static resources
     */
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve uploaded files
        String uploadsPath = System.getProperty("user.dir") + "/" + uploadDir + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadsPath);
        
        // Log để debug
        System.out.println("Upload path configured: " + uploadsPath);
    }
}
