package com.travel.dto.response;

/**
 * DTO cho response chung của API
 */
public class MessageResponse {

    private String message;
    private boolean success;
    private Object data;

    // Constructors
    public MessageResponse() {}

    public MessageResponse(String message) {
        this.message = message;
        this.success = true;
    }

    public MessageResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }

    public MessageResponse(String message, boolean success, Object data) {
        this.message = message;
        this.success = success;
        this.data = data;
    }

    // Static factory methods
    public static MessageResponse success(String message) {
        return new MessageResponse(message, true);
    }

    public static MessageResponse success(String message, Object data) {
        return new MessageResponse(message, true, data);
    }

    public static MessageResponse error(String message) {
        return new MessageResponse(message, false);
    }

    public static MessageResponse error(String message, Object data) {
        return new MessageResponse(message, false, data);
    }

    // Getters and Setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
