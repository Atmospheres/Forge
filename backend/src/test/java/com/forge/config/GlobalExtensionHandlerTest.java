package com.forge.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ThrowingTestController.class)
@Import(TestSecurityConfig.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void noSuchElementException_isMappedTo404WithErrorMessageBody() throws Exception {
        mockMvc.perform(get("/test/not-found").with(jwt().jwt(j -> j.tokenValue("test-token"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("Thing not found"));
    }
}