package com.travel.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Cấu hình xử lý bất đồng bộ
 */
@Configuration
public class AsyncConfig implements AsyncConfigurer {

    /**
     * Cấu hình thread pool cho xử lý bất đồng bộ
     */
    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);        // Số thread tối thiểu
        executor.setMaxPoolSize(5);         // Số thread tối đa
        executor.setQueueCapacity(100);     // Capacity của queue
        executor.setThreadNamePrefix("Async-Email-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
