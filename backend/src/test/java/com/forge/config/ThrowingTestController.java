package com.forge.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.NoSuchElementException;

/**
 * Exists purely to give GlobalExceptionHandlerTest something that throws
 * NoSuchElementException, so the handler can be tested in isolation from
 * any real controller's business logic.
 */
@RestController
class ThrowingTestController {
    @GetMapping("/test/not-found")
    public String notFound() {
        throw new NoSuchElementException("Thing not found");
    }
}